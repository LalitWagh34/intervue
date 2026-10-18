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
      const FLAGSHIP_ORDER = ["striver-a2z", "blind-75", "neetcode-150", "striver-sde"];
      
      const CURATED_PROB_MAP = new Map<string, any>();
      for (const sheet of CURATED_FLAGSHIP_SHEETS) {
        for (const prob of sheet.problems) {
          CURATED_PROB_MAP.set(prob.slug, prob);
          CURATED_PROB_MAP.set(prob.title.toLowerCase().trim(), prob);
        }
      }

      formattedSheets = sheets
        .filter((sheet) => !sheet.slug.includes("mock") && !sheet.title.includes("Mock"))
        .map((sheet) => {
          const normalizedSlug = sheet.slug.replace(/_/g, "-");
          return {
            id: normalizedSlug,
            subjectId: "dsa",
            title: sheet.title,
            subtitle: sheet.subtitle,
            description: sheet.description,
            badge: sheet.badge,
            badgeColor: sheet.badgeColor,
            problemCount: sheet.problems.length,
            estimatedHours: sheet.estimatedHours,
            problems: sheet.problems.map((sp, index) => {
              const curated =
                CURATED_PROB_MAP.get(sp.problem.slug) ||
                CURATED_PROB_MAP.get(sp.problem.title.toLowerCase().trim());
              const link =
                curated?.link ||
                (sp.problem.slug.startsWith("http")
                  ? sp.problem.slug
                  : `https://takeuforward.org/practice/dsa/${sp.problem.slug}`);
              const videoUrl = curated?.videoUrl || "";
              const cleanTopic = curated?.topic || (sp.problem.tags.length > 0 ? sp.problem.tags[0] : "General");
              const cleanSubtopic = curated?.subtopic || cleanTopic;

              return {
                id: String(sp.id),
                index: index + 1,
                title: sp.problem.title,
                slug: sp.problem.slug,
                difficulty:
                  sp.problem.difficulty === "EASY"
                    ? "Basic"
                    : sp.problem.difficulty === "MEDIUM"
                    ? "Core"
                    : "Hard",
                topic: cleanTopic,
                subtopic: cleanSubtopic,
                moreTopics: 0,
                companies: [], // Companies removed per user request
                link,
                videoUrl,
              };
            }),
          };
        })
        .sort((a, b) => {
          const idxA = FLAGSHIP_ORDER.indexOf(a.id);
          const idxB = FLAGSHIP_ORDER.indexOf(b.id);
          return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
        });
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
