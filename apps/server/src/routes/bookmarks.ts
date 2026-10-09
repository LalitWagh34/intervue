import { Hono } from "hono";
import { db } from "@intervue/db";
import { requireAuth } from "../middleware/auth";
import type { AuthVariables } from "../types";

const bookmarks = new Hono<{ Variables: AuthVariables }>();

bookmarks.use("*", requireAuth);

function normalizeDifficulty(diff?: string): "Easy" | "Medium" | "Hard" {
  if (!diff) return "Medium";
  const raw = String(diff).toUpperCase().trim();
  if (raw === "BASIC" || raw === "EASY") return "Easy";
  if (raw === "HARD") return "Hard";
  return "Medium";
}

// GET /api/bookmarks - list all bookmarks for current user
bookmarks.get("/", async (c) => {
  try {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const all = await db.userBookmark.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    const normalized = all.map((b) => ({
      ...b,
      difficulty: normalizeDifficulty(b.difficulty),
    }));

    return c.json({ bookmarks: normalized });
  } catch (err: any) {
    console.error("Error fetching bookmarks:", err);
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/bookmarks/toggle - toggle bookmark for a problem
bookmarks.post("/toggle", async (c) => {
  try {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json();
    let { problemSlug, problemTitle, difficulty } = body;

    if (!problemSlug) return c.json({ error: "problemSlug is required" }, 400);

    const existing = await db.userBookmark.findUnique({
      where: { userId_problemSlug: { userId: user.id, problemSlug } },
    });

    if (existing) {
      await db.userBookmark.delete({ where: { id: existing.id } });
      return c.json({ bookmarked: false });
    } else {
      const normalizedDiff = normalizeDifficulty(difficulty);

      await db.userBookmark.create({
        data: {
          userId: user.id,
          problemSlug,
          problemTitle: problemTitle || problemSlug,
          difficulty: normalizedDiff,
        },
      });
      return c.json({ bookmarked: true });
    }
  } catch (err: any) {
    console.error("Error toggling bookmark:", err);
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/bookmarks/slugs - just the slugs for fast client-side lookup
bookmarks.get("/slugs", async (c) => {
  try {
    const user = c.get("user");
    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const all = await db.userBookmark.findMany({
      where: { userId: user.id },
      select: { problemSlug: true },
    });

    return c.json({ slugs: all.map((b) => b.problemSlug) });
  } catch (err: any) {
    console.error("Error fetching bookmark slugs:", err);
    return c.json({ error: err.message }, 500);
  }
});

export default bookmarks;