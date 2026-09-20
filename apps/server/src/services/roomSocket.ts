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
}

class RoomSocketManager {
  // roomCode -> Set of client sockets
  private rooms: Map<string, Set<any>> = new Map();
  // client socket -> metadata
  private clients: Map<any, ConnectedClient> = new Map();
  // Active room timer timeouts
  private roomTimers: Map<string, any> = new Map();

  /**
   * Register a new client connection to a room
   */
  public joinRoom(ws: any, clientData: { userId: string; roomCode: string; name?: string; image?: string }) {
    const code = clientData.roomCode.toUpperCase();

    // Clean up if already in a room
    this.leaveRoom(ws);

    const client: ConnectedClient = {
      ws,
      userId: clientData.userId,
      roomCode: code,
      name: clientData.name,
      image: clientData.image,
    };

    this.clients.set(ws, client);

    if (!this.rooms.has(code)) {
      this.rooms.set(code, new Set());
    }
    this.rooms.get(code)!.add(ws);

    console.log(`[Socket] User ${clientData.name || clientData.userId} joined room ${code}. Total in room: ${this.rooms.get(code)!.size}`);

    // Broadcast participant joined event to others
    this.broadcastToRoomExcept(code, ws, "participant:joined", {
      userId: client.userId,
      name: client.name || "Anonymous",
      image: client.image,
      totalConnected: this.rooms.get(code)!.size,
    });

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
        this.broadcastToRoom(roomCode, "participant:left", {
          userId,
          totalConnected: roomSet.size,
        });
      }
    }

    console.log(`[Socket] User ${userId} left room ${roomCode}`);
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
   * Authoritative Room Sync: sends complete state snapshot to client
   */
  public async sendRoomSync(ws: any, roomCode: string) {
    try {
      const room = await db.room.findUnique({
        where: { code: roomCode.toUpperCase() },
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

      this.sendToClient(ws, "room:sync", {
        status: room.status,
        startTime: room.startTime,
        endTime: room.endTime,
        remainingSeconds,
        participants: room.participants.map((p, idx) => ({
          rank: idx + 1,
          participantId: p.id,
          userId: p.userId,
          name: p.user.name || "Anonymous",
          image: p.user.image,
          role: p.role,
          score: p.score,
          solvedCount: p.solvedCount,
          penaltyTime: p.penaltyTime,
          isSelf: client?.userId === p.userId,
        })),
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

    // Schedule authoritative end timer
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
