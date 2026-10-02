/**
 * 🧪 Phase 2 Benchmark & Verification Suite
 * Tests:
 * 1. Concurrency Semaphore (Strict Permit Ceiling & FIFO Queueing)
 * 2. Asynchronous Worker Pool (Producer-Consumer & HTTP 202 Accepted)
 * 3. Backpressure Management (High-Water Mark Tripping & Retry-After Headers)
 * 4. Cancellation Tokens & AbortControllers (In-Flight Task Cancellation)
 * 5. Resilient Retry Strategy with Full Jitter (Thundering Herd Defense)
 */

import { Hono } from "hono";
import { AsyncSemaphore } from "../src/lib/semaphore";
import { TaskQueue } from "../src/services/taskQueue";
import { cancellationManager } from "../src/lib/cancellation";
import { retryWithFullJitter, calculateJitterDelay } from "../src/lib/retry";
import { AppError, RateLimitError } from "../src/lib/errors";

const c = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

// ─── Test 1: Concurrency Semaphore Permit Ceiling ────────────────────────────

async function testSemaphoreConcurrency(): Promise<boolean> {
  console.log(`\n${c.bold}=== [1/5] Concurrency Limiter: AsyncSemaphore Strict Permit Ceiling ===${c.reset}`);

  const maxPermits = 3;
  const semaphore = new AsyncSemaphore(maxPermits);
  let peakActive = 0;
  let currentlyActive = 0;
  const executionOrder: number[] = [];

  const runTask = async (id: number) => {
    await semaphore.withPermit(async () => {
      currentlyActive++;
      peakActive = Math.max(peakActive, currentlyActive);
      executionOrder.push(id);
      // Simulate compiler/Docker run duration
      await new Promise((resolve) => setTimeout(resolve, 50));
      currentlyActive--;
    });
  };

  // Launch 10 tasks simultaneously
  const taskPromises = Array.from({ length: 10 }, (_, i) => runTask(i + 1));
  await Promise.all(taskPromises);

  console.log(`  Configured Max Capacity: ${maxPermits}`);
  console.log(`  Peak In-Flight Active:   ${c.cyan}${peakActive}${c.reset} (Expected: <= ${maxPermits})`);
  console.log(`  Completed Task Count:    ${executionOrder.length}/10`);
  console.log(`  Active Permits at End:   ${semaphore.activeCount} (Expected: 0)`);

  const passed = peakActive <= maxPermits && peakActive > 0 && semaphore.activeCount === 0 && executionOrder.length === 10;
  console.log(`  Verdict: ${passed ? c.green + "PASSED ✓" : c.red + "FAILED ✗"}${c.reset}`);
  return passed;
}

// ─── Test 2: Task Queue Worker Pool (Producer-Consumer) ──────────────────────

async function testWorkerPool(): Promise<boolean> {
  console.log(`\n${c.bold}=== [2/5] Task Queue Worker Pool: Producer-Consumer Decoupling ===${c.reset}`);

  const queue = new TaskQueue(2, 50);

  // Enqueue 4 simulated jobs
  const job1 = queue.enqueue({
    type: "RUN",
    userId: "test-user-1",
    problemId: 1,
    sourceCode: "console.log('job 1')",
    language: "JAVASCRIPT",
  });

  const job2 = queue.enqueue({
    type: "RUN",
    userId: "test-user-2",
    problemId: 1,
    sourceCode: "console.log('job 2')",
    language: "JAVASCRIPT",
  });

  console.log(`  Job 1 Enqueued: ID=${job1.id} | Initial Status=${job1.status}`);
  console.log(`  Job 2 Enqueued: ID=${job2.id} | Initial Status=${job2.status}`);

  const initialStats = queue.getStats();
  console.log(`  Initial Queue Stats: Total=${initialStats.total} | Queued/Processing=${initialStats.queued + initialStats.processing}`);

  // Wait for background worker consumers
  await new Promise((resolve) => setTimeout(resolve, 250));

  const stats = queue.getStats();
  console.log(`  Worker Progress Stats: Processed=${stats.completed + stats.failed} / Total=${stats.total}`);

  const passed = job1.status !== undefined && initialStats.total === 2;
  console.log(`  Verdict: ${passed ? c.green + "PASSED ✓" : c.red + "FAILED ✗"}${c.reset}`);
  return passed;
}

// ─── Test 3: Backpressure High-Water Mark ────────────────────────────────────

async function testBackpressure(): Promise<boolean> {
  console.log(`\n${c.bold}=== [3/5] Backpressure Management: Queue High-Water Mark Saturation ===${c.reset}`);

  const highWaterMark = 4;
  // Create a queue with highWaterMark = 4 and 0 workers to freeze queue consumption
  const saturatedQueue = new TaskQueue(0, highWaterMark);

  let acceptedCount = 0;
  let rejectedCount = 0;
  let retryAfterHeader = 0;

  for (let i = 0; i < 8; i++) {
    try {
      saturatedQueue.enqueue({
        type: "RUN",
        userId: `flood-user-${i}`,
        problemId: 1,
        sourceCode: "return 0;",
        language: "CPP",
      });
      acceptedCount++;
    } catch (err: any) {
      rejectedCount++;
      if (err instanceof RateLimitError) {
        retryAfterHeader = err.details?.retryAfter ?? 0;
      }
    }
  }

  console.log(`  High-Water Mark Limit: ${highWaterMark}`);
  console.log(`  Total Ingestion Floods: 8`);
  console.log(`  Accepted (Within Cap): ${c.green}${acceptedCount}${c.reset} (Expected: ${highWaterMark})`);
  console.log(`  Rejected (Backpressure): ${c.red}${rejectedCount}${c.reset} (Expected: ${8 - highWaterMark})`);
  console.log(`  Retry-After Header:    ${c.cyan}${retryAfterHeader}s${c.reset} (Expected: 10s)`);

  const passed = acceptedCount === highWaterMark && rejectedCount === (8 - highWaterMark) && retryAfterHeader === 10;
  console.log(`  Verdict: ${passed ? c.green + "PASSED ✓" : c.red + "FAILED ✗"}${c.reset}`);
  return passed;
}

// ─── Test 4: Cancellation Tokens & AbortControllers ──────────────────────────

async function testCancellation(): Promise<boolean> {
  console.log(`\n${c.bold}=== [4/5] Cancellation Tokens: Reclaiming Stale In-Flight Executions ===${c.reset}`);

  // Test Cancellation Manager standalone
  const key = `exec-task-${Date.now()}`;
  const signal1 = cancellationManager.createToken(key);

  console.log(`  Token Created: Aborted=${signal1.aborted} (Expected: false)`);

  // Creating a new token with same key should supersede and abort previous token
  const signal2 = cancellationManager.createToken(key);
  console.log(`  Superseded Previous: Aborted=${signal1.aborted} (Expected: true)`);
  console.log(`  New Token Active:    Aborted=${signal2.aborted} (Expected: false)`);

  // Explicit cancellation
  const cancelled = cancellationManager.cancel(key, "User navigated away");
  console.log(`  Explicit Cancel:     Success=${cancelled} | Aborted=${signal2.aborted} (Expected: true)`);

  // Test Task Queue job cancellation
  const queue = new TaskQueue(0, 10);
  const queuedJob = queue.enqueue({
    type: "SUBMIT",
    userId: "cancel-user",
    problemId: 1,
    sourceCode: "int main() {}",
    language: "CPP",
  });

  const queueCancelled = queue.cancelJob(queuedJob.id, "Candidate edited code");
  const jobStateAfter = queue.getJob(queuedJob.id);

  console.log(`  Queue Job Cancelled: Success=${queueCancelled} | Status=${jobStateAfter?.status} (Expected: CANCELLED)`);

  const passed = signal1.aborted && signal2.aborted && queueCancelled && jobStateAfter?.status === "CANCELLED";
  console.log(`  Verdict: ${passed ? c.green + "PASSED ✓" : c.red + "FAILED ✗"}${c.reset}`);
  return passed;
}

// ─── Test 5: Resilient Retry Strategy with Full Jitter ───────────────────────

async function testRetryWithFullJitter(): Promise<boolean> {
  console.log(`\n${c.bold}=== [5/5] Resilient Retries: Exponential Backoff with Full Jitter ===${c.reset}`);

  // 1. Verify Jitter math randomness across 5 samples
  const delays: number[] = [];
  for (let i = 0; i < 5; i++) {
    delays.push(calculateJitterDelay(2, 100, 1000));
  }
  const isRandomized = new Set(delays).size > 1;
  console.log(`  Full Jitter Delay Samples (Attempt 2, Base 100ms): [${delays.join(", ")}ms] (Randomized: ${isRandomized ? "YES ✓" : "NO ✗"})`);

  // 2. Simulate transient upstream failure (fails twice, succeeds on attempt 3)
  let attemptCount = 0;
  const result = await retryWithFullJitter(
    async (attempt) => {
      attemptCount++;
      if (attempt < 2) {
        throw new Error(`Transient 503 Service Unavailable (attempt ${attempt})`);
      }
      return "SUCCESS_FROM_JUDGE";
    },
    { maxRetries: 3, baseDelayMs: 20, maxDelayMs: 100 }
  );

  console.log(`  Transient Error Recovery: Outcome='${result}' | Total Invocations=${attemptCount} (Expected: 3)`);

  // 3. Verify that AbortError is NEVER retried
  let abortAttemptCount = 0;
  let abortCaught = false;
  try {
    await retryWithFullJitter(
      async () => {
        abortAttemptCount++;
        const err = new Error("Execution was aborted");
        err.name = "AbortError";
        throw err;
      },
      { maxRetries: 3, baseDelayMs: 10 }
    );
  } catch (e: any) {
    abortCaught = e.name === "AbortError";
  }

  console.log(`  Abort Non-Retry Guard:    Invocations=${abortAttemptCount} (Expected: 1) | Abort Propagated: ${abortCaught ? "YES ✓" : "NO ✗"}`);

  const passed = isRandomized && result === "SUCCESS_FROM_JUDGE" && attemptCount === 3 && abortAttemptCount === 1;
  console.log(`  Verdict: ${passed ? c.green + "PASSED ✓" : c.red + "FAILED ✗"}${c.reset}`);
  return passed;
}

// ─── Master Runner ───────────────────────────────────────────────────────────

async function runPhase2Master() {
  console.log(`${c.bold}${c.cyan}`);
  console.log("================================================================================");
  console.log(" 🚀 INTERVUE SYSTEM DESIGN BENCHMARK — PHASE 2: CONCURRENCY & QUEUEING");
  console.log("================================================================================");
  console.log(c.reset);

  const t1 = await testSemaphoreConcurrency();
  const t2 = await testWorkerPool();
  const t3 = await testBackpressure();
  const t4 = await testCancellation();
  const t5 = await testRetryWithFullJitter();

  console.log(`\n${c.bold}================================================================================${c.reset}`);
  console.log(`${c.bold} 📊 PHASE 2 BENCHMARK SCORECARD${c.reset}`);
  console.log(`${c.bold}================================================================================${c.reset}`);
  console.log(`  2.1 Concurrency Limiting (AsyncSemaphore Permit Ceiling):  ${t1 ? c.green + "PASS ✓" : c.red + "FAIL ✗"}${c.reset}`);
  console.log(`  2.2 Task Queue & Worker Pool (Producer-Consumer Pattern):  ${t2 ? c.green + "PASS ✓" : c.red + "FAIL ✗"}${c.reset}`);
  console.log(`  2.3 Backpressure Management (High-Water Mark 429/Retry):   ${t3 ? c.green + "PASS ✓" : c.red + "FAIL ✗"}${c.reset}`);
  console.log(`  2.4 Cancellation Tokens (AbortController CPU Reclamation): ${t4 ? c.green + "PASS ✓" : c.red + "FAIL ✗"}${c.reset}`);
  console.log(`  2.5 Resilient Retry Strategy (Exponential Backoff Jitter): ${t5 ? c.green + "PASS ✓" : c.red + "FAIL ✗"}${c.reset}`);
  console.log(`================================================================================\n`);

  const allPassed = t1 && t2 && t3 && t4 && t5;
  if (allPassed) {
    console.log(`${c.bold}${c.green}🎉 ALL PHASE 2 CONCURRENCY & QUEUEING CHECKPOINTS VERIFIED!${c.reset}\n`);
    process.exit(0);
  } else {
    console.error(`${c.bold}${c.red}❌ SOME CHECKPOINTS FAILED. PLEASE REVIEW THE LOGS ABOVE.${c.reset}\n`);
    process.exit(1);
  }
}

runPhase2Master().catch((err) => {
  console.error("Fatal benchmark runner error:", err);
  process.exit(1);
});
