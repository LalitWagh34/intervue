import { beforeEach, describe, expect, it, mock } from "bun:test";
import { db } from "@intervue/db";
import { CURATED_FLAGSHIP_SHEETS } from "../data/flagshipSheetsData";
import { sheetsRouter } from "../routes/sheets";
import { clearCache } from "../lib/cache";

describe("public sheet metrics", () => {
  beforeEach(async () => {
    mock.restore();
    await clearCache();
  });

  it("returns database and catalog-derived counts without synthetic activity", async () => {
    db.user.count = mock(async () => 7);

    const response = await sheetsRouter.request("/");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.stats).toEqual({
      totalUsers: 7,
      curatedSubjects: CURATED_FLAGSHIP_SHEETS.length,
      totalProblems: CURATED_FLAGSHIP_SHEETS.reduce((sum, sheet) => sum + sheet.problems.length, 0),
    });
    expect(body.stats).not.toHaveProperty("activeThisMonth");
  });

  it("reports an unavailable user count instead of a fabricated fallback", async () => {
    db.user.count = mock(async () => {
      throw new Error("database unavailable");
    });

    const response = await sheetsRouter.request("/");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.stats.totalUsers).toBeNull();
    expect(body.stats.totalProblems).toBeGreaterThan(0);
  });
});
