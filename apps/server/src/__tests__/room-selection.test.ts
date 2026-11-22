import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Hono } from "hono";

const mockFindUniqueRoom = mock(async () => null as any);
const mockFindManyProblems = mock(async () => [] as any[]);
const mockCountProblems = mock(async () => 0);
const mockFindManyMCQs = mock(async () => [] as any[]);
const mockCountMCQs = mock(async () => 0);
let createdRoomConfig: any = null;
let createdRoomQuestions: any[] = [];

const mockTransaction = mock(async (fn: any) => {
  if (typeof fn === "function") {
    return fn({
      room: {
        create: mock(async ({ data }: any) => {
          createdRoomConfig = data.config;
          return { id: "room-test-1", code: data.code, ...data };
        }),
      },
      roomParticipant: {
        create: mock(async () => ({ id: "rp-1" })),
      },
      roomQuestion: {
        createMany: mock(async ({ data }: any) => {
          createdRoomQuestions = data;
          return { count: data.length };
        }),
      },
    });
  }
  return Promise.all(fn);
});

const dbModels: Record<string, any> = {};
const mockDb = new Proxy(
  {
    room: {
      findUnique: mockFindUniqueRoom,
    },
    problem: {
      count: mockCountProblems,
      findMany: mockFindManyProblems,
    },
    assessmentQuestion: {
      count: mockCountMCQs,
      findMany: mockFindManyMCQs,
    },
    $transaction: mockTransaction,
  },
  {
    get(target, prop: string) {
      if (prop in target) return (target as any)[prop];
      if (!dbModels[prop]) dbModels[prop] = {};
      return dbModels[prop];
    },
    set(target, prop: string, value) {
      (target as any)[prop] = value;
      return true;
    },
  }
);

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
      getSession: mock(async () => ({
        user: { id: "user-1", email: "host@intervue.dev", role: "user" },
        session: { id: "sess-1" },
      })),
    },
  },
}));

const { default: roomRoutes } = await import("../routes/rooms");

describe("Contest Room Strict Selection & Anti-Pollution", () => {
  const app = new Hono();
  app.route("/rooms", roomRoutes);

  beforeEach(() => {
    mockFindUniqueRoom.mockReset();
    mockFindManyProblems.mockReset();
    mockCountProblems.mockReset();
    mockFindManyMCQs.mockReset();
    mockCountMCQs.mockReset();
    createdRoomConfig = null;
    createdRoomQuestions = [];
  });

  it("rejects room creation with 400 when assessment questions are insufficient (hard constraint)", async () => {
    // Only 2 QUANT questions in DB
    mockCountMCQs.mockResolvedValue(2);
    mockFindManyMCQs.mockResolvedValue([
      { id: "q1", subject: "QUANT", category: "APTITUDE" },
      { id: "q2", subject: "QUANT", category: "APTITUDE" },
    ]);

    const res = await app.request("/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Quant Speed Contest",
        type: "APTITUDE",
        duration: 30,
        assessmentCount: 5,
        assessmentSubjects: ["QUANT"],
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Insufficient assessment questions matching criteria");
    expect(body.requested).toBe(5);
    expect(body.available).toBe(2);
    expect(body.filters.subjects).toEqual(["QUANT"]);
  });

  it("never silently relaxes subject filters or fills QUANT with unrelated subjects", async () => {
    // 2 QUANT questions available
    mockCountMCQs.mockResolvedValue(2);
    mockFindManyMCQs.mockImplementation(async ({ where }: any) => {
      // If query filter is relaxed or searches outside QUANT, return other questions to catch fallback
      if (!where?.subject) {
        return [
          { id: "dbms1", subject: "DBMS" },
          { id: "os1", subject: "OS" },
        ];
      }
      return [
        { id: "q1", subject: "QUANT" },
        { id: "q2", subject: "QUANT" },
      ];
    });

    const res = await app.request("/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Strict Subject Room",
        type: "APTITUDE",
        duration: 30,
        assessmentCount: 4,
        assessmentSubjects: ["QUANT"],
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.available).toBe(2);
  });

  it("rejects room creation with 400 when coding problems matching tags/difficulty are insufficient", async () => {
    mockCountProblems.mockResolvedValue(1);
    mockFindManyProblems.mockResolvedValue([
      { id: 1, title: "DP Problem 1", difficulty: "HARD", tags: ["Dynamic Programming"] },
    ]);

    const res = await app.request("/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "DP Hard Contest",
        type: "CODING",
        duration: 60,
        codingCount: 3,
        codingDifficulty: "HARD",
        codingTags: ["Dynamic Programming"],
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Insufficient coding problems matching criteria");
    expect(body.requested).toBe(3);
    expect(body.available).toBe(1);
  });

  it("creates room, persists effective filters in config, and links strictly matching questions", async () => {
    mockCountMCQs.mockResolvedValue(4);
    mockFindManyMCQs.mockResolvedValue([
      { id: "q1", subject: "QUANT" },
      { id: "q2", subject: "QUANT" },
      { id: "q3", subject: "QUANT" },
      { id: "q4", subject: "QUANT" },
    ]);

    const res = await app.request("/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Quant Challenge",
        type: "APTITUDE",
        duration: 20,
        assessmentCount: 3,
        assessmentSubjects: ["QUANT"],
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.room).toBeDefined();

    // Verify room questions linked strictly match requested count and IDs
    expect(createdRoomQuestions.length).toBe(3);
    createdRoomQuestions.forEach((rq, idx) => {
      expect(rq.orderIndex).toBe(idx + 1);
      expect(rq.points).toBe(4);
      expect(["q1", "q2", "q3", "q4"]).toContain(rq.assessmentQuestionId);
    });

    // Verify effective filters persisted in config for auditing
    expect(createdRoomConfig).toBeDefined();
    expect(createdRoomConfig.assessmentSubjects).toEqual(["QUANT"]);
    expect(createdRoomConfig.requestedCounts.assessment).toBe(3);
  });

  it("rejects room creation with 400 when assessment questions matching specific topic are insufficient", async () => {
    // Only 1 question matching topic "Percentages"
    mockCountMCQs.mockImplementation(async ({ where }: any) => {
      if (where?.topic?.in?.includes("Percentages")) return 1;
      return 10;
    });

    const res = await app.request("/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Percentages Topic Room",
        type: "APTITUDE",
        duration: 30,
        assessmentCount: 3,
        assessmentSubjects: ["QUANT"],
        assessmentTopics: ["Percentages"],
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Insufficient assessment questions matching criteria");
    expect(body.requested).toBe(3);
    expect(body.available).toBe(1);
    expect(body.filters.topics).toEqual(["Percentages"]);
  });

  it("strictly filters assessment questions by topic, passes where.topic to query, and persists assessmentTopics in config", async () => {
    let capturedWhere: any = null;
    mockCountMCQs.mockImplementation(async ({ where }: any) => {
      capturedWhere = where;
      return 5;
    });
    mockFindManyMCQs.mockImplementation(async ({ where }: any) => {
      capturedWhere = where;
      return [
        { id: "q-p1", subject: "QUANT", topic: "Percentages" },
        { id: "q-p2", subject: "QUANT", topic: "Percentages" },
      ];
    });

    const res = await app.request("/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Topic Specific Contest",
        type: "APTITUDE",
        duration: 25,
        assessmentCount: 2,
        assessmentSubjects: ["QUANT"],
        assessmentTopics: ["Percentages"],
      }),
    });

    expect(res.status).toBe(200);
    expect(capturedWhere).toBeDefined();
    expect(capturedWhere.topic).toEqual({ in: ["Percentages"] });
    expect(capturedWhere.subject).toEqual({ in: ["QUANT"] });
    expect(createdRoomConfig.assessmentTopics).toEqual(["Percentages"]);
  });
});
