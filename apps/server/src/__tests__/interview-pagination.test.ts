import { beforeEach, describe, expect, it, mock } from "bun:test";
import { db } from "@intervue/db";
import { auth } from "../lib/auth";
import interviewRoutes from "../routes/interview";

describe("Phase 2D.3: bounded interview history and transcripts", () => {
  const user = { id: "interview-user", name: "Interview User", email: "interview@example.com" };

  beforeEach(() => {
    mock.restore();
    (db as any).interview ??= {};
    (db as any).message ??= {};
    auth.api.getSession = mock(async () => ({
      user,
      session: { id: "interview-session", userId: user.id },
    } as any));
  });

  it("paginates interview history with a bounded cursor query", async () => {
    const rows = Array.from({ length: 4 }, (_, index) => ({
      id: `interview-${index + 1}`,
      userId: user.id,
      role: "backend engineer",
      createdAt: new Date(4 - index),
      evaluation: null,
    }));
    db.interview.findMany = mock(async () => rows as any);

    const response = await interviewRoutes.request("/?limit=3&cursor=previous-interview");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.interviews).toHaveLength(3);
    expect(body.pageInfo).toEqual({ hasMore: true, nextCursor: "interview-3" });
    expect(db.interview.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: user.id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 4,
      cursor: { id: "previous-interview" },
      skip: 1,
    }));
  });

  it("caps excessive page sizes and reports the final page", async () => {
    db.interview.findMany = mock(async () => [{
      id: "interview-1",
      userId: user.id,
      role: "backend engineer",
      createdAt: new Date(),
      evaluation: null,
    }] as any);

    const response = await interviewRoutes.request("/?limit=1000");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.pageInfo).toEqual({ hasMore: false, nextCursor: null });
    expect(db.interview.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 101 }));
  });

  it("returns the latest transcript page in chronological display order", async () => {
    db.interview.findFirst = mock(async () => ({
      id: "interview-1",
      userId: user.id,
      role: "backend engineer",
      createdAt: new Date(),
      evaluation: null,
    } as any));
    db.message.findMany = mock(async () => [
      { id: "m4", interviewId: "interview-1", role: "assistant", content: "fourth", createdAt: new Date(4) },
      { id: "m3", interviewId: "interview-1", role: "user", content: "third", createdAt: new Date(3) },
      { id: "m2", interviewId: "interview-1", role: "assistant", content: "second", createdAt: new Date(2) },
    ] as any);

    const response = await interviewRoutes.request("/interview-1?limit=2&cursor=newer-page");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.interview.messages.map((message: any) => message.id)).toEqual(["m3", "m4"]);
    expect(body.pageInfo).toEqual({ hasMore: true, nextCursor: "m3" });
    expect(db.message.findMany).toHaveBeenCalledWith({
      where: { interviewId: "interview-1" },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 3,
      cursor: { id: "newer-page" },
      skip: 1,
    });
  });

  it("does not query transcript messages for an inaccessible interview", async () => {
    db.interview.findFirst = mock(async () => null as any);
    let messageLookupCalled = false;
    db.message.findMany = mock(async () => {
      messageLookupCalled = true;
      return [] as any;
    });

    const response = await interviewRoutes.request("/foreign-interview");

    expect(response.status).toBe(404);
    expect(messageLookupCalled).toBe(false);
  });
});
