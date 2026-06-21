import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./lib/auth";
import type { AuthVariables } from "./types";
import profileRoutes from "./routes/profile"
import interviewRoutes from "./routes/interview";
import chatRoutes from "./routes/chat";

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

// Auth routes — better-auth handles everything under /api/auth/*
app.on(["GET", "POST"], "/api/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

app.route("/api/profile", profileRoutes);
app.route("/api/interviews", interviewRoutes);
app.route("/api/chats", chatRoutes);

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", message: "Intervue server running" });
});

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
};