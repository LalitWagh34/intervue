import { describe, it, expect, beforeEach, mock } from "bun:test";
import roomRoutes from "../routes/rooms";
import { roomSocketManager } from "../services/roomSocket";
import { auth } from "../lib/auth";
import { db } from "@intervue/db";

// Mock WebSocket
class MockWebSocket {
  public readyState = 1;
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
    this.readyState = 3;
  }

  getLastMessage() {
    return this.sentMessages[this.sentMessages.length - 1];
  }

  findMessage(predicate: (msg: any) => boolean) {
    return this.sentMessages.find(predicate);
  }
}

describe("Reproduce Confirmed Vulnerabilities (Should FAIL before fix)", () => {
  const hostUser = { id: "host_user_1", name: "Host User", email: "host@example.com" };
  const participantUser = { id: "participant_user_2", name: "Participant User", email: "part@example.com" };
  const roomCode = "VULN01";

  beforeEach(() => {
    mock.restore();
  });

  it("Vulnerability 1a: POST /:code/leave should return 200 (FAILS with 500 currently due to c.get('room'))", async () => {
    // Authenticate participantUser
    auth.api.getSession = mock(async () => ({
      user: participantUser,
      session: { id: "sess_part", userId: participantUser.id },
    } as any));

    // Mock DB findUnique for requireRoomMember
    db.room.findUnique = mock(async () => ({
      id: "room_vuln_1",
      code: roomCode,
      hostId: hostUser.id,
      participants: [
        { id: "p_host", userId: hostUser.id, role: "HOST" },
        { id: "p_part", userId: participantUser.id, role: "PARTICIPANT" },
      ],
    } as any));

    db.roomParticipant.deleteMany = mock(async () => ({ count: 1 }));

    // Send request to real route handler
    const res = await roomRoutes.request(`/${roomCode}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    // BEFORE FIX: Fails because handler reads c.get("room") (undefined) and throws 500
    // EXPECTED AFTER FIX: 200 OK
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("Vulnerability 1b: POST /:code/kick/:targetUserId should return 200 (FAILS with 500 currently due to c.get('room'))", async () => {
    // Authenticate hostUser
    auth.api.getSession = mock(async () => ({
      user: hostUser,
      session: { id: "sess_host", userId: hostUser.id },
    } as any));

    // Mock DB findUnique for requireRoomHost
    db.room.findUnique = mock(async () => ({
      id: "room_vuln_1",
      code: roomCode,
      hostId: hostUser.id,
      participants: [
        { id: "p_host", userId: hostUser.id, role: "HOST" },
        { id: "p_part", userId: participantUser.id, role: "PARTICIPANT" },
      ],
    } as any));

    db.roomParticipant.deleteMany = mock(async () => ({ count: 1 }));

    // Host kicks participant
    const res = await roomRoutes.request(`/${roomCode}/kick/${participantUser.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    // BEFORE FIX: Fails because handler reads c.get("room") (undefined) and throws 500
    // EXPECTED AFTER FIX: 200 OK
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("Vulnerability 2: Revoked users must be denied access to time:sync (FAILS before fix)", async () => {
    const ws = new MockWebSocket();
    roomSocketManager.registerConnection(ws, participantUser);

    db.room.findFirst = mock(async () => ({ id: "room_vuln_1", status: "ACTIVE" } as any));
    db.room.findUnique = mock(async () => ({
      id: "room_vuln_1",
      code: roomCode,
      status: "ACTIVE",
      duration: 30,
      endTime: null,
      participants: [{ id: "p1", userId: participantUser.id, user: participantUser }],
      violations: [],
    } as any));

    // Participant joins room
    await roomSocketManager.handleMessage(ws, "room:join", { roomCode });
    expect(roomSocketManager.getClient(ws)?.state).toBe("JOINED");

    // Clear sent messages
    ws.sentMessages = [];

    // Now participant's membership is revoked from DB
    db.room.findFirst = mock(async () => null as any);

    // Revoked user attempts time:sync
    await roomSocketManager.handleMessage(ws, "time:sync", { roomCode });

    // BEFORE FIX: time:sync was not checked by verifyActiveMembership, so room:sync is returned!
    // EXPECTED AFTER FIX: Socket must be kicked/closed, not sent a room:sync
    const syncMsg = ws.findMessage((m) => m.event === "room:sync");
    expect(syncMsg).toBeUndefined(); // Should NOT receive room:sync!

    const kickMsg = ws.findMessage((m) => m.event === "room:kicked");
    expect(kickMsg).toBeDefined(); // Must be kicked!
    expect(ws.closed).toBe(true);
  });

  it("Vulnerability 3: REST spectator endpoint must NOT expose snapshots of removed participants (FAILS before fix)", async () => {
    // Authenticate hostUser as spectator
    auth.api.getSession = mock(async () => ({
      user: hostUser,
      session: { id: "sess_host", userId: hostUser.id },
    } as any));

    // Save a code snapshot for participantUser
    await roomSocketManager.updateCodeSnapshot(roomCode, participantUser.id, {
      problemId: 42,
      sourceCode: "secret_code()",
      language: "python",
    });

    // Mock DB: hostUser is in the room, BUT participantUser is NOT in the room (removed/kicked)
    db.room.findUnique = mock(async () => ({
      id: "room_vuln_1",
      code: roomCode,
      hostId: hostUser.id,
      participants: [
        { id: "p_host", userId: hostUser.id, role: "HOST" },
        // participantUser was removed!
      ],
    } as any));

    // Mock findFirst for participant check
    db.roomParticipant.findFirst = mock(async () => null as any);

    // Host queries spectator endpoint for removed participantUser
    const res = await roomRoutes.request(`/${roomCode}/participant-code/${participantUser.id}`, {
      method: "GET",
    });

    // BEFORE FIX: Endpoint returned { snapshot: { sourceCode: "secret_code()" } } even though user was removed!
    // EXPECTED AFTER FIX: Snapshot should be null or 404 (participant is not in room)
    const json = await res.json();
    expect(json.snapshot).toBeNull();
  });

  it("Side-effect protection: Unauthorized non-member cannot /leave or trigger deletions", async () => {
    const outsider = { id: "outsider_999", email: "outsider@example.com", name: "Outsider" };
    auth.api.getSession = mock(async () => ({
      user: outsider,
      session: { id: "sess_out", userId: outsider.id },
    } as any));

    db.room.findUnique = mock(async () => ({
      id: "room_vuln_1",
      code: roomCode,
      hostId: hostUser.id,
      participants: [{ id: "p1", userId: participantUser.id, role: "PARTICIPANT" }],
    } as any));

    let deleteCalled = false;
    db.roomParticipant.deleteMany = mock(async () => {
      deleteCalled = true;
      return { count: 0 };
    });

    const res = await roomRoutes.request(`/${roomCode}/leave`, {
      method: "POST",
    });

    expect(res.status).toBe(403);
    expect(deleteCalled).toBe(false); // Zero side effects
  });

  it("Side-effect protection: Non-host participant cannot /kick other participants", async () => {
    // Participant tries to kick host or another participant
    auth.api.getSession = mock(async () => ({
      user: participantUser,
      session: { id: "sess_part", userId: participantUser.id },
    } as any));

    db.room.findUnique = mock(async () => ({
      id: "room_vuln_1",
      code: roomCode,
      hostId: hostUser.id,
      participants: [
        { id: "p_host", userId: hostUser.id, role: "HOST" },
        { id: "p1", userId: participantUser.id, role: "PARTICIPANT" },
      ],
    } as any));

    let deleteCalled = false;
    db.roomParticipant.deleteMany = mock(async () => {
      deleteCalled = true;
      return { count: 0 };
    });

    const res = await roomRoutes.request(`/${roomCode}/kick/${hostUser.id}`, {
      method: "POST",
    });

    expect(res.status).toBe(403);
    expect(deleteCalled).toBe(false); // Zero side effects
  });

  it("Side-effect protection: Unauthorized non-member cannot inspect spectator snapshot", async () => {
    const outsider = { id: "outsider_888", email: "outsider@example.com", name: "Outsider" };
    auth.api.getSession = mock(async () => ({
      user: outsider,
      session: { id: "sess_out", userId: outsider.id },
    } as any));

    db.room.findUnique = mock(async () => ({
      id: "room_vuln_1",
      code: roomCode,
      hostId: hostUser.id,
      participants: [{ id: "p1", userId: participantUser.id, role: "PARTICIPANT" }],
    } as any));

    const res = await roomRoutes.request(`/${roomCode}/participant-code/${participantUser.id}`, {
      method: "GET",
    });

    expect(res.status).toBe(403);
  });

  it("Code sync DB query caching: High-frequency code:sync does not query DB excessively", async () => {
    const ws = new MockWebSocket();
    roomSocketManager.registerConnection(ws, participantUser);

    db.room.findFirst = mock(async () => ({ id: "room_vuln_1", status: "ACTIVE" } as any));
    await roomSocketManager.handleMessage(ws, "room:join", { roomCode });

    // Track database query invocations
    let dbQueryCount = 0;
    db.room.findFirst = mock(async () => {
      dbQueryCount++;
      return { id: "room_vuln_1" } as any;
    });

    // Send 10 rapid code:sync messages (within 500ms)
    for (let i = 0; i < 10; i++) {
      await roomSocketManager.handleMessage(ws, "code:sync", {
        roomCode,
        problemId: 1,
        sourceCode: `print(${i})`,
        language: "python",
      });
    }

    // Only 1 database query should have occurred due to 5s caching!
    expect(dbQueryCount).toBe(1);

    // Snapshot is updated accurately
    const snap = await roomSocketManager.getCodeSnapshot(roomCode, participantUser.id);
    expect(snap?.sourceCode).toBe("print(9)");

    roomSocketManager.leaveRoom(ws);
  });
});
