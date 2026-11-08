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
}

describe("Phase 1: WebSocket Room Authorization & Scoping", () => {
  const userA = { id: "user_alpha", name: "User Alpha", image: null };
  const userB = { id: "user_bravo", name: "User Bravo", image: null };
  const roomAlphaCode = "ROOM_ALPHA";
  const roomBravoCode = "ROOM_BRAVO";

  beforeEach(() => {
    // Reset db.room.findFirst mock
    mock.restore();
  });

  it("registers a connection with roomCode: null prior to joining", () => {
    const ws = new MockWebSocket();
    roomSocketManager.registerConnection(ws, userA);

    const client = roomSocketManager.getClient(ws);
    expect(client).toBeDefined();
    expect(client?.userId).toBe(userA.id);
    expect(client?.roomCode).toBeNull();

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
    expect(ws.closed).toBe(false);

    // Verifies room sync was dispatched
    const syncMsg = ws.findMessage((m) => m.event === "room:sync");
    expect(syncMsg).toBeDefined();
    expect(syncMsg?.data?.status).toBe("WAITING");
    expect(syncMsg?.data?.participants).toHaveLength(1);

    roomSocketManager.leaveRoom(ws);
  });

  it("enforces rule 4: restricts connection to one room and forbids room switching", async () => {
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

    // Join room Alpha
    await roomSocketManager.handleMessage(ws, "room:join", { roomCode: roomAlphaCode });
    expect(roomSocketManager.getClient(ws)?.roomCode).toBe(roomAlphaCode);

    // Attempt to join room Bravo on the same WebSocket connection
    await roomSocketManager.handleMessage(ws, "room:join", { roomCode: roomBravoCode });

    const switchError = ws.findMessage((m) => m.event === "error" && m.data?.code === "ROOM_SWITCH_FORBIDDEN");
    expect(switchError).toBeDefined();
    expect(switchError?.data?.message).toContain("A WebSocket connection is restricted to one room");

    // Ensure the socket is STILL bound to Room Alpha and did not switch
    expect(roomSocketManager.getClient(ws)?.roomCode).toBe(roomAlphaCode);

    roomSocketManager.leaveRoom(ws);
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

  it("correctly handles membership revocation and kicks target sockets", async () => {
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
    expect(roomSocketManager.isUserInRoom(roomAlphaCode, userA.id)).toBe(true);

    // Host or admin revokes userA membership
    await roomSocketManager.revokeMembership(roomAlphaCode, userA.id, "Host removed participant");

    const kickMsg = ws.findMessage((m) => m.event === "room:kicked");
    expect(kickMsg).toBeDefined();
    expect(kickMsg?.data?.reason).toBe("Host removed participant");
    expect(ws.closed).toBe(true);
    expect(ws.closeCode).toBe(4403);
    expect(roomSocketManager.isUserInRoom(roomAlphaCode, userA.id)).toBe(false);
  });
});
