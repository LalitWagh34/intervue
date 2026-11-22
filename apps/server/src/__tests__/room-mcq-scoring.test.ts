import { beforeEach, describe, expect, it, mock } from "bun:test";
import { applyRoomMcqAnswer } from "../routes/rooms";

describe("Phase 2C.1: transactional room MCQ scoring", () => {
  const input = { code: "MCQ2C1", userId: "mcq-user", questionId: "question-1", selectedOption: 2 };
  let state: any;
  let transactionOptions: any[];
  let client: any;
  let baseTransaction: (action: (tx: any) => Promise<any>, options: any) => Promise<any>;

  beforeEach(() => {
    mock.restore();
    state = { score: 0, solvedCount: 0, answer: null };
    transactionOptions = [];

    const tx = {
      room: {
        findUnique: mock(async ({ include }: any) => {
          const requestedQuestionId = include.questions.where.assessmentQuestionId;
          return {
            id: "room-mcq-2c1",
            code: input.code,
            status: "ACTIVE",
            endTime: new Date(Date.now() + 60_000),
            participants: [{ id: "participant-mcq", userId: input.userId }],
            questions: requestedQuestionId === input.questionId
              ? [{
                  id: "room-question-1",
                  assessmentQuestionId: input.questionId,
                  assessmentQuestion: {
                    id: input.questionId,
                    correctOption: 2,
                    subject: "Operating Systems",
                    topic: "Processes",
                  },
                }]
              : [],
          };
        }),
      },
      roomMcqAnswer: {
        findUnique: mock(async () => state.answer ? { ...state.answer } : null),
        create: mock(async ({ data }: any) => {
          state.answer = { id: "answer-1", ...data };
          return state.answer;
        }),
        update: mock(async ({ data }: any) => {
          state.answer = { ...state.answer, ...data };
          return state.answer;
        }),
      },
      roomParticipant: {
        update: mock(async ({ data }: any) => {
          state.score += data.score.increment;
          state.solvedCount += data.solvedCount.increment;
          return { id: "participant-mcq", score: state.score, solvedCount: state.solvedCount };
        }),
      },
    };

    let transactionTail = Promise.resolve();
    baseTransaction = async (action, options) => {
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
    };
    client = { $transaction: mock(baseTransaction) };
  });

  it("awards one score change for two concurrent identical first answers", async () => {
    const [first, second] = await Promise.all([
      applyRoomMcqAnswer(input, client),
      applyRoomMcqAnswer(input, client),
    ]);

    expect(first.updatedParticipant.score).toBe(4);
    expect(second.updatedParticipant.score).toBe(4);
    expect(state.score).toBe(4);
    expect(state.solvedCount).toBe(1);
    expect(state.answer.pointsAwarded).toBe(4);
    expect(transactionOptions).toHaveLength(2);
    expect(transactionOptions.every((options) => options.isolationLevel === "Serializable")).toBe(true);
  });

  it("applies the answer replacement delta once under concurrent correction", async () => {
    state.score = -1;
    state.answer = { id: "answer-1", selectedOption: 0, isCorrect: false, pointsAwarded: -1 };

    await Promise.all([
      applyRoomMcqAnswer(input, client),
      applyRoomMcqAnswer(input, client),
    ]);

    expect(state.score).toBe(4);
    expect(state.solvedCount).toBe(1);
  });

  it("rejects an assessment question that is not assigned to the room", async () => {
    await expect(
      applyRoomMcqAnswer({ ...input, questionId: "foreign-question" }, client)
    ).rejects.toMatchObject({ statusCode: 400, errorCode: "BAD_REQUEST" });

    expect(state.answer).toBeNull();
    expect(state.score).toBe(0);
    expect(state.solvedCount).toBe(0);
  });

  it("retries a serialization conflict before applying the score", async () => {
    let attempts = 0;
    client.$transaction = mock(async (action: any, options: any) => {
      attempts++;
      if (attempts === 1) {
        const conflict: any = new Error("Transaction failed due to serialization conflict");
        conflict.code = "P2034";
        throw conflict;
      }
      return baseTransaction(action, options);
    });

    const result = await applyRoomMcqAnswer(input, client);

    expect(result.updatedParticipant.score).toBe(4);
    expect(attempts).toBe(2);
    expect(state.score).toBe(4);
    expect(state.solvedCount).toBe(1);
  });
});
