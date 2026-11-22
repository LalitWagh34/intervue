import { db } from "@intervue/db";
import { groq, GROQ_CHAT_MODEL } from "../lib/groq";

const MAX_EVALUATION_ATTEMPTS = 3;
const EVALUATION_RETRY_BASE_MS = 30_000;
const EVALUATION_LEASE_MS = 5 * 60_000;
const EVALUATION_RECOVERY_INTERVAL_MS = 30_000;
const EVALUATION_RECOVERY_BATCH_SIZE = 10;

export async function evaluateInterview(interviewId: string) {
  const claimedAt = new Date();
  const claim = await db.evaluation.updateMany({
    where: {
      interviewId,
      attemptCount: { lt: MAX_EVALUATION_ATTEMPTS },
      OR: [
        { status: "pending" },
        { status: "failed", nextAttemptAt: { lte: claimedAt } },
      ],
    },
    data: {
      status: "processing",
      attemptCount: { increment: 1 },
      lastAttemptAt: claimedAt,
      nextAttemptAt: null,
      lastError: null,
    },
  });

  // Another worker already owns the job, or the evaluation is complete.
  if (claim.count !== 1) return null;

  const claimedEvaluation = await db.evaluation.findUnique({
    where: { interviewId },
    select: { attemptCount: true },
  });
  const attemptCount = claimedEvaluation?.attemptCount ?? MAX_EVALUATION_ATTEMPTS;

  const interview = await db.interview.findUnique({
    where: { id: interviewId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!interview || interview.messages.length === 0) {
    await db.evaluation.update({
      where: { interviewId },
      data: {
        status: "failed",
        attemptCount: MAX_EVALUATION_ATTEMPTS,
        nextAttemptAt: null,
        lastError: "Interview transcript is empty",
      },
    });
    return null;
  }

  const transcript = interview.messages
    .map((m) => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
    .join("\n\n");

  const prompt = `You are an expert technical interview evaluator. Below is a transcript of a ${interview.difficulty} level interview for a ${interview.role} position.

TRANSCRIPT:
${transcript}

Evaluate the candidate's performance and respond with ONLY valid JSON in this exact format, no markdown, no extra text:
{
  "score": <number 1-10>,
  "feedback": "<2-3 sentence overall summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "dimensionScores": {
    "technical": <number 1-10>,
    "communication": <number 1-10>,
    "problemSolving": <number 1-10>
  }
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const cleaned = raw.replace(/```json\n?|```/g, "").trim();
    const result = JSON.parse(cleaned);

    await db.evaluation.update({
      where: { interviewId },
      data: {
        status: "completed",
        score: result.score,
        feedback: result.feedback,
        strengths: result.strengths || [],
        improvements: result.improvements || [],
        dimensionScores: result.dimensionScores || {},
        completedAt: new Date(),
        nextAttemptAt: null,
        lastError: null,
      },
    });

    await db.interview.update({
      where: { id: interviewId },
      data: { score: result.score },
    });

    return result;
  } catch (err: any) {
    console.error("Evaluation failed:", err);
    const canRetry = attemptCount < MAX_EVALUATION_ATTEMPTS;
    const retryDelay = EVALUATION_RETRY_BASE_MS * 2 ** Math.max(0, attemptCount - 1);
    await db.evaluation.update({
      where: { interviewId },
      data: {
        status: "failed",
        nextAttemptAt: canRetry ? new Date(Date.now() + retryDelay) : null,
        lastError: String(err?.message || "Evaluation failed").slice(0, 500),
      },
    });
    return null;
  }
}

export async function recoverEvaluationJobs(now = new Date()) {
  const staleBefore = new Date(now.getTime() - EVALUATION_LEASE_MS);

  const recovered = await db.evaluation.updateMany({
    where: {
      status: "processing",
      lastAttemptAt: { lt: staleBefore },
      attemptCount: { lt: MAX_EVALUATION_ATTEMPTS },
    },
    data: { status: "pending" },
  });

  const exhausted = await db.evaluation.updateMany({
    where: {
      status: "processing",
      lastAttemptAt: { lt: staleBefore },
      attemptCount: { gte: MAX_EVALUATION_ATTEMPTS },
    },
    data: {
      status: "failed",
      nextAttemptAt: null,
      lastError: "Evaluation retry limit reached",
    },
  });

  const jobs = await db.evaluation.findMany({
    where: {
      attemptCount: { lt: MAX_EVALUATION_ATTEMPTS },
      OR: [
        { status: "pending" },
        { status: "failed", nextAttemptAt: { lte: now } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: EVALUATION_RECOVERY_BATCH_SIZE,
    select: { interviewId: true },
  });

  await Promise.allSettled(jobs.map(({ interviewId }) => evaluateInterview(interviewId)));
  return { recovered: recovered.count, exhausted: exhausted.count, dispatched: jobs.length };
}

export function startEvaluationRecoveryWorker() {
  const runRecovery = () => {
    recoverEvaluationJobs().catch((error) => {
      console.error("[Evaluation Recovery] Worker cycle failed", error);
    });
  };

  runRecovery();
  const interval = setInterval(runRecovery, EVALUATION_RECOVERY_INTERVAL_MS);
  interval.unref?.();
  return () => clearInterval(interval);
}
