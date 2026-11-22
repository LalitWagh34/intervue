import { beforeEach, describe, expect, it, mock } from "bun:test";

const claimEvaluation = mock(async () => ({ count: 1 }));
const findEvaluation = mock(async () => ({ attemptCount: 1 }));
const findEvaluationJobs = mock(async () => [] as Array<{ interviewId: string }>);
const findInterview = mock(async () => ({
  id: "interview-1",
  role: "Backend Engineer",
  difficulty: "mid",
  messages: [
    { role: "assistant", content: "Tell me about yourself." },
    { role: "user", content: "I build reliable APIs." },
  ],
}));
const updateEvaluation = mock(async () => ({}));
const updateInterview = mock(async () => ({}));
const createCompletion = mock(async () => ({
  choices: [{
    message: {
      content: JSON.stringify({
        score: 8,
        feedback: "Strong performance.",
        strengths: ["Clear communication"],
        improvements: ["Add more examples"],
        dimensionScores: { technical: 8, communication: 8, problemSolving: 7 },
      }),
    },
  }],
}));

mock.module("@intervue/db", () => ({
  db: {
    evaluation: {
      updateMany: claimEvaluation,
      findUnique: findEvaluation,
      findMany: findEvaluationJobs,
      update: updateEvaluation,
    },
    interview: {
      findUnique: findInterview,
      update: updateInterview,
    },
    // Preserve mutable delegates expected by other files in Bun's shared
    // module-mock process.
    room: {},
    roomParticipant: {},
  },
}));

mock.module("../lib/groq", () => ({
  groq: { chat: { completions: { create: createCompletion } } },
  GROQ_CHAT_MODEL: "test-model",
}));

const { evaluateInterview, recoverEvaluationJobs } = await import("../services/evaluation");

describe("evaluation lifecycle", () => {
  beforeEach(() => {
    claimEvaluation.mockReset();
    claimEvaluation.mockResolvedValue({ count: 1 });
    findEvaluation.mockReset();
    findEvaluation.mockResolvedValue({ attemptCount: 1 });
    findEvaluationJobs.mockReset();
    findEvaluationJobs.mockResolvedValue([]);
    findInterview.mockReset();
    findInterview.mockResolvedValue({
      id: "interview-1",
      role: "Backend Engineer",
      difficulty: "mid",
      messages: [
        { role: "assistant", content: "Tell me about yourself." },
        { role: "user", content: "I build reliable APIs." },
      ],
    });
    updateEvaluation.mockReset();
    updateEvaluation.mockResolvedValue({});
    updateInterview.mockReset();
    updateInterview.mockResolvedValue({});
    createCompletion.mockClear();
  });

  it("does not evaluate when another worker already claimed the job", async () => {
    claimEvaluation.mockResolvedValue({ count: 0 });

    const result = await evaluateInterview("interview-1");

    expect(result).toBeNull();
    expect(findInterview).not.toHaveBeenCalled();
    expect(createCompletion).not.toHaveBeenCalled();
  });

  it("claims a pending job before evaluating and persists the result", async () => {
    const result = await evaluateInterview("interview-1");

    expect(claimEvaluation).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        interviewId: "interview-1",
        attemptCount: { lt: 3 },
      }),
      data: expect.objectContaining({
        status: "processing",
        attemptCount: { increment: 1 },
      }),
    }));
    expect(createCompletion).toHaveBeenCalledTimes(1);
    expect(updateEvaluation).toHaveBeenCalledWith(expect.objectContaining({
      where: { interviewId: "interview-1" },
      data: expect.objectContaining({ status: "completed", score: 8 }),
    }));
    expect(result?.score).toBe(8);
  });

  it("marks a claimed job failed when there is no transcript to score", async () => {
    findInterview.mockResolvedValue({
      id: "interview-1",
      role: "Backend Engineer",
      difficulty: "mid",
      messages: [],
    });

    const result = await evaluateInterview("interview-1");

    expect(result).toBeNull();
    expect(updateEvaluation).toHaveBeenCalledWith({
      where: { interviewId: "interview-1" },
      data: {
        status: "failed",
        attemptCount: 3,
        nextAttemptAt: null,
        lastError: "Interview transcript is empty",
      },
    });
    expect(createCompletion).not.toHaveBeenCalled();
  });

  it("schedules a bounded retry when the provider fails", async () => {
    createCompletion.mockRejectedValueOnce(new Error("provider unavailable"));

    const result = await evaluateInterview("interview-1");

    expect(result).toBeNull();
    expect(updateEvaluation).toHaveBeenCalledWith({
      where: { interviewId: "interview-1" },
      data: {
        status: "failed",
        nextAttemptAt: expect.any(Date),
        lastError: "provider unavailable",
      },
    });
  });

  it("recovers stale processing jobs and dispatches persisted pending work", async () => {
    claimEvaluation
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    findEvaluationJobs.mockResolvedValue([{ interviewId: "interview-1" }]);
    const now = new Date("2026-11-22T09:00:00.000Z");

    const result = await recoverEvaluationJobs(now);

    expect(claimEvaluation.mock.calls[0]?.[0]).toEqual({
      where: {
        status: "processing",
        lastAttemptAt: { lt: new Date("2026-11-22T08:55:00.000Z") },
        attemptCount: { lt: 3 },
      },
      data: { status: "pending" },
    });
    expect(findEvaluationJobs).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }));
    expect(createCompletion).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ recovered: 1, exhausted: 0, dispatched: 1 });
  });
});
