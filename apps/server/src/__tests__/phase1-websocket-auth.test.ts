import { describe, it, expect, beforeEach, mock } from "bun:test";
import { roomSocketManager } from "../services/roomSocket";
import { db } from "@intervue/db";

// Mock WebSocket class to capture sent messages and socket state
class MockWebSocket {
  public readyState = 1; // WebSocket.OPEN
  public sentMessages: any[] = [];
  public closed = false;
  public closeCode: number | null = null;
  public closeReason: string | null = null;

  send(data: string) {
    try {
      this.sentMessages.push(JSON.parse(data));
    } catch {
      this.sentMessages.push(data);
    }
  }

  close(code?: number, reason?: string) {
    this.closed = true;
    this.closeCode = code || 1000;
    this.closeReason = reason || "";
    this.readyState = 3; // CLOSED
  }

  getLastMessage() {
    return this.sentMessages[this.sentMessages.length - 1];
  }

  findMessage(predicate: (msg: any) => boolean) {
    return this.sentMessages.find(predicate);
  }

  filterMessages(predicate: (msg: any) => boolean) {
    return this.sentMessages.filter(predicate);
  }
}

describe("Phase 1: WebSocket Room Authorization & Scoping", () => {
  const userA = { id: "user_alpha", name: "User Alpha", image: null };
  const userB = { id: "user_bravo", name: "User Bravo", image: null };
  const roomAlphaCode = "ROOM_ALPHA";
  const roomBravoCode = "ROOM_BRAVO";

  beforeEach(() => {
    // Reset mocks
    mock.restore();
  });

  it("registers a connection with roomCode: null and CONNECTED state prior to joining", () => {
    const ws = new MockWebSocket();
    roomSocketManager.registerConnection(ws, userA);

    const client = roomSocketManager.getClient(ws);
    expect(client).toBeDefined();
    expect(client?.userId).toBe(userA.id);
    expect(client?.roomCode).toBeNull();
    expect(client?.state).toBe("CONNECTED");

    // Clean up
    roomSocketManager.leaveRoom(ws);
  });

  it("rejects pre-join events when a socket has not joined a room", async () => {
    const ws = new MockWebSocket();
    roomSocketManager.registerConnection(ws, userA);

    // Attempt time:sync before joining
    await roomSocketManager.handleMessage(ws, "time:sync", { roomCode: roomAlphaCode });
    let lastMsg = ws.getLastMessage();
    expect(lastMsg?.event).toBe("error");
    expect(lastMsg?.data?.code).toBe("PRE_JOIN_FORBIDDEN");

    // Attempt code:sync before joining
    await roomSocketManager.handleMessage(ws, "code:sync", {
      roomCode: roomAlphaCode,
      sourceCode: "console.log('pwn')",
      language: "javascript",
    });
    lastMsg = ws.getLastMessage();
    expect(lastMsg?.event).toBe("error");
    expect(lastMsg?.data?.code).toBe("PRE_JOIN_FORBIDDEN");

    // Attempt anticheat:violation before joining
    await roomSocketManager.handleMessage(ws, "anticheat:violation", {
      roomCode: roomAlphaCode,
      type: "TAB_SWITCH",
    });
    lastMsg = ws.getLastMessage();
    expect(lastMsg?.event).toBe("error");
    expect(lastMsg?.data?.code).toBe("PRE_JOIN_FORBIDDEN");

    // Attempt code:inspect before joining
    await roomSocketManager.handleMessage(ws, "code:inspect", {
      roomCode: roomAlphaCode,
      targetUserId: userB.id,
    });
    lastMsg = ws.getLastMessage();
    expect(lastMsg?.event).toBe("error");
    expect(lastMsg?.data?.code).toBe("PRE_JOIN_FORBIDDEN");

    roomSocketManager.leaveRoom(ws);
  });

  it("rejects unauthorized room join attempts and closes the socket", async () => {
    const ws = new MockWebSocket();
    roomSocketManager.registerConnection(ws, userA);

    // Mock DB to return null (unauthorized)
    db.room.findFirst = mock(async () => null as any);

    await roomSocketManager.handleMessage(ws, "room:join", { roomCode: "FORBIDDEN_ROOM" });

    const errorMsg = ws.findMessage((m) => m.event === "error");
    expect(errorMsg).toBeDefined();
    expect(errorMsg?.data?.code).toBe("UNAUTHORIZED_ROOM");
    expect(ws.closed).toBe(true);
    expect(ws.closeCode).toBe(4403);

    roomSocketManager.leaveRoom(ws);
  });

  it("successfully joins an authorized room and binds roomCode", async () => {
    const ws = new MockWebSocket();
    roomSocketManager.registerConnection(ws, userA);

    // Mock DB to authorize userA for roomAlphaCode
    db.room.findFirst = mock(async () => ({ id: "room_1", status: "WAITING" } as any));
    db.room.findUnique = mock(async () => ({
      id: "room_1",
      code: roomAlphaCode,
      status: "WAITING",
      duration: 30,
      endTime: null,
      participants: [
        {
          id: "p1",
          userId: userA.id,
          role: "HOST",
          score: 100,
          penaltyTime: 0,
          user: { id: userA.id, name: userA.name, image: null },
        },
      ],
      submissions: [],
    } as any));

    await roomSocketManager.handleMessage(ws, "room:join", { roomCode: roomAlphaCode });

    const client = roomSocketManager.getClient(ws);
    expect(client?.roomCode).toBe(roomAlphaCode);
    expect(client?.state).toBe("JOINED");
    expect(ws.closed).toBe(false);

    // Verifies room sync was dispatched
    const syncMsg = ws.findMessage((m) => m.event === "room:sync");
    expect(syncMsg).toBeDefined();
    expect(syncMsg?.data?.status).toBe("WAITING");
    expect(syncMsg?.data?.participants).toHaveLength(1);

    roomSocketManager.leaveRoom(ws);
  });

  it("Priority 2: Rejects concurrent double-join races via Promise.all", async () => {
    const ws = new MockWebSocket();
    roomSocketManager.registerConnection(ws, userA);

    db.room.findFirst = mock(async () => {
      // Simulate microtask delay to expose race conditions
      await new Promise((r) => setTimeout(r, 10));
      return { id: "room_1", status: "WAITING" } as any;
    });
    db.room.findUnique = mock(async () => ({
      id: "room_1",
      code: roomAlphaCode,
      status: "WAITING",
      duration: 30,
      endTime: null,
      participants: [],
      submissions: [],
    } as any));

    // Fire two simultaneous join requests on the same socket
    const [res1, res2] = await Promise.all([
      roomSocketManager.joinRoom(ws, { roomCode: roomAlphaCode }),
      roomSocketManager.joinRoom(ws, { roomCode: roomAlphaCode }),
    ]);

    // Exactly one should succeed and one should fail
    expect(res1 !== res2).toBe(true);

    const raceError = ws.findMessage(
      (m) => m.event === "error" && (m.data?.code === "CONCURRENT_JOIN_FORBIDDEN" || m.data?.code === "ROOM_SWITCH_FORBIDDEN")
    );
    expect(raceError).toBeDefined();

    roomSocketManager.leaveRoom(ws);
  });

  it("Priority 3: Reconnection behavior replaces duplicate socket with close code 4409 (non-retriable)", async () => {
    const tab1 = new MockWebSocket();
    const tab2 = new MockWebSocket();

    db.room.findFirst = mock(async () => ({ id: "room_1", status: "WAITING" } as any));
    db.room.findUnique = mock(async () => ({
      id: "room_1",
      code: roomAlphaCode,
      status: "WAITING",
      duration: 30,
      endTime: null,
      participants: [],
      submissions: [],
    } as any));

    // Tab 1 joins
    roomSocketManager.registerConnection(tab1, userA);
    await roomSocketManager.handleMessage(tab1, "room:join", { roomCode: roomAlphaCode });
    expect(roomSocketManager.getClient(tab1)?.state).toBe("JOINED");
    expect(tab1.closed).toBe(false);

    // Tab 2 opens and joins the same room with same user
    roomSocketManager.registerConnection(tab2, userA);
    await roomSocketManager.handleMessage(tab2, "room:join", { roomCode: roomAlphaCode });

    // Tab 1 must be closed with non-retriable code 4409
    expect(tab1.closed).toBe(true);
    expect(tab1.closeCode).toBe(4409);
    expect(tab1.closeReason).toContain("Superseded by new session");

    // Tab 2 is active and healthy
    expect(tab2.closed).toBe(false);
    expect(roomSocketManager.getClient(tab2)?.state).toBe("JOINED");

    roomSocketManager.leaveRoom(tab2);
  });

  it("Priority 4: Spectator inspection authorizes via DB and works for disconnected participants", async () => {
    const spectatorWs = new MockWebSocket();
    roomSocketManager.registerConnection(spectatorWs, userB);

    db.room.findFirst = mock(async () => ({ id: "room_1", status: "ACTIVE" } as any));
    db.room.findUnique = mock(async () => ({
      id: "room_1",
      code: roomAlphaCode,
      status: "ACTIVE",
      duration: 30,
      endTime: null,
      participants: [],
      submissions: [],
    } as any));

    // User A previously submitted a code snapshot
    await roomSocketManager.updateCodeSnapshot(roomAlphaCode, userA.id, {
      problemId: 101,
      sourceCode: "function solve() { return 42; }",
      language: "typescript",
    });

    // Notice: User A does NOT have an open WebSocket connection (offline/disconnected)
    expect(roomSocketManager.isUserInRoom(roomAlphaCode, userA.id)).toBe(false);

    // Mock DB: spectator User B is an active participant in roomAlpha
    // Mock DB: target User A is an authorized participant in roomAlpha
    db.roomParticipant.findFirst = mock(async (query: any) => {
      // Both userB and userA belong to roomAlpha in DB
      return { id: "participant_record" } as any;
    });

    // Spectator joins roomAlpha
    await roomSocketManager.handleMessage(spectatorWs, "room:join", { roomCode: roomAlphaCode });

    // Spectator inspects User A's code
    await roomSocketManager.handleMessage(spectatorWs, "code:inspect", {
      roomCode: roomAlphaCode,
      targetUserId: userA.id,
    });

    const inspectResult = spectatorWs.findMessage((m) => m.event === "code:inspect_result");
    expect(inspectResult).toBeDefined();
    expect(inspectResult?.data?.targetUserId).toBe(userA.id);
    expect(inspectResult?.data?.snapshot?.sourceCode).toBe("function solve() { return 42; }");

    roomSocketManager.leaveRoom(spectatorWs);
  });

  it("Priority 1: Enforces active membership before sensitive events and revokes revoked users", async () => {
    const ws = new MockWebSocket();
    roomSocketManager.registerConnection(ws, userA);

    db.room.findFirst = mock(async () => ({ id: "room_1", status: "ACTIVE" } as any));
    db.room.findUnique = mock(async () => ({
      id: "room_1",
      code: roomAlphaCode,
      status: "ACTIVE",
      duration: 30,
      endTime: null,
      participants: [],
      submissions: [],
    } as any));

    // Initially participant is in DB and joins
    db.roomParticipant.findFirst = mock(async () => ({ id: "p1" } as any));
    await roomSocketManager.handleMessage(ws, "room:join", { roomCode: roomAlphaCode });

    // Now participant is REMOVED from the database (e.g. host kicked them or admin deleted them)
    db.room.findFirst = mock(async () => null as any);

    // Socket attempts to send a sensitive code:sync event
    await roomSocketManager.handleMessage(ws, "code:sync", {
      roomCode: roomAlphaCode,
      sourceCode: "console.log('tamper')",
      language: "javascript",
    });

    // Verification must fail: socket receives room:kicked, is closed with 4403, and removed from room
    const kickMsg = ws.findMessage((m) => m.event === "room:kicked");
    expect(kickMsg).toBeDefined();
    expect(ws.closed).toBe(true);
    expect(ws.closeCode).toBe(4403);
    expect(roomSocketManager.isUserInRoom(roomAlphaCode, userA.id)).toBe(false);
  });

  it("Priority 1: Fails closed when database error occurs during active membership verification", async () => {
    const ws = new MockWebSocket();
    roomSocketManager.registerConnection(ws, userA);

    db.room.findFirst = mock(async () => ({ id: "room_1", status: "ACTIVE" } as any));
    db.room.findUnique = mock(async () => ({
      id: "room_1",
      code: roomAlphaCode,
      status: "ACTIVE",
      duration: 30,
      endTime: null,
      participants: [],
      submissions: [],
    } as any));

    await roomSocketManager.handleMessage(ws, "room:join", { roomCode: roomAlphaCode });

    // Simulate DB connection crash / failure during sensitive event
    db.room.findFirst = mock(async () => {
      throw new Error("Neon DB connection timeout");
    });

    await roomSocketManager.handleMessage(ws, "anticheat:violation", {
      roomCode: roomAlphaCode,
      type: "TAB_SWITCH",
    });

    // Must fail closed: send error and terminate connection with code 1011
    const authFailMsg = ws.findMessage(
      (m) => m.event === "error" && m.data?.code === "AUTH_VERIFICATION_FAILED"
    );
    expect(authFailMsg).toBeDefined();
    expect(ws.closed).toBe(true);
    expect(ws.closeCode).toBe(1011);
  });

  it("rejects cross-room events targeting a different room", async () => {
    const ws = new MockWebSocket();
    roomSocketManager.registerConnection(ws, userA);

    db.room.findFirst = mock(async () => ({ id: "room_1", status: "WAITING" } as any));
    db.room.findUnique = mock(async () => ({
      id: "room_1",
      code: roomAlphaCode,
      status: "WAITING",
      duration: 30,
      endTime: null,
      participants: [],
      submissions: [],
    } as any));

    await roomSocketManager.handleMessage(ws, "room:join", { roomCode: roomAlphaCode });

    // Try sending code:sync for room Bravo while joined in room Alpha
    await roomSocketManager.handleMessage(ws, "code:sync", {
      roomCode: roomBravoCode,
      sourceCode: "malicious code",
      language: "typescript",
    });

    const crossRoomError = ws.findMessage((m) => m.event === "error" && m.data?.code === "CROSS_ROOM_FORBIDDEN");
    expect(crossRoomError).toBeDefined();
    expect(crossRoomError?.data?.message).toContain(`socket is bound to room ${roomAlphaCode}`);

    roomSocketManager.leaveRoom(ws);
  });

  it("rejects identity spoofing when client supplies a mismatched userId", async () => {
    const ws = new MockWebSocket();
    roomSocketManager.registerConnection(ws, userA);

    db.room.findFirst = mock(async () => ({ id: "room_1", status: "WAITING" } as any));
    db.room.findUnique = mock(async () => ({
      id: "room_1",
      code: roomAlphaCode,
      status: "WAITING",
      duration: 30,
      endTime: null,
      participants: [],
      submissions: [],
    } as any));

    await roomSocketManager.handleMessage(ws, "room:join", { roomCode: roomAlphaCode });

    // Client userA attempts to claim they are userB to record a violation
    await roomSocketManager.handleMessage(ws, "anticheat:violation", {
      roomCode: roomAlphaCode,
      userId: userB.id,
      type: "SUSPICIOUS_PASTE",
    });

    const spoofError = ws.findMessage((m) => m.event === "error" && m.data?.code === "IDENTITY_MISMATCH");
    expect(spoofError).toBeDefined();

    roomSocketManager.leaveRoom(ws);
  });
});
