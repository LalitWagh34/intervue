import type { Context, Next } from "hono";
import { redis, isRedisConnected } from "../lib/redis.js";

interface CachedResponse {
  status: "IN_FLIGHT" | "COMPLETED";
  statusCode?: number;
  headers?: Record<string, string>;
  body?: any;
  createdAt: number;
}

export interface IdempotencyOptions {
  /** TTL in milliseconds to retain cached responses (default: 120,000ms = 2 minutes) */
  ttlMs?: number;
}

/**
 * Idempotency Middleware for Critical Non-Idempotent Operations (POST / PUT)
 * Follows the IETF Draft specifications for the `Idempotency-Key` header.
 * 
 * - Uses Redis if available, with graceful in-memory fallback.
 * - If no Idempotency-Key header is present: passes through transparently.
 * - If key is IN_FLIGHT: returns HTTP 409 Conflict to prevent concurrent double-execution.
 * - If key is COMPLETED: replays the cached status, headers, and body with `Idempotent-Replay: true`.
 * - If key is NEW: locks key as IN_FLIGHT, executes handler, caches result, and unlocks.
 */
export function idempotency(options: IdempotencyOptions = {}) {
  const ttlMs = options.ttlMs ?? 120_000;
  const store = new Map<string, CachedResponse>();

  // Periodic sweeper for expired idempotency records in memory
  const cleanupInterval = setInterval(() => {
    if (isRedisConnected) return; // Redis handles its own TTLs
    const now = Date.now();
    for (const [k, v] of store.entries()) {
      if (now - v.createdAt > ttlMs) {
        store.delete(k);
      }
    }
  }, Math.max(ttlMs, 30_000));

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return async function idempotencyMiddleware(c: Context, next: Next) {
    const idempotencyKey =
      c.req.header("idempotency-key") ||
      c.req.header("x-idempotency-key");

    if (!idempotencyKey) {
      return await next();
    }

    const user = (c as any).get?.("user");
    const userId = user?.id || "anonymous";
    const cacheKey = `idempotent:${userId}:${c.req.method}:${c.req.path}:${idempotencyKey}`;
    const now = Date.now();

    let useFallback = !isRedisConnected;
    let existing: CachedResponse | undefined = undefined;

    if (!useFallback) {
      try {
        const locked = await redis.set(
          cacheKey, 
          JSON.stringify({ status: "IN_FLIGHT", createdAt: now }), 
          "PX", 
          ttlMs, 
          "NX"
        );
        
        if (!locked) {
          // Lock exists, meaning request is in flight or completed
          const val = await redis.get(cacheKey);
          if (val) {
            existing = JSON.parse(val);
          } else {
            // Edge case: expired right after set failed
            // We treat as new, so we'll just fall back to memory for this one attempt
            useFallback = true;
          }
        }
      } catch (err) {
        console.error("[Idempotency] Redis error, falling back to in-memory:", err);
        useFallback = true;
      }
    }

    if (useFallback) {
      existing = store.get(cacheKey);
      if (!existing) {
        store.set(cacheKey, {
          status: "IN_FLIGHT",
          createdAt: now,
        });
      }
    }

    if (existing) {
      if (existing.status === "IN_FLIGHT") {
        return c.json(
          {
            statusCode: 409,
            error: "Conflict: A request with this Idempotency-Key is currently in progress. Please retry shortly.",
            code: "IDEMPOTENT_OPERATION_IN_FLIGHT",
          },
          409
        );
      }

      if (existing.status === "COMPLETED") {
        c.header("Idempotent-Replayed", "true");
        c.header("X-Idempotency-Key", idempotencyKey);
        if (existing.headers) {
          for (const [hName, hVal] of Object.entries(existing.headers)) {
            c.header(hName, hVal);
          }
        }
        return c.json(existing.body, (existing.statusCode as any) || 200);
      }
    }

    try {
      await next();

      const res = c.res;
      let responseBody: any = null;

      try {
        const cloned = res.clone();
        responseBody = await cloned.json();
      } catch (e) {
        // Not JSON
      }

      const completedData: CachedResponse = {
        status: "COMPLETED",
        statusCode: res.status,
        body: responseBody,
        createdAt: now,
      };

      if (!useFallback && isRedisConnected) {
        try {
          await redis.set(cacheKey, JSON.stringify(completedData), "PX", ttlMs);
        } catch (err) {
          console.error("[Idempotency] Redis set completion error:", err);
          store.set(cacheKey, completedData);
        }
      } else {
        store.set(cacheKey, completedData);
      }

      c.header("Idempotent-Replayed", "false");
      c.header("X-Idempotency-Key", idempotencyKey);
    } catch (err) {
      if (!useFallback && isRedisConnected) {
        await redis.del(cacheKey).catch(() => {});
      } else {
        store.delete(cacheKey);
      }
      throw err;
    }
  };
}

export const requireIdempotency = idempotency({ ttlMs: 120_000 });
