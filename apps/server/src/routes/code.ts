import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";
import Groq from "groq-sdk";

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
  const user = c.get("user");
  const body = await c.req.json();

  const PISTON_LANGUAGES: Record<string, { language: string; version: string }> = {
    JAVASCRIPT: { language: "javascript", version: "1.32.3" },
    PYTHON: { language: "python", version: "3.10.0" },
    CPP: { language: "c++", version: "10.2.0" },
    JAVA: { language: "java", version: "15.0.2" },
    TYPESCRIPT: { language: "typescript", version: "1.32.3" },
  };

  const lang = PISTON_LANGUAGES[body.language];
  if (!lang) return c.json({ error: "Unsupported language" }, 400);

  const response = await fetch(`${process.env.PISTON_API_URL}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: lang.language,
      version: lang.version,
      files: [{ content: body.sourceCode }],
      stdin: body.stdin || "",
    }),
  });

  const result = await response.json() as any;
  const stdout = result.run?.stdout || "";
  const stderr = result.run?.stderr || "";
  const code = result.run?.code;

  const verdict = code === 0 ? "ACCEPTED" : stderr ? "RUNTIME_ERROR" : "WRONG_ANSWER";
 console.log("Piston full response:", JSON.stringify(result, null, 2));
  if (body.problemId) {
    await db.submission.create({
      data: {
        userId: user.id,
        problemId: body.problemId,
        language: body.language,
        languageId: 0,
        sourceCode: body.sourceCode,
        verdict,
        stdout,
        stderr,
        isAccepted: verdict === "ACCEPTED",
      },
    });
  }

  return c.json({ verdict, stdout, stderr });
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