import { describe, it, expect, vi, beforeEach } from "bun:test";
import * as path from "path";
import {
  validateConceptManifest,
  LearnConceptManifest,
} from "../../../../packages/db/prisma/data/learn/manifest.schema";
import { runImportLearnManifests } from "../../../../packages/db/prisma/import-learn-manifest";

describe("Learn Content Manifest Workflow (Plan 4.2)", () => {
  const validManifest: LearnConceptManifest = {
    moduleSlug: "arrays-patterns",
    slug: "two-pointers",
    orderIndex: 1,
    title: "Two Pointers",
    summary:
      "Replace nested O(n²) loops on sorted arrays, strings, or linked lists with two coordinated indices.",
    difficulty: "FOUNDATION",
    estimatedMinutes: 12,
    objectives: ["Understand monotonicity", "Master converging pointers"],
    prerequisites: ["Array indexing"],
    quickRevisionMd:
      "## Core Idea\nMaintain two pointers whose movements are strictly monotonic. Each step evaluates the state and permanently discards an entire slice of search space, cutting brute force O(n²) down to O(n) amortized time.",
    deepDiveMd:
      "## Theoretical Foundation: Why Two Pointers Works\nIn a brute-force search over a sorted array nums, you consider all pairs (i, j) where i < j. This forms an n × n matrix of potential sums. When the array is sorted monotonically, if nums[left] + nums[right] < target, then left must advance to discard an entire row of unfeasible pairs, completing in strictly O(n) amortized time.",
    commonMistakes: [
      "Attempting opposite-direction pair sum on an unsorted array without sorting first.",
    ],
    keyTakeaways: [
      "Monotonicity is the prerequisite for two pointers.",
      "Opposite-direction pointers converge to search sorted ranges.",
    ],
    sources: [
      "Introduction to Algorithms (CLRS) - Two Pointers",
      { title: "LeetCode Patterns", url: "https://leetcode.com" },
    ],
    reviewer: "Intervue Curriculum Team",
    reviewDate: "2026-11-20",
    changeSummary: "Canonical reference manifest for testing.",
    recallQuestions: [
      {
        prompt: "Under what conditions can the Two Pointers technique find a pair in O(n) time?",
        options: [
          "The array must have no duplicates.",
          "The array must be sorted in monotonic order.",
          "The array must have positive numbers only.",
        ],
        correctOption: 1,
        explanation: "Monotonic ordering is required so that index movements reliably discard invalid search space.",
        isPublished: true,
      },
      {
        prompt: "What is the space complexity of Floyd's Cycle-Finding Algorithm?",
        options: [
          "O(1) auxiliary space.",
          "O(n) auxiliary space.",
          "O(log n) auxiliary space.",
        ],
        correctOption: 0,
        explanation: "Only two pointers (slow and fast) are maintained, using O(1) memory.",
        isPublished: true,
      },
    ],
  };

  describe("Structural Manifest Validation", () => {
    it("accepts a fully compliant manifest", () => {
      const result = validateConceptManifest(validManifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects manifest with missing or invalid slug format", () => {
      const invalid = { ...validManifest, slug: "Invalid Slug With Spaces!" };
      const result = validateConceptManifest(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("kebab-case"))).toBe(true);
    });

    it("rejects quickRevisionMd shorter than 100 characters", () => {
      const invalid = { ...validManifest, quickRevisionMd: "Too short" };
      const result = validateConceptManifest(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("quickRevisionMd"))).toBe(true);
    });

    it("rejects deepDiveMd shorter than 300 characters", () => {
      const invalid = { ...validManifest, deepDiveMd: "Too short deep dive" };
      const result = validateConceptManifest(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("deepDiveMd"))).toBe(true);
    });

    it("rejects less than 2 key takeaways", () => {
      const invalid = { ...validManifest, keyTakeaways: ["Only one takeaway"] };
      const result = validateConceptManifest(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("keyTakeaways"))).toBe(true);
    });

    it("rejects less than 1 common mistake", () => {
      const invalid = { ...validManifest, commonMistakes: [] };
      const result = validateConceptManifest(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("commonMistakes"))).toBe(true);
    });

    it("rejects less than 2 recall questions", () => {
      const invalid = {
        ...validManifest,
        recallQuestions: [validManifest.recallQuestions[0]],
      };
      const result = validateConceptManifest(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("recallQuestions"))).toBe(true);
    });

    it("rejects recall questions with duplicate prompt within the same manifest", () => {
      const invalid = {
        ...validManifest,
        recallQuestions: [
          validManifest.recallQuestions[0],
          { ...validManifest.recallQuestions[0], explanation: "Different explanation" },
        ],
      };
      const result = validateConceptManifest(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("duplicate prompt"))).toBe(true);
    });

    it("rejects questions with duplicate options", () => {
      const invalid = {
        ...validManifest,
        recallQuestions: [
          validManifest.recallQuestions[0],
          {
            prompt: "What is two pointers?",
            options: ["Identical option", "Identical option", "Option C"],
            correctOption: 0,
            explanation: "Valid explanation here.",
          },
        ],
      };
      const result = validateConceptManifest(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("duplicate options"))).toBe(true);
    });

    it("rejects out-of-bounds correctOption index", () => {
      const invalid = {
        ...validManifest,
        recallQuestions: [
          validManifest.recallQuestions[0],
          {
            prompt: "What is two pointers?",
            options: ["Option A", "Option B"],
            correctOption: 5,
            explanation: "Valid explanation here.",
          },
        ],
      };
      const result = validateConceptManifest(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("out of bounds"))).toBe(true);
    });
  });

  describe("Import Runner & Database Interactions", () => {
    let mockDb: any;
    const testFixturePath = path.resolve(
      __dirname,
      "../../../../packages/db/prisma/data/learn/two-pointers.json"
    );

    beforeEach(() => {
      mockDb = {
        learnModule: {
          findFirst: vi.fn(),
        },
        learnConcept: {
          findUnique: vi.fn(),
          create: vi.fn(),
        },
        learnConceptRevision: {
          create: vi.fn(),
          update: vi.fn(),
        },
        learnRecallQuestion: {
          create: vi.fn(),
          deleteMany: vi.fn(),
        },
        $transaction: vi.fn(async (cb: any) => cb(mockDb)),
      };
    });

    it("performs a safe dry run without mutating the database", async () => {
      mockDb.learnModule.findFirst.mockResolvedValue({
        id: "mod-1",
        slug: "arrays-patterns",
      });
      mockDb.learnConcept.findUnique.mockResolvedValue(null);

      const summary = await runImportLearnManifests({
        dryRun: true,
        filePath: testFixturePath,
        dbClient: mockDb,
      });

      expect(summary.dryRun).toBe(true);
      expect(summary.totalFiles).toBe(1);
      expect(summary.validFiles).toBe(1);
      expect(summary.createdDrafts).toBe(1);
      expect(mockDb.learnConcept.create).not.toHaveBeenCalled();
      expect(mockDb.learnConceptRevision.create).not.toHaveBeenCalled();
      expect(summary.details[0].action).toBe("created_draft");
      expect(summary.details[0].version).toBe(1);
    });

    it("reports an error if the specified moduleSlug does not exist", async () => {
      mockDb.learnModule.findFirst.mockResolvedValue(null);

      const summary = await runImportLearnManifests({
        dryRun: false,
        filePath: testFixturePath,
        dbClient: mockDb,
      });

      expect(summary.details[0].action).toBe("error");
      expect(summary.details[0].reason).toContain("does not exist in database");
    });

    it("creates concept and DRAFT revision v1 when concept does not exist", async () => {
      mockDb.learnModule.findFirst.mockResolvedValue({
        id: "mod-1",
        slug: "arrays-patterns",
      });
      mockDb.learnConcept.findUnique.mockResolvedValue(null);
      mockDb.learnConcept.create.mockResolvedValue({
        id: "concept-new-1",
        slug: "two-pointers",
      });
      mockDb.learnConceptRevision.create.mockResolvedValue({
        id: "rev-new-1",
        version: 1,
        status: "DRAFT",
      });

      const summary = await runImportLearnManifests({
        dryRun: false,
        filePath: testFixturePath,
        dbClient: mockDb,
      });

      expect(summary.dryRun).toBe(false);
      expect(summary.createdDrafts).toBe(1);
      expect(mockDb.learnConcept.create).toHaveBeenCalled();
      expect(mockDb.learnConceptRevision.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            conceptId: "concept-new-1",
            version: 1,
            status: "DRAFT",
          }),
        })
      );
      expect(mockDb.learnRecallQuestion.create).toHaveBeenCalled();
    });

    it("protects published revisions: creates version N+1 DRAFT when new content is imported", async () => {
      mockDb.learnModule.findFirst.mockResolvedValue({
        id: "mod-1",
        slug: "arrays-patterns",
      });
      mockDb.learnConcept.findUnique.mockResolvedValue({
        id: "concept-1",
        slug: "two-pointers",
        revisions: [
          {
            id: "rev-v1",
            version: 1,
            status: "PUBLISHED",
            title: "Old Published Title",
            summary: "Old summary",
            quickRevisionMd: "Old quick revision markdown...",
            deepDiveMd: "Old deep dive markdown...",
          },
        ],
      });
      mockDb.learnConceptRevision.create.mockResolvedValue({
        id: "rev-v2",
        version: 2,
        status: "DRAFT",
      });

      const summary = await runImportLearnManifests({
        dryRun: false,
        filePath: testFixturePath,
        dbClient: mockDb,
      });

      expect(summary.createdDrafts).toBe(1);
      // Ensures the published revision was NEVER mutated or overwritten
      expect(mockDb.learnConceptRevision.update).not.toHaveBeenCalled();
      // Creates revision version 2 as DRAFT
      expect(mockDb.learnConceptRevision.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            conceptId: "concept-1",
            version: 2,
            status: "DRAFT",
          }),
        })
      );
    });

    it("skips import when published revision already matches manifest content", async () => {
      // Read raw fixture to match identical content
      const rawFixture = require(testFixturePath);

      mockDb.learnModule.findFirst.mockResolvedValue({
        id: "mod-1",
        slug: "arrays-patterns",
      });
      mockDb.learnConcept.findUnique.mockResolvedValue({
        id: "concept-1",
        slug: "two-pointers",
        revisions: [
          {
            id: "rev-v1",
            version: 1,
            status: "PUBLISHED",
            title: rawFixture.title,
            summary: rawFixture.summary,
            quickRevisionMd: rawFixture.quickRevisionMd,
            deepDiveMd: rawFixture.deepDiveMd,
            estimatedMinutes: rawFixture.estimatedMinutes,
            difficulty: rawFixture.difficulty,
            keyTakeaways: rawFixture.keyTakeaways,
            commonMistakes: rawFixture.commonMistakes,
            sources: rawFixture.sources.map((s: any) => typeof s === "string" ? s : s.url ? `${s.title} (${s.url})` : s.title),
            reviewer: rawFixture.reviewer,
            reviewedAt: new Date(rawFixture.reviewDate),
            changeSummary: rawFixture.changeSummary,
            questions: rawFixture.recallQuestions.map((q: any, idx: number) => ({
              orderIndex: idx + 1,
              prompt: q.prompt,
              options: q.options,
              correctOption: q.correctOption,
              explanation: q.explanation,
              isPublished: q.isPublished ?? true,
            })),
          },
        ],
      });

      const summary = await runImportLearnManifests({
        dryRun: false,
        filePath: testFixturePath,
        dbClient: mockDb,
      });

      expect(summary.skippedDrafts).toBe(1);
      expect(mockDb.learnConceptRevision.create).not.toHaveBeenCalled();
      expect(mockDb.learnConceptRevision.update).not.toHaveBeenCalled();
      expect(summary.details[0].action).toBe("skipped_protected");
    });

    it("comprehensive equality check detects question differences even if text fields match", async () => {
      const rawFixture = require(testFixturePath);

      mockDb.learnModule.findFirst.mockResolvedValue({
        id: "mod-1",
        slug: "arrays-patterns",
      });
      // DB has matching text fields, but questions in DB have different prompt
      mockDb.learnConcept.findUnique.mockResolvedValue({
        id: "concept-1",
        slug: "two-pointers",
        revisions: [
          {
            id: "rev-v1",
            version: 1,
            status: "PUBLISHED",
            title: rawFixture.title,
            summary: rawFixture.summary,
            quickRevisionMd: rawFixture.quickRevisionMd,
            deepDiveMd: rawFixture.deepDiveMd,
            estimatedMinutes: rawFixture.estimatedMinutes,
            difficulty: rawFixture.difficulty,
            keyTakeaways: rawFixture.keyTakeaways,
            commonMistakes: rawFixture.commonMistakes,
            sources: rawFixture.sources.map((s: any) => typeof s === "string" ? s : s.url ? `${s.title} (${s.url})` : s.title),
            reviewer: rawFixture.reviewer,
            reviewedAt: new Date(rawFixture.reviewDate),
            changeSummary: rawFixture.changeSummary,
            questions: [
              {
                orderIndex: 1,
                prompt: "Different question prompt in DB",
                options: ["A", "B"],
                correctOption: 0,
                explanation: "Different explanation",
                isPublished: true,
              },
            ],
          },
        ],
      });
      mockDb.learnConceptRevision.create.mockResolvedValue({
        id: "rev-v2",
        version: 2,
        status: "DRAFT",
      });

      const summary = await runImportLearnManifests({
        dryRun: false,
        filePath: testFixturePath,
        dbClient: mockDb,
      });

      // Does NOT falsely skip as identical! Recognizes questions changed and creates new draft v2
      expect(summary.createdDrafts).toBe(1);
      expect(summary.details[0].action).toBe("created_draft");
      expect(summary.details[0].version).toBe(2);
    });

    it("comprehensive equality check detects reviewDate changes", async () => {
      const rawFixture = require(testFixturePath);

      mockDb.learnModule.findFirst.mockResolvedValue({
        id: "mod-1",
        slug: "arrays-patterns",
      });
      // DB has older reviewedAt date (e.g. 2026-01-01 instead of 2026-11-20)
      mockDb.learnConcept.findUnique.mockResolvedValue({
        id: "concept-1",
        slug: "two-pointers",
        revisions: [
          {
            id: "rev-v1",
            version: 1,
            status: "PUBLISHED",
            title: rawFixture.title,
            summary: rawFixture.summary,
            quickRevisionMd: rawFixture.quickRevisionMd,
            deepDiveMd: rawFixture.deepDiveMd,
            estimatedMinutes: rawFixture.estimatedMinutes,
            difficulty: rawFixture.difficulty,
            keyTakeaways: rawFixture.keyTakeaways,
            commonMistakes: rawFixture.commonMistakes,
            sources: rawFixture.sources.map((s: any) => typeof s === "string" ? s : s.url ? `${s.title} (${s.url})` : s.title),
            reviewer: rawFixture.reviewer,
            reviewedAt: new Date("2026-01-01"), // Stale date in DB
            changeSummary: rawFixture.changeSummary,
            questions: rawFixture.recallQuestions.map((q: any, idx: number) => ({
              orderIndex: idx + 1,
              prompt: q.prompt,
              options: q.options,
              correctOption: q.correctOption,
              explanation: q.explanation,
              isPublished: q.isPublished ?? true,
            })),
          },
        ],
      });
      mockDb.learnConceptRevision.create.mockResolvedValue({
        id: "rev-v2",
        version: 2,
        status: "DRAFT",
      });

      const summary = await runImportLearnManifests({
        dryRun: false,
        filePath: testFixturePath,
        dbClient: mockDb,
      });

      // Does not skip: recognizes reviewDate changed and creates new draft v2
      expect(summary.createdDrafts).toBe(1);
      expect(summary.details[0].action).toBe("created_draft");
      expect(summary.details[0].version).toBe(2);
    });

    it("comprehensive equality check detects changeSummary changes", async () => {
      const rawFixture = require(testFixturePath);

      mockDb.learnModule.findFirst.mockResolvedValue({
        id: "mod-1",
        slug: "arrays-patterns",
      });
      // DB has older changeSummary
      mockDb.learnConcept.findUnique.mockResolvedValue({
        id: "concept-1",
        slug: "two-pointers",
        revisions: [
          {
            id: "rev-v1",
            version: 1,
            status: "PUBLISHED",
            title: rawFixture.title,
            summary: rawFixture.summary,
            quickRevisionMd: rawFixture.quickRevisionMd,
            deepDiveMd: rawFixture.deepDiveMd,
            estimatedMinutes: rawFixture.estimatedMinutes,
            difficulty: rawFixture.difficulty,
            keyTakeaways: rawFixture.keyTakeaways,
            commonMistakes: rawFixture.commonMistakes,
            sources: rawFixture.sources.map((s: any) => typeof s === "string" ? s : s.url ? `${s.title} (${s.url})` : s.title),
            reviewer: rawFixture.reviewer,
            reviewedAt: new Date(rawFixture.reviewDate),
            changeSummary: "Old initial changeSummary", // Different change summary in DB
            questions: rawFixture.recallQuestions.map((q: any, idx: number) => ({
              orderIndex: idx + 1,
              prompt: q.prompt,
              options: q.options,
              correctOption: q.correctOption,
              explanation: q.explanation,
              isPublished: q.isPublished ?? true,
            })),
          },
        ],
      });
      mockDb.learnConceptRevision.create.mockResolvedValue({
        id: "rev-v2",
        version: 2,
        status: "DRAFT",
      });

      const summary = await runImportLearnManifests({
        dryRun: false,
        filePath: testFixturePath,
        dbClient: mockDb,
      });

      // Does not skip: recognizes changeSummary changed and creates new draft v2
      expect(summary.createdDrafts).toBe(1);
      expect(summary.details[0].action).toBe("created_draft");
      expect(summary.details[0].version).toBe(2);
    });

    it("protects existing DRAFT revision from overwrite when manual admin edits exist (authorId set)", async () => {
      mockDb.learnModule.findFirst.mockResolvedValue({
        id: "mod-1",
        slug: "arrays-patterns",
      });
      mockDb.learnConcept.findUnique.mockResolvedValue({
        id: "concept-1",
        slug: "two-pointers",
        revisions: [
          {
            id: "rev-v1-draft",
            version: 1,
            status: "DRAFT",
            authorId: "admin-user-42", // Admin edited in UI!
            title: "Draft modified in admin UI",
            summary: "Draft summary",
            quickRevisionMd: "Draft quick revision",
            deepDiveMd: "Draft deep dive",
            questions: [
              { id: "q1", prompt: "Admin edited question", options: ["A", "B"], correctOption: 0, explanation: "Exp" },
            ],
          },
        ],
      });

      const summary = await runImportLearnManifests({
        dryRun: false,
        filePath: testFixturePath,
        dbClient: mockDb,
        allowDraftOverwrite: true, // Even if flag is passed, manual admin draft is strictly protected!
      });

      expect(summary.skippedDrafts).toBe(1);
      expect(summary.details[0].action).toBe("skipped_protected");
      expect(summary.details[0].reason).toContain("manual admin edits");
      expect(mockDb.learnConceptRevision.update).not.toHaveBeenCalled();
      expect(mockDb.learnRecallQuestion.deleteMany).not.toHaveBeenCalled();
    });

    it("protects unauthored DRAFT revision from overwrite by default without allowDraftOverwrite", async () => {
      mockDb.learnModule.findFirst.mockResolvedValue({
        id: "mod-1",
        slug: "arrays-patterns",
      });
      mockDb.learnConcept.findUnique.mockResolvedValue({
        id: "concept-1",
        slug: "two-pointers",
        revisions: [
          {
            id: "rev-v1-draft",
            version: 1,
            status: "DRAFT",
            authorId: null,
            title: "Draft title needing update",
            summary: "Draft summary",
            quickRevisionMd: "Draft quick revision",
            deepDiveMd: "Draft deep dive",
            questions: [],
          },
        ],
      });

      const summary = await runImportLearnManifests({
        dryRun: false,
        filePath: testFixturePath,
        dbClient: mockDb,
        allowDraftOverwrite: false, // Default behavior
      });

      expect(summary.skippedDrafts).toBe(1);
      expect(summary.details[0].action).toBe("skipped_protected");
      expect(mockDb.learnConceptRevision.update).not.toHaveBeenCalled();
      expect(mockDb.learnRecallQuestion.deleteMany).not.toHaveBeenCalled();
    });

    it("updates unauthored DRAFT revision in-place when allowDraftOverwrite is explicitly enabled", async () => {
      mockDb.learnModule.findFirst.mockResolvedValue({
        id: "mod-1",
        slug: "arrays-patterns",
      });
      mockDb.learnConcept.findUnique.mockResolvedValue({
        id: "concept-1",
        slug: "two-pointers",
        revisions: [
          {
            id: "rev-v1-draft",
            version: 1,
            status: "DRAFT",
            authorId: null,
            title: "Draft title needing update",
            summary: "Draft summary",
            quickRevisionMd: "Draft quick revision",
            deepDiveMd: "Draft deep dive",
            questions: [],
          },
        ],
      });

      const summary = await runImportLearnManifests({
        dryRun: false,
        filePath: testFixturePath,
        dbClient: mockDb,
        allowDraftOverwrite: true, // Explicitly enabled
      });

      expect(summary.updatedDrafts).toBe(1);
      expect(mockDb.learnConceptRevision.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "rev-v1-draft" },
        })
      );
      // Cleans and re-syncs questions for this unauthored draft revision
      expect(mockDb.learnRecallQuestion.deleteMany).toHaveBeenCalledWith({
        where: { revisionId: "rev-v1-draft" },
      });
      expect(mockDb.learnRecallQuestion.create).toHaveBeenCalled();
    });
  });
});
