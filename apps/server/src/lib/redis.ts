import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redisOptions = {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy(times: number) {
    if (times > 3) return null;
    return Math.min(times * 100, 2000);
  },
};

export const redis = new Redis(REDIS_URL, redisOptions);
export const redisSubscriber = new Redis(REDIS_URL, redisOptions);

export let isRedisConnected = false;
export let isRedisSubscriberConnected = false;

redis.on("connect", () => {
  isRedisConnected = true;
  console.log("[Redis] Main client connected.");
});

redis.on("error", (err) => {
  isRedisConnected = false;
  console.warn("[Redis] Main connection error:", err.message);
});

redis.on("close", () => {
  isRedisConnected = false;
});

redisSubscriber.on("connect", () => {
  isRedisSubscriberConnected = true;
  console.log("[Redis] Subscriber client connected.");
});

redisSubscriber.on("error", (err) => {
  isRedisSubscriberConnected = false;
  console.warn("[Redis] Subscriber connection error:", err.message);
});

redisSubscriber.on("close", () => {
  isRedisSubscriberConnected = false;
});

// Attempt to connect immediately
redis.connect().catch(() => {
  console.warn("[Redis] Main initial connection failed. App will use in-memory fallbacks.");
});

redisSubscriber.connect().catch(() => {
  console.warn("[Redis] Subscriber initial connection failed.");
});

