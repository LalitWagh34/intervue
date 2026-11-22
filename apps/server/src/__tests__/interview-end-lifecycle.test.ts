import { beforeEach, describe, expect, it, mock } from "bun:test";

const getSession = mock(async () => ({
  user: { id: "user-1", email: "user@example.com" },
  session: { id: "session-1", userId: "user-1" },
}));
const transitionInterview = mock(async () => ({ count: 1 }));
const findInterview = mock(async () => ({
  id: "interview-1",
  userId: "user-1",
  status: "completed",
}));
const persistEvaluation = mock(async () => ({}));
const retryFindInterview = mock(async () => ({
  id: "interview-1",
  userId: "user-1",
  status: "completed",
  evaluation: { status: "failed" },
}));
const resetEvaluation = mock(async () => ({ count: 1 }));
const evaluateInterview = mock(async () => ({}));

const transactionClient = {
  interview: {
    updateMany: transitionInterview,
    findFirst: findInterview,
  },
  evaluation: { upsert: persistEvaluation },
};

mock.module("../lib/auth", () => ({
  auth: { api: { getSession } },
}));

mock.module("@intervue/db", () => ({
  db: {
    $transaction: (callback: (tx: typeof transactionClient) => unknown) => callback(transactionClient),
    // Keep mutable delegates used by later Bun test files so this module mock
    // does not erase their shared test harness.
    room: {},
    roomParticipant: {},
    interview: { findFirst: retryFindInterview },
    evaluation: { updateMany: resetEvaluation },
  },
}));

mock.module("../services/evaluation", () => ({ evaluateInterview }));
mock.module("../lib/groq", () => ({
  groq: { chat: { completions: { create: mock(async () => ({})) } } },
  GROQ_CHAT_MODEL: "test-model",
  GROQ_FAST_MODEL: "test-fast-model",
}));

const { default: interviewRoutes } = await import("../routes/interview");

describe("PUT /:id/end evaluation lifecycle", () => {
  beforeEach(() => {
    transitionInterview.mockReset();
    transitionInterview.mockResolvedValue({ count: 1 });
    findInterview.mockReset();
    findInterview.mockResolvedValue({ id: "interview-1", userId: "user-1", status: "completed" });
    persistEvaluation.mockReset();
    persistEvaluation.mockResolvedValue({});
    evaluateInterview.mockReset();
    evaluateInterview.mockResolvedValue({});
    retryFindInterview.mockReset();
    retryFindInterview.mockResolvedValue({
      id: "interview-1",
      userId: "user-1",
      status: "completed",
      evaluation: { status: "failed" },
    });
    resetEvaluation.mockReset();
    resetEvaluation.mockResolvedValue({ count: 1 });
  });

  it("persists a pending evaluation before launching scoring", async () => {
    const response = await interviewRoutes.request("/interview-1/end", { method: "PUT" });

    expect(response.status).toBe(200);
    expect(persistEvaluation).toHaveBeenCalledWith({
      where: { interviewId: "interview-1" },
      update: {},
      create: { interviewId: "interview-1", status: "pending" },
    });
    expect(evaluateInterview).toHaveBeenCalledTimes(1);
  });

  it("does not relaunch scoring when ending an already completed interview", async () => {
    transitionInterview.mockResolvedValue({ count: 0 });

    const response = await interviewRoutes.request("/interview-1/end", { method: "PUT" });

    expect(response.status).toBe(200);
    expect(persistEvaluation).not.toHaveBeenCalled();
    expect(evaluateInterview).not.toHaveBeenCalled();
  });

  it("resets a failed evaluation and launches a manual retry", async () => {
    const response = await interviewRoutes.request("/interview-1/evaluation/retry", { method: "POST" });

    expect(response.status).toBe(202);
    expect(resetEvaluation).toHaveBeenCalledWith({
      where: { interviewId: "interview-1", status: "failed" },
      data: {
        status: "pending",
        attemptCount: 0,
        lastAttemptAt: null,
        nextAttemptAt: null,
        lastError: null,
      },
    });
    expect(evaluateInterview).toHaveBeenCalledWith("interview-1");
  });

  it("rejects retry when the evaluation is not failed", async () => {
    retryFindInterview.mockResolvedValue({
      id: "interview-1",
      userId: "user-1",
      status: "completed",
      evaluation: { status: "processing" },
    });

    const response = await interviewRoutes.request("/interview-1/evaluation/retry", { method: "POST" });

    expect(response.status).toBe(409);
    expect(resetEvaluation).not.toHaveBeenCalled();
  });
});
