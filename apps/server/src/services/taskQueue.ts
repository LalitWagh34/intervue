import { EventEmitter } from "events";
import { db } from "@intervue/db";
import { judgeSubmission, runSampleTestCases } from "./judge";
import { judgeSemaphore } from "../lib/semaphore";
import { cancellationManager } from "../lib/cancellation";
import { RateLimitError } from "../lib/errors";
import { roomSocketManager } from "./roomSocket";

export type JobType = "RUN" | "SUBMIT";
export type JobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface EnqueueJobParams {
  type: JobType;
  userId: string;
  problemId: number;
  sourceCode: string;
  language: string;
  roomCode?: string;
}

export interface ExecutionJob extends EnqueueJobParams {
  id: string;
  status: JobStatus;
  attemptCount: number;
  nextAttemptAt?: Date | null;
  leaseExpiresAt?: Date | null;
  createdAt: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
  durationMs?: number | null;
  result?: any;
  error?: string | null;
}

export interface QueueStats {
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  total: number;
  maxQueueDepth: number;
}

type QueueDatabase = { executionJob: any };
type JobRunner = (job: ExecutionJob, signal: AbortSignal) => Promise<any>;

const MAX_JOB_ATTEMPTS = 3;
const JOB_LEASE_MS = 5 * 60_000;
const RETRY_BASE_MS = 5_000;
const WORKER_POLL_MS = 1_000;
const COMPLETED_RETENTION_MS = 24 * 60 * 60_000;

async function defaultRunner(job: ExecutionJob, signal: AbortSignal) {
  return judgeSemaphore.withPermit(async () => {
    if (job.type === "RUN") {
      return runSampleTestCases({ problemId: job.problemId, sourceCode: job.sourceCode, language: job.language, signal });
    }
    return judgeSubmission({
      userId: job.userId,
      problemId: job.problemId,
      sourceCode: job.sourceCode,
      language: job.language,
      executionJobId: job.id,
      signal,
    });
  });
}

/** Database-backed execution queue. Persisted rows are the source of truth. */
export class TaskQueue extends EventEmitter {
  private processingCount = 0;
  private cycleRunning = false;
  private readonly database: QueueDatabase;
  private readonly runner: JobRunner;
  private workerTimer?: ReturnType<typeof setInterval>;
  private cleanupTimer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly workerConcurrency = 3,
    private readonly maxQueueDepth = 50,
    options: { database?: QueueDatabase; runner?: JobRunner; autoStart?: boolean } = {}
  ) {
    super();
    this.database = options.database ?? (db as unknown as QueueDatabase);
    this.runner = options.runner ?? defaultRunner;
    if (options.autoStart ?? process.env.NODE_ENV !== "test") this.start();
  }

  start() {
    if (this.workerTimer) return;
    void this.processAvailableJobs();
    this.workerTimer = setInterval(() => void this.processAvailableJobs(), WORKER_POLL_MS);
    this.cleanupTimer = setInterval(() => void this.cleanupExpiredJobs(), 60_000);
    this.workerTimer.unref?.();
    this.cleanupTimer.unref?.();
  }

  stop() {
    if (this.workerTimer) clearInterval(this.workerTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    this.workerTimer = undefined;
    this.cleanupTimer = undefined;
  }

  async enqueue(params: EnqueueJobParams): Promise<ExecutionJob> {
    const queued = await this.database.executionJob.count({ where: { status: "QUEUED" } });
    if (queued >= this.maxQueueDepth) {
      throw new RateLimitError(
        `Backpressure Tripped: Task queue has reached high-water mark capacity (${queued}/${this.maxQueueDepth}). Please retry shortly.`,
        { retryAfter: 10, queueDepth: queued, maxCapacity: this.maxQueueDepth }
      );
    }
    const job = await this.database.executionJob.create({
      data: { ...params, roomCode: params.roomCode, status: "QUEUED" },
    });
    this.emit("job:queued", job);
    if (this.workerTimer) queueMicrotask(() => void this.processAvailableJobs());
    return job as ExecutionJob;
  }

  async getJob(id: string, userId?: string): Promise<ExecutionJob | null> {
    return this.database.executionJob.findFirst({ where: { id, ...(userId ? { userId } : {}) } });
  }

  async getQueuePosition(id: string): Promise<number> {
    const job = await this.database.executionJob.findUnique({ where: { id }, select: { status: true, createdAt: true } });
    if (!job || job.status !== "QUEUED") return 0;
    return this.database.executionJob.count({ where: { status: "QUEUED", createdAt: { lte: job.createdAt } } });
  }

  async cancelJob(id: string, userId: string, reason = "User cancelled execution"): Promise<boolean> {
    const job = await this.getJob(id, userId);
    if (!job || !["QUEUED", "PROCESSING"].includes(job.status)) return false;
    const cancelled = await this.database.executionJob.updateMany({
      where: { id, userId, status: { in: ["QUEUED", "PROCESSING"] } },
      data: { status: "CANCELLED", error: reason, completedAt: new Date(), leaseExpiresAt: null },
    });
    if (cancelled.count !== 1) return false;
    if (job.status === "PROCESSING") cancellationManager.cancel(id, reason);
    this.emit("job:cancelled", { ...job, status: "CANCELLED", error: reason });
    return true;
  }

  async getStats(): Promise<QueueStats> {
    const grouped = await this.database.executionJob.groupBy({ by: ["status"], _count: { _all: true } });
    const counts = Object.fromEntries(grouped.map((row: any) => [row.status, row._count._all]));
    return {
      queued: counts.QUEUED ?? 0,
      processing: counts.PROCESSING ?? 0,
      completed: counts.COMPLETED ?? 0,
      failed: counts.FAILED ?? 0,
      cancelled: counts.CANCELLED ?? 0,
      total: grouped.reduce((sum: number, row: any) => sum + row._count._all, 0),
      maxQueueDepth: this.maxQueueDepth,
    };
  }

  async processAvailableJobs(now = new Date()): Promise<void> {
    if (this.cycleRunning) return;
    this.cycleRunning = true;
    try {
      await this.recoverStaleJobs(now);
      while (this.processingCount < this.workerConcurrency) {
        const job = await this.claimNextJob(now);
        if (!job) break;
        this.processingCount++;
        void this.runWorker(job).finally(() => {
          this.processingCount = Math.max(0, this.processingCount - 1);
          void this.processAvailableJobs();
        });
      }
    } finally {
      this.cycleRunning = false;
    }
  }

  private async claimNextJob(now: Date): Promise<ExecutionJob | null> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = await this.database.executionJob.findFirst({
        where: {
          status: "QUEUED",
          attemptCount: { lt: MAX_JOB_ATTEMPTS },
          OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
        },
        orderBy: { createdAt: "asc" },
      });
      if (!candidate) return null;
      const claimed = await this.database.executionJob.updateMany({
        where: { id: candidate.id, status: "QUEUED" },
        data: {
          status: "PROCESSING",
          attemptCount: { increment: 1 },
          startedAt: now,
          leaseExpiresAt: new Date(now.getTime() + JOB_LEASE_MS),
          nextAttemptAt: null,
          error: null,
        },
      });
      if (claimed.count === 1) {
        return { ...candidate, status: "PROCESSING", attemptCount: candidate.attemptCount + 1, startedAt: now };
      }
    }
    return null;
  }

  private async recoverStaleJobs(now: Date) {
    await this.database.executionJob.updateMany({
      where: { status: "PROCESSING", leaseExpiresAt: { lt: now }, attemptCount: { lt: MAX_JOB_ATTEMPTS } },
      data: { status: "QUEUED", leaseExpiresAt: null, nextAttemptAt: now },
    });
    await this.database.executionJob.updateMany({
      where: { status: "PROCESSING", leaseExpiresAt: { lt: now }, attemptCount: { gte: MAX_JOB_ATTEMPTS } },
      data: { status: "FAILED", leaseExpiresAt: null, completedAt: now, error: "Execution retry limit reached" },
    });
  }

  private async runWorker(job: ExecutionJob) {
    const signal = cancellationManager.createToken(job.id);
    try {
      const result = await this.runner(job, signal);
      const completedAt = new Date();
      const completed = await this.database.executionJob.updateMany({
        where: { id: job.id, status: "PROCESSING" },
        data: {
          status: "COMPLETED",
          result,
          completedAt,
          durationMs: completedAt.getTime() - (job.startedAt?.getTime() ?? job.createdAt.getTime()),
          leaseExpiresAt: null,
        },
      });
      if (completed.count !== 1) return;
      this.emit("job:completed", { ...job, status: "COMPLETED", result, completedAt });
      if (job.roomCode) {
        roomSocketManager.broadcastToRoom(job.roomCode, "job:completed", {
          jobId: job.id, userId: job.userId, problemId: job.problemId, type: job.type, verdict: result.verdict,
        });
      }
    } catch (error: any) {
      const cancelled = signal.aborted || String(error?.message).toLowerCase().includes("cancelled");
      if (cancelled) return;
      const canRetry = job.attemptCount < MAX_JOB_ATTEMPTS;
      await this.database.executionJob.updateMany({
        where: { id: job.id, status: "PROCESSING" },
        data: canRetry
          ? {
              status: "QUEUED",
              nextAttemptAt: new Date(Date.now() + RETRY_BASE_MS * 2 ** Math.max(0, job.attemptCount - 1)),
              leaseExpiresAt: null,
              error: String(error?.message || "Execution failed").slice(0, 500),
            }
          : {
              status: "FAILED",
              completedAt: new Date(),
              leaseExpiresAt: null,
              error: String(error?.message || "Execution failed").slice(0, 500),
            },
      });
      this.emit("job:failed", { ...job, status: canRetry ? "QUEUED" : "FAILED" });
    } finally {
      cancellationManager.cleanup(job.id);
    }
  }

  private async cleanupExpiredJobs() {
    const before = new Date(Date.now() - COMPLETED_RETENTION_MS);
    await this.database.executionJob.deleteMany({
      where: { status: { in: ["COMPLETED", "FAILED", "CANCELLED"] }, completedAt: { lt: before } },
    });
  }
}

export const executionQueue = new TaskQueue(Number(process.env.WORKER_CONCURRENCY) || 3);
