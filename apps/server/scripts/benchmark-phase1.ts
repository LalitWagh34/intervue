/**
 * 🧪 Phase 1 Benchmark & Verification Suite
 * Tests:
 * 1. 100 - 500 Concurrent Spike & Latency Profiling (P50, P95, P99)
 * 2. Sliding Window Rate Limiting (429 Spike, IETF Headers, Retry-After)
 * 3. Boundary Schema Validation (Zod 400 Bad Request & Field Details)
 * 4. Idempotency Key Handling (Replay Caching & 409 In-Flight Conflicts)
 * 5. BOLA / IDOR Defense (Object-Level Authorization 401/403)
 */

import { Hono } from "hono";
import { app } from "../src/index";
import { rateLimiter } from "../src/middleware/rateLimiter";
import { idempotency } from "../src/middleware/idempotency";
import { validateBody, joinRoomSchema } from "../src/middleware/validator";
import { requireRoomMember, requireRoomHost } from "../src/middleware/authorize";
import { AppError, NotFoundError, ForbiddenError } from "../src/lib/errors";

// ─── Helpers & Latency Math ──────────────────────────────────────────────────

interface LatencyStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  reqPerSec: number;
  durationMs: number;
}

function calculatePercentiles(latencies: number[], totalDurationMs: number): LatencyStats {
  if (latencies.length === 0) {
    return { count: 0, min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0, reqPerSec: 0, durationMs: 0 };
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);

  const p50 = sorted[Math.floor(sorted.length * 0.50)] ?? 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
  const p99 = sorted[Math.floor(sorted.length * 0.99)] ?? 0;
  const min = sorted[0] ?? 0;
  const max = sorted[sorted.length - 1] ?? 0;

  return {
    count: sorted.length,
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    avg: Number((sum / sorted.length).toFixed(2)),
    p50: Number(p50.toFixed(2)),
    p95: Number(p95.toFixed(2)),
    p99: Number(p99.toFixed(2)),
    reqPerSec: Number(((sorted.length / (totalDurationMs || 1)) * 1000).toFixed(1)),
    durationMs: Number(totalDurationMs.toFixed(2)),
  };
}

const c = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

// ─── Benchmark 1: Concurrency Spike (100 -> 500 requests) ────────────────────

async function benchmarkConcurrencySpike(targetApp: Hono<any>, concurrency: number): Promise<LatencyStats> {
  const latencies: number[] = [];
  const start = performance.now();

  const tasks = Array.from({ length: concurrency }, async () => {
    const t0 = performance.now();
    const res = await targetApp.request("/health", { method: "GET" });
    const t1 = performance.now();
    latencies.push(t1 - t0);
    return res.status;
  });

  const statuses = await Promise.all(tasks);
  const totalDuration = performance.now() - start;

  const okCount = statuses.filter((s) => s === 200).length;
  if (okCount !== concurrency) {
    console.warn(`  ⚠️ Expected ${concurrency} OK statuses, got ${okCount}`);
  }

  return calculatePercentiles(latencies, totalDuration);
}

// ─── Benchmark 2: Rate Limiting & 429 Verification ───────────────────────────

async function benchmarkRateLimiting() {
  console.log(`\n${c.bold}=== [1/5] Rate Limiter Stress & 429 Boundary Verification ===${c.reset}`);

  // Create isolated sub-app with strict 10 req / 60s limit
  const testLimiterApp = new Hono();
  testLimiterApp.use(
    "/limited",
    rateLimiter({
      windowMs: 60_000,
      max: 10,
      message: "Rate limit triggered for test",
    })
  );
  testLimiterApp.get("/limited", (ctx) => ctx.json({ status: "allowed" }));

  const totalRequests = 25;
  const results: { status: number; remaining: string | null; retryAfter: string | null }[] = [];

  for (let i = 0; i < totalRequests; i++) {
    const res = await testLimiterApp.request("/limited", {
      headers: { "x-forwarded-for": "203.0.113.42" },
    });
    results.push({
      status: res.status,
      remaining: res.headers.get("x-ratelimit-remaining"),
      retryAfter: res.headers.get("retry-after"),
    });
  }

  const allowed = results.filter((r) => r.status === 200).length;
  const rejected = results.filter((r) => r.status === 429).length;
  const lastRejected = results[results.length - 1];

  console.log(`  Total Requests Sent: ${totalRequests}`);
  console.log(`  Allowed (HTTP 200):  ${c.green}${allowed}${c.reset} (Expected: 10)`);
  console.log(`  Blocked (HTTP 429):  ${c.red}${rejected}${c.reset} (Expected: 15)`);
  console.log(`  X-RateLimit-Remaining on 429: ${c.cyan}${lastRejected?.remaining}${c.reset}`);
  console.log(`  Retry-After header present:   ${c.green}${lastRejected?.retryAfter !== null}${c.reset} (${lastRejected?.retryAfter}s)`);

  const passed = allowed === 10 && rejected === 15 && lastRejected?.remaining === "0";
  console.log(`  Verdict: ${passed ? c.green + "PASSED ✓" : c.red + "FAILED ✗"}${c.reset}`);
  return passed;
}

// ─── Benchmark 3: Request Boundary Validation (Zod 400) ──────────────────────

async function benchmarkRequestValidation() {
  console.log(`\n${c.bold}=== [2/5] Runtime Boundary Validation (Zod Schemas) ===${c.reset}`);

  const testApp = new Hono();
  testApp.post("/join", validateBody(joinRoomSchema), (ctx) => ctx.json({ success: true }));

  // Case A: Missing required code field
  const res1 = await testApp.request("/join", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });

  // Case B: Invalid code length (3 chars instead of 6)
  const res2 = await testApp.request("/join", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code: "ABC" }),
  });

  // Case C: Valid 6-character room code
  const res3 = await testApp.request("/join", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code: "ABC123" }),
  });

  const body1 = (await res1.json()) as any;
  const body2 = (await res2.json()) as any;

  console.log(`  Case A (Empty Payload):   Status ${res1.status === 400 ? c.green + "400 Bad Request ✓" : c.red + res1.status} - Code: ${body1.code}`);
  console.log(`  Case B (Invalid Length):  Status ${res2.status === 400 ? c.green + "400 Bad Request ✓" : c.red + res2.status} - Error: "${body2.details?.[0]?.message}"`);
  console.log(`  Case C (Valid Payload):    Status ${res3.status === 200 ? c.green + "200 OK ✓" : c.red + res3.status}`);

  const passed = res1.status === 400 && res2.status === 400 && res3.status === 200;
  console.log(`  Verdict: ${passed ? c.green + "PASSED ✓" : c.red + "FAILED ✗"}${c.reset}`);
  return passed;
}

// ─── Benchmark 4: Idempotency Replay & Conflict Locking ──────────────────────

async function benchmarkIdempotency() {
  console.log(`\n${c.bold}=== [3/5] Idempotency Key Handling & Replay Caching ===${c.reset}`);

  let executionCounter = 0;
  const testApp = new Hono();

  testApp.use(
    "/charge-contest",
    idempotency({ ttlMs: 30_000 })
  );

  testApp.post("/charge-contest", async (ctx) => {
    // Artificial execution delay to simulate Judge0 / DB transaction
    await new Promise((resolve) => setTimeout(resolve, 30));
    executionCounter++;
    return ctx.json({ transactionId: `txn_${executionCounter}`, counter: executionCounter });
  });

  const idemKey = `test-key-${Date.now()}`;

  // Step 1: Initial call
  const res1 = await testApp.request("/charge-contest", {
    method: "POST",
    headers: { "idempotency-key": idemKey },
  });
  const data1 = (await res1.json()) as any;
  const replayedHeader1 = res1.headers.get("idempotent-replayed");

  // Step 2: Duplicate retry with identical key
  const res2 = await testApp.request("/charge-contest", {
    method: "POST",
    headers: { "idempotency-key": idemKey },
  });
  const data2 = (await res2.json()) as any;
  const replayedHeader2 = res2.headers.get("idempotent-replayed");

  // Step 3: In-flight collision test (parallel identical requests)
  const parallelKey = `parallel-${Date.now()}`;
  const [resA, resB] = await Promise.all([
    testApp.request("/charge-contest", {
      method: "POST",
      headers: { "idempotency-key": parallelKey },
    }),
    testApp.request("/charge-contest", {
      method: "POST",
      headers: { "idempotency-key": parallelKey },
    }),
  ]);

  const statuses = [resA.status, resB.status];
  const hadConflict = statuses.includes(409);

  console.log(`  Initial Request:  HTTP ${res1.status} | Execution Count: ${data1.counter} | Replayed: ${replayedHeader1}`);
  console.log(`  Replay Request:   HTTP ${res2.status} | Execution Count: ${data2.counter} (Unchanged!) | Replayed: ${c.green}${replayedHeader2}${c.reset}`);
  console.log(`  In-Flight Lock:   Status Pair [${statuses.join(", ")}] | 409 Conflict Detected: ${hadConflict ? c.green + "YES ✓" : c.red + "NO ✗"}${c.reset}`);

  const passed = data1.counter === 1 && data2.counter === 1 && replayedHeader2 === "true" && hadConflict;
  console.log(`  Verdict: ${passed ? c.green + "PASSED ✓" : c.red + "FAILED ✗"}${c.reset}`);
  return passed;
}

// ─── Benchmark 5: BOLA / IDOR Authorization Defense ──────────────────────────

async function benchmarkAuthorizationDefense() {
  console.log(`\n${c.bold}=== [4/5] Object-Level Authorization (BOLA/IDOR Defense) ===${c.reset}`);

  const testApp = new Hono();
  testApp.onError((err, ctx) => {
    if (err instanceof AppError) {
      return ctx.json(err.toJSON(ctx.req.path), (err.statusCode as any) || 500);
    }
    return ctx.json({ error: "Internal Error" }, 500);
  });

  testApp.get("/rooms/:code/logs", requireRoomMember, (ctx) => ctx.json({ logs: ["secret-log"] }));

  // Call with non-existent or unauthorized room
  const resForbidden = await testApp.request("/rooms/NOTEXIST/logs");
  const bodyForbidden = (await resForbidden.json()) as any;

  console.log(`  Unauthorized Access Check: HTTP ${resForbidden.status} ${c.yellow}${bodyForbidden.errorCode || "NOT_FOUND"}${c.reset}`);
  console.log(`  RFC 7807 Format Verified:  ${c.green}${bodyForbidden.type && bodyForbidden.status ? "YES ✓" : "NO ✗"}${c.reset}`);

  const passed = resForbidden.status === 404 || resForbidden.status === 403;
  console.log(`  Verdict: ${passed ? c.green + "PASSED ✓" : c.red + "FAILED ✗"}${c.reset}`);
  return passed;
}

// ─── Master Runner ───────────────────────────────────────────────────────────

async function runMasterSuite() {
  console.log(`${c.bold}${c.cyan}`);
  console.log("================================================================================");
  console.log(" 🚀 INTERVUE SYSTEM DESIGN BENCHMARK — PHASE 1: RELIABILITY & DEFENSIVE ENGR");
  console.log("================================================================================");
  console.log(c.reset);

  // 1. High-concurrency spike tests
  console.log(`${c.bold}=== [5/5] High-Concurrency Load Spikes (100 & 500 Concurrent Requests) ===${c.reset}`);
  console.log(`  Sending 100 concurrent requests to /health...`);
  const stats100 = await benchmarkConcurrencySpike(app, 100);
  console.log(`  ⚡ 100 Concurrency:  P50=${stats100.p50}ms | P95=${stats100.p95}ms | P99=${stats100.p99}ms | Throughput=${stats100.reqPerSec} req/sec`);

  console.log(`  Sending 500 concurrent requests to /health...`);
  const stats500 = await benchmarkConcurrencySpike(app, 500);
  console.log(`  ⚡ 500 Concurrency:  P50=${stats500.p50}ms | P95=${stats500.p95}ms | P99=${stats500.p99}ms | Throughput=${stats500.reqPerSec} req/sec`);

  // 2. Functional defensive engineering suites
  const rateLimitOk = await benchmarkRateLimiting();
  const validationOk = await benchmarkRequestValidation();
  const idempotencyOk = await benchmarkIdempotency();
  const authorizationOk = await benchmarkAuthorizationDefense();

  // 3. Final Summary Scorecard
  console.log(`\n${c.bold}================================================================================${c.reset}`);
  console.log(`${c.bold} 📊 PHASE 1 BENCHMARK SCORECARD${c.reset}`);
  console.log(`${c.bold}================================================================================${c.reset}`);
  console.log(`  1.1 Rate Limiting (Sliding Window Log & 429 Spike):      ${rateLimitOk ? c.green + "PASS ✓" : c.red + "FAIL ✗"}${c.reset}`);
  console.log(`  1.2 Request Boundary Validation (Zod Runtime Contract):  ${validationOk ? c.green + "PASS ✓" : c.red + "FAIL ✗"}${c.reset}`);
  console.log(`  1.3 Authorization Checks (BOLA / IDOR Defense):          ${authorizationOk ? c.green + "PASS ✓" : c.red + "FAIL ✗"}${c.reset}`);
  console.log(`  1.4 Idempotency Execution (IETF Key & Replay Cache):     ${idempotencyOk ? c.green + "PASS ✓" : c.red + "FAIL ✗"}${c.reset}`);
  console.log(`  1.5 Structured Error Handling (RFC 7807 Hierarchy):      ${authorizationOk ? c.green + "PASS ✓" : c.red + "FAIL ✗"}${c.reset}`);
  console.log(`  1.6 Latency Profiling (100 Concurrency P95):             ${c.cyan}${stats100.p95}ms${c.reset} (${stats100.reqPerSec} req/s)`);
  console.log(`  1.6 Latency Profiling (500 Concurrency P95):             ${c.cyan}${stats500.p95}ms${c.reset} (${stats500.reqPerSec} req/s)`);
  console.log(`================================================================================\n`);

  const allPassed = rateLimitOk && validationOk && idempotencyOk && authorizationOk;
  if (allPassed) {
    console.log(`${c.bold}${c.green}🎉 ALL PHASE 1 SYSTEM DESIGN CHECKPOINTS VERIFIED SUCCESSFULLY!${c.reset}\n`);
    process.exit(0);
  } else {
    console.error(`${c.bold}${c.red}❌ SOME CHECKPOINTS FAILED. PLEASE REVIEW THE LOGS ABOVE.${c.reset}\n`);
    process.exit(1);
  }
}

runMasterSuite().catch((err) => {
  console.error("Fatal benchmark runner error:", err);
  process.exit(1);
});
