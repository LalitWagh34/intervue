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
import companyRoutes from "./routes/companies";
import { roomSocketManager } from "./services/roomSocket";

const { upgradeWebSocket, websocket } = createBunWebSocket();
const app = new Hono<{ Variables: AuthVariables }>();


// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);
app.get("/test-auth", (c) => {
  return c.json({ auth: typeof auth, handler: typeof auth.handler });
});
// Auth routes — better-auth handles everything under /api/auth/*
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
app.route("/api/companies", companyRoutes);

// Real-Time Competitive Rooms WebSocket
app.get(
  "/ws/rooms",
  upgradeWebSocket((c) => {
    return {
      onOpen(event, ws) {
        console.log("[WS] Client connected to /ws/rooms");
      },
      onMessage(event, ws) {
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
app.get("/health", (c) => {
  return c.json({ status: "ok", message: "Intervue server running" });
});

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
  websocket,
};