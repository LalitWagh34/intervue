CREATE TYPE "ExecutionJobType" AS ENUM ('RUN', 'SUBMIT');
CREATE TYPE "ExecutionJobStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

CREATE TABLE "ExecutionJob" (
    "id" TEXT NOT NULL,
    "type" "ExecutionJobType" NOT NULL,
    "status" "ExecutionJobStatus" NOT NULL DEFAULT 'QUEUED',
    "userId" TEXT NOT NULL,
    "problemId" INTEGER NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "roomCode" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3),
    "leaseExpiresAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "result" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExecutionJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExecutionJob_status_nextAttemptAt_createdAt_idx" ON "ExecutionJob"("status", "nextAttemptAt", "createdAt");
CREATE INDEX "ExecutionJob_status_leaseExpiresAt_idx" ON "ExecutionJob"("status", "leaseExpiresAt");
CREATE INDEX "ExecutionJob_userId_createdAt_idx" ON "ExecutionJob"("userId", "createdAt");

ALTER TABLE "ExecutionJob" ADD CONSTRAINT "ExecutionJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExecutionJob" ADD CONSTRAINT "ExecutionJob_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Submission" ADD COLUMN "executionJobId" TEXT;
CREATE UNIQUE INDEX "Submission_executionJobId_key" ON "Submission"("executionJobId");
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_executionJobId_fkey" FOREIGN KEY ("executionJobId") REFERENCES "ExecutionJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
