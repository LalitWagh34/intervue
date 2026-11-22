import { Hono } from "hono";
import { db } from "@intervue/db";
import { CURATED_FLAGSHIP_SHEETS } from "../data/flagshipSheetsData";

const app = new Hono();

// ─── GET /api/sheets ───────────────────────────────────────────────────
app.get("/", async (c) => {
  let userCount: number | null = null;

  try {
    userCount = await db.user.count();
  } catch {
    // Catalog data remains available, but the response must not invent a user count.
  }

  const totalProblems = CURATED_FLAGSHIP_SHEETS.reduce(
    (sum, sheet) => sum + sheet.problems.length,
    0
  );

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
