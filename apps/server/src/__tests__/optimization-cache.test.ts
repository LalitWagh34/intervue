import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { Hono } from "hono";
import { db } from "@intervue/db";
import { auth } from "../lib/auth";
import { redis } from "../lib/redis";
import {
  cacheDelete,
  cacheDeleteByPrefix,
  cacheGet,
  cacheGetOrSet,
  cacheSet,
  captureCacheGeneration,
  clearCache,
  getMemoryCacheSize,
} from "../lib/cache";
import { sheetsRouter } from "../routes/sheets";
import companyRoutes from "../routes/companies";
import profileRoutes from "../routes/profile";
import learnRoutes from "../routes/learn";
import adminRoutes from "../routes/admin";
import { app as mainApp } from "../index";

const restorers: Array<() => void> = [];

function patchMethod<T extends object, K extends keyof T>(
  target: T,
  key: K,
  impl: (...args: any[]) => any
): ReturnType<typeof mock> {
  if (!target) {
    throw new Error(`Cannot patch missing target for ${String(key)}`);
  }
  const fnMock = mock(impl as any);
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  if (descriptor && descriptor.writable === false) {
    const spy = spyOn(target as any, key as string).mockImplementation(fnMock as any);
    restorers.push(() => spy.mockRestore());
    return fnMock;
  }
  const original = target[key];
  target[key] = fnMock as any;
  restorers.push(() => {
    target[key] = original;
  });
  return fnMock;
}

function ensureModel(name: string): Record<string, any> {
  const dbAny = db as Record<string, any>;
  if (!dbAny[name] || typeof dbAny[name] !== "object") {
    dbAny[name] = {};
  }
  return dbAny[name];
}

describe("Server Cache & Query Optimizations", () => {
  beforeEach(async () => {
    await clearCache();
  });

  afterEach(() => {
    while (restorers.length > 0) {
      const restore = restorers.pop();
      restore?.();
    }
  });

  describe("cache.ts utility", () => {
    it("uses an atomic Redis generation comparison to reject a write invalidated by another worker", async () => {
      let sharedGeneration = "0";
      const stored = new Map<string, string>();
      patchMethod(redis, "get", async (key: string) => key === "intervue:cache-generation" ? sharedGeneration : stored.get(key) ?? null);
      const evalSpy = patchMethod(redis, "eval", async (_script: string, count: number, generationKey: string, key: string, expected: string, value: string) => {
        expect(count).toBe(2);
        expect(generationKey).toBe("intervue:cache-generation");
        if (expected !== sharedGeneration) return null;
        stored.set(key, value);
        return "OK";
      });
      redis.emit("connect");
      try {
        const generation = await captureCacheGeneration();
        sharedGeneration = "1"; // Another process invalidated while this read was in flight.
        await cacheSet("learn:redis-race", "old", 300, generation);
        expect(await cacheGet("learn:redis-race")).toBeNull();
        const freshGeneration = await captureCacheGeneration();
        await cacheSet("learn:redis-race", "new", 300, freshGeneration);
        expect(await cacheGet("learn:redis-race")).toBe("new");
        expect(evalSpy).toHaveBeenCalledTimes(2);
        expect(String((evalSpy.mock.calls[0] as any)[0])).toContain("redis.call('SET'");
      } finally {
        redis.emit("close");
      }
    });

    it.each(["prefix", "key"])("fences pending loaders after %s invalidation", async (kind) => {
      let release!: () => void;
      let started!: () => void;
      const entered = new Promise<void>((resolve) => { started = resolve; });
      const gate = new Promise<void>((resolve) => { release = resolve; });
      const pending = cacheGetOrSet("learn:race", 300, async () => {
        started();
        await gate;
        return "old revision";
      });
      await entered;
      if (kind === "prefix") await cacheDeleteByPrefix("learn:");
      else await cacheDelete("learn:race");
      // A subsequent request must not join the invalidated loader.
      const fresh = cacheGetOrSet("learn:race", 300, async () => "new revision");
      await Promise.resolve();
      release();
      await pending;
      expect(await fresh).toBe("new revision");
      expect(await cacheGet("learn:race")).toBe("new revision");
    });

    it("stores, retrieves, deletes, and invalidates keys by prefix", async () => {
      expect(await cacheGet("missing-key")).toBeNull();

      await cacheSet("learn:subjects", { ok: true }, 60);
      await cacheSet("learn:concept:two-pointers", { slug: "two-pointers" }, 60);
      await cacheSet("problem:slug-map", { "two-sum": 1 }, 60);

      expect(await cacheGet<{ ok: boolean }>("learn:subjects")).toEqual({ ok: true });

      await cacheDeleteByPrefix("learn:");
      expect(await cacheGet("learn:subjects")).toBeNull();
      expect(await cacheGet("learn:concept:two-pointers")).toBeNull();
      expect(await cacheGet("problem:slug-map")).toEqual({ "two-sum": 1 });

      await cacheDelete("problem:slug-map");
      expect(await cacheGet("problem:slug-map")).toBeNull();
    });

    it("expires entries after TTL and bounds in-memory map to 500 entries", async () => {
      const realNow = Date.now;
      let fakeNow = 1_700_000_000_000;
      Date.now = () => fakeNow;

      try {
        await cacheSet("ttl:key", { val: 42 }, 5);
        expect(await cacheGet("ttl:key")).toEqual({ val: 42 });

        fakeNow += 5_001;
        expect(await cacheGet("ttl:key")).toBeNull();

        for (let i = 0; i < 550; i++) {
          await cacheSet(`bound:${i}`, i, 60);
        }
        expect(getMemoryCacheSize()).toBeLessThanOrEqual(500);
        expect(await cacheGet<number>("bound:549")).toBe(549);
      } finally {
        Date.now = realNow;
      }
    });

    it("deduplicates concurrent cacheGetOrSet loaders and never caches loader failures", async () => {
      let calls = 0;
      const [a, b] = await Promise.all([
        cacheGetOrSet("dedupe:key", 60, async () => {
          calls++;
          await new Promise((r) => setTimeout(r, 10));
          return { count: 99 };
        }),
        cacheGetOrSet("dedupe:key", 60, async () => {
          calls++;
          return { count: 100 };
        }),
      ]);

      expect(calls).toBe(1);
      expect(a).toEqual({ count: 99 });
      expect(b).toEqual({ count: 99 });

      await expect(
        cacheGetOrSet("failing:key", 60, async () => {
          throw new Error("boom");
        })
      ).rejects.toThrow("boom");
      expect(await cacheGet("failing:key")).toBeNull();
    });
  });

  describe("GET /api/sheets caching & error safety", () => {
    it("caches successful user count and sets public Cache-Control header", async () => {
      const userModel = ensureModel("user");
      const countSpy = patchMethod(userModel, "count", async () => 12);

      const res1 = await sheetsRouter.request("/");
      const res2 = await sheetsRouter.request("/");

      expect(res1.status).toBe(200);
      expect(res1.headers.get("cache-control")).toBe("public, max-age=300, stale-while-revalidate=3600");
      expect((await res1.json()).stats.totalUsers).toBe(12);
      expect((await res2.json()).stats.totalUsers).toBe(12);
      expect(countSpy).toHaveBeenCalledTimes(1);
    });

    it("returns totalUsers: null on DB failure without caching the failure", async () => {
      const userModel = ensureModel("user");
      let shouldFail = true;
      patchMethod(userModel, "count", async () => {
        if (shouldFail) throw new Error("db offline");
        return 19;
      });

      const res1 = await sheetsRouter.request("/");
      expect(res1.status).toBe(200);
      expect((await res1.json()).stats.totalUsers).toBeNull();

      shouldFail = false;
      const res2 = await sheetsRouter.request("/");
      expect(res2.status).toBe(200);
      expect((await res2.json()).stats.totalUsers).toBe(19);
    });
  });

  describe("GET /api/companies/:company caching & admin invalidation", () => {
    it("caches published problem slug lookup map and invalidates on admin problem update", async () => {
      patchMethod(auth.api, "getSession", async () => ({
        user: { id: "admin-1", email: "admin@test.com", role: "admin" },
        session: { id: "s1" },
      }));
      const userModel = ensureModel("user");
      patchMethod(userModel, "findUnique", async () => ({ role: "admin" }));

      patchMethod(globalThis, "fetch", async () =>
        new Response(
          "Difficulty,Title,Frequency,Acceptance Rate,Link,Topics\nEASY,Two Sum,95,0.52,https://leetcode.com/problems/two-sum,Array\n",
          { status: 200, headers: { "Content-Type": "text/csv" } }
        )
      );

      const problemModel = ensureModel("problem");
      let dbSlugs = [{ id: 1, slug: "two-sum", title: "Two Sum" }];
      const findManySpy = patchMethod(problemModel, "findMany", async (args: any) => {
        expect(args.where).toEqual({ status: "published" });
        return dbSlugs;
      });
      patchMethod(problemModel, "update", async () => ({ id: 1, status: "published" }));

      const apiApp = new Hono();
      apiApp.route("/api/companies", companyRoutes);
      apiApp.route("/api/admin", adminRoutes);

      const r1 = await apiApp.request("/api/companies/google");
      const r2 = await apiApp.request("/api/companies/google");
      expect(r1.status).toBe(200);
      expect(r1.headers.get("cache-control")).toBe("private, max-age=300");
      expect((await r1.json()).questions[0].nativeId).toBe(1);
      expect((await r2.json()).questions[0].nativeId).toBe(1);
      expect(findManySpy).toHaveBeenCalledTimes(1);

      // Admin publish invalidates problem:* keys
      dbSlugs = [{ id: 99, slug: "two-sum", title: "Two Sum v2" }];
      const pubRes = await apiApp.request("/api/admin/problems/1/publish", { method: "POST" });
      expect(pubRes.status).toBe(200);

      const r3 = await apiApp.request("/api/companies/google");
      expect((await r3.json()).questions[0].nativeId).toBe(99);
      expect(findManySpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("Profile dashboard & stats slim projections", () => {
    it("queries slim projections on /api/profile/dashboard without transcript/resumeText/canvasData", async () => {
      patchMethod(auth.api, "getSession", async () => ({
        user: { id: "u1", name: "Test", email: "u1@test.com", role: "user" },
        session: { id: "s1" },
      }));

      const profileModel = ensureModel("profile");
      const submissionModel = ensureModel("submission");
      const solvedModel = ensureModel("userSolvedProblem");
      const interviewModel = ensureModel("interview");

      const profileSpy = patchMethod(profileModel, "findUnique", async () => ({ streakCount: 3 }));
      patchMethod(submissionModel, "count", async () => 5);
      patchMethod(solvedModel, "count", async () => 2);
      patchMethod(interviewModel, "count", async () => 1);
      const interviewFindManySpy = patchMethod(interviewModel, "findMany", async (args: any) => {
        if (args.take === 3) {
          return [
            {
              id: "int-1",
              mode: "text",
              role: "Backend Engineer",
              difficulty: "mid",
              focus: "comprehensive",
              status: "completed",
              score: 8,
              duration: 120,
              endedAt: new Date("2026-11-01T00:00:00Z"),
              createdAt: new Date("2026-11-01T00:00:00Z"),
            },
          ];
        }
        return [{ id: "int-1", score: 8 }];
      });

      const res = await profileRoutes.request("/dashboard");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.streakCount).toBe(3);
      expect(body.solvedCount).toBe(7);
      expect(body.avgScore).toBe(8);

      const profileCallArgs = (profileSpy.mock.calls[0] as any)[0];
      expect(profileCallArgs.select).toEqual({ streakCount: true });

      const recentSelect = (interviewFindManySpy.mock.calls[0] as any)[0].select;
      expect(recentSelect.transcript).toBeUndefined();
      expect(recentSelect.resumeText).toBeUndefined();
      expect(recentSelect.canvasData).toBeUndefined();
    });

    it("uses slim submission selects and caches published problem summary on /api/profile/stats", async () => {
      patchMethod(auth.api, "getSession", async () => ({
        user: { id: "u1", name: "Test", email: "u1@test.com", role: "admin" },
        session: { id: "s1" },
      }));

      const userModel = ensureModel("user");
      const problemModel = ensureModel("problem");
      const solvedModel = ensureModel("userSolvedProblem");
      const participantModel = ensureModel("roomParticipant");

      const userFindSpy = patchMethod(userModel, "findUnique", async () => ({
        role: "admin",
        profile: { streakCount: 2, avatarUrl: null, leetcodeData: null, codeforcesData: null, githubData: null },
        submissions: [
          {
            id: 1,
            problemId: 10,
            isAccepted: true,
            verdict: "ACCEPTED",
            createdAt: new Date("2026-11-10T00:00:00Z"),
            problem: { id: 10, title: "Two Sum", slug: "two-sum", difficulty: "EASY", tags: ["Arrays"] },
          },
        ],
        roomSubmissions: [],
      }));
      const problemFindSpy = patchMethod(problemModel, "findMany", async () => [
        { id: 10, difficulty: "EASY", tags: ["Arrays"] },
      ]);
      patchMethod(solvedModel, "findMany", async () => []);
      patchMethod(participantModel, "count", async () => 1);

      const res1 = await profileRoutes.request("/stats?year=2026");
      const res2 = await profileRoutes.request("/stats?year=2026");

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      const body1 = await res1.json();
      expect(body1.user.role).toBe("admin");
      expect(body1.dsaProgress.totalSolved).toBe(1);
      expect(problemFindSpy).toHaveBeenCalledTimes(1);

      const userSelect = (userFindSpy.mock.calls[0] as any)[0].select;
      expect(userSelect.submissions.select.sourceCode).toBeUndefined();
      expect(userSelect.submissions.select.stderr).toBeUndefined();
      expect(userSelect.submissions.select.stdout).toBeUndefined();
      expect(userSelect.submissions.select.aiFeedback).toBeUndefined();
      expect(userSelect.roomSubmissions.select.sourceCode).toBeUndefined();
    });
  });

  describe("Learn global vs per-user progress isolation & admin invalidation", () => {
    it("does not restore a concept cache when its pending database read overlaps invalidation", async () => {
      patchMethod(auth.api, "getSession", async () => ({ user: { id: "a", email: "a@test.com" }, session: { id: "s" } }));
      let release!: () => void;
      let started!: () => void;
      const entered = new Promise<void>((resolve) => { started = resolve; });
      const gate = new Promise<void>((resolve) => { release = resolve; });
      let title = "Old lesson";
      let first = true;
      const conceptModel = ensureModel("learnConcept");
      patchMethod(conceptModel, "findFirst", async () => {
        const snapshot = title;
        if (first) { first = false; started(); await gate; }
        return {
          id: "c", slug: "race-lesson", orderIndex: 1,
          module: { id: "m", slug: "m", title: "M", orderIndex: 1, subject: { id: "s", slug: "s", title: "S" } },
          publishedRevision: { id: "r", version: 1, title: snapshot, summary: "s", quickRevisionMd: "q", deepDiveMd: "d", estimatedMinutes: 5, difficulty: "FOUNDATION", keyTakeaways: [], commonMistakes: [], publishedAt: null },
        };
      });
      patchMethod(conceptModel, "findMany", async () => []);
      patchMethod(ensureModel("userConceptProgress"), "findUnique", async () => null);
      const pending = learnRoutes.request("/concepts/race-lesson");
      await entered;
      title = "New lesson";
      await cacheDeleteByPrefix("learn:");
      release();
      expect((await pending).status).toBe(200);
      expect(await cacheGet("learn:concept:race-lesson")).toBeNull();
      const latest = await learnRoutes.request("/concepts/race-lesson");
      expect((await latest.json<{ concept: { title: string } }>()).concept.title).toBe("New lesson");
    });

    it("caches concept globally while keeping per-user progress uncached and invalidating on admin publish", async () => {
      let activeUserId = "user-a";
      patchMethod(auth.api, "getSession", async () => ({
        user: { id: activeUserId, email: `${activeUserId}@test.com`, role: "admin" },
        session: { id: "s1" },
      }));
      const userModel = ensureModel("user");
      patchMethod(userModel, "findUnique", async () => ({ role: "admin" }));

      const conceptModel = ensureModel("learnConcept");
      const progressModel = ensureModel("userConceptProgress");
      const questionModel = ensureModel("learnRecallQuestion");
      const revisionModel = ensureModel("learnConceptRevision");

      let publishedTitle = "Two Pointers v1";
      const conceptFirstSpy = patchMethod(conceptModel, "findFirst", async () => ({
        id: "c1",
        slug: "two-pointers",
        orderIndex: 1,
        module: {
          id: "m1",
          slug: "arrays",
          title: "Arrays",
          orderIndex: 1,
          subject: { id: "sub1", slug: "dsa", title: "DSA" },
        },
        publishedRevision: {
          id: "rev1",
          version: 1,
          title: publishedTitle,
          summary: "Summary",
          quickRevisionMd: "## Quick",
          deepDiveMd: "## Deep",
          estimatedMinutes: 10,
          difficulty: "FOUNDATION",
          keyTakeaways: ["a", "b"],
          commonMistakes: ["c"],
          publishedAt: new Date("2026-11-10T00:00:00Z"),
        },
      }));
      patchMethod(conceptModel, "findMany", async () => [
        { slug: "two-pointers", publishedRevision: { title: publishedTitle } },
      ]);

      patchMethod(progressModel, "findUnique", async (args: any) => {
        const uid = args.where.userId_conceptId.userId;
        return {
          status: uid === "user-a" ? "CONFIDENT" : "STUDYING",
          recallAttempts: uid === "user-a" ? 4 : 1,
          recallCorrect: uid === "user-a" ? 4 : 0,
          lastStudiedAt: null,
          nextReviewAt: null,
        };
      });

      const apiApp = new Hono();
      apiApp.route("/api/learn", learnRoutes);
      apiApp.route("/api/admin", adminRoutes);

      // User A populates concept cache and gets User A progress
      activeUserId = "user-a";
      const resA = await apiApp.request("/api/learn/concepts/two-pointers");
      expect(resA.status).toBe(200);
      const bodyA = await resA.json();
      expect(bodyA.concept.title).toBe("Two Pointers v1");
      expect(bodyA.progress.status).toBe("CONFIDENT");

      // User B hits concept cache (conceptFirstSpy still 1) and gets User B progress!
      activeUserId = "user-b";
      const resB = await apiApp.request("/api/learn/concepts/two-pointers");
      expect(resB.status).toBe(200);
      const bodyB = await resB.json();
      expect(bodyB.concept.title).toBe("Two Pointers v1");
      expect(bodyB.progress.status).toBe("STUDYING");
      expect(conceptFirstSpy).toHaveBeenCalledTimes(1);

      // Admin publishes v2 -> invalidates learn:* cache
      publishedTitle = "Two Pointers v2";
      patchMethod(conceptModel, "findUnique", async () => ({
        id: "c1",
        revisions: [
          {
            id: "rev2",
            quickRevisionMd: "q".repeat(120),
            deepDiveMd: "d".repeat(320),
            keyTakeaways: ["a", "b"],
            commonMistakes: ["c"],
          },
        ],
      }));
      patchMethod(questionModel, "findMany", async () => [
        { prompt: "Q1?", options: ["A", "B"], correctOption: 0 },
        { prompt: "Q2?", options: ["A", "B"], correctOption: 1 },
      ]);
      patchMethod(revisionModel, "update", async () => ({}));
      patchMethod(conceptModel, "update", async () => ({}));
      patchMethod(db, "$transaction", async (arg: any) => (Array.isArray(arg) ? Promise.all(arg) : arg(db)));

      const pubRes = await apiApp.request("/api/admin/learn/concepts/c1/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionId: "rev2" }),
      });
      expect(pubRes.status).toBe(200);

      const resAfterPublish = await apiApp.request("/api/learn/concepts/two-pointers");
      expect((await resAfterPublish.json()).concept.title).toBe("Two Pointers v2");
      expect(conceptFirstSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("Compression middleware & SSE bypass", () => {
    it("compresses normal JSON responses when large enough and skips SSE endpoints", async () => {
      const userModel = ensureModel("user");
      patchMethod(userModel, "count", async () => 5);

      const sheetsRes = await mainApp.request("/api/sheets", {
        headers: { "Accept-Encoding": "gzip" },
      });
      expect(sheetsRes.status).toBe(200);
      expect(sheetsRes.headers.get("content-encoding")).toBe("gzip");

      patchMethod(auth.api, "getSession", async () => null);
      const sseRes = await mainApp.request("/api/chats/chat-1/message", {
        method: "POST",
        headers: { "Accept-Encoding": "gzip", "Content-Type": "application/json" },
        body: JSON.stringify({ content: "hello" }),
      });
      expect(sseRes.headers.get("content-encoding")).toBeNull();
    });
  });
});
