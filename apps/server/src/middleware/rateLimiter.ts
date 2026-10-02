import type { Context, Next } from "hono";
import { redis, isRedisConnected } from "../lib/redis.js";

export interface RateLimiterOptions {
  /** Time window in milliseconds (default: 60,000ms = 1 minute) */
  windowMs?: number;
  /** Maximum number of requests allowed within the window (default: 60) */
  max?: number;
  /** Custom message returned on 429 */
  message?: string;
  /** Custom key generator (defaults to userId if authenticated, else IP) */
  keyGenerator?: (c: Context) => string;
}

interface ClientRecord {
  timestamps: number[];
}

/**
 * Sliding Window Rate Limiter (Redis + In-Memory Fallback)
 * 
 * Algorithm: Sliding Window Log
 * - Records request timestamps per client key.
 * - On each request, prunes entries older than (now - windowMs).
 * - Accurately smooths out traffic without fixed-window boundary burst flaws.
 * - Automatically returns IETF standard headers:
 *   X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After.
 */
export function rateLimiter(options: RateLimiterOptions = {}) {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max ?? 60;
  const message = options.message ?? "Too many requests. Please slow down and try again later.";

  // Key -> Client record (for fallback)
  const clients = new Map<string, ClientRecord>();

  // Periodic garbage collection to prevent memory leaks from idle clients
  const cleanupInterval = setInterval(() => {
    if (isRedisConnected) return; // Let Redis handle its own TTLs
    const now = Date.now();
    for (const [key, record] of clients.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < windowMs);
      if (record.timestamps.length === 0) {
        clients.delete(key);
      }
    }
  }, Math.max(windowMs, 30_000));

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  // Lua script to perform sliding window rate limit atomically without penalizing
  // ARGV[1] = windowStart, ARGV[2] = max, ARGV[3] = now, ARGV[4] = uniqueMember, ARGV[5] = windowMs
  // Returns {allowed (1 or 0), currentCount (after add if allowed, else before), oldestTimestamp}
  const redisScript = `
    redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1])
    local count = redis.call('ZCARD', KEYS[1])
    local oldest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')[2]
    
    if count < tonumber(ARGV[2]) then
      redis.call('ZADD', KEYS[1], ARGV[3], ARGV[4])
      redis.call('PEXPIRE', KEYS[1], tonumber(ARGV[5]))
      return {1, count + 1, oldest}
    else
      return {0, count, oldest}
    end
  `;

  return async function rateLimitMiddleware(c: Context, next: Next) {
    let key: string;
    if (options.keyGenerator) {
      key = options.keyGenerator(c);
    } else {
      const user = (c as any).get?.("user");
      const ip =
        c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
        c.req.header("x-real-ip") ||
        "127.0.0.1";
      key = user?.id ? `user:${user.id}` : `ip:${ip}`;
    }

    const now = Date.now();
    const windowStart = now - windowMs;
    let allowed = false;
    let currentCount = 0;
    let oldestTimestamp = now;

    let useFallback = !isRedisConnected;

    if (!useFallback) {
      const redisKey = `ratelimit:${key}`;
      const uniqueMember = `${now}-${Math.random().toString(36).substring(2, 8)}`;
      
      try {
        const result = await redis.eval(
          redisScript, 
          1, 
          redisKey, 
          windowStart, 
          max, 
          now, 
          uniqueMember, 
          windowMs
        ) as [number, number, string | null];
        
        allowed = result[0] === 1;
        currentCount = result[1];
        oldestTimestamp = result[2] ? parseInt(result[2], 10) : now;
      } catch (err) {
        console.error("[RateLimiter] Redis eval failed, falling back to in-memory:", err);
        useFallback = true;
      }
    } 
    
    if (useFallback) {
      let record = clients.get(key);
      if (!record) {
        record = { timestamps: [] };
        clients.set(key, record);
      }

      record.timestamps = record.timestamps.filter((t) => t > windowStart);
      currentCount = record.timestamps.length;
      oldestTimestamp = record.timestamps[0] || now;

      if (currentCount < max) {
        record.timestamps.push(now);
        currentCount++;
        allowed = true;
      } else {
        allowed = false;
      }
    }

    const remaining = Math.max(0, max - currentCount);
    const resetTimeSeconds = Math.ceil((oldestTimestamp + windowMs) / 1000);

    c.header("X-RateLimit-Limit", max.toString());
    c.header("X-RateLimit-Remaining", remaining.toString());
    c.header("X-RateLimit-Reset", resetTimeSeconds.toString());

    if (!allowed) {
      const retryAfterSeconds = Math.max(1, Math.ceil((oldestTimestamp + windowMs - now) / 1000));
      c.header("Retry-After", retryAfterSeconds.toString());

      return c.json(
        {
          error: message,
          statusCode: 429,
          limit: max,
          remaining: 0,
          retryAfter: retryAfterSeconds,
        },
        429
      );
    }

    await next();
  };
}

/** Pre-configured Tier 1: Heavy CPU/Docker execution limiter (15 runs / minute) */
export const codeExecutionLimiter = rateLimiter({
  windowMs: 60_000,
  max: 15,
  message: "Code execution rate limit reached (15 runs/min). Please wait before running more test cases.",
});

/** Pre-configured Tier 2: AI Token & LLM query limiter (10 calls / minute) */
export const aiReviewLimiter = rateLimiter({
  windowMs: 60_000,
  max: 10,
  message: "AI assistance limit reached (10 requests/min). Please wait before requesting more AI reviews.",
});

/** Pre-configured Tier 3: Contest submission limiter (20 submissions / minute) */
export const contestSubmissionLimiter = rateLimiter({
  windowMs: 60_000,
  max: 20,
  message: "Contest submission rate limit reached. Please wait a moment before submitting again.",
});
