import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { codeExecutionLimiter, aiReviewLimiter } from "../middleware/rateLimiter";
import { validateBody, runCodeSchema, aiReviewSchema } from "../middleware/validator";
import { idempotency } from "../middleware/idempotency";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";
import { groq, GROQ_CHAT_MODEL } from "../lib/groq";
import { judgeSubmission, runSampleTestCases } from "../services/judge";
import { syncSolutionToGitHub } from "../services/githubSync";
import { judgeSemaphore } from "../lib/semaphore";
import { executionQueue } from "../services/taskQueue";

const app = new Hono<{ Variables: AuthVariables }>();

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

// Run sample test cases (non-authoritative, does not save submission)
app.post("/run", requireAuth, codeExecutionLimiter, validateBody(runCodeSchema), async (c) => {
  try {
    const body = (c as any).get("validatedBody") as { problemId: number; sourceCode: string; language: string };

    const result = await judgeSemaphore.withPermit(async () => {
      return await runSampleTestCases({
        problemId: body.problemId,
        sourceCode: body.sourceCode,
        language: body.language,
      });
    });

    return c.json({
      ...result,
      mode: "run",
    });
  } catch (error) {
    console.error("Run error:", error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to run sample test cases",
      },
      500
    );
  }
});

// Execute code (authoritative submission or sample run depending on mode)
app.post("/execute", requireAuth, codeExecutionLimiter, idempotency(), validateBody(runCodeSchema), async (c) => {
  try {
    const user = c.get("user");
    const body = (c as any).get("validatedBody") as { problemId: number; sourceCode: string; language: string; mode?: string };

    if (body.mode === "run") {
      const result = await judgeSemaphore.withPermit(async () => {
        return await runSampleTestCases({
          problemId: body.problemId,
          sourceCode: body.sourceCode,
          language: body.language,
        });
      });
      return c.json({
        ...result,
        mode: "run",
      });
    }

    const result = await judgeSemaphore.withPermit(async () => {
      return await judgeSubmission({
        userId: user.id,
        problemId: body.problemId,
        sourceCode: body.sourceCode,
        language: body.language,
      });
    });

    return c.json({
      ...result,
      mode: "submit",
    });
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

// Alias for authoritative submission
app.post("/submit", requireAuth, codeExecutionLimiter, validateBody(runCodeSchema), async (c) => {
  try {
    const user = c.get("user");
    const body = (c as any).get("validatedBody") as { problemId: number; sourceCode: string; language: string };

    const result = await judgeSemaphore.withPermit(async () => {
      return await judgeSubmission({
        userId: user.id,
        problemId: body.problemId,
        sourceCode: body.sourceCode,
        language: body.language,
      });
    });

    // If accepted, sync to GitHub in the background!
    if (result.isAccepted) {
      // Find problem title for the commit message
      db.problem.findUnique({ where: { id: body.problemId }, select: { slug: true, title: true } })
        .then(problem => {
          if (problem) {
            syncSolutionToGitHub(
              user.id,
              problem.slug,
              problem.title,
              body.language,
              body.sourceCode
            );
          }
        });
    }

    return c.json({
      ...result,
      mode: "submit",
    });
  } catch (error) {
    console.error("Submit error:", error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process submission",
      },
      500
    );
  }
});

// AI code evaluation
app.post("/evaluate", requireAuth, aiReviewLimiter, validateBody(aiReviewSchema), async (c) => {
  const body = (c as any).get("validatedBody") as { problemTitle: string; problemDescription: string; language: string; sourceCode: string; verdict?: string };

  const prompt = `You are an expert code reviewer. Review this ${body.language} solution for the problem "${body.problemTitle}".

Problem: ${body.problemDescription}

Code:
${body.sourceCode}

Verdict: ${body.verdict || "unknown"}

Give concise feedback in 3-4 sentences covering: time/space complexity, code quality, and one specific improvement suggestion. Be direct and helpful.`;

  const completion = await groq.chat.completions.create({
    model: GROQ_CHAT_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const feedback = completion.choices[0]?.message?.content || "";
  return c.json({ feedback });
});

// ─── 2.2 Asynchronous Worker Pool & Task Queue Endpoints ─────────────────────

// Producer: Submit code execution task asynchronously (returns HTTP 202 Accepted)
app.post("/jobs", requireAuth, codeExecutionLimiter, idempotency(), validateBody(runCodeSchema), async (c) => {
  const user = c.get("user");
  const body = (c as any).get("validatedBody") as {
    problemId: number;
    sourceCode: string;
    language: string;
    mode?: "run" | "submit";
    roomCode?: string;
  };

  const job = executionQueue.enqueue({
    type: body.mode === "run" ? "RUN" : "SUBMIT",
    userId: user.id,
    problemId: body.problemId,
    sourceCode: body.sourceCode,
    language: body.language,
    roomCode: body.roomCode,
  });

  return c.json(
    {
      jobId: job.id,
      status: job.status,
      type: job.type,
      queuePosition: executionQueue.getQueuePosition(job.id),
      pollUrl: `/api/code/jobs/${job.id}`,
      createdAt: job.createdAt,
      message: "Submission accepted and queued for asynchronous background execution.",
    },
    202
  );
});

// Consumer Inspector: Poll status & result of an asynchronous execution job
app.get("/jobs/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Job ID parameter is required." }, 400);
  }
  const job = executionQueue.getJob(id);

  if (!job) {
    return c.json({ error: `Job with ID '${id}' was not found or has expired.` }, 404);
  }

  const queuePosition = job.status === "QUEUED" ? executionQueue.getQueuePosition(job.id) : 0;

  return c.json({
    id: job.id,
    status: job.status,
    type: job.type,
    queuePosition,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    durationMs: job.durationMs,
    result: job.result,
    error: job.error,
  });
});

// 2.4 Cancellation: Abort in-flight or queued background execution job
app.delete("/jobs/:id", requireAuth, async (c) => {
  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Job ID parameter is required." }, 400);
  }

  const success = executionQueue.cancelJob(id, "Cancelled by user request");
  if (!success) {
    const job = executionQueue.getJob(id);
    if (!job) {
      return c.json({ error: `Job with ID '${id}' was not found.` }, 404);
    }
    return c.json({ message: `Job is already in status '${job.status}'.`, status: job.status }, 400);
  }

  return c.json({
    message: "Execution job cancelled successfully.",
    jobId: id,
    status: "CANCELLED",
  });
});

// Observability: Current Queue Depth and Semaphore Permit Statistics
app.get("/queue-stats", requireAuth, async (c) => {
  return c.json({
    queue: executionQueue.getStats(),
    semaphore: judgeSemaphore.getStats(),
    timestamp: Date.now(),
  });
});

export default app;