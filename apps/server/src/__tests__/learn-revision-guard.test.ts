import { describe, it, expect, mock } from "bun:test";
import {
  getAuthoritativeRecallFilter,
  isQuestionEligibleForRevision,
} from "../lib/learn-revision-guard";

describe("Learn Revision Guard & Non-Mixing Compatibility", () => {
  it("selects revision-bound questions when current published revision has bound questions", async () => {
    const mockDb = {
      learnRecallQuestion: {
        count: mock(async () => 3),
      },
    };

    const filter = await getAuthoritativeRecallFilter(
      { id: "c1", publishedRevisionId: "rev-2" },
      mockDb
    );

    expect(filter.conceptId).toBe("c1");
    expect(filter.revisionId).toBe("rev-2");
    expect(filter.isPublished).toBe(true);
  });

  it("falls back to legacy null revisionId only when published revision has no bound questions", async () => {
    const mockDb = {
      learnRecallQuestion: {
        count: mock(async () => 0),
      },
    };

    const filter = await getAuthoritativeRecallFilter(
      { id: "c1", publishedRevisionId: "rev-1" },
      mockDb
    );

    expect(filter.conceptId).toBe("c1");
    expect(filter.revisionId).toBeNull();
    expect(filter.isPublished).toBe(true);
  });

  it("strictly rejects legacy null question if current revision has bound questions", () => {
    const concept = { id: "c1", publishedRevisionId: "rev-2" };
    const eligibility = { conceptId: "c1", revisionId: "rev-2", isPublished: true };

    // Legacy unversioned question
    const legacyQuestion = { conceptId: "c1", revisionId: null, isPublished: true };
    const res = isQuestionEligibleForRevision(legacyQuestion, concept, eligibility);
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain("does not belong to the current published revision");
  });

  it("strictly rejects questions from older or other revisions", () => {
    const concept = { id: "c1", publishedRevisionId: "rev-2" };
    const eligibility = { conceptId: "c1", revisionId: "rev-2", isPublished: true };

    const oldRevisionQuestion = { conceptId: "c1", revisionId: "rev-1", isPublished: true };
    const res = isQuestionEligibleForRevision(oldRevisionQuestion, concept, eligibility);
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain("does not belong to the current published revision");
  });

  it("accepts matching revision-bound question", () => {
    const concept = { id: "c1", publishedRevisionId: "rev-2" };
    const eligibility = { conceptId: "c1", revisionId: "rev-2", isPublished: true };

    const validQuestion = { conceptId: "c1", revisionId: "rev-2", isPublished: true };
    const res = isQuestionEligibleForRevision(validQuestion, concept, eligibility);
    expect(res.eligible).toBe(true);
  });

  it("accepts legacy null question when concept has no bound questions for revision", () => {
    const concept = { id: "c1", publishedRevisionId: "rev-1" };
    const eligibility = { conceptId: "c1", revisionId: null, isPublished: true };

    const legacyQuestion = { conceptId: "c1", revisionId: null, isPublished: true };
    const res = isQuestionEligibleForRevision(legacyQuestion, concept, eligibility);
    expect(res.eligible).toBe(true);
  });

  it("rejects questions belonging to a different concept or unpublished questions", () => {
    const concept = { id: "c1", publishedRevisionId: "rev-2" };
    const eligibility = { conceptId: "c1", revisionId: "rev-2", isPublished: true };

    const foreignQuestion = { conceptId: "c99", revisionId: "rev-2", isPublished: true };
    expect(isQuestionEligibleForRevision(foreignQuestion, concept, eligibility).eligible).toBe(false);

    const unpublishedQuestion = { conceptId: "c1", revisionId: "rev-2", isPublished: false };
    expect(isQuestionEligibleForRevision(unpublishedQuestion, concept, eligibility).eligible).toBe(false);
  });
});
