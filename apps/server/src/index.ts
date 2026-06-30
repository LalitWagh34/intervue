import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./lib/auth";
import type { AuthVariables } from "./types";
import profileRoutes from "./routes/profile"
import interviewRoutes from "./routes/interview";
import codeRoutes from "./routes/code";
import chatRoutes from "./routes/chat";
import adminRoutes from "./routes/admin";
import voiceRoutes from "./routes/voice";


console.log("auth object:", typeof auth);
console.log("auth.handler:", typeof auth?.handler);
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
// Health check
app.route("/api/admin", adminRoutes);
app.get("/health", (c) => {
  return c.json({ status: "ok", message: "Intervue server running" });
});

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
};