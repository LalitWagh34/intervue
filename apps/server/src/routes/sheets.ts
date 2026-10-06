import { Hono } from "hono";
import { db } from "@intervue/db";

const app = new Hono();

// ─── GET /api/sheets ───────────────────────────────────────────────────
app.get("/", async (c) => {
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
              }
            }
          },
          orderBy: {
            orderIndex: "asc"
          }
        }
      }
    });

    const userCount = await db.user.count();

    // Format the response to match the frontend expectations
    const formattedSheets = sheets.map(sheet => ({
      id: sheet.slug,
      subjectId: "dsa",
      title: sheet.title,
      subtitle: sheet.subtitle,
      description: sheet.description,
      badge: sheet.badge,
      badgeColor: sheet.badgeColor,
      problemCount: sheet.problems.length, // Uses actual count of problems linked
      estimatedHours: sheet.estimatedHours,
      problems: sheet.problems.map((sp, index) => ({
        id: sp.id,
        index: index + 1,
        title: sp.problem.title,
        slug: sp.problem.slug,
        difficulty: sp.problem.difficulty === "EASY" ? "Basic" : sp.problem.difficulty === "MEDIUM" ? "Core" : "Hard",
        topic: sp.problem.tags.length > 0 ? sp.problem.tags[0] : "General",
        moreTopics: sp.problem.tags.length > 1 ? sp.problem.tags.length - 1 : 0,
        companies: sp.problem.company,
      }))
    }));

    return c.json({ 
      sheets: formattedSheets,
      stats: {
        totalUsers: userCount,
        curatedSubjects: formattedSheets.length,
        activeThisMonth: Math.floor(userCount * 0.4) + 1200 // Mocking active users for now based on total
      }
    });
  } catch (error) {
    console.error("Error fetching sheets:", error);
    return c.json({ error: "Failed to fetch sheets" }, 500);
  }
});

export { app as sheetsRouter };
