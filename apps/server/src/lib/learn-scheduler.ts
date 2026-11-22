export const PASS_THRESHOLD = 0.7;

// Spaced Repetition interval steps in days: Stage 0: 1d, Stage 1: 3d, Stage 2: 7d, Stage 3: 14d, Stage 4: 30d
export const STAGE_DAYS = [1, 3, 7, 14, 30] as const;

export type ConceptProgressStatus =
  | "NOT_STARTED"
  | "STUDYING"
  | "STUDIED"
  | "NEEDS_REVISION"
  | "CONFIDENT"
  | "DEMONSTRATED_UNDERSTANDING";

export interface ProgressSnapshot {
  status: ConceptProgressStatus;
  reviewStage: number;
  nextReviewAt: Date | null;
  recallAttempts: number;
  recallCorrect: number;
  lastStudiedAt?: Date | null;
  lastReviewedAt?: Date | null;
}

export interface SchedulingDecision {
  isScheduledReview: boolean;
  stageBefore: number;
  stageAfter: number;
  newStatus: ConceptProgressStatus;
  nextReviewAt: Date | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function calculateSpacedSchedule(
  currentProgress: ProgressSnapshot | null,
  score: number,
  now: Date = new Date()
): SchedulingDecision {
  const isFirstAttempt =
    !currentProgress ||
    (currentProgress.recallAttempts === 0 && currentProgress.nextReviewAt === null);

  // 1. First completed recall session: stay stage 0, schedule +1 day
  if (isFirstAttempt) {
    const isPass = score >= PASS_THRESHOLD;
    return {
      isScheduledReview: true,
      stageBefore: 0,
      stageAfter: 0,
      newStatus: isPass ? "STUDIED" : "NEEDS_REVISION",
      nextReviewAt: new Date(now.getTime() + 1 * MS_PER_DAY),
    };
  }

  // 2. Check if a review is currently due
  const isDue =
    (currentProgress.nextReviewAt !== null &&
      new Date(currentProgress.nextReviewAt).getTime() <= now.getTime()) ||
    currentProgress.status === "NEEDS_REVISION";

  const stageBefore = currentProgress.reviewStage ?? 0;

  if (isDue) {
    const isPass = score >= PASS_THRESHOLD;

    if (isPass) {
      // Due pass: advance stage up to 4
      const stageAfter = Math.min(stageBefore + 1, 4);
      const daysToAdd = STAGE_DAYS[stageAfter] ?? 30;
      const nextReviewAt = new Date(now.getTime() + daysToAdd * MS_PER_DAY);
      const newStatus: ConceptProgressStatus =
        stageAfter >= 3 ? "DEMONSTRATED_UNDERSTANDING" : "CONFIDENT";

      return {
        isScheduledReview: true,
        stageBefore,
        stageAfter,
        newStatus,
        nextReviewAt,
      };
    } else {
      // Due failure: reset stage to 0, status NEEDS_REVISION, retry in 1 day
      return {
        isScheduledReview: true,
        stageBefore,
        stageAfter: 0,
        newStatus: "NEEDS_REVISION",
        nextReviewAt: new Date(now.getTime() + 1 * MS_PER_DAY),
      };
    }
  }

  // 3. Early casual practice run (not due yet): preserve stage, status, and scheduled review date
  return {
    isScheduledReview: false,
    stageBefore,
    stageAfter: stageBefore,
    newStatus: currentProgress.status,
    nextReviewAt: currentProgress.nextReviewAt ? new Date(currentProgress.nextReviewAt) : null,
  };
}
