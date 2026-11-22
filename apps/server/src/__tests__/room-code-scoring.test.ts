import { beforeEach, describe, expect, it, mock } from "bun:test";
import { applyRoomCodeSubmission } from "../routes/rooms";

describe("Phase 2C.2: transactional room coding scores", () => {
  const submittedAt = new Date("2026-11-22T10:15:00.000Z");
  const baseInput = {
    code: "CODE2C",
    userId: "code-user",
    problemId: 42,
    sourceCode: "return 42;",
    language: "JAVASCRIPT",
    submittedAt,
  };

  let state: any;
  let client: any;
  let transactionOptions: any[];

  beforeEach(() => {
    mock.restore();
    state = { score: 0, solvedCount: 0, penaltyTime: 0, submissions: [] as any[] };
    transactionOptions = [];

    const tx = {
      room: {
        findUnique: mock(async () => ({
          id: "room-code-2c",
          code: baseInput.code,
          status: "ACTIVE",
          startTime: new Date("2026-11-22T10:00:00.000Z"),
          endTime: new Date("2026-11-22T11:00:00.000Z"),
          participants: [{ id: "participant-code", userId: baseInput.userId }],
          questions: [{
            id: "room-problem-42",
            points: 100,
            problem: { id: 42, title: "Concurrent Score" },
          }],
        })),
      },
      roomSubmission: {
        findFirst: mock(async () =>
          state.submissions.find((submission: any) => submission.verdict === "ACCEPTED") ?? null
        ),
        count: mock(async () =>
          state.submissions.filter((submission: any) => submission.verdict !== "ACCEPTED").length
        ),
        create: mock(async ({ data }: any) => {
          const submission = { id: `room-sub-${state.submissions.length + 1}`, ...data };
          state.submissions.push(submission);
          return submission;
        }),
      },
      roomParticipant: {
        update: mock(async ({ data }: any) => {
          state.score += data.score.increment;
          state.solvedCount += data.solvedCount.increment;
          state.penaltyTime += data.penaltyTime.increment;
          return { ...state };
        }),
      },
    };

    let transactionTail = Promise.resolve();
    client = {
      $transaction: mock(async (action: any, options: any) => {
        transactionOptions.push(options);
        const previous = transactionTail;
        let release!: () => void;
        transactionTail = new Promise<void>((resolve) => { release = resolve; });
        await previous;
        try {
          return await action(tx);
        } finally {
          release();
        }
      }),
    };
  });

  it("awards concurrent accepted submissions exactly once", async () => {
    const judgeResult = { verdict: "ACCEPTED", runtime: 25, memory: 1024 };
    const [first, second] = await Promise.all([
      applyRoomCodeSubmission({ ...baseInput, judgeResult }, client),
      applyRoomCodeSubmission({ ...baseInput, judgeResult }, client),
    ]);

    expect([first.pointsAwarded, second.pointsAwarded].sort((a, b) => b - a)).toEqual([100, 0]);
    expect([first.isFirstSolve, second.isFirstSolve].sort()).toEqual([false, true]);
    expect(state.score).toBe(100);
    expect(state.solvedCount).toBe(1);
    expect(state.penaltyTime).toBe(15);
    expect(state.submissions).toHaveLength(2);
    expect(transactionOptions.every((options) => options.isolationLevel === "Serializable")).toBe(true);
  });

  it("records failed attempts without changing standings", async () => {
    const failedResult = { verdict: "WRONG_ANSWER", runtime: 18, memory: 900 };
    await applyRoomCodeSubmission({ ...baseInput, judgeResult: failedResult }, client);
    await applyRoomCodeSubmission({ ...baseInput, judgeResult: failedResult }, client);

    expect(state.submissions).toHaveLength(2);
    expect(state.submissions.every((submission: any) => submission.pointsAwarded === 0)).toBe(true);
    expect(state.score).toBe(0);
    expect(state.solvedCount).toBe(0);
    expect(state.penaltyTime).toBe(0);
  });

  it("counts prior failures once when calculating first-solve penalty", async () => {
    await applyRoomCodeSubmission({
      ...baseInput,
      judgeResult: { verdict: "WRONG_ANSWER", runtime: 20, memory: 950 },
    }, client);
    const accepted = await applyRoomCodeSubmission({
      ...baseInput,
      judgeResult: { verdict: "ACCEPTED", runtime: 15, memory: 850 },
    }, client);

    expect(accepted.isFirstSolve).toBe(true);
    expect(accepted.pointsAwarded).toBe(100);
    expect(accepted.addedPenalty).toBe(25);
    expect(state.penaltyTime).toBe(25);
    expect(state.score).toBe(100);
    expect(state.solvedCount).toBe(1);
  });
});
