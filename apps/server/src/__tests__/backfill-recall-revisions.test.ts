import { describe, it, expect, mock } from "bun:test";
import { runBackfillRecallRevisions } from "../../../../packages/db/prisma/backfill-recall-revisions";

describe("Recall Question Revision Backfill", () => {
  it("performs idempotent dry run without writing to database", async () => {
    const mockUpdate = mock(async () => ({}));
    const mockDb = {
      learnRecallQuestion: {
        count: mock(async (opts?: any) => (opts?.where ? 5 : 8)),
        findMany: mock(async () => [
          { id: "q1", conceptId: "c1", prompt: "Q1", orderIndex: 1 },
          { id: "q2", conceptId: "c1", prompt: "Q2", orderIndex: 2 },
          { id: "q3", conceptId: "c2", prompt: "Q3", orderIndex: 1 },
        ]),
        update: mockUpdate,
      },
      learnConcept: {
        findUnique: mock(async ({ where }: any) => {
          if (where.id === "c1") {
            return { id: "c1", slug: "two-pointers", publishedRevisionId: "rev-1", revisions: [{ id: "rev-1" }] };
          }
          if (where.id === "c2") {
            return { id: "c2", slug: "sliding-window", publishedRevisionId: "rev-2", revisions: [{ id: "rev-2" }] };
          }
          return null;
        }),
      },
    };

    const summary = await runBackfillRecallRevisions({ dryRun: true, dbClient: mockDb });

    expect(summary.dryRun).toBe(true);
    expect(summary.totalQuestions).toBe(8);
    expect(summary.alreadyVersioned).toBe(5);
    expect(summary.backfilled).toBe(3);
    expect(summary.invalidCount).toBe(0);
    // Crucial: update must NEVER be called in dry-run mode
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("updates questions in live mode using publishedRevisionId", async () => {
    const mockUpdate = mock(async () => ({}));
    const mockDb = {
      learnRecallQuestion: {
        count: mock(async (opts?: any) => (opts?.where ? 2 : 3)),
        findMany: mock(async () => [
          { id: "q-legacy", conceptId: "c1", prompt: "Legacy Q", orderIndex: 1 },
        ]),
        update: mockUpdate,
      },
      learnConcept: {
        findUnique: mock(async () => ({
          id: "c1",
          slug: "two-pointers",
          publishedRevisionId: "rev-pub-10",
          revisions: [{ id: "rev-pub-10" }],
        })),
      },
    };

    const summary = await runBackfillRecallRevisions({ dryRun: false, dbClient: mockDb });

    expect(summary.dryRun).toBe(false);
    expect(summary.backfilled).toBe(1);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "q-legacy" },
      data: { revisionId: "rev-pub-10" },
    });
  });

  it("reports invalid rows when concept has no revisions or does not exist", async () => {
    const mockUpdate = mock(async () => ({}));
    const mockDb = {
      learnRecallQuestion: {
        count: mock(async () => 2),
        findMany: mock(async () => [
          { id: "q-orphaned", conceptId: "c-missing", prompt: "Orphaned", orderIndex: 1 },
          { id: "q-no-rev", conceptId: "c-empty", prompt: "No revs", orderIndex: 2 },
        ]),
        update: mockUpdate,
      },
      learnConcept: {
        findUnique: mock(async ({ where }: any) => {
          if (where.id === "c-empty") {
            return { id: "c-empty", slug: "empty-concept", publishedRevisionId: null, revisions: [] };
          }
          return null; // c-missing not found
        }),
      },
    };

    const summary = await runBackfillRecallRevisions({ dryRun: false, dbClient: mockDb });

    expect(summary.backfilled).toBe(0);
    expect(summary.invalidCount).toBe(2);
    expect(summary.invalidDetails[0].reason).toContain("does not exist");
    expect(summary.invalidDetails[1].reason).toContain("no revisions to bind");
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
