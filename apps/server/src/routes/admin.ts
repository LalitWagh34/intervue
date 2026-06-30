import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";
import Groq from "groq-sdk";

const app = new Hono<{ Variables: AuthVariables }>();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// All admin routes require auth + admin role
app.use("*", requireAuth, requireAdmin);

// List all problems
app.get("/problems", async (c) => {
  const problems = await db.problem.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { submissions: true, testCases: true } },
      author: { select: { name: true, email: true } },
    },
  });
  return c.json({ problems });
});

// Get single problem with all relations
app.get("/problems/:id", async (c) => {
  const id = parseInt(c.req.param("id")!);

  const problem = await db.problem.findUnique({
    where: { id },
    include: {
      testCases: { orderBy: { orderIndex: "asc" } },
      examples: { orderBy: { orderIndex: "asc" } },
      templates: true,
    },
  });

  if (!problem) return c.json({ error: "Problem not found" }, 404);
  return c.json({ problem });
});

// Create problem manually
app.post("/problems", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  const problem = await db.problem.create({
    data: {
      title: body.title,
      slug: body.slug || body.title.toLowerCase().replace(/\s+/g, "-"),
      difficulty: body.difficulty,
      status: body.status || "draft",
      description: body.description,
      constraints: body.constraints,
      inputFormat: body.inputFormat,
      outputFormat: body.outputFormat,
      hints: body.hints || [],
      tags: body.tags || [],
      company: body.company || [],
      timeLimit: body.timeLimit || 1000,
      memoryLimit: body.memoryLimit || 256,
      authorId: user.id,
      examples: {
        create: (body.examples || []).map((e: any, i: number) => ({
          input: e.input,
          output: e.output,
          explanation: e.explanation,
          orderIndex: i,
        })),
      },
      testCases: {
        create: (body.testCases || []).map((t: any, i: number) => ({
          input: t.input,
          expectedOutput: t.expectedOutput,
          isHidden: t.isHidden ?? true,
          orderIndex: i,
        })),
      },
      templates: {
        create: (body.templates || []).map((t: any) => ({
          language: t.language,
          code: t.code,
        })),
      },
    },
  });

  return c.json({ problem });
});

// Update problem
app.put("/problems/:id", async (c) => {
  const id = parseInt(c.req.param("id")!);
  const body = await c.req.json();

  const problem = await db.problem.update({
    where: { id },
    data: {
      title: body.title,
      difficulty: body.difficulty,
      status: body.status,
      description: body.description,
      constraints: body.constraints,
      inputFormat: body.inputFormat,
      outputFormat: body.outputFormat,
      hints: body.hints || [],
      tags: body.tags || [],
      company: body.company || [],
      timeLimit: body.timeLimit,
      memoryLimit: body.memoryLimit,
    },
  });

  return c.json({ problem });
});

// Publish problem
app.post("/problems/:id/publish", async (c) => {
  const id = parseInt(c.req.param("id")!);

  const problem = await db.problem.update({
    where: { id },
    data: { status: "published" },
  });

  return c.json({ problem });
});

// Delete problem
app.delete("/problems/:id", async (c) => {
  const id = parseInt(c.req.param("id")!);

  await db.problem.delete({ where: { id } });

  return c.json({ success: true });
});

// AI generate problem
app.post("/problems/generate", async (c) => {
  const body = await c.req.json();

  const prompt = `You are an expert competitive programming problem setter. Generate a complete coding problem based on these specs:
Topic: ${body.topic}
Difficulty: ${body.difficulty}
Tags: ${body.tags || "any"}
IMPORTANT: In the templates.code field, provide ONLY empty starter code with comments like "// your code here". Do NOT provide the actual solution. The templates are just scaffolding for the user to fill in.
Respond with ONLY valid JSON, no markdown, no extra text:
{
  "title": "Problem Title",
  "slug": "problem-slug",
  "description": "Full problem description with clear explanation",
  "constraints": "List of constraints",
  "inputFormat": "Description of input format",
  "outputFormat": "Description of output format",
  "hints": ["hint 1", "hint 2"],
  "tags": ["tag1", "tag2"],
  "examples": [
    { "input": "example input", "output": "example output", "explanation": "why this output" }
  ],
  "testCases": [
    { "input": "test input 1", "expectedOutput": "expected output 1", "isHidden": false },
    { "input": "test input 2", "expectedOutput": "expected output 2", "isHidden": true },
    { "input": "test input 3", "expectedOutput": "expected output 3", "isHidden": true }
  ],
  "templates": [
    { "language": "JAVASCRIPT", "code": "function solution() {\n  // your code here\n}" },
    { "language": "PYTHON", "code": "def solution():\n    # your code here\n    pass" }
  ]
    
}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

const raw = completion.choices[0]?.message?.content || "{}";

// Remove markdown code fences
let cleaned = raw.replace(/```json\n?|```/g, "").trim();

// Replace actual newlines inside JSON string values with \n
// This fixes Groq's habit of putting real newlines in code strings
cleaned = cleaned.replace(
  /("code"\s*:\s*")([\s\S]*?)("(?:\s*[,}\]]))/g,
  (_, prefix, code, suffix) => {
    const escaped = code
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
    return prefix + escaped + suffix;
  }
);

try {
  const generated = JSON.parse(cleaned);
  return c.json({ generated });
} catch (e) {
  console.error("Parse error:", e);
  console.error("Cleaned:", cleaned);
  return c.json({ error: "Failed to parse AI response" }, 500);
}
});

export default app;