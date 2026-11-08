import { describe, it, expect, mock, beforeEach } from "bun:test";
import { EventEmitter } from "events";
import { RoomSocketManager } from "../services/roomSocket";
import { db } from "@intervue/db";

class MockRedisBroker extends EventEmitter {
  async publish(channel: string, message: string) {
    this.emit(channel, message);
    return 1;
  }
}

class MockRedisClient {
  public broker: MockRedisBroker;
  constructor(broker: MockRedisBroker) {
    this.broker = broker;
  }
  async publish(channel: string, message: string) {
    return await this.broker.publish(channel, message);
  }
  async hdel() { return 1; }
  async hset() { return 1; }
  async expire() { return 1; }
}

class MockRedisSubscriber extends EventEmitter {
  public status = "ready";
  public isConnected = true;
  private broker: MockRedisBroker;
  private channelHandlers: Map<string, (msg: string) => void> = new Map();

  constructor(broker: MockRedisBroker) {
    super();
    this.broker = broker;
  }

  subscribe(channel: string, cb?: (err: any) => void) {
    const handler = (msg: string) => {
      if (this.isConnected) {
        this.emit("message", channel, msg);
      }
    };
    this.channelHandlers.set(channel, handler);
    this.broker.on(channel, handler);
    if (cb) cb(null);
  }

  disconnect() {
    this.isConnected = false;
    this.status = "close";
    this.emit("close");
  }

  reconnect() {
    this.isConnected = true;
    this.status = "ready";
    this.emit("ready");
  }
}

class MockWebSocket extends EventEmitter {
  public closed = false;
  public closeCode: number | null = null;
  public closeReason: string | null = null;
  public messages: any[] = [];

  send(data: string) {
    this.messages.push(JSON.parse(data));
  }

  close(code?: number, reason?: string) {
    this.closed = true;
    this.closeCode = code || 1000;
    this.closeReason = reason || "";
    this.emit("close", this.closeCode, this.closeReason);
  }

  findMessage(predicate: (msg: any) => boolean) {
    return this.messages.find(predicate);
  }
}

describe("Cross-Instance Redis Revocation & Passive Broadcast Authorization", () => {
  const roomCode = "XINST1";
  const userHost = { id: "host_1", name: "Host One" };
  const userKicked = { id: "kicked_user_2", name: "Kicked User" };
  const userLegit = { id: "legit_user_3", name: "Legit User" };

  let activeParticipants: string[] = [];

  beforeEach(() => {
    activeParticipants = [userHost.id, userKicked.id, userLegit.id];

    // Mock Database for room authorization
    db.room.findFirst = mock(async ({ where }: any) => {
      const checkUserId = where?.OR?.[0]?.hostId || where?.OR?.[1]?.participants?.some?.userId;
      if (checkUserId && activeParticipants.includes(checkUserId)) {
        return { id: "room_xinst_1", code: roomCode, status: "ACTIVE" } as any;
      }
      return null as any;
    });

    db.room.findUnique = mock(async () => ({
      id: "room_xinst_1",
      code: roomCode,
      status: "ACTIVE",
      hostId: userHost.id,
      duration: 30,
      participants: activeParticipants.map((id) => ({
        id: `p_${id}`,
        userId: id,
        user: { name: `User ${id}`, image: null },
        role: id === userHost.id ? "HOST" : "PARTICIPANT",
        score: 0,
        solvedCount: 0,
        penaltyTime: 0,
      })),
    } as any));

    db.roomParticipant.deleteMany = mock(async ({ where }: any) => {
      activeParticipants = activeParticipants.filter((id) => id !== where.userId);
      return { count: 1 };
    });
  });

  it("Reproduction: Kicked user on Instance B must NOT receive sensitive broadcast data when Instance B loses Redis subscription (FAILS before fix)", async () => {
    const broker = new MockRedisBroker();
    const redisClientA = new MockRedisClient(broker);
    const redisSubA = new MockRedisSubscriber(broker);
    const redisClientB = new MockRedisClient(broker);
    const redisSubB = new MockRedisSubscriber(broker);

    // Instantiate two independent instances of RoomSocketManager
    const instanceA = new RoomSocketManager({
      redisClient: redisClientA,
      redisSubscriber: redisSubA,
      isRedisConnected: true,
    });

    const instanceB = new RoomSocketManager({
      redisClient: redisClientB,
      redisSubscriber: redisSubB,
      isRedisConnected: true,
    });

    // 1. Both userKicked and userLegit join roomCode on Instance B
    const wsKicked = new MockWebSocket();
    const wsLegit = new MockWebSocket();

    instanceB.registerConnection(wsKicked, userKicked);
    instanceB.registerConnection(wsLegit, userLegit);

    await instanceB.joinRoom(wsKicked, { roomCode });
    await instanceB.joinRoom(wsLegit, { roomCode });

    expect(instanceB.isUserInRoom(roomCode, userKicked.id)).toBe(true);
    expect(instanceB.isUserInRoom(roomCode, userLegit.id)).toBe(true);

    // Clear initial join/sync messages
    wsKicked.messages = [];
    wsLegit.messages = [];

    // 2. Instance B loses its Redis subscription
    redisSubB.disconnect();

    // 3. Host kicks the user through Instance A
    // Simulate kick endpoint on Instance A
    await db.roomParticipant.deleteMany({
      where: { roomId: "room_xinst_1", userId: userKicked.id },
    });
    // Instance A publishes REVOKE_MEMBERSHIP via Redis Pub/Sub
    await instanceA.revokeMembership(roomCode, userKicked.id, "Kicked by host");

    // 4. Instance B missed the Pub/Sub notification because its subscriber was disconnected!
    // Verify userKicked's socket has NOT been closed by Pub/Sub yet on Instance B
    // (Simulating the passive disconnected window)

    // 5. Other participants continue publishing room events on Instance B
    // e.g., A competitor stream update with sensitive code
    await instanceB.broadcastToRoom(roomCode, "code:stream_update", {
      userId: userLegit.id,
      sourceCode: "def secret_solution(): return 42",
      language: "python",
    });

    // BEFORE FIX: instanceB.broadcastToRoom sends code:stream_update to ALL sockets in roomSet
    // because it blindly trusts stale local roomSet and doesn't revalidate while subscriber is down!
    // EXPECTED AFTER FIX: userKicked MUST NOT receive any code:stream_update!
    const leakedCode = wsKicked.findMessage((m) => m.event === "code:stream_update");
    expect(leakedCode).toBeUndefined(); // FAILS before fix!
    expect(wsKicked.closed).toBe(true); // Must be kicked on fail-closed revalidation

    // Valid participant must receive the broadcast normally
    const legitCode = wsLegit.findMessage((m) => m.event === "code:stream_update");
    expect(legitCode).toBeDefined();
    expect(wsLegit.closed).toBe(false);

    // 6. Restore Redis and verify valid participants can resume normal operation
    redisSubB.reconnect();

    // Verify legitimate participant can continue normal operation without being kicked
    wsLegit.messages = [];
    await instanceB.broadcastToRoom(roomCode, "leaderboard:update", {
      status: "ACTIVE",
      leaderboard: [],
    });

    const leaderboardMsg = wsLegit.findMessage((m) => m.event === "leaderboard:update");
    expect(leaderboardMsg).toBeDefined();
    expect(wsLegit.closed).toBe(false);
  });
});
