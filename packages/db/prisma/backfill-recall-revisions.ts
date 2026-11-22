import { db, PrismaClient } from "../index";

export interface BackfillSummary {
  dryRun: boolean;
  totalQuestions: number;
  alreadyVersioned: number;
  backfilled: number;
  invalidCount: number;
  invalidDetails: Array<{ questionId: string; conceptId: string; reason: string }>;
}

export async function runBackfillRecallRevisions(options: {
  dryRun?: boolean;
  dbClient?: any;
} = {}): Promise<BackfillSummary> {
  const dryRun = options.dryRun ?? false;
  const prisma = options.dbClient ?? db;

  const totalQuestions = await prisma.learnRecallQuestion.count();
  const alreadyVersioned = await prisma.learnRecallQuestion.count({
    where: { revisionId: { not: null } },
  });

  const legacyQuestions = await prisma.learnRecallQuestion.findMany({
    where: { revisionId: null },
    select: {
      id: true,
      conceptId: true,
      prompt: true,
      orderIndex: true,
    },
  });

  const invalidDetails: Array<{ questionId: string; conceptId: string; reason: string }> = [];
  let backfillCount = 0;

  for (const q of legacyQuestions) {
    const concept = await prisma.learnConcept.findUnique({
      where: { id: q.conceptId },
      select: {
        id: true,
        slug: true,
        publishedRevisionId: true,
        revisions: {
          orderBy: { version: "desc" },
          take: 1,
          select: { id: true, version: true },
        },
      },
    });

    if (!concept) {
      invalidDetails.push({
        questionId: q.id,
        conceptId: q.conceptId,
        reason: "Parent concept does not exist",
      });
      continue;
    }

    const targetRevisionId =
      concept.publishedRevisionId || concept.revisions?.[0]?.id;

    if (!targetRevisionId) {
      invalidDetails.push({
        questionId: q.id,
        conceptId: q.conceptId,
        reason: `Concept '${concept.slug}' has no revisions to bind`,
      });
      continue;
    }

    if (!dryRun) {
      await prisma.learnRecallQuestion.update({
        where: { id: q.id },
        data: { revisionId: targetRevisionId },
      });
    }

    backfillCount++;
  }

  const summary: BackfillSummary = {
    dryRun,
    totalQuestions,
    alreadyVersioned,
    backfilled: backfillCount,
    invalidCount: invalidDetails.length,
    invalidDetails,
  };

  return summary;
}

// Direct CLI execution
if (import.meta.main) {
  const isDryRun = process.argv.includes("--dry-run") || process.env.DRY_RUN === "true";
  console.log(`\n🚀 Starting recall question revision backfill (dryRun: ${isDryRun})...\n`);

  runBackfillRecallRevisions({ dryRun: isDryRun })
    .then((summary) => {
      console.log("=== Backfill Execution Summary ===");
      console.log(`Execution Mode:         ${summary.dryRun ? "DRY RUN (no database writes)" : "LIVE EXECUTION"}`);
      console.log(`Total Questions:        ${summary.totalQuestions}`);
      console.log(`Already Versioned:      ${summary.alreadyVersioned}`);
      console.log(`Backfilled Questions:   ${summary.backfilled}`);
      console.log(`Invalid Questions:      ${summary.invalidCount}`);

      if (summary.invalidDetails.length > 0) {
        console.warn("\n⚠️ Invalid Questions Report:");
        for (const item of summary.invalidDetails) {
          console.warn(`  - Question [${item.questionId}] for Concept [${item.conceptId}]: ${item.reason}`);
        }
      }
      console.log("\n✅ Backfill script completed successfully.\n");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Backfill execution failed:", err);
      process.exit(1);
    });
}
