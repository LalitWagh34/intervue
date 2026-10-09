import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createBunWebSocket } from "hono/bun";
import { auth } from "./lib/auth";
import type { AuthVariables } from "./types";
import profileRoutes from "./routes/profile";
import interviewRoutes from "./routes/interview";
import codeRoutes from "./routes/code";
import chatRoutes from "./routes/chat";
import adminRoutes from "./routes/admin";
import voiceRoutes from "./routes/voice";
import roomRoutes from "./routes/rooms";
import { sheetsRouter } from "./routes/sheets";
import companyRoutes from "./routes/companies";
import { searchRouter } from "./routes/search";
import notesRoutes from "./routes/notes";
import bookmarksRoutes from "./routes/bookmarks";
import rewardsRoutes from "./routes/rewards";
import feedbackRoutes from "./routes/feedback";
import { roomSocketManager } from "./services/roomSocket";
import { register, httpRequestDurationMicroseconds } from "./lib/metrics";
import { logger as pinoLogger } from "./lib/logger";

import { AppError, InternalServerError } from "./lib/errors";

const { upgradeWebSocket, websocket } = createBunWebSocket();
const app = new Hono<{ Variables: AuthVariables }>();

// Global RFC 7807 Problem Details Error Handler
app.onError((err, c) => {
  if (err instanceof AppError) {
    if (err.details?.retryAfter) {
      c.header("Retry-After", String(err.details.retryAfter));
    }
    return c.json(err.toJSON(c.req.path), (err.statusCode as any) || 500);
  }

  console.error("[Unhandled Server Error]", err);
  const fallback = new InternalServerError(
    process.env.NODE_ENV === "production" ? "Internal server error occurred" : err.message
  );
  return c.json(fallback.toJSON(c.req.path), 500);
});

// Metrics Middleware
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  httpRequestDurationMicroseconds.labels(c.req.method, c.req.routePath, c.res.status.toString()).observe(duration);
});

// Middleware
app.use("*", async (c, next) => {
  pinoLogger.info({ method: c.req.method, url: c.req.url, status: "incoming" });
  await next();
});
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return "http://localhost:5173";
      if (
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        origin.endsWith(".vercel.app") ||
        origin.includes("vercel.app")
      ) {
        return origin;
      }
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        process.env.CLIENT_URL,
      ].filter(Boolean) as string[];

      if (allowedOrigins.some((allowed) => origin === allowed || origin.startsWith(allowed))) {
        return origin;
      }
      return origin;
    },
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "Idempotency-Key", "X-Idempotency-Key"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.get("/", (c) => {
  return c.json({ status: "healthy", service: "intervue-backend", timestamp: new Date().toISOString() });
});

app.get("/test-auth", (c) => {
  return c.json({ auth: typeof auth, handler: typeof auth.handler });
});

// Auth routes — better-auth handles everything under /api/auth/* (Google OAuth + Email/Password)
app.on(["GET", "POST", "PUT", "DELETE", "PATCH"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});
app.route("/api/profile", profileRoutes);
app.route("/api/interviews", interviewRoutes);
app.route("/api/chats", chatRoutes);
app.route("/api/code",codeRoutes)
app.route("/api/voice",voiceRoutes)
app.route("/api/rooms", roomRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/sheets", sheetsRouter);
app.route("/api/companies", companyRoutes);
app.route("/api/search", searchRouter);
app.route("/api/notes", notesRoutes);
app.route("/api/bookmarks", bookmarksRoutes);
app.route("/api/rewards", rewardsRoutes);
app.route("/api/feedback", feedbackRoutes);

// Metrics Endpoint
app.get("/metrics", async (c) => {
  c.header("Content-Type", register.contentType);
  return c.body(await register.metrics());
});

// Real-Time Competitive Rooms WebSocket
app.get(
  "/ws/rooms",
  upgradeWebSocket((c) => {
    return {
      onOpen(event, ws) {
        console.log("[WS] Client connected to /ws/rooms");
      },
      onMessage: async (event, ws) => {
        try {
          let raw: string;
          if (typeof event.data === "string") {
            raw = event.data;
          } else if (event.data instanceof ArrayBuffer) {
            raw = new TextDecoder().decode(event.data);
          } else if (ArrayBuffer.isView(event.data)) {
            raw = new TextDecoder().decode(event.data.buffer);
          } else {
            raw = String(event.data);
          }
          const message = JSON.parse(raw);
          const { event: eventName, data } = message;

          if (eventName === "room:join") {
            roomSocketManager.joinRoom(ws, data);
          } else if (eventName === "room:leave") {
            roomSocketManager.leaveRoom(ws);
          } else if (eventName === "time:sync") {
            if (data?.roomCode) {
              roomSocketManager.sendRoomSync(ws, data.roomCode);
            }
          } else if (eventName === "anticheat:violation") {
            if (data?.roomCode && data?.userId && data?.type) {
              await roomSocketManager.recordViolation(data.roomCode, data.userId, data.type, data.details);
            }
          } else if (eventName === "code:sync") {
            if (data?.roomCode && data?.userId && data?.sourceCode !== undefined) {
              await roomSocketManager.updateCodeSnapshot(data.roomCode, data.userId, {
                problemId: data.problemId,
                sourceCode: data.sourceCode,
                language: data.language,
              });
            }
          } else if (eventName === "code:inspect") {
            if (data?.roomCode && data?.targetUserId) {
              const snapshot = await roomSocketManager.getCodeSnapshot(data.roomCode, data.targetUserId);
              roomSocketManager.sendToClient(ws, "code:inspect_result", {
                targetUserId: data.targetUserId,
                snapshot,
              });
            }
          }
        } catch (err) {
          console.error("[WS] Error parsing client message:", err);
        }
      },
      onClose(event, ws) {
        roomSocketManager.leaveRoom(ws);
      },
      onError(event, ws) {
        console.error("[WS] Connection error:", event);
        roomSocketManager.leaveRoom(ws);
      },
    };
  })
);

// Health check
let isShuttingDown = false;

app.get("/health", (c) => {
  if (isShuttingDown) {
    return c.json({ status: "shutting_down" }, 503);
  }
  return c.json({ status: "ok", message: "Intervue server running" });
});

export { app };

const server = {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
  websocket,
};

// Graceful Shutdown
process.on("SIGINT", async () => {
  pinoLogger.info("SIGINT received, starting graceful shutdown");
  isShuttingDown = true;
  // Let active requests finish
  setTimeout(() => process.exit(0), 5000);
});

process.on("SIGTERM", async () => {
  pinoLogger.info("SIGTERM received, starting graceful shutdown");
  isShuttingDown = true;
  // Let active requests finish
  setTimeout(() => process.exit(0), 5000);
});

export default server;