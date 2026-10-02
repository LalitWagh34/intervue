import { ExecutionTimeoutError } from "./errors";

interface Waiter {
  resolve: () => void;
  reject: (err: Error) => void;
  timer?: ReturnType<typeof setTimeout>;
}

export interface SemaphoreStats {
  capacity: number;
  activeCount: number;
  waitingCount: number;
}

/**
 * Asynchronous Counting Semaphore
 * Used to throttle concurrent CPU/Docker intensive operations (Judge0 / compiler processes).
 * 
 * Features:
 * - Strict FIFO ordering for waiting callers.
 * - Non-blocking async queueing via Promises.
 * - Optional acquisition timeout to prevent resource hangs.
 * - Safe `withPermit` wrapper ensuring release in finally block.
 * - Live observability stats: capacity, activeCount, waitingCount.
 */
export class AsyncSemaphore {
  private _capacity: number;
  private _activeCount: number = 0;
  private _waitQueue: Waiter[] = [];

  constructor(capacity: number) {
    if (capacity <= 0) {
      throw new Error("Semaphore capacity must be greater than 0");
    }
    this._capacity = capacity;
  }

  get capacity(): number {
    return this._capacity;
  }

  get activeCount(): number {
    return this._activeCount;
  }

  get waitingCount(): number {
    return this._waitQueue.length;
  }

  getStats(): SemaphoreStats {
    return {
      capacity: this._capacity,
      activeCount: this._activeCount,
      waitingCount: this._waitQueue.length,
    };
  }

  /**
   * Acquire a permit from the semaphore.
   * If all permits are in use, caller waits in FIFO order until a permit is released
   * or timeoutMs expires.
   */
  async acquire(timeoutMs?: number): Promise<void> {
    if (this._activeCount < this._capacity) {
      this._activeCount++;
      return;
    }

    return new Promise<void>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined;

      if (timeoutMs !== undefined && timeoutMs > 0) {
        timer = setTimeout(() => {
          // Remove from waiting queue on timeout
          const idx = this._waitQueue.findIndex((w) => w.resolve === resolve);
          if (idx !== -1) {
            this._waitQueue.splice(idx, 1);
          }
          reject(
            new ExecutionTimeoutError(
              `Semaphore acquisition timed out after ${timeoutMs}ms while waiting in queue (${this._waitQueue.length} ahead).`
            )
          );
        }, timeoutMs);

        if (timer.unref) {
          timer.unref();
        }
      }

      this._waitQueue.push({ resolve, reject, timer });
    });
  }

  /**
   * Release a previously acquired permit.
   * Hands permit directly to the next waiting caller in FIFO order.
   */
  release(): void {
    if (this._waitQueue.length > 0) {
      const nextWaiter = this._waitQueue.shift()!;
      if (nextWaiter.timer) {
        clearTimeout(nextWaiter.timer);
      }
      nextWaiter.resolve();
      return;
    }

    this._activeCount = Math.max(0, this._activeCount - 1);
  }

  /**
   * Executes an async operation with automatic permit acquisition and release.
   */
  async withPermit<T>(fn: () => Promise<T>, timeoutMs?: number): Promise<T> {
    await this.acquire(timeoutMs);
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

/** Global Judge Execution Semaphore — restricts active compilation runs to 5 concurrent */
export const judgeSemaphore = new AsyncSemaphore(
  Number(process.env.MAX_CONCURRENT_JUDGE_RUNS) || 5
);
