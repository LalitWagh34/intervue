import { beforeEach, describe, expect, it, mock } from "bun:test";
import { db } from "@intervue/db";
import { auth } from "../lib/auth";

const fetchLeetCodeStats = mock(async (_handle: string): Promise<any> => ({}));
const fetchCodeforcesStats = mock(async (_handle: string): Promise<any> => ({}));
const fetchGitHubStats = mock(async (_handle: string): Promise<any> => ({}));

mock.module("../lib/externalStats", () => ({
  fetchLeetCodeStats,
  fetchCodeforcesStats,
  fetchGitHubStats,
  isExternalProviderTimeout: (error: unknown) =>
    ["AbortError", "TimeoutError"].includes((error as { name?: string } | null)?.name ?? ""),
}));

import profileRoutes from "../routes/profile";

describe("external profile synchronization freshness", () => {
  const user = { id: "sync-user", name: "Sync User", email: "sync@example.com" };
  const previousLeetCode = { handle: "lc-user", totalSolved: 10, lastSyncedAt: "2026-11-20T10:00:00.000Z" };
  const previousCodeforces = { handle: "cf-user", solvedCount: 5, lastSyncedAt: "2026-11-20T11:00:00.000Z" };

  beforeEach(() => {
    fetchLeetCodeStats.mockReset();
    fetchCodeforcesStats.mockReset();
    fetchGitHubStats.mockReset();
    auth.api.getSession = mock(async () => ({
      user,
      session: { id: "sync-session", userId: user.id },
    } as any));
  });

  it("reports partial provider success without disguising cached data as fresh", async () => {
    const freshCodeforces = { handle: "cf-user", solvedCount: 8, lastSyncedAt: "2026-11-22T10:00:00.000Z" };
    fetchLeetCodeStats.mockRejectedValueOnce(Object.assign(new Error("deadline"), { name: "TimeoutError" }));
    fetchCodeforcesStats.mockResolvedValueOnce(freshCodeforces);
    db.profile.findUnique = mock(async () => ({
      userId: user.id,
      leetcodeHandle: "lc-user",
      codeforcesHandle: "cf-user",
      githubHandle: null,
      leetcodeData: previousLeetCode,
      codeforcesData: previousCodeforces,
      githubData: null,
      lastSyncedAt: new Date("2026-11-20T11:00:00.000Z"),
    } as any));
    db.profile.update = mock(async ({ data }: any) => ({ userId: user.id, ...data }));

    const response = await profileRoutes.request("/sync-all", { method: "POST" });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.syncStatus).toEqual({
      leetcode: { state: "stale", lastSyncedAt: previousLeetCode.lastSyncedAt, reason: "timeout" },
      codeforces: { state: "fresh", lastSyncedAt: freshCodeforces.lastSyncedAt },
      github: { state: "disconnected", lastSyncedAt: null },
    });
    expect(db.profile.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        leetcodeData: previousLeetCode,
        codeforcesData: freshCodeforces,
        lastSyncedAt: expect.any(Date),
      }),
    }));
  });

  it("does not advance lastSyncedAt when every connected provider fails", async () => {
    fetchLeetCodeStats.mockRejectedValueOnce(new Error("unavailable"));
    fetchCodeforcesStats.mockRejectedValueOnce(new Error("unavailable"));
    db.profile.findUnique = mock(async () => ({
      userId: user.id,
      leetcodeHandle: "lc-user",
      codeforcesHandle: "cf-user",
      githubHandle: null,
      leetcodeData: previousLeetCode,
      codeforcesData: previousCodeforces,
      githubData: null,
      lastSyncedAt: new Date("2026-11-20T11:00:00.000Z"),
    } as any));
    db.profile.update = mock(async ({ data }: any) => ({ userId: user.id, ...data }));

    const response = await profileRoutes.request("/sync-all", { method: "POST" });
    const updateCall = (db.profile.update as any).mock.calls[0][0];

    expect(response.status).toBe(200);
    expect(Object.prototype.hasOwnProperty.call(updateCall.data, "lastSyncedAt")).toBe(false);
  });
});
