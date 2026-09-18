import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";
import Groq from "groq-sdk";
import { judgeSubmission } from "../services/judge";

const app = new Hono<{ Variables: AuthVariables }>();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// List all problems
app.get("/problems", requireAuth, async (c) => {
  const difficulty = c.req.query("difficulty");

  const problems = await db.problem.findMany({
    where: {
      status: "published",
      ...(difficulty ? { difficulty:difficulty as any} : {}),
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

// Get single problem with all relations
app.get("/problems/:slug", requireAuth, async (c) => {
  const slug = c.req.param("slug")!;

  const problem = await db.problem.findUnique({
    where: { slug },
    include: {
      examples: { orderBy: { orderIndex: "asc" } },
      testCases: { where: { isHidden: false }, orderBy: { orderIndex: "asc" } },
      templates: true,
    },
  });

  if (!problem) {
    return c.json({ error: "Problem not found" }, 404);
  }

  return c.json({ problem });
});

// Get submissions for a problem
app.get("/problems/:slug/submissions", requireAuth, async (c) => {
  const user = c.get("user");
  const slug = c.req.param("slug")!;

  const problem = await db.problem.findUnique({ where: { slug } });
  if (!problem) return c.json({ error: "Problem not found" }, 404);

  const submissions = await db.submission.findMany({
    where: { userId: user.id, problemId: problem.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return c.json({ submissions });
});

// Execute code via Judge0
app.post("/execute", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();

    if (!body.problemId) {
      return c.json({ error: "problemId is required" }, 400);
    }

    if (!body.sourceCode) {
      return c.json({ error: "sourceCode is required" }, 400);
    }

    if (!body.language) {
      return c.json({ error: "language is required" }, 400);
    }

    const result = await judgeSubmission({
      userId: user.id,
      problemId: Number(body.problemId),
      sourceCode: body.sourceCode,
      language: body.language,
    });

    return c.json(result);
  } catch (error) {
    console.error("Judge error:", error);

    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to execute submission",
      },
      500
    );
  }
});

// AI code evaluation
app.post("/evaluate", requireAuth, async (c) => {
  const body = await c.req.json();

  const prompt = `You are an expert code reviewer. Review this ${body.language} solution for the problem "${body.problemTitle}".

Problem: ${body.problemDescription}

Code:
${body.sourceCode}

Verdict: ${body.verdict || "unknown"}

Give concise feedback in 3-4 sentences covering: time/space complexity, code quality, and one specific improvement suggestion. Be direct and helpful.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const feedback = completion.choices[0]?.message?.content || "";
  return c.json({ feedback });
});

export default app;