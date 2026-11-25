import { Hono } from "hono";
import { db } from "@intervue/db";
import { CURATED_FLAGSHIP_SHEETS } from "../data/flagshipSheetsData";
import { cacheGetOrSet } from "../lib/cache";

const app = new Hono();
const SHEETS_USER_COUNT_CACHE_KEY = "sheets:user-count";
const SHEETS_USER_COUNT_TTL_SECONDS = 300;

// ─── GET /api/sheets ───────────────────────────────────────────────────
app.get("/", async (c) => {
  let userCount: number | null = null;

  try {
    userCount = await cacheGetOrSet<number>(
      SHEETS_USER_COUNT_CACHE_KEY,
      SHEETS_USER_COUNT_TTL_SECONDS,
      async () => await db.user.count()
    );
  } catch {
    // Catalog data remains available, but the response must not invent a user count.
  }

  const totalProblems = CURATED_FLAGSHIP_SHEETS.reduce(
    (sum, sheet) => sum + sheet.problems.length,
    0
  );

  c.header("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
  return c.json({
    sheets: CURATED_FLAGSHIP_SHEETS,
    stats: {
      totalUsers: userCount,
      curatedSubjects: CURATED_FLAGSHIP_SHEETS.length,
      totalProblems,
    },
  });
});

export { app as sheetsRouter };
