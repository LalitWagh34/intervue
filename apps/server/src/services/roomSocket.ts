import { db } from "@intervue/db";
import { redis, redisSubscriber, isRedisConnected } from "../lib/redis.js";
import crypto from "crypto";

export type SocketConnectionState = "CONNECTED" | "JOINING" | "JOINED" | "CLOSED";

export interface ConnectedClient {
  ws: any;
  userId: string;
  roomCode: string | null;
  state: SocketConnectionState;
  name?: string;
  image?: string;
  connectedAt: number;
  lastMembershipVerifiedAt?: number;
}

export interface LeaderboardEntry {
  rank: number;
  participantId: string;
  userId: string;
  name: string;
  image?: string | null;
  role: string;
  score: number;
  solvedCount: number;
  penaltyTime: number;
  warningsCount: number;
  isDisqualified: boolean;
}

export interface AntiCheatViolation {
  id: string;
  roomCode: string;
  userId: string;
  userName: string;
  type: "TAB_SWITCH" | "WINDOW_BLUR" | "SUSPICIOUS_PASTE";
  warningLevel: number;
  penaltyAddedSeconds?: number;
  isDisqualified?: boolean;
  details?: string;
  timestamp: number;
}

export interface CodeSnapshot {
  problemId: number;
  sourceCode: string;
  language: string;
  updatedAt: number;
}

class RoomSocketManager {
  // roomCode -> Set of client sockets
  private rooms: Map<string, Set<any>> = new Map();
  // client socket -> metadata
  private clients: Map<any, ConnectedClient> = new Map();
  // Active room timer timeouts
  private roomTimers: Map<string, any> = new Map();

  // Anti-Cheat tracking per room
  private roomViolations: Map<string, AntiCheatViolation[]> = new Map();
  private participantWarnings: Map<string, Map<string, number>> = new Map();
  private disqualifiedUsers: Map<string, Set<string>> = new Map();

  // Live Spectator code snapshots: roomCode -> (userId -> CodeSnapshot)
  private codeSnapshots: Map<string, Map<string, CodeSnapshot>> = new Map();

  // Finished participants tracking: roomCode -> Set of userIds
  private finishedUsers: Map<string, Set<string>> = new Map();

  private nodeId = crypto.randomUUID();

  constructor() {
    // Setup Redis Pub/Sub for horizontal scaling synchronization
    const setupSubscription = () => {
      try {
        redisSubscriber.subscribe("room_events", (err) => {
          if (err) console.error("[Socket] Failed to subscribe to room_events:", err);
          else console.log("[Socket] Subscribed to Redis room_events for distributed sync.");
        });
      } catch (err) {
        console.error("[Socket] Failed to subscribe to Redis:", err);
      }
    };

    if (isRedisConnected || redisSubscriber.status === "ready" || redisSubscriber.status === "connect") {
      setupSubscription();
    }
    redisSubscriber.on("connect", setupSubscription);
    redisSubscriber.on("ready", setupSubscription);

    redisSubscriber.on("message", (channel, message) => {
      if (channel === "room_events") {
        try {
          const msg = JSON.parse(message);
          if (msg.senderId === this.nodeId) return; // Ignore own messages

          const code = msg.roomCode.toUpperCase();
          
          if (msg.action === "BROADCAST") {
            const { event, data, excludeUserId } = msg.payload;

            // Broadcast to local WebSockets
            const roomSet = this.rooms.get(code);
            if (roomSet && roomSet.size > 0) {
              const payloadStr = JSON.stringify({ event, data, timestamp: Date.now() });
              for (const ws of roomSet) {
                if (excludeUserId && this.clients.get(ws)?.userId === excludeUserId) continue;
                try {
                  ws.send(payloadStr);
                } catch (err) {}
              }
            }
          } else if (msg.action === "REVOKE_MEMBERSHIP") {
            const { userId, reason } = msg.payload;
            this.revokeMembership(code, userId, reason, true);
          }
        } catch (err) {
          console.error("[Socket] Failed to process Redis pubsub message:", err);
        }
      }
    });
  }

  public async markUserFinished(roomCode: string, userId: string): Promise<number> {
    const code = roomCode.toUpperCase();
    if (isRedisConnected) {
      const key = `room:${code}:finishedUsers`;
      await redis.sadd(key, userId);
      redis.expire(key, 86400).catch(() => {});
      return await redis.scard(key);
    }

    if (!this.finishedUsers.has(code)) {
      this.finishedUsers.set(code, new Set());
    }
    this.finishedUsers.get(code)!.add(userId);
    return this.finishedUsers.get(code)!.size;
  }

  public async getFinishedCount(roomCode: string): Promise<number> {
    const code = roomCode.toUpperCase();
    if (isRedisConnected) {
      return await redis.scard(`room:${code}:finishedUsers`);
    }
    return this.finishedUsers.get(code)?.size || 0;
  }

  /**
   * Helper to get count of unique userIds in a room
   */
  private getUniqueUserCount(roomCode: string): number {
    const roomSet = this.rooms.get(roomCode.toUpperCase());
    if (!roomSet) return 0;
    const userIds = new Set<string>();
    for (const ws of roomSet) {
      const c = this.clients.get(ws);
      if (c?.userId) {
        userIds.add(c.userId);
      }
    }
    return userIds.size;
  }

  /**
   * Check if a user is currently connected to a room
   */
  public isUserInRoom(roomCode: string, userId: string): boolean {
    const code = roomCode.toUpperCase();
    const roomSet = this.rooms.get(code);
    if (!roomSet) return false;
    for (const ws of roomSet) {
      if (this.clients.get(ws)?.userId === userId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Register a newly established WebSocket connection (prior to room join)
   */
  public registerConnection(ws: any, user: { id: string; name?: string; image?: string }) {
    this.clients.set(ws, {
      ws,
      userId: user.id,
      roomCode: null,
      state: "CONNECTED",
      name: user.name,
      image: user.image,
      connectedAt: Date.now(),
    });
  }

  /**
   * Get connected client metadata
   */
  public getClient(ws: any): ConnectedClient | undefined {
    return this.clients.get(ws);
  }

  /**
   * Register a client connection to a room with strict authorization & state machine:
   * CONNECTED -> JOINING (synchronous before await) -> JOINED -> CLOSED
   */
  public async joinRoom(ws: any, clientData: { roomCode: string; name?: string; image?: string }): Promise<boolean> {
    const client = this.clients.get(ws);
    if (!client || client.state === "CLOSED") {
      this.sendToClient(ws, "error", { code: "UNREGISTERED_SOCKET", message: "Socket not registered or already closed." });
      try { ws.close(4401, "Unregistered socket"); } catch (_) {}
      return false;
    }

    // Priority 2: Synchronously reject concurrent room join races
    if (client.state === "JOINING") {
      console.warn(`[Socket] Concurrent room join attempt rejected for user ${client.userId}`);
      this.sendToClient(ws, "error", {
        code: "CONCURRENT_JOIN_FORBIDDEN",
        message: "Room join is already in progress.",
      });
      return false;
    }

    // Priority 2 / Rule 4: One-room-per-connection restriction
    if (client.state === "JOINED" || client.roomCode !== null) {
      console.warn(`[Socket] Forbidden room switch attempt by user ${client.userId} from ${client.roomCode} to ${clientData.roomCode}`);
      this.sendToClient(ws, "error", {
        code: "ROOM_SWITCH_FORBIDDEN",
        message: "A WebSocket connection is restricted to one room. Disconnect and open a new connection to join a different room.",
      });
      return false;
    }

    // Synchronously set state to JOINING before any async operations
    client.state = "JOINING";

    const code = clientData.roomCode.toUpperCase();

    // Verify user is an authorized participant or host in database (Fail-Closed)
    try {
      const isAuthorized = await db.room.findFirst({
        where: {
          code,
          OR: [
            { hostId: client.userId },
            { participants: { some: { userId: client.userId } } },
          ],
        },
        select: { id: true, status: true },
      });

      if (!isAuthorized) {
        console.warn(`[Socket] Unauthorized join attempt by user ${client.userId} for room ${code}`);
        client.state = "CLOSED";
        this.sendToClient(ws, "error", { code: "UNAUTHORIZED_ROOM", message: "Unauthorized: You have not joined this room." });
        try { ws.close(4403, "Unauthorized room membership"); } catch (_) {}
        this.leaveRoom(ws);
        return false;
      }
    } catch (err) {
      console.error("[Socket] Error verifying user participation:", err);
      client.state = "CLOSED";
      this.sendToClient(ws, "error", { code: "SERVER_ERROR", message: "Server error verifying room authorization." });
      try { ws.close(1011, "Server error during authorization"); } catch (_) {}
      this.leaveRoom(ws);
      return false;
    }

    if (!this.rooms.has(code)) {
      this.rooms.set(code, new Set());
    }
    const roomSet = this.rooms.get(code)!;

    // Check if this userId already has an active socket in the room (multi-tab or reconnect)
    let alreadyInRoom = false;
    for (const existingWs of [...roomSet]) {
      if (existingWs === ws) continue;
      const meta = this.clients.get(existingWs);
      if (meta && meta.userId === client.userId) {
        alreadyInRoom = true;
        this.clients.delete(existingWs);
        roomSet.delete(existingWs);
        try {
          // Priority 3: Use intentional close code 4409 ("Superseded by another connection")
          // so the client recognizes it as NON-RETRIABLE, preventing multi-tab reconnection storms!
          existingWs.close(4409, "Superseded by new session in another tab");
        } catch (_) {}
      }
    }

    // Transition state to JOINED
    client.state = "JOINED";
    client.roomCode = code;
    if (clientData.name) client.name = clientData.name;
    if (clientData.image) client.image = clientData.image;

    // Ensure socket does not belong to any other room sets
    for (const [rCode, rSet] of this.rooms.entries()) {
      if (rCode !== code && rSet.has(ws)) {
        rSet.delete(ws);
      }
    }

    roomSet.add(ws);

    const totalUnique = this.getUniqueUserCount(code);
    console.log(`[Socket] User ${client.name || client.userId} successfully joined room ${code}. Total unique: ${totalUnique} (Sockets: ${roomSet.size})`);

    // Broadcast participant joined event to others if this user wasn't already in the room
    if (!alreadyInRoom) {
      this.broadcastToRoomExcept(code, ws, "participant:joined", {
        userId: client.userId,
        name: client.name || "Anonymous",
        image: client.image,
        totalConnected: totalUnique,
      });
    }

    // Send instant full room sync to the newly connected/reconnected client
    await this.sendRoomSync(ws, code);
    return true;
  }

  /**
   * Handle client disconnection and atomic cleanup across all room sets
   */
  public leaveRoom(ws: any) {
    const client = this.clients.get(ws);
    if (!client) {
      // Clean up any lingering references in room sets
      for (const [code, rSet] of this.rooms.entries()) {
        if (rSet.has(ws)) {
          rSet.delete(ws);
          if (rSet.size === 0) this.rooms.delete(code);
        }
      }
      return;
    }

    const { roomCode, userId } = client;
    client.state = "CLOSED";
    this.clients.delete(ws);

    // Remove from ALL room sets to ensure zero lingering socket references
    for (const [code, rSet] of this.rooms.entries()) {
      if (rSet.has(ws)) {
        rSet.delete(ws);
        if (rSet.size === 0) this.rooms.delete(code);
      }
    }

    if (!roomCode) {
      return;
    }

    const roomSet = this.rooms.get(roomCode);
    if (roomSet) {
      let userHasOtherSocket = false;
      for (const remainingWs of roomSet) {
        if (this.clients.get(remainingWs)?.userId === userId) {
          userHasOtherSocket = true;
          break;
        }
      }

      if (!userHasOtherSocket) {
        const totalUnique = this.getUniqueUserCount(roomCode);
        this.broadcastToRoom(roomCode, "participant:left", {
          userId,
          totalConnected: totalUnique,
        });
      }
    }

    console.log(`[Socket] User ${userId} disconnected from room ${roomCode}`);
  }

  /**
   * Centralized message dispatcher with full authorization enforcement:
   * - Enforces pre-join check for all non-join events
   * - Enforces strict room binding (rejects cross-room events)
   * - Enforces identity match (rejects identity spoofing)
   */
  public async handleMessage(ws: any, eventName: string, data: any): Promise<void> {
    const client = this.clients.get(ws);
    if (!client || client.state === "CLOSED") {
      this.sendToClient(ws, "error", { code: "UNREGISTERED_SOCKET", message: "Socket not registered or closed." });
      try { ws.close(4401, "Unregistered socket"); } catch (_) {}
      return;
    }

    // 1. Handle room:join
    if (eventName === "room:join") {
      if (!data?.roomCode || typeof data.roomCode !== "string") {
        this.sendToClient(ws, "error", { code: "INVALID_ROOM_CODE", message: "Missing or invalid roomCode." });
        return;
      }
      await this.joinRoom(ws, {
        roomCode: data.roomCode,
        name: client.name || data.name,
        image: client.image || data.image,
      });
      return;
    }

    // 2. Pre-join validation: all non-join events require active JOINED state
    if (client.state !== "JOINED" || !client.roomCode) {
      this.sendToClient(ws, "error", {
        code: "PRE_JOIN_FORBIDDEN",
        message: "Pre-join event rejected: you must join a room first.",
      });
      return;
    }

    // 3. Cross-room tamper validation: socket is strictly bound to client.roomCode
    if (data?.roomCode && typeof data.roomCode === "string" && data.roomCode.toUpperCase() !== client.roomCode) {
      this.sendToClient(ws, "error", {
        code: "CROSS_ROOM_FORBIDDEN",
        message: `Cross-room event rejected: socket is bound to room ${client.roomCode}.`,
      });
      return;
    }

    // 4. Identity spoofing validation: client cannot spoof another userId
    if (data?.userId && typeof data.userId === "string" && data.userId !== client.userId) {
      this.sendToClient(ws, "error", {
        code: "IDENTITY_MISMATCH",
        message: "Identity mismatch: cannot perform room actions for another user.",
      });
      return;
    }

    const boundRoomCode = client.roomCode;
    const boundUserId = client.userId;

    // 5. Sensitive events require active database membership verification (Fail-Closed)
    // High-frequency events (code:sync) use a 5-second verification cache to prevent excessive DB load.
    // Sensitive control/sync events (time:sync, anticheat:violation, code:inspect) always verify strictly against DB.
    if (
      eventName === "anticheat:violation" ||
      eventName === "code:sync" ||
      eventName === "code:inspect" ||
      eventName === "time:sync"
    ) {
      const cacheTtlMs = eventName === "code:sync" ? 5000 : 0;
      const isStillMember = await this.verifyActiveMembership(ws, cacheTtlMs);
      if (!isStillMember) {
        return;
      }
    }

    // 6. Dispatch validated room-scoped events
    if (eventName === "room:leave") {
      this.leaveRoom(ws);
    } else if (eventName === "time:sync") {
      await this.sendRoomSync(ws, boundRoomCode);
    } else if (eventName === "anticheat:violation") {
      if (data?.type) {
        await this.recordViolation(boundRoomCode, boundUserId, data.type, data.details);
      }
    } else if (eventName === "code:sync") {
      if (data?.sourceCode !== undefined) {
        await this.updateCodeSnapshot(boundRoomCode, boundUserId, {
          problemId: data.problemId,
          sourceCode: data.sourceCode,
          language: data.language,
        });
      }
    } else if (eventName === "code:inspect") {
      if (data?.targetUserId && typeof data.targetUserId === "string") {
        // Priority 4: Authorize inspection using actual database room membership
        // Does NOT require target participant to have an active local socket!
        const targetMember = await db.roomParticipant.findFirst({
          where: {
            userId: data.targetUserId,
            room: { code: boundRoomCode },
          },
          select: { id: true },
        });

        if (!targetMember) {
          this.sendToClient(ws, "error", {
            code: "TARGET_NOT_IN_ROOM",
            message: "Target participant does not belong to this room.",
          });
          return;
        }

        const snapshot = await this.getCodeSnapshot(boundRoomCode, data.targetUserId);
        this.sendToClient(ws, "code:inspect_result", {
          targetUserId: data.targetUserId,
          snapshot,
        });
      }
    }
  }

  /**
   * Revoke membership of a participant, notify room, and kick active sockets across nodes
   */
  public async revokeMembership(roomCode: string, userId: string, reason = "Membership revoked", isFromRedis = false): Promise<void> {
    const code = roomCode.toUpperCase();

    // Priority 1: Broadcast via Redis Pub/Sub for distributed horizontal sync across backend instances
    if (!isFromRedis && isRedisConnected) {
      redis.publish("room_events", JSON.stringify({
        senderId: this.nodeId,
        roomCode: code,
        action: "REVOKE_MEMBERSHIP",
        payload: { userId, reason },
      })).catch(() => {});
    }

    const roomSet = this.rooms.get(code);
    if (roomSet) {
      for (const ws of [...roomSet]) {
        const client = this.clients.get(ws);
        if (client?.userId === userId) {
          this.sendToClient(ws, "room:kicked", { roomCode: code, reason });
          try {
            ws.close(4403, reason);
          } catch (_) {}
          this.leaveRoom(ws);
        }
      }
    }

    // Delete live code snapshot of revoked participant
    await this.deleteCodeSnapshot(code, userId);

    this.broadcastToRoom(code, "participant:revoked", {
      userId,
      reason,
      totalConnected: this.getUniqueUserCount(code),
    }, isFromRedis);
  }

  /**
   * Delete code snapshot for a participant (used upon revocation or leave)
   */
  public async deleteCodeSnapshot(roomCode: string, userId: string): Promise<void> {
    const code = roomCode.toUpperCase();
    if (isRedisConnected) {
      await redis.hdel(`room:${code}:codeSnapshots`, userId).catch(() => {});
    }
    this.codeSnapshots.get(code)?.delete(userId);
  }

  /**
   * Verify whether the socket's client still has active membership in the room
   */
  public async verifyActiveMembership(ws: any, maxCacheAgeMs = 0): Promise<boolean> {
    const client = this.clients.get(ws);
    if (!client || !client.roomCode) return false;

    const now = Date.now();
    if (
      maxCacheAgeMs > 0 &&
      client.lastMembershipVerifiedAt &&
      now - client.lastMembershipVerifiedAt < maxCacheAgeMs
    ) {
      return true;
    }

    try {
      const member = await db.room.findFirst({
        where: {
          code: client.roomCode,
          OR: [
            { hostId: client.userId },
            { participants: { some: { userId: client.userId } } },
          ],
        },
        select: { id: true },
      });
      if (!member) {
        await this.revokeMembership(client.roomCode, client.userId, "Room membership no longer active.");
        return false;
      }
      client.lastMembershipVerifiedAt = now;
      return true;
    } catch (err) {
      console.error("[Socket] DB error in verifyActiveMembership (Failing Closed):", err);
      this.sendToClient(ws, "error", {
        code: "AUTH_VERIFICATION_FAILED",
        message: "Failed to verify room membership. Connection terminated.",
      });
      try {
        ws.close(1011, "Server verification error");
      } catch (_) {}
      this.leaveRoom(ws);
      return false;
    }
  }

  /**
   * Broadcast an event and payload to all clients in a room
   */
  public broadcastToRoom(roomCode: string, event: string, data: any, isFromRedis = false) {
    const code = roomCode.toUpperCase();
    
    // Publish to Redis for other nodes
    if (!isFromRedis && isRedisConnected) {
      redis.publish("room_events", JSON.stringify({
        senderId: this.nodeId,
        roomCode: code,
        action: "BROADCAST",
        payload: { event, data }
      })).catch(() => {});
    }

    const roomSet = this.rooms.get(code);
    if (!roomSet || roomSet.size === 0) return;

    const payload = JSON.stringify({
      event,
      data,
      timestamp: Date.now(),
    });

    for (const ws of roomSet) {
      try {
        ws.send(payload);
      } catch (err) {
        console.error(`[Socket] Failed to send message to client in ${code}:`, err);
      }
    }
  }

  /**
   * Broadcast an event to all clients in a room except the sender
   */
  public broadcastToRoomExcept(roomCode: string, excludeWs: any, event: string, data: any, isFromRedis = false) {
    const code = roomCode.toUpperCase();
    
    if (!isFromRedis && isRedisConnected) {
      const excludeUserId = this.clients.get(excludeWs)?.userId;
      redis.publish("room_events", JSON.stringify({
        senderId: this.nodeId,
        roomCode: code,
        action: "BROADCAST",
        payload: { event, data, excludeUserId }
      })).catch(() => {});
    }

    const roomSet = this.rooms.get(code);
    if (!roomSet || roomSet.size === 0) return;

    const payload = JSON.stringify({
      event,
      data,
      timestamp: Date.now(),
    });

    for (const ws of roomSet) {
      if (ws === excludeWs) continue;
      try {
        ws.send(payload);
      } catch (err) {
        console.error(`[Socket] Failed to send message in ${code}:`, err);
      }
    }
  }

  /**
   * Send a direct event to a specific client
   */
  public sendToClient(ws: any, event: string, data: any) {
    try {
      ws.send(
        JSON.stringify({
          event,
          data,
          timestamp: Date.now(),
        })
      );
    } catch (err) {
      console.error("[Socket] Failed to send to client:", err);
    }
  }

  /**
   * Check if a user is disqualified in a room
   */
  public async isUserDisqualified(roomCode: string, userId: string): Promise<boolean> {
    const code = roomCode.toUpperCase();
    if (isRedisConnected) {
      return (await redis.sismember(`room:${code}:disqualifiedUsers`, userId)) === 1;
    }
    const set = this.disqualifiedUsers.get(code);
    return set ? set.has(userId) : false;
  }

  /**
   * Get anti-cheat warning count for a user in a room
   */
  public async getUserWarningCount(roomCode: string, userId: string): Promise<number> {
    const code = roomCode.toUpperCase();
    if (isRedisConnected) {
      const val = await redis.hget(`room:${code}:warnings`, userId);
      return val ? parseInt(val, 10) : 0;
    }
    return this.participantWarnings.get(code)?.get(userId) || 0;
  }

  /**
   * Authoritative Anti-Cheat Violation Recorder with Penalty Escalation Ladder
   */
  public async recordViolation(
    roomCode: string,
    userId: string,
    violationType: "TAB_SWITCH" | "WINDOW_BLUR" | "SUSPICIOUS_PASTE",
    details?: string
  ): Promise<AntiCheatViolation> {
    const code = roomCode.toUpperCase();

    let currentWarnings = 0;
    
    if (isRedisConnected) {
      currentWarnings = await redis.hincrby(`room:${code}:warnings`, userId, 1);
      redis.expire(`room:${code}:warnings`, 86400).catch(() => {});
    } else {
      if (!this.participantWarnings.has(code)) {
        this.participantWarnings.set(code, new Map());
      }
      const warningsMap = this.participantWarnings.get(code)!;
      currentWarnings = (warningsMap.get(userId) || 0) + 1;
      warningsMap.set(userId, currentWarnings);
    }

    let penaltyAdded = 0;
    let isDisqualified = false;
    let participant: any = null;

    try {
      participant = await db.roomParticipant.findFirst({
        where: {
          userId,
          room: { code },
        },
        include: {
          user: { select: { name: true } },
        },
      });

      if (currentWarnings === 2 && participant) {
        // Strike 2: Add +180s (+3 minutes) penalty to participant score in database
        penaltyAdded = 180;
        await db.roomParticipant.update({
          where: { id: participant.id },
          data: { penaltyTime: { increment: 180 } },
        });
      }
    } catch (dbErr) {
      console.error(`[Socket] DB error in recordViolation for user ${userId} in ${code}:`, dbErr);
    }

    const userName = participant?.user?.name || "Participant";

    if (currentWarnings >= 3) {
      // Strike 3: Automatic disqualification
      isDisqualified = true;
      if (isRedisConnected) {
        await redis.sadd(`room:${code}:disqualifiedUsers`, userId);
        redis.expire(`room:${code}:disqualifiedUsers`, 86400).catch(() => {});
      } else {
        if (!this.disqualifiedUsers.has(code)) {
          this.disqualifiedUsers.set(code, new Set());
        }
        this.disqualifiedUsers.get(code)!.add(userId);
      }
    }

    const violation: AntiCheatViolation = {
      id: `viol_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      roomCode: code,
      userId,
      userName,
      type: violationType,
      warningLevel: Math.min(3, currentWarnings),
      penaltyAddedSeconds: penaltyAdded,
      isDisqualified,
      details,
      timestamp: Date.now(),
    };

    if (isRedisConnected) {
      await redis.lpush(`room:${code}:violations`, JSON.stringify(violation));
      await redis.ltrim(`room:${code}:violations`, 0, 49);
      redis.expire(`room:${code}:violations`, 86400).catch(() => {});
    } else {
      if (!this.roomViolations.has(code)) {
        this.roomViolations.set(code, []);
      }
      const violations = this.roomViolations.get(code)!;
      violations.unshift(violation);
      if (violations.length > 50) violations.pop();
    }

    // Broadcast violation event to all clients in the room (including host and spectators)
    this.broadcastToRoom(code, "anticheat:violation", {
      violation,
      warningsCount: currentWarnings,
      isDisqualified,
    });

    // Update leaderboard if penalty was applied
    if (penaltyAdded > 0 || isDisqualified) {
      this.broadcastLeaderboard(code);
    }

    return violation;
  }

  /**
   * Update live code snapshot for participant (used by Spectator Mode)
   */
  public async updateCodeSnapshot(
    roomCode: string,
    userId: string,
    data: { problemId: number; sourceCode: string; language: string }
  ): Promise<void> {
    const code = roomCode.toUpperCase();
    const snapshot: CodeSnapshot = {
      ...data,
      updatedAt: Date.now(),
    };
    
    if (isRedisConnected) {
      await redis.hset(`room:${code}:codeSnapshots`, userId, JSON.stringify(snapshot));
      redis.expire(`room:${code}:codeSnapshots`, 86400).catch(() => {});
    } else {
      if (!this.codeSnapshots.has(code)) {
        this.codeSnapshots.set(code, new Map());
      }
      this.codeSnapshots.get(code)!.set(userId, snapshot);
    }

    // Broadcast live code update to room spectators
    this.broadcastToRoom(code, "code:stream_update", {
      userId,
      ...snapshot,
    });
  }

  /**
   * Retrieve active code snapshot for a target participant
   */
  public async getCodeSnapshot(roomCode: string, targetUserId: string): Promise<CodeSnapshot | null> {
    const code = roomCode.toUpperCase();
    if (isRedisConnected) {
      const val = await redis.hget(`room:${code}:codeSnapshots`, targetUserId);
      return val ? JSON.parse(val) : null;
    }
    return this.codeSnapshots.get(code)?.get(targetUserId) || null;
  }

  /**
   * Get all anti-cheat violations recorded for a room
   */
  public async getRoomViolations(roomCode: string): Promise<AntiCheatViolation[]> {
    const code = roomCode.toUpperCase();
    if (isRedisConnected) {
      const vals = await redis.lrange(`room:${code}:violations`, 0, -1);
      return vals.map((v) => JSON.parse(v));
    }
    return this.roomViolations.get(code) || [];
  }

  /**
   * Authoritative Room Sync: sends complete state snapshot to client
   */
  public async sendRoomSync(ws: any, roomCode: string) {
    try {
      const code = roomCode.toUpperCase();
      const room = await db.room.findUnique({
        where: { code },
        include: {
          participants: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
            orderBy: [{ score: "desc" }, { penaltyTime: "asc" }],
          },
        },
      });

      if (!room) return;

      const client = this.clients.get(ws);
      const remainingSeconds = room.endTime
        ? Math.max(0, Math.floor((new Date(room.endTime).getTime() - Date.now()) / 1000))
        : room.duration * 60;

      const participantsList = await Promise.all(room.participants.map(async (p, idx) => ({
        rank: idx + 1,
        participantId: p.id,
        userId: p.userId,
        name: p.user?.name || "Anonymous",
        image: p.user?.image,
        role: p.role,
        score: p.score,
        solvedCount: p.solvedCount,
        penaltyTime: p.penaltyTime,
        warningsCount: await this.getUserWarningCount(code, p.userId),
        isDisqualified: await this.isUserDisqualified(code, p.userId),
        isSelf: client?.userId === p.userId,
      })));

      const violations = await this.getRoomViolations(code);

      this.sendToClient(ws, "room:sync", {
        status: room.status,
        startTime: room.startTime,
        endTime: room.endTime,
        remainingSeconds,
        participants: participantsList,
        violations,
      });
    } catch (err) {
      console.error(`[Socket] Error sending room sync for ${roomCode}:`, err);
    }
  }

  /**
   * Recalculates and broadcasts authoritative leaderboard to the room
   */
  public async broadcastLeaderboard(roomCode: string) {
    try {
      const code = roomCode.toUpperCase();
      const room = await db.room.findUnique({
        where: { code },
        include: {
          participants: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
            orderBy: [{ score: "desc" }, { penaltyTime: "asc" }, { joinedAt: "asc" }],
          },
        },
      });

      if (!room) return;

      const leaderboard: LeaderboardEntry[] = await Promise.all(room.participants.map(async (p, idx) => ({
        rank: idx + 1,
        participantId: p.id,
        userId: p.userId,
        name: p.user?.name || "Anonymous",
        image: p.user?.image,
        role: p.role,
        score: p.score,
        solvedCount: p.solvedCount,
        penaltyTime: p.penaltyTime,
        warningsCount: await this.getUserWarningCount(code, p.userId),
        isDisqualified: await this.isUserDisqualified(code, p.userId),
      })));

      this.broadcastToRoom(code, "leaderboard:update", {
        status: room.status,
        leaderboard,
      });
    } catch (err) {
      console.error(`[Socket] Error broadcasting leaderboard for ${roomCode}:`, err);
    }
  }

  /**
   * Broadcast live activity ticker (e.g. "Priya solved Two Sum (+100 pts)!")
   */
  public broadcastActivity(
    roomCode: string,
    activity: {
      userId: string;
      userName: string;
      userImage?: string | null;
      problemTitle: string;
      isAccepted: boolean;
      pointsAwarded: number;
    }
  ) {
    this.broadcastToRoom(roomCode, "submission:activity", activity);
  }

  /**
   * Called when host starts contest: broadcasts start event and schedules authoritative end timer
   */
  public handleContestStart(roomCode: string, startTime: Date, endTime: Date) {
    const code = roomCode.toUpperCase();

    this.broadcastToRoom(code, "contest:started", {
      status: "ACTIVE",
      startTime,
      endTime,
      durationSeconds: Math.floor((endTime.getTime() - startTime.getTime()) / 1000),
    });

    const msUntilEnd = Math.max(0, endTime.getTime() - Date.now());

    if (this.roomTimers.has(code)) {
      clearTimeout(this.roomTimers.get(code));
    }

    const timer = setTimeout(() => {
      this.handleContestEnd(code);
    }, msUntilEnd);

    this.roomTimers.set(code, timer);
  }

  /**
   * Authoritatively ends the contest when timer reaches 0 or host forces end
   */
  public async handleContestEnd(roomCode: string) {
    const code = roomCode.toUpperCase();

    if (this.roomTimers.has(code)) {
      clearTimeout(this.roomTimers.get(code));
      this.roomTimers.delete(code);
    }

    if (isRedisConnected) {
      const lockKey = `lock:contestEnd:${code}`;
      // Acquire lock for 10 seconds. If we don't get it, another instance is already ending this contest.
      const acquired = await redis.set(lockKey, this.nodeId, "NX", "PX", 10000);
      if (!acquired) {
        console.log(`[Socket] Contest end lock for ${code} already acquired by another node. Yielding.`);
        return;
      }
    }

    console.log(`[Socket] Contest ended authoritatively for room ${code}`);

    try {
      await db.room.update({
        where: { code },
        data: { status: "FINISHED" },
      });

      const room = await db.room.findUnique({
        where: { code },
        include: {
          participants: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
            orderBy: [{ score: "desc" }, { penaltyTime: "asc" }],
          },
        },
      });

      const finalLeaderboard = await Promise.all((room?.participants || []).map(async (p, idx) => ({
        rank: idx + 1,
        participantId: p.id,
        userId: p.userId,
        name: p.user?.name || "Anonymous",
        image: p.user?.image,
        role: p.role,
        score: p.score,
        solvedCount: p.solvedCount,
        penaltyTime: p.penaltyTime,
        warningsCount: await this.getUserWarningCount(code, p.userId),
        isDisqualified: await this.isUserDisqualified(code, p.userId),
      })));

      this.broadcastToRoom(code, "contest:ended", {
        status: "FINISHED",
        finalLeaderboard,
      });
    } catch (err) {
      console.error(`[Socket] Error ending contest for ${code}:`, err);
    }
  }

  /**
   * Broadcasts periodic authoritative timer ticks (every 30s) so client clocks don't drift
   */
  public broadcastTimeSync(roomCode: string, endTime: Date) {
    const remainingSeconds = Math.max(0, Math.floor((endTime.getTime() - Date.now()) / 1000));
    this.broadcastToRoom(roomCode, "contest:time_sync", {
      serverTime: Date.now(),
      endTime,
      remainingSeconds,
    });
  }
}

export const roomSocketManager = new RoomSocketManager();
