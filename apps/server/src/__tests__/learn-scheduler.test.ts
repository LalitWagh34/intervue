import { describe, it, expect } from "bun:test";
import {
  calculateSpacedSchedule,
  PASS_THRESHOLD,
  STAGE_DAYS,
  type ProgressSnapshot,
} from "../lib/learn-scheduler";

describe("Learn Spaced Scheduler", () => {
  const baseTime = new Date("2026-11-18T10:00:00Z");
  const ONE_DAY = 24 * 60 * 60 * 1000;

  it("handles first completed recall: remains stage 0 and schedules +1 day", () => {
    // Null progress (brand new user)
    const resultPass = calculateSpacedSchedule(null, 0.8, baseTime);
    expect(resultPass.isScheduledReview).toBe(true);
    expect(resultPass.stageBefore).toBe(0);
    expect(resultPass.stageAfter).toBe(0);
    expect(resultPass.newStatus).toBe("STUDIED");
    expect(resultPass.nextReviewAt?.getTime()).toBe(baseTime.getTime() + 1 * ONE_DAY);

    // Initial progress with 0 attempts and null nextReviewAt
    const zeroProgress: ProgressSnapshot = {
      status: "NOT_STARTED",
      reviewStage: 0,
      nextReviewAt: null,
      recallAttempts: 0,
      recallCorrect: 0,
    };
    const resultFail = calculateSpacedSchedule(zeroProgress, 0.5, baseTime);
    expect(resultFail.isScheduledReview).toBe(true);
    expect(resultFail.stageBefore).toBe(0);
    expect(resultFail.stageAfter).toBe(0);
    expect(resultFail.newStatus).toBe("NEEDS_REVISION");
    expect(resultFail.nextReviewAt?.getTime()).toBe(baseTime.getTime() + 1 * ONE_DAY);
  });

  it("advances through stages on due passes", () => {
    // Due at Stage 0 -> Stage 1 (+3 days)
    const stage0Due: ProgressSnapshot = {
      status: "STUDIED",
      reviewStage: 0,
      nextReviewAt: new Date(baseTime.getTime() - 1000), // in the past = due
      recallAttempts: 3,
      recallCorrect: 3,
    };
    const res0 = calculateSpacedSchedule(stage0Due, 0.75, baseTime);
    expect(res0.isScheduledReview).toBe(true);
    expect(res0.stageBefore).toBe(0);
    expect(res0.stageAfter).toBe(1);
    expect(res0.newStatus).toBe("CONFIDENT");
    expect(res0.nextReviewAt?.getTime()).toBe(baseTime.getTime() + 3 * ONE_DAY);

    // Due at Stage 1 -> Stage 2 (+7 days)
    const stage1Due: ProgressSnapshot = {
      status: "CONFIDENT",
      reviewStage: 1,
      nextReviewAt: new Date(baseTime.getTime() - 1000),
      recallAttempts: 6,
      recallCorrect: 5,
    };
    const res1 = calculateSpacedSchedule(stage1Due, 0.8, baseTime);
    expect(res1.stageBefore).toBe(1);
    expect(res1.stageAfter).toBe(2);
    expect(res1.newStatus).toBe("CONFIDENT");
    expect(res1.nextReviewAt?.getTime()).toBe(baseTime.getTime() + 7 * ONE_DAY);

    // Due at Stage 2 -> Stage 3 (+14 days, DEMONSTRATED_UNDERSTANDING)
    const stage2Due: ProgressSnapshot = {
      status: "CONFIDENT",
      reviewStage: 2,
      nextReviewAt: new Date(baseTime.getTime() - 1000),
      recallAttempts: 9,
      recallCorrect: 8,
    };
    const res2 = calculateSpacedSchedule(stage2Due, 0.9, baseTime);
    expect(res2.stageBefore).toBe(2);
    expect(res2.stageAfter).toBe(3);
    expect(res2.newStatus).toBe("DEMONSTRATED_UNDERSTANDING");
    expect(res2.nextReviewAt?.getTime()).toBe(baseTime.getTime() + 14 * ONE_DAY);

    // Due at Stage 3 -> Stage 4 (+30 days)
    const stage3Due: ProgressSnapshot = {
      status: "DEMONSTRATED_UNDERSTANDING",
      reviewStage: 3,
      nextReviewAt: new Date(baseTime.getTime() - 1000),
      recallAttempts: 12,
      recallCorrect: 11,
    };
    const res3 = calculateSpacedSchedule(stage3Due, 1.0, baseTime);
    expect(res3.stageBefore).toBe(3);
    expect(res3.stageAfter).toBe(4);
    expect(res3.newStatus).toBe("DEMONSTRATED_UNDERSTANDING");
    expect(res3.nextReviewAt?.getTime()).toBe(baseTime.getTime() + 30 * ONE_DAY);

    // Due at Stage 4 -> caps at Stage 4 (+30 days)
    const stage4Due: ProgressSnapshot = {
      status: "DEMONSTRATED_UNDERSTANDING",
      reviewStage: 4,
      nextReviewAt: new Date(baseTime.getTime() - 1000),
      recallAttempts: 15,
      recallCorrect: 14,
    };
    const res4 = calculateSpacedSchedule(stage4Due, 1.0, baseTime);
    expect(res4.stageBefore).toBe(4);
    expect(res4.stageAfter).toBe(4);
    expect(res4.newStatus).toBe("DEMONSTRATED_UNDERSTANDING");
    expect(res4.nextReviewAt?.getTime()).toBe(baseTime.getTime() + 30 * ONE_DAY);
  });

  it("resets stage to 0 and schedules +1 day on due failure (< 70%)", () => {
    const stage3Due: ProgressSnapshot = {
      status: "DEMONSTRATED_UNDERSTANDING",
      reviewStage: 3,
      nextReviewAt: new Date(baseTime.getTime() - 5000),
      recallAttempts: 12,
      recallCorrect: 11,
    };
    const resFail = calculateSpacedSchedule(stage3Due, 0.5, baseTime);
    expect(resFail.isScheduledReview).toBe(true);
    expect(resFail.stageBefore).toBe(3);
    expect(resFail.stageAfter).toBe(0);
    expect(resFail.newStatus).toBe("NEEDS_REVISION");
    expect(resFail.nextReviewAt?.getTime()).toBe(baseTime.getTime() + 1 * ONE_DAY);
  });

  it("treats NEEDS_REVISION status as due even if nextReviewAt is slightly in future", () => {
    const needsRevisionProgress: ProgressSnapshot = {
      status: "NEEDS_REVISION",
      reviewStage: 0,
      nextReviewAt: new Date(baseTime.getTime() + 10000),
      recallAttempts: 5,
      recallCorrect: 2,
    };
    const res = calculateSpacedSchedule(needsRevisionProgress, 0.8, baseTime);
    expect(res.isScheduledReview).toBe(true);
    expect(res.stageBefore).toBe(0);
    expect(res.stageAfter).toBe(1);
    expect(res.newStatus).toBe("CONFIDENT");
    expect(res.nextReviewAt?.getTime()).toBe(baseTime.getTime() + 3 * ONE_DAY);
  });

  it("preserves schedule, stage, and status during early casual practice", () => {
    const futureDate = new Date(baseTime.getTime() + 5 * ONE_DAY);
    const inFlightProgress: ProgressSnapshot = {
      status: "CONFIDENT",
      reviewStage: 2,
      nextReviewAt: futureDate,
      recallAttempts: 10,
      recallCorrect: 9,
    };

    const resCasual = calculateSpacedSchedule(inFlightProgress, 1.0, baseTime);
    expect(resCasual.isScheduledReview).toBe(false);
    expect(resCasual.stageBefore).toBe(2);
    expect(resCasual.stageAfter).toBe(2);
    expect(resCasual.newStatus).toBe("CONFIDENT");
    expect(resCasual.nextReviewAt?.getTime()).toBe(futureDate.getTime());
  });
});
