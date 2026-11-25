import { redis, isRedisConnected } from "./redis";

interface MemoryCacheEntry {
  serialized: string;
  expiresAt: number;
}

const MAX_MEMORY_CACHE_ENTRIES = 500;
const REDIS_SCAN_COUNT = 100;
const CACHE_GENERATION_KEY = "intervue:cache-generation";

export interface CacheGeneration {
  local: number;
  redis: string | null;
}

let localGeneration = 0;

const memoryCache = new Map<string, MemoryCacheEntry>();
const inFlightLoads = new Map<string, { generation: CacheGeneration; promise: Promise<unknown> }>();

/** Capture before reading source data so invalidation can fence a later write. */
export async function captureCacheGeneration(): Promise<CacheGeneration> {
  const local = localGeneration;
  if (isRedisConnected) {
    try {
      return { local, redis: (await redis.get(CACHE_GENERATION_KEY)) ?? "0" };
    } catch {
      // A failed generation read must not authorize a later Redis write.
    }
  }
  return { local, redis: null };
}

async function invalidateGeneration(): Promise<void> {
  localGeneration++;
  inFlightLoads.clear();
  if (isRedisConnected) {
    try {
      await redis.incr(CACHE_GENERATION_KEY);
    } catch {
      // Local fencing remains available during Redis outages.
    }
  }
}

function evictExpiredMemoryEntries(now: number): void {
  for (const [key, entry] of memoryCache) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
}

function setMemoryEntry(key: string, serialized: string, ttlSeconds: number): void {
  if (ttlSeconds <= 0) return;

  const now = Date.now();
  if (memoryCache.has(key)) {
    memoryCache.delete(key);
  } else if (memoryCache.size >= MAX_MEMORY_CACHE_ENTRIES) {
    evictExpiredMemoryEntries(now);
    while (memoryCache.size >= MAX_MEMORY_CACHE_ENTRIES) {
      const oldestKey = memoryCache.keys().next().value;
      if (oldestKey === undefined) break;
      memoryCache.delete(oldestKey);
    }
  }

  memoryCache.set(key, {
    serialized,
    expiresAt: now + ttlSeconds * 1000,
  });
}

function getMemoryEntry<T>(key: string): { hit: boolean; value: T | null } {
  const entry = memoryCache.get(key);
  if (!entry) return { hit: false, value: null };

  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return { hit: false, value: null };
  }

  // Refresh insertion order for LRU behavior
  memoryCache.delete(key);
  memoryCache.set(key, entry);

  try {
    return { hit: true, value: JSON.parse(entry.serialized) as T };
  } catch {
    memoryCache.delete(key);
    return { hit: false, value: null };
  }
}

/**
 * Retrieve a cached JSON-serializable value by key.
 * Uses Redis when connected and falls back to a bounded in-memory Map.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (isRedisConnected) {
    try {
      const raw = await redis.get(key);
      if (raw !== null) {
        return JSON.parse(raw) as T;
      }
      return null;
    } catch {
      // Fall through to in-memory fallback on transient Redis failure
    }
  }

  return getMemoryEntry<T>(key).value;
}

/**
 * Store a JSON-serializable value in cache with a TTL in seconds.
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number,
  generation?: CacheGeneration
): Promise<void> {
  if (value === undefined || ttlSeconds <= 0) return;
  if (generation && generation.local !== localGeneration) return;

  const serialized = JSON.stringify(value);
  if (isRedisConnected) {
    try {
      if (generation) {
        if (generation.redis === null) return;
        // Compare and write atomically across workers sharing Redis.
        await redis.eval(
          "if (redis.call('GET', KEYS[1]) or '0') == ARGV[1] then return redis.call('SET', KEYS[2], ARGV[2], 'EX', ARGV[3]) end return nil",
          2,
          CACHE_GENERATION_KEY,
          key,
          generation.redis,
          serialized,
          Math.ceil(ttlSeconds)
        );
      } else {
        await redis.set(key, serialized, "EX", Math.ceil(ttlSeconds));
      }
      return;
    } catch {
      // Fall back to in-memory cache if Redis write fails
    }
  }

  if (!generation || generation.local === localGeneration) {
    setMemoryEntry(key, serialized, ttlSeconds);
  }
}

/**
 * Read from cache or compute via loader and store on success.
 * Errors thrown by loader are propagated and never cached.
 */
export async function cacheGetOrSet<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<T> {
  const generation = await captureCacheGeneration();
  if (isRedisConnected) {
    try {
      const raw = await redis.get(key);
      if (raw !== null) {
        return JSON.parse(raw) as T;
      }
    } catch {
      const mem = getMemoryEntry<T>(key);
      if (mem.hit) return mem.value as T;
    }
  } else {
    const mem = getMemoryEntry<T>(key);
    if (mem.hit) return mem.value as T;
  }

  const existingLoad = inFlightLoads.get(key);
  if (
    existingLoad &&
    existingLoad.generation.local === generation.local &&
    existingLoad.generation.redis === generation.redis
  ) {
    return (await existingLoad.promise) as T;
  }

  const loadPromise = (async () => {
    const loaded = await loader();
    if (loaded !== undefined) {
      await cacheSet(key, loaded, ttlSeconds, generation);
    }
    return loaded;
  })();

  inFlightLoads.set(key, { generation, promise: loadPromise });
  try {
    return await loadPromise;
  } finally {
    if (inFlightLoads.get(key)?.promise === loadPromise) {
      inFlightLoads.delete(key);
    }
  }
}

/**
 * Delete a single key from both in-memory and Redis caches.
 */
export async function cacheDelete(key: string): Promise<void> {
  await invalidateGeneration();
  memoryCache.delete(key);
  if (isRedisConnected) {
    try {
      await redis.del(key);
    } catch {
      // Ignore transient Redis deletion errors
    }
  }
}

/**
 * Delete all keys matching a prefix from both in-memory and Redis caches.
 */
export async function cacheDeleteByPrefix(prefix: string): Promise<void> {
  await invalidateGeneration();
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }

  if (isRedisConnected) {
    try {
      if (typeof redis.scan === "function") {
        let cursor = "0";
        do {
          const [nextCursor, keys] = await redis.scan(
            cursor,
            "MATCH",
            `${prefix}*`,
            "COUNT",
            REDIS_SCAN_COUNT
          );
          cursor = nextCursor;
          if (Array.isArray(keys) && keys.length > 0) {
            await redis.del(...keys);
          }
        } while (cursor !== "0");
      }
    } catch {
      // Ignore transient Redis scan/delete errors
    }
  }
}

/**
 * Clear in-memory cache and in-flight load map (primarily for test isolation).
 */
export async function clearCache(): Promise<void> {
  localGeneration++;
  memoryCache.clear();
  inFlightLoads.clear();
}

export function getMemoryCacheSize(): number {
  return memoryCache.size;
}
