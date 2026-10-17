import { Hono } from "hono";
import { db } from "@intervue/db";
import { CURATED_FLAGSHIP_SHEETS } from "../data/flagshipSheetsData";

const app = new Hono();

// ─── GET /api/sheets ───────────────────────────────────────────────────
app.get("/", async (c) => {
  let formattedSheets: any[] = [];
  let userCount = 1420;

  try {
    const sheets = await db.dsaSheet.findMany({
      include: {
        problems: {
          include: {
            problem: {
              select: {
                id: true,
                title: true,
                slug: true,
                difficulty: true,
                tags: true,
                company: true,
              },
            },
          },
          orderBy: {
            orderIndex: "asc",
          },
        },
      },
    });

    if (sheets && sheets.length > 0) {
      formattedSheets = sheets.map((sheet) => ({
        id: sheet.slug,
        subjectId: "dsa",
        title: sheet.title,
        subtitle: sheet.subtitle,
        description: sheet.description,
        badge: sheet.badge,
        badgeColor: sheet.badgeColor,
        problemCount: sheet.problems.length,
        estimatedHours: sheet.estimatedHours,
        problems: sheet.problems.map((sp, index) => ({
          id: sp.id,
          index: index + 1,
          title: sp.problem.title,
          slug: sp.problem.slug,
          difficulty:
            sp.problem.difficulty === "EASY"
              ? "Basic"
              : sp.problem.difficulty === "MEDIUM"
              ? "Core"
              : "Hard",
          topic: sp.problem.tags.length > 0 ? sp.problem.tags[0] : "General",
          moreTopics: sp.problem.tags.length > 1 ? sp.problem.tags.length - 1 : 0,
          companies: sp.problem.company,
          link: `https://leetcode.com/problems/${sp.problem.slug}`,
        })),
      }));
    }

    try {
      const realUserCount = await db.user.count();
      if (realUserCount > 0) userCount = realUserCount;
    } catch {
      // Ignore count error in offline/pool exhaustion scenarios
    }
  } catch (error) {
    console.warn("Notice: Database sheets query failed or empty, using curated flagship sheets.", error);
  }

  // Gracefully fallback to our curated flagship sheets if database is empty
  if (formattedSheets.length === 0) {
    formattedSheets = CURATED_FLAGSHIP_SHEETS;
  }

  return c.json({
    sheets: formattedSheets,
    stats: {
      totalUsers: userCount,
      curatedSubjects: formattedSheets.length,
      activeThisMonth: Math.floor(userCount * 0.4) + 1200,
    },
  });
});

export { app as sheetsRouter };
