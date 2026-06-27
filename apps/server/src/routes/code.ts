import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";

const app = new Hono<{ Variables: AuthVariables }>();

// List all problems
app.get("/problems", requireAuth, async (c) => {
  const difficulty = c.req.query("difficulty");

  const problems = await db.problem.findMany({
    where: {
      isActive: true,
      ...(difficulty ? { difficulty } : {}),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      difficulty: true,
      tags: true,
      company: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return c.json({ problems });
});

// Get single problem
app.get("/problems/:slug", requireAuth, async (c) => {
  const slug = c.req.param("slug")!;

  const problem = await db.problem.findUnique({
    where: { slug },
  });

  if (!problem) {
    return c.json({ error: "Problem not found" }, 404);
  }

  return c.json({ problem });
});

// Get user's past submissions for a problem
app.get("/problems/:slug/submissions", requireAuth, async (c) => {
  const user = c.get("user");
  const slug = c.req.param("slug")!;

  const problem = await db.problem.findUnique({ where: { slug } });
  if (!problem) {
    return c.json({ error: "Problem not found" }, 404);
  }

  const submissions = await db.submission.findMany({
    where: { userId: user.id, problemId: problem.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return c.json({ submissions });
});

export default app;