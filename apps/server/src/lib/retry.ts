export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial backoff delay in milliseconds (default: 200ms) */
  baseDelayMs?: number;
  /** Maximum backoff ceiling in milliseconds (default: 3000ms) */
  maxDelayMs?: number;
  /** Predicate determining if an error is transient and eligible for retry */
  isRetryable?: (error: any) => boolean;
}

/**
 * Calculates exponential backoff delay with Full Jitter.
 * Formula: delay = Math.random() * Math.min(maxDelayMs, baseDelayMs * (2 ** attempt))
 * 
 * Why Full Jitter?
 * - Equal distribution of retries across the backoff window.
 * - Completely prevents the "Thundering Herd" problem when downstream services recover.
 */
export function calculateJitterDelay(
  attempt: number,
  baseDelayMs: number = 200,
  maxDelayMs: number = 3000
): number {
  const exponentialCap = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
  return Math.floor(Math.random() * exponentialCap);
}

/**
 * Resilient Retry Helper with Full Jitter
 * Wraps unreliable external network calls (Judge0, Groq AI).
 */
export async function retryWithFullJitter<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 200;
  const maxDelayMs = options.maxDelayMs ?? 3000;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err: any) {
      lastError = err;

      // Check if error is abort/cancellation — do NOT retry cancelled operations!
      if (err?.name === "AbortError" || err?.name === "TimeoutError") {
        throw err;
      }

      // Check custom retryable predicate if provided
      if (options.isRetryable && !options.isRetryable(err)) {
        throw err;
      }

      // If we've exhausted all retries, break and throw
      if (attempt >= maxRetries) {
        break;
      }

      const delay = calculateJitterDelay(attempt, baseDelayMs, maxDelayMs);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
