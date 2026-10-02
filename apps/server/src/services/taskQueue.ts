import { EventEmitter } from "events";
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

export interface ExecutionJob {
  id: string;
  type: JobType;
  userId: string;
  problemId: number;
  sourceCode: string;
  language: string;
  roomCode?: string;
  status: JobStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  result?: any;
  error?: string;
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

/**
 * In-Memory Asynchronous Task Queue & Worker Pool
 * Implements Producer-Consumer Pattern for heavy code execution tasks.
 * 
 * - Decouples HTTP request arrival from Judge0 / compilation execution.
 * - Limits concurrent worker execution using AsyncSemaphore.
 * - Backpressure Management: Rejects new jobs when queue exceeds high-water mark.
 * - Cancellation Token Integration: Aborts in-flight and queued jobs.
 * - Stores completed job results for fast polling retrieval with automated TTL cleanup.
 */
export class TaskQueue extends EventEmitter {
  private jobs: Map<string, ExecutionJob> = new Map();
  private queue: string[] = []; // FIFO job IDs
  private processingCount: number = 0;
  private workerConcurrency: number;
  private maxQueueDepth: number;
  private isProcessing: boolean = false;

  constructor(workerConcurrency: number = 3, maxQueueDepth: number = 50) {
    super();
    this.workerConcurrency = workerConcurrency;
    this.maxQueueDepth = maxQueueDepth;

    // Background TTL cleanup for old jobs (15 minutes)
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const TTL = 15 * 60 * 1000;
      for (const [id, job] of this.jobs.entries()) {
        if (job.completedAt && now - job.completedAt > TTL) {
          this.jobs.delete(id);
        }
      }
    }, 60_000);

    if (cleanupInterval.unref) {
      cleanupInterval.unref();
    }
  }

  /**
   * Producer: Enqueues a new execution task.
   * Throws RateLimitError (Backpressure) if queue depth exceeds high-water mark.
   */
  enqueue(params: EnqueueJobParams): ExecutionJob {
    // 2.3 Backpressure Guard: High-water mark check
    if (this.queue.length >= this.maxQueueDepth) {
      throw new RateLimitError(
        `Backpressure Tripped: Task queue has reached high-water mark capacity (${this.queue.length}/${this.maxQueueDepth}). Please retry shortly.`,
        { retryAfter: 10, queueDepth: this.queue.length, maxCapacity: this.maxQueueDepth }
      );
    }

    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const job: ExecutionJob = {
      id,
      type: params.type,
      userId: params.userId,
      problemId: params.problemId,
      sourceCode: params.sourceCode,
      language: params.language,
      roomCode: params.roomCode,
      status: "QUEUED",
      createdAt: Date.now(),
    };

    this.jobs.set(id, job);
    this.queue.push(id);

    this.emit("job:queued", job);

    // Trigger consumer worker loop asynchronously
    queueMicrotask(() => this.processNext());

    return job;
  }

  /**
   * 2.4 Cancellation: Aborts a queued or in-flight job by ID.
   */
  cancelJob(id: string, reason: string = "User cancelled execution"): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    if (job.status === "QUEUED") {
      const idx = this.queue.indexOf(id);
      if (idx !== -1) {
        this.queue.splice(idx, 1);
      }
      job.status = "CANCELLED";
      job.error = reason;
      job.completedAt = Date.now();
      this.emit("job:cancelled", job);
      return true;
    }

    if (job.status === "PROCESSING") {
      cancellationManager.cancel(id, reason);
      job.status = "CANCELLED";
      job.error = reason;
      job.completedAt = Date.now();
      this.emit("job:cancelled", job);
      return true;
    }

    return false;
  }

  /**
   * Retrieve job by ID.
   */
  getJob(id: string): ExecutionJob | undefined {
    return this.jobs.get(id);
  }

  /**
   * Calculate current position of a job in the waiting FIFO queue.
   */
  getQueuePosition(id: string): number {
    const idx = this.queue.indexOf(id);
    return idx === -1 ? 0 : idx + 1;
  }

  /**
   * Returns current depth and worker saturation metrics.
   */
  getStats(): QueueStats {
    let queued = 0;
    let processing = 0;
    let completed = 0;
    let failed = 0;
    let cancelled = 0;

    for (const job of this.jobs.values()) {
      if (job.status === "QUEUED") queued++;
      else if (job.status === "PROCESSING") processing++;
      else if (job.status === "COMPLETED") completed++;
      else if (job.status === "FAILED") failed++;
      else if (job.status === "CANCELLED") cancelled++;
    }

    return {
      queued,
      processing,
      completed,
      failed,
      cancelled,
      total: this.jobs.size,
      maxQueueDepth: this.maxQueueDepth,
    };
  }

  /**
   * Consumer / Worker Loop
   * Consumes jobs from FIFO queue up to workerConcurrency.
   */
  private async processNext(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0 && this.processingCount < this.workerConcurrency) {
        const jobId = this.queue.shift();
        if (!jobId) continue;

        const job = this.jobs.get(jobId);
        if (!job || job.status !== "QUEUED") continue;

        this.processingCount++;
        job.status = "PROCESSING";
        job.startedAt = Date.now();

        // Run worker task asynchronously using semaphore protection
        this.runWorker(job).finally(() => {
          this.processingCount = Math.max(0, this.processingCount - 1);
          this.processNext();
        });
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Worker Execution Logic with Cancellation Support
   */
  private async runWorker(job: ExecutionJob): Promise<void> {
    const signal = cancellationManager.createToken(job.id);

    try {
      // Execute through Judge Semaphore to respect system-wide concurrency limits
      const result = await judgeSemaphore.withPermit(async () => {
        if (job.type === "RUN") {
          return await runSampleTestCases({
            problemId: job.problemId,
            sourceCode: job.sourceCode,
            language: job.language,
            signal,
          });
        } else {
          return await judgeSubmission({
            userId: job.userId,
            problemId: job.problemId,
            sourceCode: job.sourceCode,
            language: job.language,
            signal,
          });
        }
      });

      if (job.status === "CANCELLED") {
        return;
      }

      job.status = "COMPLETED";
      job.result = result;
      job.completedAt = Date.now();
      job.durationMs = job.completedAt - (job.startedAt || job.createdAt);

      this.emit("job:completed", job);

      // If related to a competitive room, broadcast result
      if (job.roomCode) {
        roomSocketManager.broadcastToRoom(job.roomCode, "job:completed", {
          jobId: job.id,
          userId: job.userId,
          problemId: job.problemId,
          type: job.type,
          verdict: result.verdict,
          durationMs: job.durationMs,
        });
      }
    } catch (err: any) {
      if (job.status === "CANCELLED" || signal.aborted || err?.message?.includes("cancelled")) {
        job.status = "CANCELLED";
        job.error = "Execution was cancelled by client";
        job.completedAt = Date.now();
        this.emit("job:cancelled", job);
        return;
      }

      job.status = "FAILED";
      job.error = err?.message || "Execution worker encountered an unknown failure";
      job.completedAt = Date.now();
      job.durationMs = job.completedAt - (job.startedAt || job.createdAt);

      this.emit("job:failed", job);

      if (job.roomCode) {
        roomSocketManager.broadcastToRoom(job.roomCode, "job:failed", {
          jobId: job.id,
          userId: job.userId,
          problemId: job.problemId,
          error: job.error,
        });
      }
    } finally {
      cancellationManager.cleanup(job.id);
    }
  }
}

/** Global Task Queue instance with 3 background consumers */
export const executionQueue = new TaskQueue(
  Number(process.env.WORKER_CONCURRENCY) || 3
);
