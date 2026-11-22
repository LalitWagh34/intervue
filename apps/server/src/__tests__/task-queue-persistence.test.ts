import { describe, expect, it } from "bun:test";
import { TaskQueue } from "../services/taskQueue";

class FakeExecutionJobDatabase {
  jobs = new Map<string, any>();
  sequence = 0;

  executionJob = {} as any;

  constructor() {
    this.executionJob.count = async ({ where }: any) =>
      [...this.jobs.values()].filter((job) => {
        if (where?.status && job.status !== where.status) return false;
        if (where?.createdAt?.lte && job.createdAt > where.createdAt.lte) return false;
        return true;
      }).length;
    this.executionJob.create = async ({ data }: any) => {
      const job = {
        id: `job-${++this.sequence}`,
        ...data,
        attemptCount: 0,
        nextAttemptAt: null,
        leaseExpiresAt: null,
        startedAt: null,
        completedAt: null,
        durationMs: null,
        result: null,
        error: null,
        createdAt: new Date(Date.now() + this.sequence),
      };
      this.jobs.set(job.id, job);
      return { ...job };
    };
    this.executionJob.findUnique = async ({ where }: any) => {
      const job = this.jobs.get(where.id);
      return job ? { ...job } : null;
    };
    this.executionJob.findFirst = async ({ where }: any) => {
      if (where.id) {
        const job = this.jobs.get(where.id);
        if (!job || (where.userId && job.userId !== where.userId)) return null;
        return { ...job };
      }
      const now = where.OR?.[1]?.nextAttemptAt?.lte;
      const candidate = [...this.jobs.values()]
        .filter((job) => job.status === "QUEUED")
        .filter((job) => job.attemptCount < (where.attemptCount?.lt ?? 999))
        .filter((job) => !job.nextAttemptAt || !now || job.nextAttemptAt <= now)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
      return candidate ? { ...candidate } : null;
    };
    this.executionJob.updateMany = async ({ where, data }: any) => {
      let count = 0;
      for (const job of this.jobs.values()) {
        if (where.id && job.id !== where.id) continue;
        if (where.userId && job.userId !== where.userId) continue;
        if (typeof where.status === "string" && job.status !== where.status) continue;
        if (where.status?.in && !where.status.in.includes(job.status)) continue;
        if (where.attemptCount?.lt !== undefined && !(job.attemptCount < where.attemptCount.lt)) continue;
        if (where.attemptCount?.gte !== undefined && !(job.attemptCount >= where.attemptCount.gte)) continue;
        if (where.leaseExpiresAt?.lt && !(job.leaseExpiresAt && job.leaseExpiresAt < where.leaseExpiresAt.lt)) continue;
        for (const [key, value] of Object.entries(data)) {
          if (value && typeof value === "object" && "increment" in value) {
            job[key] += (value as any).increment;
          } else {
            job[key] = value;
          }
        }
        count++;
      }
      return { count };
    };
    this.executionJob.groupBy = async () => [];
    this.executionJob.deleteMany = async () => ({ count: 0 });
  }
}

function waitForCompletion(queue: TaskQueue) {
  return new Promise<void>((resolve) => queue.once("job:completed", () => resolve()));
}

describe("persistent task queue", () => {
  it("processes a job from a previous queue instance after restart", async () => {
    const database = new FakeExecutionJobDatabase();
    const firstInstance = new TaskQueue(1, 50, { database, autoStart: false });
    const job = await firstInstance.enqueue({
      type: "RUN",
      userId: "user-1",
      problemId: 101,
      sourceCode: "console.log('persisted')",
      language: "javascript",
    });

    const restartedInstance = new TaskQueue(1, 50, {
      database,
      autoStart: false,
      runner: async () => ({ verdict: "Accepted" }),
    });
    const completed = waitForCompletion(restartedInstance);
    await restartedInstance.processAvailableJobs(new Date());
    await completed;

    const persisted = database.jobs.get(job.id);
    expect(persisted.status).toBe("COMPLETED");
    expect(persisted.sourceCode).toBe("console.log('persisted')");
    expect(persisted.result).toEqual({ verdict: "Accepted" });
  });

  it("allows only one queue instance to claim the same persisted job", async () => {
    const database = new FakeExecutionJobDatabase();
    const producer = new TaskQueue(1, 50, { database, autoStart: false });
    await producer.enqueue({ type: "RUN", userId: "user-1", problemId: 101, sourceCode: "code", language: "js" });
    let executions = 0;
    const runner = async () => {
      executions++;
      return { verdict: "Accepted" };
    };
    const workerA = new TaskQueue(1, 50, { database, runner, autoStart: false });
    const workerB = new TaskQueue(1, 50, { database, runner, autoStart: false });

    await Promise.all([workerA.processAvailableJobs(new Date()), workerB.processAvailableJobs(new Date())]);
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(executions).toBe(1);
  });

  it("recovers an expired processing lease after restart", async () => {
    const database = new FakeExecutionJobDatabase();
    const producer = new TaskQueue(1, 50, { database, autoStart: false });
    const job = await producer.enqueue({ type: "SUBMIT", userId: "user-1", problemId: 101, sourceCode: "code", language: "js" });
    Object.assign(database.jobs.get(job.id), {
      status: "PROCESSING",
      attemptCount: 1,
      leaseExpiresAt: new Date("2026-11-22T08:00:00.000Z"),
    });
    const worker = new TaskQueue(1, 50, {
      database,
      autoStart: false,
      runner: async () => ({ verdict: "Accepted" }),
    });
    const completed = waitForCompletion(worker);

    await worker.processAvailableJobs(new Date("2026-11-22T09:00:00.000Z"));
    await completed;

    expect(database.jobs.get(job.id).status).toBe("COMPLETED");
    expect(database.jobs.get(job.id).attemptCount).toBe(2);
  });

  it("keeps job inspection and cancellation owner-scoped", async () => {
    const database = new FakeExecutionJobDatabase();
    const queue = new TaskQueue(1, 50, { database, autoStart: false });
    const job = await queue.enqueue({ type: "RUN", userId: "owner", problemId: 101, sourceCode: "private", language: "js" });

    expect(await queue.getJob(job.id, "outsider")).toBeNull();
    expect(await queue.cancelJob(job.id, "outsider")).toBe(false);
    expect(await queue.cancelJob(job.id, "owner")).toBe(true);
    expect(database.jobs.get(job.id).status).toBe("CANCELLED");
  });
});
