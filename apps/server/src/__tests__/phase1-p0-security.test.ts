import { describe, it, expect, beforeEach, mock } from "bun:test";
import { app, isAllowedOrigin } from "../index";
import { createAuthExchangeCode, consumeAuthExchangeCode } from "../lib/exchangeCodes";
import codeRoutes from "../routes/code";
import feedbackRoutes from "../routes/feedback";
import rewardsRoutes from "../routes/rewards";
import { executionQueue } from "../services/taskQueue";
import { auth } from "../lib/auth";
import { shouldSkipOAuthStateCookieCheck } from "../lib/authOptions";
import { db } from "@intervue/db";

describe("Phase 1: P0 Security & Data Integrity", () => {
  const userA = { id: "user_alpha_1", name: "User Alpha", email: "alpha@example.com", role: "user" };
  const userB = { id: "user_bravo_2", name: "User Bravo", email: "bravo@example.com", role: "user" };
  const adminUser = { id: "admin_user_3", name: "Admin User", email: "admin@example.com", role: "admin" };

  beforeEach(() => {
    mock.restore();
  });

  describe("Finding 01 & 02: Strict CORS & Origin Allowlist Validation", () => {
    it("limits the cross-site OAuth cookie compatibility mode to production", () => {
      expect(shouldSkipOAuthStateCookieCheck("production", undefined)).toBe(true);
      expect(shouldSkipOAuthStateCookieCheck("development", undefined)).toBe(false);
      expect(shouldSkipOAuthStateCookieCheck("test", undefined)).toBe(false);
      expect(shouldSkipOAuthStateCookieCheck("production", "true")).toBe(false);
    });

    it("rejects hostile external origins", () => {
      expect(isAllowedOrigin("https://evil.com")).toBe(false);
      expect(isAllowedOrigin("https://hacker.org")).toBe(false);
    });

    it("rejects lookalike and prefix-hijacking origins", () => {
      expect(isAllowedOrigin("https://intervue-mu.vercel.app.attacker.com")).toBe(false);
      expect(isAllowedOrigin("https://evil-intervue-mu.vercel.app")).toBe(false);
      expect(isAllowedOrigin("https://intervue.vercel.app.malicious.io")).toBe(false);
    });

    it("allows configured production deployment origins", () => {
      expect(isAllowedOrigin("https://intervue-mu.vercel.app")).toBe(true);
      expect(isAllowedOrigin("https://intervue.vercel.app")).toBe(true);
      expect(isAllowedOrigin("https://intervue-git-main-lalit-wagh-s-projects.vercel.app")).toBe(true);
    });

    it("allows local development hosts in test/dev environment", () => {
      expect(isAllowedOrigin("http://localhost:5173")).toBe(true);
      expect(isAllowedOrigin("http://127.0.0.1:3000")).toBe(true);
    });

    it("rejects null or malformed origin strings gracefully", () => {
      expect(isAllowedOrigin(undefined)).toBe(false);
      expect(isAllowedOrigin("")).toBe(false);
      expect(isAllowedOrigin("not-a-valid-url")).toBe(false);
    });
  });

  describe("Finding 03: Ephemeral Single-Use Authorization Exchange Code", () => {
    it("generates a code and allows single successful redemption", () => {
      const sessionToken = "session_secret_jwt_token_12345";
      const code = createAuthExchangeCode(sessionToken);

      expect(typeof code).toBe("string");
      expect(code.length).toBeGreaterThan(10);

      // First consumption should return the token
      const retrieved = consumeAuthExchangeCode(code);
      expect(retrieved).toBe(sessionToken);

      // Second consumption must be immediately rejected (single-use)
      const secondAttempt = consumeAuthExchangeCode(code);
      expect(secondAttempt).toBeNull();
    });

    it("returns null for non-existent or forged exchange codes", () => {
      expect(consumeAuthExchangeCode("invalid-uuid-code-9999")).toBeNull();
    });

    it("serves the exchange endpoint before the catch-all auth handler", async () => {
      const code = createAuthExchangeCode("route-level-session-token");
      const response = await app.request("/api/auth/exchange-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ token: "route-level-session-token", success: true });

      const replay = await app.request("/api/auth/exchange-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      expect(replay.status).toBe(400);
    });
  });

  describe("Finding 04: Execution Job Ownership & Authorization (IDOR)", () => {
    const persistedJobs = new Map<string, any>();

    beforeEach(() => {
      persistedJobs.clear();
      db.executionJob.count = mock(async ({ where }: any) =>
        [...persistedJobs.values()].filter((job) => !where?.status || job.status === where.status).length
      ) as any;
      db.executionJob.create = mock(async ({ data }: any) => {
        const job = {
          id: `job_${persistedJobs.size + 1}`,
          ...data,
          attemptCount: 0,
          createdAt: new Date(),
          startedAt: null,
          completedAt: null,
        };
        persistedJobs.set(job.id, job);
        return job;
      }) as any;
      db.executionJob.findFirst = mock(async ({ where }: any) => {
        const job = persistedJobs.get(where.id);
        return job && (!where.userId || job.userId === where.userId) ? job : null;
      }) as any;
      db.executionJob.findUnique = mock(async ({ where }: any) => persistedJobs.get(where.id) ?? null) as any;
      db.executionJob.updateMany = mock(async () => ({ count: 1 })) as any;
      db.executionJob.groupBy = mock(async () => []) as any;
    });

    it("allows job owner (User A) to inspect their queued job", async () => {
      auth.api.getSession = mock(async () => ({
        user: userA,
        session: { id: "sess_a", userId: userA.id },
      } as any));

      const job = await executionQueue.enqueue({
        type: "RUN",
        userId: userA.id,
        problemId: 101,
        sourceCode: "console.log('hello from alpha');",
        language: "javascript",
      });

      const res = await codeRoutes.request(`/jobs/${job.id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.id).toBe(job.id);
    });

    it("denies access with 404 when another user (User B) attempts to read User A's job", async () => {
      // User A owns the job
      const job = await executionQueue.enqueue({
        type: "RUN",
        userId: userA.id,
        problemId: 102,
        sourceCode: "console.log('secret code');",
        language: "javascript",
      });

      // User B attempts to access it
      auth.api.getSession = mock(async () => ({
        user: userB,
        session: { id: "sess_b", userId: userB.id },
      } as any));

      const res = await codeRoutes.request(`/jobs/${job.id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain("was not found or has expired");
    });

    it("denies cancellation with 404 when another user (User B) attempts to cancel User A's job", async () => {
      const job = await executionQueue.enqueue({
        type: "RUN",
        userId: userA.id,
        problemId: 103,
        sourceCode: "console.log('running task');",
        language: "javascript",
      });

      auth.api.getSession = mock(async () => ({
        user: userB,
        session: { id: "sess_b", userId: userB.id },
      } as any));

      const res = await codeRoutes.request(`/jobs/${job.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      expect(res.status).toBe(404);
    });

    it("restricts /queue-stats to admin users", async () => {
      // Non-admin user
      auth.api.getSession = mock(async () => ({
        user: userA,
        session: { id: "sess_a", userId: userA.id },
      } as any));
      db.user.findUnique = mock(async () => ({ role: "user" } as any));

      const res = await codeRoutes.request("/queue-stats", { method: "GET" });
      expect(res.status).toBe(403);

      // Admin user
      auth.api.getSession = mock(async () => ({
        user: adminUser,
        session: { id: "sess_admin", userId: adminUser.id },
      } as any));
      db.user.findUnique = mock(async () => ({ role: "admin" } as any));

      const adminRes = await codeRoutes.request("/queue-stats", { method: "GET" });
      expect(adminRes.status).toBe(200);
      const data = await adminRes.json();
      expect(data.queue).toBeDefined();
    });
  });

  describe("Finding 05: Feedback Email HTML Injection Prevention & Persistence", () => {
    it("persists feedback first and rejects invalid email format", async () => {
      const res = await feedbackRoutes.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Tester",
          email: "not-an-email",
          subject: "Test Subject",
          message: "Valid feedback message text.",
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid email address format");
    });

    it("escapes hostile HTML in feedback messages and stores unescaped plain text in DB", async () => {
      let createdData: any = null;
      db.feedback.create = mock(async ({ data }: any) => {
        createdData = data;
        return { id: "fb_101", ...data, createdAt: new Date() };
      });

      const hostilePayload = {
        name: '<script>alert("hacked")</script>',
        email: "legit@example.com",
        subject: '<img src=x onerror=alert("xss")>',
        message: 'Hello <b onmouseover="steal()">world</b> & test!',
      };

      const res = await feedbackRoutes.request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hostilePayload),
      });

      expect(res.status).toBe(200);
      expect(createdData).toBeDefined();
      expect(createdData.name).toBe('<script>alert("hacked")</script>');
      expect(createdData.message).toBe('Hello <b onmouseover="steal()">world</b> & test!');
    });
  });

  describe("Finding 12: Atomic Daily Rewards Concurrency", () => {
    it("awards daily check-in points once under concurrent requests", async () => {
      auth.api.getSession = mock(async () => ({
        user: userA,
        session: { id: "sess_a", userId: userA.id },
      } as any));

      let mockProfile = {
        userId: userA.id,
        points: 50,
        streakCount: 2,
        lastDailyCheckInAt: null as Date | null,
      };

      const tx = {
        profile: {
          findUnique: mock(async () => ({ ...mockProfile })),
          create: mock(async () => ({ ...mockProfile })),
          update: mock(async ({ data }: any) => {
            if (data.points?.increment) {
              mockProfile.points += data.points.increment;
            }
            mockProfile.streakCount = data.streakCount;
            mockProfile.lastDailyCheckInAt = data.lastDailyCheckInAt;
            return { ...mockProfile };
          }),
        },
      };

      // Model serializable transaction execution while issuing both HTTP requests together.
      let transactionTail = Promise.resolve();
      db.$transaction = mock((callback: any) => {
        const result = transactionTail.then(() => callback(tx));
        transactionTail = result.then(() => undefined, () => undefined);
        return result;
      });

      const [res1, res2] = await Promise.all([
        rewardsRoutes.request("/daily-checkin", { method: "POST" }),
        rewardsRoutes.request("/daily-checkin", { method: "POST" }),
      ]);
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);

      const results = await Promise.all([res1.json(), res2.json()]);
      const awarded = results.filter((result: any) => !result.alreadyClaimed);
      const duplicates = results.filter((result: any) => result.alreadyClaimed);

      expect(awarded).toHaveLength(1);
      expect(awarded[0].pointsAwarded).toBe(10);
      expect(duplicates).toHaveLength(1);
      expect(results.every((result: any) => result.points === 60)).toBe(true);
      expect(mockProfile.points).toBe(60);
    });
  });
});
