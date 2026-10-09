import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";
import { groq, GROQ_CHAT_MODEL } from "../lib/groq";

const app = new Hono<{ Variables: AuthVariables }>();

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
    model: GROQ_CHAT_MODEL,
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

// ─── Platform Overview Stats ───────────────────────────────────────────
app.get("/stats", async (c) => {
  const [
    totalUsers,
    totalProblems,
    totalMcqs,
    totalRooms,
    totalSubmissions,
    totalInterviews,
    totalNotes,
    totalBookmarks,
  ] = await Promise.all([
    db.user.count(),
    db.problem.count(),
    db.assessmentQuestion.count(),
    db.room.count(),
    db.submission.count(),
    db.interview.count(),
    db.userQuestionNote.count(),
    db.userBookmark.count(),
  ]);

  const activeRooms = await db.room.count({ where: { status: "ACTIVE" } });
  const memoryUsage = process.memoryUsage();

  return c.json({
    stats: {
      totalUsers,
      totalProblems,
      totalMcqs,
      totalRooms,
      activeRooms,
      totalSubmissions,
      totalInterviews,
      totalNotes,
      totalBookmarks,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryRssMb: Math.round(memoryUsage.rss / 1024 / 1024),
    },
  });
});

// ─── User Management ───────────────────────────────────────────────────
app.get("/users", async (c) => {
  const query = c.req.query("search")?.trim() || "";
  const users = await db.user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      profile: {
        select: {
          points: true,
          streakCount: true,
          totalReferrals: true,
          referralCode: true,
          targetCompany: true,
          leetcodeHandle: true,
          codeforcesHandle: true,
        },
      },
      _count: {
        select: {
          solvedProblems: true,
          submissions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return c.json({ users });
});

app.put("/users/:id/role", async (c) => {
  const id = c.req.param("id");
  const { role } = await c.req.json();
  if (role !== "admin" && role !== "user") {
    return c.json({ error: "Invalid role" }, 400);
  }
  const updated = await db.user.update({
    where: { id },
    data: { role },
    select: { id: true, role: true },
  });
  return c.json({ success: true, user: updated });
});

app.put("/users/:id/points", async (c) => {
  const id = c.req.param("id");
  const { points, streakCount } = await c.req.json();
  const data: any = {};
  if (typeof points === "number") data.points = Math.max(0, points);
  if (typeof streakCount === "number") data.streakCount = Math.max(0, streakCount);

  await db.profile.upsert({
    where: { userId: id },
    create: { userId: id, ...data },
    update: data,
  });
  return c.json({ success: true });
});

app.delete("/users/:id", async (c) => {
  const id = c.req.param("id");
  const user = c.get("user");
  if (id === user.id) {
    return c.json({ error: "Cannot delete your own admin account" }, 400);
  }
  await db.user.delete({ where: { id } });
  return c.json({ success: true });
});

// ─── MCQ Assessment Question Bank ──────────────────────────────────────
app.get("/mcqs", async (c) => {
  const category = c.req.query("category");
  const subject = c.req.query("subject");
  const search = c.req.query("search")?.trim();

  const where: any = {};
  if (category && category !== "ALL") where.category = category;
  if (subject && subject !== "ALL") where.subject = subject;
  if (search) where.question = { contains: search, mode: "insensitive" };

  const mcqs = await db.assessmentQuestion.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return c.json({ mcqs });
});

app.post("/mcqs", async (c) => {
  const body = await c.req.json();
  const { category, subject, topic, difficulty, question, options, correctOption, explanation } = body;

  const mcq = await db.assessmentQuestion.create({
    data: {
      category: category || "CORE_CS",
      subject: subject || "DBMS",
      topic: topic || "General",
      difficulty: difficulty || "MEDIUM",
      question,
      options: options || [],
      correctOption: parseInt(correctOption ?? 0),
      explanation: explanation || "",
    },
  });

  return c.json({ mcq });
});

app.delete("/mcqs/:id", async (c) => {
  const id = c.req.param("id");
  await db.assessmentQuestion.delete({ where: { id } });
  return c.json({ success: true });
});

// ─── Contest Rooms Monitor ─────────────────────────────────────────────
app.get("/rooms", async (c) => {
  const rooms = await db.room.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      host: { select: { id: true, name: true, email: true } },
      _count: { select: { participants: true, questions: true } },
    },
    take: 40,
  });

  return c.json({ rooms });
});

app.post("/rooms/:id/terminate", async (c) => {
  const id = c.req.param("id");
  await db.room.update({
    where: { id },
    data: { status: "FINISHED" },
  });
  return c.json({ success: true });
});

// ─── Mock Interviews Surveillance ──────────────────────────────────────
app.get("/interviews", async (c) => {
  const search = c.req.query("search")?.trim();
  const where: any = {};
  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { role: { contains: search, mode: "insensitive" } },
    ];
  }

  const interviews = await db.interview.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      evaluation: { select: { score: true, feedback: true, strengths: true, improvements: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return c.json({ interviews });
});

app.delete("/interviews/:id", async (c) => {
  const id = c.req.param("id");
  await db.interview.delete({ where: { id } });
  return c.json({ success: true });
});

// ─── Code Submissions & Judge Log ──────────────────────────────────────
app.get("/submissions", async (c) => {
  const verdict = c.req.query("verdict");
  const where: any = {};
  if (verdict && verdict !== "ALL") {
    where.verdict = verdict;
  }

  const submissions = await db.submission.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      problem: { select: { id: true, title: true, slug: true, difficulty: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return c.json({ submissions });
});

export default app;