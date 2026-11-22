ALTER TABLE "Evaluation"
ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastAttemptAt" TIMESTAMP(3),
ADD COLUMN "nextAttemptAt" TIMESTAMP(3),
ADD COLUMN "lastError" TEXT;

-- Existing failed rows become eligible for one controlled retry after deploy.
UPDATE "Evaluation"
SET "nextAttemptAt" = CURRENT_TIMESTAMP
WHERE "status" = 'failed';

CREATE INDEX "Evaluation_status_nextAttemptAt_idx"
ON "Evaluation"("status", "nextAttemptAt");

CREATE INDEX "Evaluation_status_lastAttemptAt_idx"
ON "Evaluation"("status", "lastAttemptAt");
