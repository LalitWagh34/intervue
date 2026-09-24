import { db } from "@intervue/db";

export interface ConnectedClient {
  ws: any;
  userId: string;
  roomCode: string;
  name?: string;
  image?: string;
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

  public markUserFinished(roomCode: string, userId: string): number {
    const code = roomCode.toUpperCase();
    if (!this.finishedUsers.has(code)) {
      this.finishedUsers.set(code, new Set());
    }
    this.finishedUsers.get(code)!.add(userId);
    return this.finishedUsers.get(code)!.size;
  }

  public getFinishedCount(roomCode: string): number {
    return this.finishedUsers.get(roomCode.toUpperCase())?.size || 0;
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
   * Register a new client connection to a room
   */
  public async joinRoom(ws: any, clientData: { userId: string; roomCode: string; name?: string; image?: string }) {
    const code = clientData.roomCode.toUpperCase();

    // Verify user is an authorized participant or host
    try {
      const isAuthorized = await db.room.findFirst({
        where: {
          code,
          OR: [
            { hostId: clientData.userId },
            { participants: { some: { userId: clientData.userId } } },
          ],
        },
        select: { id: true },
      });

      if (!isAuthorized) {
        console.warn(`[Socket] Unauthorized join attempt by user ${clientData.userId} for room ${code}`);
        try {
          ws.send(JSON.stringify({ type: "error", message: "Unauthorized: You have not joined this room." }));
          ws.close();
        } catch (_) {}
        return;
      }
    } catch (err) {
      console.error("[Socket] Error verifying user participation:", err);
    }

    if (!this.rooms.has(code)) {
      this.rooms.set(code, new Set());
    }
    const roomSet = this.rooms.get(code)!;

    // Check if this userId already has an active socket in the room (reconnect or page navigation)
    let alreadyInRoom = false;
    for (const existingWs of roomSet) {
      if (existingWs === ws) continue;
      const meta = this.clients.get(existingWs);
      if (meta && meta.userId === clientData.userId) {
        alreadyInRoom = true;
        this.clients.delete(existingWs);
        roomSet.delete(existingWs);
        try {
          existingWs.close();
        } catch (_) {}
      }
    }

    const client: ConnectedClient = {
      ws,
      userId: clientData.userId,
      roomCode: code,
      name: clientData.name,
      image: clientData.image,
    };

    this.clients.set(ws, client);
    roomSet.add(ws);

    const totalUnique = this.getUniqueUserCount(code);
    console.log(`[Socket] User ${clientData.name || clientData.userId} connected to room ${code}. Total unique: ${totalUnique} (Sockets: ${roomSet.size})`);

    // ONLY broadcast participant joined event to others if this user wasn't already in the room
    if (!alreadyInRoom) {
      this.broadcastToRoomExcept(code, ws, "participant:joined", {
        userId: client.userId,
        name: client.name || "Anonymous",
        image: client.image,
        totalConnected: totalUnique,
      });
    }

    // Send instant full room sync to the newly connected/reconnected client
    this.sendRoomSync(ws, code);
  }

  /**
   * Handle client disconnection
   */
  public leaveRoom(ws: any) {
    const client = this.clients.get(ws);
    if (!client) return;

    const { roomCode, userId } = client;
    this.clients.delete(ws);

    const roomSet = this.rooms.get(roomCode);
    if (roomSet) {
      roomSet.delete(ws);
      if (roomSet.size === 0) {
        this.rooms.delete(roomCode);
      } else {
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
    }

    console.log(`[Socket] User ${userId} disconnected from room ${roomCode}`);
  }

  /**
   * Broadcast an event and payload to all clients in a room
   */
  public broadcastToRoom(roomCode: string, event: string, data: any) {
    const code = roomCode.toUpperCase();
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
  public broadcastToRoomExcept(roomCode: string, excludeWs: any, event: string, data: any) {
    const code = roomCode.toUpperCase();
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
  public isUserDisqualified(roomCode: string, userId: string): boolean {
    const set = this.disqualifiedUsers.get(roomCode.toUpperCase());
    return set ? set.has(userId) : false;
  }

  /**
   * Get anti-cheat warning count for a user in a room
   */
  public getUserWarningCount(roomCode: string, userId: string): number {
    return this.participantWarnings.get(roomCode.toUpperCase())?.get(userId) || 0;
  }

  /**
   * Authoritative Anti-Cheat Violation Recorder with Penalty Escalation Ladder
   */
  public async recordViolation(
    roomCode: string,
    userId: string,
    violationType: "TAB_SWITCH" | "WINDOW_BLUR" | "SUSPICIOUS_PASTE",
    details?: string
  ) {
    const code = roomCode.toUpperCase();

    if (!this.participantWarnings.has(code)) {
      this.participantWarnings.set(code, new Map());
    }
    const warningsMap = this.participantWarnings.get(code)!;
    const currentWarnings = (warningsMap.get(userId) || 0) + 1;
    warningsMap.set(userId, currentWarnings);

    let penaltyAdded = 0;
    let isDisqualified = false;

    if (!this.disqualifiedUsers.has(code)) {
      this.disqualifiedUsers.set(code, new Set());
    }

    const participant = await db.roomParticipant.findFirst({
      where: {
        userId,
        room: { code },
      },
      include: {
        user: { select: { name: true } },
      },
    });

    const userName = participant?.user?.name || "Participant";

    if (currentWarnings === 2) {
      // Strike 2: Add +180s (+3 minutes) penalty to participant score in database
      penaltyAdded = 180;
      if (participant) {
        await db.roomParticipant.update({
          where: { id: participant.id },
          data: { penaltyTime: { increment: 180 } },
        });
      }
    } else if (currentWarnings >= 3) {
      // Strike 3: Automatic disqualification
      isDisqualified = true;
      this.disqualifiedUsers.get(code)!.add(userId);
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

    if (!this.roomViolations.has(code)) {
      this.roomViolations.set(code, []);
    }
    const violations = this.roomViolations.get(code)!;
    violations.unshift(violation);
    if (violations.length > 50) violations.pop();

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
  public updateCodeSnapshot(
    roomCode: string,
    userId: string,
    data: { problemId: number; sourceCode: string; language: string }
  ) {
    const code = roomCode.toUpperCase();
    if (!this.codeSnapshots.has(code)) {
      this.codeSnapshots.set(code, new Map());
    }
    const snapshot: CodeSnapshot = {
      ...data,
      updatedAt: Date.now(),
    };
    this.codeSnapshots.get(code)!.set(userId, snapshot);

    // Broadcast live code update to room spectators
    this.broadcastToRoom(code, "code:stream_update", {
      userId,
      ...snapshot,
    });
  }

  /**
   * Retrieve active code snapshot for a target participant
   */
  public getCodeSnapshot(roomCode: string, targetUserId: string): CodeSnapshot | null {
    const code = roomCode.toUpperCase();
    return this.codeSnapshots.get(code)?.get(targetUserId) || null;
  }

  /**
   * Get all anti-cheat violations recorded for a room
   */
  public getRoomViolations(roomCode: string): AntiCheatViolation[] {
    return this.roomViolations.get(roomCode.toUpperCase()) || [];
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

      const participantsList = room.participants.map((p, idx) => ({
        rank: idx + 1,
        participantId: p.id,
        userId: p.userId,
        name: p.user.name || "Anonymous",
        image: p.user.image,
        role: p.role,
        score: p.score,
        solvedCount: p.solvedCount,
        penaltyTime: p.penaltyTime,
        warningsCount: this.getUserWarningCount(code, p.userId),
        isDisqualified: this.isUserDisqualified(code, p.userId),
        isSelf: client?.userId === p.userId,
      }));

      this.sendToClient(ws, "room:sync", {
        status: room.status,
        startTime: room.startTime,
        endTime: room.endTime,
        remainingSeconds,
        participants: participantsList,
        violations: this.getRoomViolations(code),
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

      const leaderboard: LeaderboardEntry[] = room.participants.map((p, idx) => ({
        rank: idx + 1,
        participantId: p.id,
        userId: p.userId,
        name: p.user.name || "Anonymous",
        image: p.user.image,
        role: p.role,
        score: p.score,
        solvedCount: p.solvedCount,
        penaltyTime: p.penaltyTime,
        warningsCount: this.getUserWarningCount(code, p.userId),
        isDisqualified: this.isUserDisqualified(code, p.userId),
      }));

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
    console.log(`[Socket] Contest ended authoritatively for room ${code}`);

    if (this.roomTimers.has(code)) {
      clearTimeout(this.roomTimers.get(code));
      this.roomTimers.delete(code);
    }

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

      const finalLeaderboard = (room?.participants || []).map((p, idx) => ({
        rank: idx + 1,
        participantId: p.id,
        userId: p.userId,
        name: p.user.name || "Anonymous",
        image: p.user.image,
        role: p.role,
        score: p.score,
        solvedCount: p.solvedCount,
        penaltyTime: p.penaltyTime,
        warningsCount: this.getUserWarningCount(code, p.userId),
        isDisqualified: this.isUserDisqualified(code, p.userId),
      }));

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
