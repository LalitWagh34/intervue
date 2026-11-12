import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Hono } from "hono";

const mockFindFirst = mock(async () => null as any);
const mockFindUniqueConcept = mock(async () => null as any);
const mockFindFirstModule = mock(async () => null as any);
const mockFindManyConcepts = mock(async () => [] as any[]);
const mockFindManySubjects = mock(async () => [] as any[]);
const mockFindUniqueSubject = mock(async () => null as any);
const mockFindManyQuestions = mock(async () => [] as any[]);
const mockFindUniqueQuestion = mock(async () => null as any);
const mockFindUniqueProgress = mock(async () => null as any);
const mockFindManyProgress = mock(async () => [] as any[]);
const mockUpsertProgress = mock(async () => ({} as any));
const mockFindFirstInterview = mock(async () => null as any);
const mockGetSession = mock(async () => null as any);

mock.module("@intervue/db", () => ({
  db: {
    interview: {
      findFirst: mockFindFirstInterview,
    },
    learnSubject: {
      findMany: mockFindManySubjects,
      findUnique: mockFindUniqueSubject,
    },
    learnModule: {
      findFirst: mockFindFirstModule,
    },
    learnConcept: {
      findFirst: mockFindFirst,
      findUnique: mockFindUniqueConcept,
      findMany: mockFindManyConcepts,
    },
    learnRecallQuestion: {
      findMany: mockFindManyQuestions,
      findUnique: mockFindUniqueQuestion,
    },
    userConceptProgress: {
      findUnique: mockFindUniqueProgress,
      findMany: mockFindManyProgress,
      upsert: mockUpsertProgress,
    },
    session: {
      findUnique: mock(async () => null),
    },
  },
}));

mock.module("../lib/auth", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

const { default: learnRoutes } = await import("../routes/learn");

describe("Learn Routes", () => {
  const app = new Hono();
  app.route("/api/learn", learnRoutes);

  beforeEach(() => {
    mockFindFirst.mockReset();
    mockFindUniqueConcept.mockReset();
    mockFindFirstModule.mockReset();
    mockFindManyConcepts.mockReset();
    mockFindManySubjects.mockReset();
    mockFindUniqueSubject.mockReset();
    mockFindManyQuestions.mockReset();
    mockFindUniqueQuestion.mockReset();
    mockFindUniqueProgress.mockReset();
    mockFindManyProgress.mockReset();
    mockUpsertProgress.mockReset();
    mockGetSession.mockReset();
  });

  describe("GET /api/learn/subjects", () => {
    it("returns 401 when unauthenticated", async () => {
      mockGetSession.mockResolvedValue(null);
      const res = await app.request("/api/learn/subjects");
      expect(res.status).toBe(401);
    });

    it("returns subject list with module and concept counts", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindManySubjects.mockResolvedValue([
        {
          id: "sub-1",
          slug: "dsa",
          title: "Data Structures & Algorithms",
          description: "Core patterns",
          icon: "Code2",
          orderIndex: 1,
          modules: [
            {
              id: "m-1",
              concepts: [
                { publishedRevision: { estimatedMinutes: 10 } },
                { publishedRevision: { estimatedMinutes: 12 } },
              ],
            },
          ],
        },
      ]);

      const res = await app.request("/api/learn/subjects");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.subjects.length).toBe(1);
      expect(body.subjects[0].slug).toBe("dsa");
      expect(body.subjects[0].conceptCount).toBe(2);
      expect(body.subjects[0].estimatedMinutes).toBe(22);
    });
  });

  describe("GET /api/learn/subjects/:slug", () => {
    it("returns 404 for unknown subject", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindUniqueSubject.mockResolvedValue(null);

      const res = await app.request("/api/learn/subjects/unknown");
      expect(res.status).toBe(404);
    });

    it("returns subject modules and published concept cards without lesson body", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindUniqueSubject.mockResolvedValue({
        id: "sub-1",
        slug: "dsa",
        title: "Data Structures & Algorithms",
        description: "Core patterns",
        icon: "Code2",
        isPublished: true,
        modules: [
          {
            id: "m-1",
            slug: "arrays-patterns",
            title: "Arrays & Patterns",
            description: "Linear scans",
            orderIndex: 1,
            concepts: [
              {
                id: "c-1",
                slug: "two-pointers",
                orderIndex: 1,
                publishedRevision: {
                  title: "Two Pointers",
                  summary: "Two indices moving monotonically",
                  difficulty: "FOUNDATION",
                  estimatedMinutes: 10,
                },
              },
            ],
          },
        ],
      });

      const res = await app.request("/api/learn/subjects/dsa");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.subject.title).toBe("Data Structures & Algorithms");
      expect(body.subject.modules[0].concepts[0].slug).toBe("two-pointers");
      expect(body.subject.modules[0].concepts[0].quickRevisionMd).toBeUndefined();
    });
  });

  describe("GET /api/learn/subjects/:subjectSlug/modules/:moduleSlug", () => {
    it("returns 404 for unknown module", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindFirstModule.mockResolvedValue(null);

      const res = await app.request("/api/learn/subjects/dsa/modules/unknown");
      expect(res.status).toBe(404);
    });

    it("returns module metadata and its published concepts", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindFirstModule.mockResolvedValue({
        id: "m-1",
        slug: "arrays-patterns",
        title: "Arrays & Patterns",
        description: "Linear scans",
        orderIndex: 1,
        subject: { id: "sub-1", slug: "dsa", title: "DSA" },
        concepts: [
          {
            id: "c-1",
            slug: "two-pointers",
            orderIndex: 1,
            publishedRevision: {
              title: "Two Pointers",
              summary: "Two indices moving monotonically",
              difficulty: "FOUNDATION",
              estimatedMinutes: 10,
            },
          },
        ],
      });

      const res = await app.request("/api/learn/subjects/dsa/modules/arrays-patterns");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.module.title).toBe("Arrays & Patterns");
      expect(body.module.concepts.length).toBe(1);
      expect(body.module.concepts[0].slug).toBe("two-pointers");
    });
  });

  describe("GET /api/learn/concepts/:slug", () => {
    it("returns published concept and prev/next navigation", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindFirst.mockResolvedValue({
        id: "c2",
        slug: "sliding-window",
        orderIndex: 2,
        module: {
          id: "m1",
          slug: "arrays-patterns",
          title: "Arrays & Patterns",
          orderIndex: 1,
          subject: {
            id: "sub1",
            slug: "dsa",
            title: "Data Structures & Algorithms",
          },
        },
        publishedRevision: {
          id: "rev2",
          version: 1,
          title: "Sliding Window",
          summary: "Contiguous subarray window",
          quickRevisionMd: "## Quick",
          deepDiveMd: "## Deep",
          estimatedMinutes: 12,
          difficulty: "INTERMEDIATE",
          keyTakeaways: ["O(n) amortized"],
          commonMistakes: ["Negative numbers"],
          publishedAt: new Date("2026-11-12T00:00:00Z"),
        },
      });
      mockFindManyConcepts.mockResolvedValue([
        { slug: "two-pointers", publishedRevision: { title: "Two Pointers" } },
        { slug: "sliding-window", publishedRevision: { title: "Sliding Window" } },
      ]);

      const res = await app.request("/api/learn/concepts/sliding-window");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.concept.slug).toBe("sliding-window");
      expect(body.concept.quickRevisionMd).toBe("## Quick");
      expect(body.navigation.prev).toEqual({ slug: "two-pointers", title: "Two Pointers" });
    });
  });

  describe("Recall & Progress Endpoints", () => {
    it("GET /api/learn/concepts/:slug/recall returns questions without correctOption or explanation", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindUniqueConcept.mockResolvedValue({ id: "c1" });
      mockFindManyQuestions.mockResolvedValue([
        { id: "q1", prompt: "What is two pointers?", options: ["A", "B"], orderIndex: 1 },
      ]);
      mockFindUniqueProgress.mockResolvedValue({
        status: "CONFIDENT",
        recallAttempts: 1,
        recallCorrect: 1,
        nextReviewAt: new Date(),
      });

      const res = await app.request("/api/learn/concepts/two-pointers/recall");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.questions.length).toBe(1);
      expect(body.questions[0].prompt).toBe("What is two pointers?");
      expect(body.questions[0].correctOption).toBeUndefined();
      expect(body.questions[0].explanation).toBeUndefined();
      expect(body.progress.status).toBe("CONFIDENT");
    });

    it("POST /api/learn/concepts/:slug/recall grades answer and updates spaced repetition stage", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindUniqueConcept.mockResolvedValue({ id: "c1" });
      mockFindUniqueQuestion.mockResolvedValue({
        id: "q1",
        conceptId: "c1",
        correctOption: 1,
        explanation: "Sorting creates monotonicity.",
      });
      mockFindUniqueProgress.mockResolvedValue({ reviewStage: 0 });
      mockUpsertProgress.mockResolvedValue({
        status: "CONFIDENT",
        recallAttempts: 1,
        recallCorrect: 1,
        reviewStage: 1,
        nextReviewAt: new Date(),
      });

      const res = await app.request("/api/learn/concepts/two-pointers/recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: "q1", selectedOption: 1 }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.isCorrect).toBe(true);
      expect(body.correctOption).toBe(1);
      expect(body.explanation).toBe("Sorting creates monotonicity.");
      expect(body.progress.status).toBe("CONFIDENT");
    });

    it("PATCH /api/learn/concepts/:slug/progress updates concept status", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindUniqueConcept.mockResolvedValue({ id: "c1" });
      mockUpsertProgress.mockResolvedValue({
        status: "STUDIED",
        lastStudiedAt: new Date(),
      });

      const res = await app.request("/api/learn/concepts/two-pointers/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "STUDIED" }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.progress.status).toBe("STUDIED");
    });
  });

  describe("GET /api/learn/queue", () => {
    it("returns overdue and needs_revision concepts for spaced review", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindManyProgress.mockResolvedValue([
        {
          id: "p1",
          status: "NEEDS_REVISION",
          reviewStage: 0,
          nextReviewAt: new Date(Date.now() - 3600000),
          lastReviewedAt: new Date(),
          recallAttempts: 1,
          recallCorrect: 0,
          concept: {
            id: "c1",
            slug: "two-pointers",
            module: {
              slug: "arrays-patterns",
              title: "Arrays & Patterns",
              subject: { slug: "dsa", title: "DSA" },
            },
            publishedRevision: {
              title: "Two Pointers",
              summary: "Two indices moving monotonically",
              estimatedMinutes: 10,
              difficulty: "FOUNDATION",
            },
          },
        },
      ]);

      const res = await app.request("/api/learn/queue");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.totalDue).toBe(1);
      expect(body.queue[0].concept.slug).toBe("two-pointers");
      expect(body.queue[0].status).toBe("NEEDS_REVISION");
    });
  });

  describe("GET /api/learn/recommendations/interview/:interviewId", () => {
    it("returns empty recommendations when evaluation has no matching weaknesses", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindFirstInterview.mockResolvedValue({
        id: "int-1",
        userId: "u1",
        evaluation: {
          status: "completed",
          improvements: ["Improve verbal communication during system design walkthroughs"],
        },
      });
      mockFindManyConcepts.mockResolvedValue([]);

      const res = await app.request("/api/learn/recommendations/interview/int-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.recommendations).toEqual([]);
    });

    it("returns explainable concept recommendations with exact matching quote", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindFirstInterview.mockResolvedValue({
        id: "int-1",
        userId: "u1",
        evaluation: {
          status: "completed",
          improvements: [
            "Consider using a two pointers pattern on the sorted array instead of quadratic nested loops",
          ],
        },
      });
      mockFindManyConcepts.mockResolvedValue([
        {
          id: "c-1",
          slug: "two-pointers",
          publishedRevision: {
            title: "Two Pointers",
            summary: "Two indices moving monotonically",
            difficulty: "FOUNDATION",
            estimatedMinutes: 10,
          },
          module: {
            slug: "arrays-patterns",
            title: "Arrays & Patterns",
            subject: {
              slug: "dsa",
              title: "Data Structures & Algorithms",
            },
          },
        },
      ]);

      const res = await app.request("/api/learn/recommendations/interview/int-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.recommendations.length).toBe(1);
      expect(body.recommendations[0].concept.slug).toBe("two-pointers");
      expect(body.recommendations[0].matchedFeedback).toBe(
        "Consider using a two pointers pattern on the sorted array instead of quadratic nested loops"
      );
      expect(body.recommendations[0].matchedKeywords).toContain("two pointers");
    });
  });
});
