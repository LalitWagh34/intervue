import { beforeEach, describe, expect, it, mock } from "bun:test";
import { db } from "@intervue/db";
import { app } from "../index";

describe("health and readiness probes", () => {
  beforeEach(() => mock.restore());

  it("keeps process liveness independent of downstream services", async () => {
    const response = await app.request("/live");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("reports ready only when the database responds", async () => {
    db.$queryRaw = mock(async () => [{ value: 1 }]) as any;
    const response = await app.request("/ready");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ready", database: "available" });
  });

  it("fails readiness without exposing database errors", async () => {
    db.$queryRaw = mock(async () => { throw new Error("secret database address"); }) as any;
    const response = await app.request("/ready");
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "not_ready", database: "unavailable" });
  });
});
