import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Hono } from "hono";

const mockFindManySubjects = mock(async () => [] as any[]);
const mockFindManyConcepts = mock(async () => [] as any[]);
const mockFindUniqueConcept = mock(async () => null as any);
const mockFindUniqueRevision = mock(async () => null as any);
const mockFindFirstRevision = mock(async () => null as any);
const mockCreateRevision = mock(async () => ({}) as any);
const mockUpdateConcept = mock(async () => ({}) as any);
const mockUpdateRevision = mock(async () => ({}) as any);
const mockDeleteConcept = mock(async () => ({}) as any);
const mockFindManyQuestions = mock(async () => [] as any[]);
const mockTransaction = mock(async (arg: any) => {
  if (typeof arg === "function") {
    return arg({
      learnConcept: {
        create: mock(async () => ({ id: "c-new", slug: "test-concept" })),
        update: mock(async () => ({ id: "c-new", publishedRevisionId: "rev-new" })),
        findUnique: mock(async () => ({ id: "c-new" })),
      },
      learnConceptRevision: {
        create: mock(async () => ({ id: "rev-new", version: 1 })),
      },
    });
  }
  return Promise.all(arg);
});

mock.module("@intervue/db", () => ({
  db: {
    learnSubject: { findMany: mockFindManySubjects },
    learnConcept: {
      findMany: mockFindManyConcepts,
      findUnique: mockFindUniqueConcept,
      update: mockUpdateConcept,
      delete: mockDeleteConcept,
    },
    learnRecallQuestion: {
      findMany: mockFindManyQuestions,
    },
    learnConceptRevision: {
      findUnique: mockFindUniqueRevision,
      findFirst: mockFindFirstRevision,
      create: mockCreateRevision,
      update: mockUpdateRevision,
    },
    user: {
      findUnique: mock(async () => ({ role: "admin" })),
    },
    $transaction: mockTransaction,
  },
}));

mock.module("../lib/auth", () => ({
  auth: {
    api: {
      getSession: mock(async () => ({
        user: { id: "admin-1", email: "admin@intervue.dev", role: "admin" },
        session: { id: "sess-1" },
      })),
    },
  },
}));

const { default: adminRoutes } = await import("../routes/admin");

describe("Admin Learn & Revise CMS Endpoints", () => {
  const app = new Hono();
  app.route("/admin", adminRoutes);

  beforeEach(() => {
    mockFindManySubjects.mockReset();
    mockFindManyConcepts.mockReset();
    mockFindUniqueConcept.mockReset();
    mockFindManyQuestions.mockReset();
    mockFindUniqueRevision.mockReset();
    mockFindFirstRevision.mockReset();
    mockCreateRevision.mockReset();
    mockUpdateConcept.mockReset();
    mockUpdateRevision.mockReset();
    mockDeleteConcept.mockReset();
  });

  it("GET /admin/learn/modules lists subjects and nested modules", async () => {
    mockFindManySubjects.mockResolvedValue([
      { id: "s1", title: "DSA", modules: [{ id: "m1", title: "Arrays" }] },
    ]);

    const res = await app.request("/admin/learn/modules");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.subjects[0].title).toBe("DSA");
    expect(body.subjects[0].modules[0].title).toBe("Arrays");
  });

  it("POST /admin/learn/concepts creates concept and initial revision", async () => {
    mockFindUniqueConcept.mockResolvedValue(null);

    const res = await app.request("/admin/learn/concepts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moduleId: "m1",
        slug: "fast-slow-pointers",
        title: "Fast & Slow Pointers",
        summary: "Detect cycles and find middle node",
      }),
    });

    expect(res.status).toBe(201);
  });

  it("POST /admin/learn/concepts/:id/publish rejects incomplete revisions", async () => {
    mockFindUniqueConcept.mockResolvedValue({
      id: "c1",
      revisions: [{ id: "r1", version: 1, quickRevisionMd: "", deepDiveMd: "" }],
    });
    mockFindManyQuestions.mockResolvedValue([]);

    const res = await app.request("/admin/learn/concepts/c1/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Revision completeness validation failed");
    expect(body.validationErrors.length).toBeGreaterThan(0);
  });

  it("POST /admin/learn/concepts/:id/publish sets concept publishedRevisionId when complete", async () => {
    mockFindUniqueConcept.mockResolvedValue({
      id: "c1",
      revisions: [
        {
          id: "r1",
          version: 1,
          quickRevisionMd: "A".repeat(120),
          deepDiveMd: "B".repeat(350),
          keyTakeaways: ["Point 1", "Point 2"],
          commonMistakes: ["Mistake 1"],
        },
      ],
    });
    mockFindManyQuestions.mockResolvedValue([
      { id: "q1", prompt: "Q1", options: ["A", "B"], correctOption: 0 },
      { id: "q2", prompt: "Q2", options: ["A", "B"], correctOption: 1 },
    ]);

    const res = await app.request("/admin/learn/concepts/c1/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.publishedRevisionId).toBe("r1");
  });

  it("POST /admin/learn/concepts/:id/unpublish clears publishedRevisionId", async () => {
    mockUpdateConcept.mockResolvedValue({ id: "c1", publishedRevisionId: null });

    const res = await app.request("/admin/learn/concepts/c1/unpublish", {
      method: "POST",
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.publishedRevisionId).toBeNull();
  });

  it("PATCH /admin/learn/revisions/:id forks into new DRAFT revision when editing PUBLISHED revision", async () => {
    mockFindUniqueRevision.mockResolvedValue({
      id: "r1",
      conceptId: "c1",
      version: 1,
      status: "PUBLISHED",
      title: "Original Title",
      summary: "Original Summary",
    });
    mockFindFirstRevision.mockResolvedValue({ version: 1 });
    mockCreateRevision.mockResolvedValue({
      id: "r2",
      conceptId: "c1",
      version: 2,
      status: "DRAFT",
      title: "Updated Title",
    });

    const res = await app.request("/admin/learn/revisions/r1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Title" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.forked).toBe(true);
    expect(body.revision.version).toBe(2);
    expect(body.revision.status).toBe("DRAFT");
  });
});

