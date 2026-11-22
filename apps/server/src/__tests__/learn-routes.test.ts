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
const mockCountQuestions = mock(async () => 0);
const mockFindUniqueProgress = mock(async () => null as any);
const mockFindManyProgress = mock(async () => [] as any[]);
const mockUpsertProgress = mock(async () => ({} as any));
const mockCreateSession = mock(async () => ({} as any));
const mockTransaction = mock(async (arg: any) => {
  if (typeof arg === "function") {
    return arg(mockDb);
  }
  return Promise.all(arg);
});
const mockFindFirstInterview = mock(async () => null as any);
const mockGetSession = mock(async () => null as any);

const mockQueryRaw = mock(async () => [] as any[]);
const dbModels: Record<string, any> = {};
const mockDb = new Proxy({
  $transaction: mockTransaction,
  $queryRaw: mockQueryRaw,
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
    count: mockCountQuestions,
  },
  userConceptProgress: {
    findUnique: mockFindUniqueProgress,
    findMany: mockFindManyProgress,
    upsert: mockUpsertProgress,
  },
  userRecallSession: {
    create: mockCreateSession,
  },
  session: {
    findUnique: mock(async () => null),
  },
}, {
  get(target, prop: string) {
    if (prop in target) return (target as any)[prop];
    if (!dbModels[prop]) dbModels[prop] = {};
    return dbModels[prop];
  },
  set(target, prop: string, value) {
    (target as any)[prop] = value;
    return true;
  }
});

mock.module("@intervue/db", () => ({
  db: mockDb,
  Prisma: {
    TransactionIsolationLevel: {
      Serializable: "Serializable",
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
    mockCountQuestions.mockReset();
    mockCountQuestions.mockResolvedValue(0);
    mockFindUniqueProgress.mockReset();
    mockFindManyProgress.mockReset();
    mockUpsertProgress.mockReset();
    mockCreateSession.mockReset();
    mockTransaction.mockReset();
    mockTransaction.mockImplementation(async (arg: any) => {
      if (typeof arg === "function") {
        return arg(mockDb);
      }
      return Promise.all(arg);
    });
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
      mockFindUniqueConcept.mockResolvedValue({ id: "c1", publishedRevisionId: "rev-1" });
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

    it("GET /api/learn/concepts/:slug/recall enforces non-mixing: queries revision-bound questions when revision has bound questions", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindUniqueConcept.mockResolvedValue({ id: "c1", publishedRevisionId: "rev-2" });
      mockCountQuestions.mockResolvedValue(3); // 3 bound questions exist for rev-2
      mockFindManyQuestions.mockResolvedValue([
        { id: "q-rev2-1", prompt: "Bound to rev-2", options: ["A", "B"], orderIndex: 1 },
      ]);

      const res = await app.request("/api/learn/concepts/two-pointers/recall");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.questions.length).toBe(1);
      expect(body.questions[0].prompt).toBe("Bound to rev-2");
      // Check query where clause passed to db
      expect(mockFindManyQuestions).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            conceptId: "c1",
            revisionId: "rev-2",
            isPublished: true,
          },
        })
      );
    });

    it("does not expose recall questions for an unpublished concept", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindUniqueConcept.mockResolvedValue({ id: "c1", publishedRevisionId: null });

      const getResponse = await app.request("/api/learn/concepts/draft-concept/recall");
      const answerResponse = await app.request("/api/learn/concepts/draft-concept/recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: "legacy-q1", selectedOption: 0 }),
      });
      const sessionResponse = await app.request("/api/learn/concepts/draft-concept/recall/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: [{ questionId: "legacy-q1", selectedOption: 0 }] }),
      });

      expect(getResponse.status).toBe(404);
      expect(answerResponse.status).toBe(404);
      expect(sessionResponse.status).toBe(404);
      expect(mockFindManyQuestions).not.toHaveBeenCalled();
      expect(mockFindUniqueQuestion).not.toHaveBeenCalled();
    });

    it("POST /api/learn/concepts/:slug/recall rejects legacy unversioned question when revision has bound questions", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindUniqueConcept.mockResolvedValue({ id: "c1", publishedRevisionId: "rev-2" });
      mockCountQuestions.mockResolvedValue(3); // rev-2 has bound questions
      mockFindUniqueQuestion.mockResolvedValue({
        id: "q-legacy",
        conceptId: "c1",
        revisionId: null, // Legacy unversioned row!
        isPublished: true,
        options: ["A", "B"],
        correctOption: 0,
      });

      const res = await app.request("/api/learn/concepts/two-pointers/recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: "q-legacy", selectedOption: 0 }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("does not belong to the current published revision");
    });

    it("POST /api/learn/concepts/:slug/recall returns immediate feedback without mutating progress or review schedule", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindUniqueConcept.mockResolvedValue({ id: "c1", publishedRevisionId: "rev-1" });
      mockFindUniqueQuestion.mockResolvedValue({
        id: "q1",
        conceptId: "c1",
        revisionId: "rev-1",
        isPublished: true,
        options: ["Option 0", "Option 1", "Option 2"],
        correctOption: 1,
        explanation: "Sorting creates monotonicity.",
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
      // Must NOT contain progress and must NOT call upsertProgress
      expect(body.progress).toBeUndefined();
      expect(mockUpsertProgress).not.toHaveBeenCalled();
    });

    it("POST /api/learn/concepts/:slug/recall rejects out-of-bounds selectedOption", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindUniqueConcept.mockResolvedValue({ id: "c1", publishedRevisionId: "rev-1" });
      mockFindUniqueQuestion.mockResolvedValue({
        id: "q1",
        conceptId: "c1",
        revisionId: "rev-1",
        isPublished: true,
        options: ["A", "B"],
        correctOption: 0,
      });

      const res = await app.request("/api/learn/concepts/two-pointers/recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: "q1", selectedOption: 5 }), // out of bounds
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("out of bounds");
    });

    it("POST /api/learn/concepts/:slug/recall rejects stale revision questions", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindUniqueConcept.mockResolvedValue({ id: "c1", publishedRevisionId: "rev-2" });
      mockFindUniqueQuestion.mockResolvedValue({
        id: "q1",
        conceptId: "c1",
        revisionId: "rev-1", // Old revision!
        isPublished: true,
        options: ["A", "B"],
        correctOption: 0,
      });

      const res = await app.request("/api/learn/concepts/two-pointers/recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: "q1", selectedOption: 0 }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("published revision");
    });

    it("POST /api/learn/concepts/:slug/recall/session records atomic session and advances review stage", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindUniqueConcept.mockResolvedValue({ id: "c1", publishedRevisionId: "rev-1" });
      mockFindManyQuestions.mockResolvedValue([
        { id: "q1", conceptId: "c1", revisionId: "rev-1", isPublished: true, options: ["A", "B"], correctOption: 1 },
        { id: "q2", conceptId: "c1", revisionId: "rev-1", isPublished: true, options: ["A", "B"], correctOption: 0 },
      ]);
      mockFindUniqueProgress.mockResolvedValue({
        reviewStage: 0,
        nextReviewAt: new Date(Date.now() - 1000), // Due!
        recallAttempts: 2,
        recallCorrect: 2,
        status: "STUDIED",
      });

      mockCreateSession.mockResolvedValue({
        id: "sess-1",
        score: 1.0,
        questionsCount: 2,
        correctCount: 2,
        stageBefore: 0,
        stageAfter: 1,
        isScheduledReview: true,
        completedAt: new Date(),
      });

      mockUpsertProgress.mockResolvedValue({
        status: "CONFIDENT",
        reviewStage: 1,
        lastSessionScore: 1.0,
        nextReviewAt: new Date(Date.now() + 3 * 86400000),
        recallAttempts: 4,
        recallCorrect: 4,
      });

      const res = await app.request("/api/learn/concepts/two-pointers/recall/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: [
            { questionId: "q1", selectedOption: 1 },
            { questionId: "q2", selectedOption: 0 },
          ],
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.session.score).toBe(1.0);
      expect(body.session.stageBefore).toBe(0);
      expect(body.session.stageAfter).toBe(1);
      expect(body.session.isScheduledReview).toBe(true);
      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it("POST /api/learn/concepts/:slug/recall/session rejects duplicate question IDs", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });

      const res = await app.request("/api/learn/concepts/two-pointers/recall/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: [
            { questionId: "q1", selectedOption: 0 },
            { questionId: "q1", selectedOption: 1 }, // Duplicate!
          ],
        }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("Duplicate questionId");
    });

    it("POST /api/learn/concepts/:slug/recall/session ignores client isScheduledReview for early casual practice", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindUniqueConcept.mockResolvedValue({ id: "c1", publishedRevisionId: "rev-1" });
      mockFindManyQuestions.mockResolvedValue([
        { id: "q1", conceptId: "c1", revisionId: "rev-1", isPublished: true, options: ["A", "B"], correctOption: 1 },
      ]);
      const futureReview = new Date(Date.now() + 5 * 86400000);
      mockFindUniqueProgress.mockResolvedValue({
        reviewStage: 2,
        nextReviewAt: futureReview, // NOT due!
        recallAttempts: 5,
        recallCorrect: 4,
        status: "CONFIDENT",
      });

      mockCreateSession.mockResolvedValue({
        id: "sess-2",
        score: 1.0,
        questionsCount: 1,
        correctCount: 1,
        stageBefore: 2,
        stageAfter: 2,
        isScheduledReview: false,
        completedAt: new Date(),
      });

      mockUpsertProgress.mockResolvedValue({
        status: "CONFIDENT",
        reviewStage: 2,
        lastSessionScore: 1.0,
        nextReviewAt: futureReview,
        recallAttempts: 6,
        recallCorrect: 5,
      });

      const res = await app.request("/api/learn/concepts/two-pointers/recall/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isScheduledReview: true, // Malicious/premature client claim!
          answers: [{ questionId: "q1", selectedOption: 1 }],
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      // Server must override to false because review is NOT due
      expect(body.session.isScheduledReview).toBe(false);
      expect(body.session.stageBefore).toBe(2);
      expect(body.session.stageAfter).toBe(2);
    });

    it("POST /api/learn/concepts/:slug/recall/session handles first completion by keeping stage 0 and scheduling +1 day", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindUniqueConcept.mockResolvedValue({ id: "c1", publishedRevisionId: "rev-1" });
      mockFindManyQuestions.mockResolvedValue([
        { id: "q1", conceptId: "c1", revisionId: "rev-1", isPublished: true, options: ["A", "B"], correctOption: 1 },
      ]);
      // Brand new user: null progress
      mockFindUniqueProgress.mockResolvedValue(null);

      mockCreateSession.mockResolvedValue({
        id: "sess-first",
        score: 1.0,
        questionsCount: 1,
        correctCount: 1,
        stageBefore: 0,
        stageAfter: 0,
        isScheduledReview: true,
        completedAt: new Date(),
      });

      mockUpsertProgress.mockResolvedValue({
        status: "STUDIED",
        reviewStage: 0,
        lastSessionScore: 1.0,
        nextReviewAt: new Date(Date.now() + 86400000),
        recallAttempts: 1,
        recallCorrect: 1,
      });

      const res = await app.request("/api/learn/concepts/two-pointers/recall/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: [{ questionId: "q1", selectedOption: 1 }],
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.session.stageBefore).toBe(0);
      expect(body.session.stageAfter).toBe(0);
      expect(body.session.isScheduledReview).toBe(true);
    });

    it("POST /api/learn/concepts/:slug/recall/session handles simultaneous concurrent submissions under serializable isolation", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindUniqueConcept.mockResolvedValue({ id: "c1", publishedRevisionId: "rev-1" });
      mockFindManyQuestions.mockResolvedValue([
        { id: "q1", conceptId: "c1", revisionId: "rev-1", isPublished: true, options: ["A", "B"], correctOption: 1 },
      ]);

      let simulatedStage = 0;
      mockFindUniqueProgress.mockImplementation(async () => {
        return {
          id: "prog-1",
          reviewStage: simulatedStage,
          nextReviewAt: null,
          recallAttempts: simulatedStage * 2,
          recallCorrect: simulatedStage * 2,
          status: simulatedStage === 0 ? "STUDIED" : "CONFIDENT",
        };
      });

      mockCreateSession.mockImplementation(async (args: any) => ({
        id: `sess-${Math.random()}`,
        score: 1.0,
        questionsCount: 1,
        correctCount: 1,
        stageBefore: args.data.stageBefore,
        stageAfter: args.data.stageAfter,
        isScheduledReview: true,
        completedAt: new Date(),
      }));

      mockUpsertProgress.mockImplementation(async (args: any) => {
        simulatedStage = args.update.reviewStage;
        return {
          id: "prog-1",
          status: args.update.status,
          reviewStage: args.update.reviewStage,
          lastSessionScore: 1.0,
          recallAttempts: 1,
          recallCorrect: 1,
        };
      });

      // Execute simultaneous submissions concurrently
      const [res1, res2] = await Promise.all([
        app.request("/api/learn/concepts/two-pointers/recall/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: [{ questionId: "q1", selectedOption: 1 }] }),
        }),
        app.request("/api/learn/concepts/two-pointers/recall/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: [{ questionId: "q1", selectedOption: 1 }] }),
        }),
      ]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(mockTransaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ isolationLevel: "Serializable" })
      );
    });

    it("POST /api/learn/concepts/:slug/recall/session retries on serialization conflict (P2034) and recovers", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindUniqueConcept.mockResolvedValue({ id: "c1", publishedRevisionId: "rev-1" });
      mockFindManyQuestions.mockResolvedValue([
        { id: "q1", conceptId: "c1", revisionId: "rev-1", isPublished: true, options: ["A", "B"], correctOption: 1 },
      ]);
      mockFindUniqueProgress.mockResolvedValue(null);
      mockCreateSession.mockResolvedValue({
        id: "sess-retried",
        score: 1.0,
        questionsCount: 1,
        correctCount: 1,
        stageBefore: 0,
        stageAfter: 0,
        isScheduledReview: true,
        completedAt: new Date(),
      });
      mockUpsertProgress.mockResolvedValue({
        status: "STUDIED",
        reviewStage: 0,
        recallAttempts: 1,
        recallCorrect: 1,
      });

      // Simulate a P2034 write conflict on the first attempt, then success on second attempt
      let attempts = 0;
      mockTransaction.mockImplementationOnce(async () => {
        attempts++;
        const p2034Error: any = new Error("Transaction failed due to a write conflict or deadlock (P2034)");
        p2034Error.code = "P2034";
        throw p2034Error;
      });

      const res = await app.request("/api/learn/concepts/two-pointers/recall/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: [{ questionId: "q1", selectedOption: 1 }] }),
      });

      expect(res.status).toBe(200);
      expect(attempts).toBe(1);
      const body = await res.json();
      expect(body.session.id).toBe("sess-retried");
    });

    it("PATCH /api/learn/concepts/:slug/progress rejects manual DEMONSTRATED_UNDERSTANDING", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });

      const res = await app.request("/api/learn/concepts/two-pointers/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DEMONSTRATED_UNDERSTANDING" }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("DEMONSTRATED_UNDERSTANDING is server-calculated");
    });

    it("PATCH /api/learn/concepts/:slug/progress updates concept status and schedules review on STUDIED", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "u1", email: "test@example.com", role: "user" },
        session: { id: "s1" },
      });
      mockFindUniqueConcept.mockResolvedValue({ id: "c1" });
      mockFindUniqueProgress.mockResolvedValue(null);
      mockUpsertProgress.mockResolvedValue({
        status: "STUDIED",
        nextReviewAt: new Date(Date.now() + 86400000),
        lastStudiedAt: new Date(),
      });

      const res = await app.request("/api/learn/concepts/two-pointers/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "STUDIED", confidence: 4 }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.progress.status).toBe("STUDIED");
      expect(body.progress.nextReviewAt).toBeDefined();
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
