import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";

const app = new Hono<{ Variables: AuthVariables }>();

// ─── GET /api/profile ──────────────────────────────────────────────────
app.get("/", requireAuth, async (c) => {
  const user = c.get("user");

  const profile = await db.profile.findUnique({
    where: { userId: user.id },
    include: { user: true },
  });
  if (!profile) {
    return c.json({ error: "Profile not found" }, 400);
  }

  return c.json({ profile });
});

// ─── POST /api/profile/setup ───────────────────────────────────────────
app.post("/setup", requireAuth, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();

  const profile = await db.profile.upsert({
    where: { userId: user.id },
    update: {
      fullName: body.fullName,
      targetRole: body.targetRole,
      experienceLevel: body.experienceLevel,
      githubUrl: body.githubUrl,
      linkedinUrl: body.linkedinUrl,
      skills: body.skills || [],
    },
    create: {
      userId: user.id,
      fullName: body.fullName,
      targetRole: body.targetRole,
      experienceLevel: body.experienceLevel,
      githubUrl: body.githubUrl,
      linkedinUrl: body.linkedinUrl,
      skills: body.skills || [],
    },
  });
  return c.json({ profile });
});

// ─── GET /api/profile/me ───────────────────────────────────────────────
app.get("/me", requireAuth, async (c) => {
  const user = c.get("user");

  const profile = await db.profile.findUnique({
    where: { userId: user.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return c.json({ profile });
});

// ─── GET /api/profile/stats ────────────────────────────────────────────
// Dynamic calculation of submission heatmap, question wheel, and topic counts
app.get("/stats", requireAuth, async (c) => {
  try {
    const user = c.get("user");

    // 1. Fetch user data with submissions and profile
    const userRecord = await db.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        submissions: {
          include: {
            problem: {
              select: {
                id: true,
                title: true,
                slug: true,
                difficulty: true,
                tags: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        roomSubmissions: {
          include: {
            problem: {
              select: {
                id: true,
                title: true,
                slug: true,
                difficulty: true,
                tags: true,
              },
            },
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    // 2. Fetch all published problems in the system
    const allProblems = await db.problem.findMany({
      where: { status: "published" },
      select: { id: true, difficulty: true, tags: true },
    });

    const totalProblemsCount = allProblems.length;
    const totalEasyCount = allProblems.filter((p) => p.difficulty === "EASY").length;
    const totalMediumCount = allProblems.filter((p) => p.difficulty === "MEDIUM").length;
    const totalHardCount = allProblems.filter((p) => p.difficulty === "HARD").length;

    // 3. User's Solved Problems (Unique problemId where accepted)
    const solvedProblemsMap = new Map<number, { id: number; difficulty: string; tags: string[] }>();

    (userRecord?.submissions || []).forEach((sub) => {
      if ((sub.isAccepted || sub.verdict === "ACCEPTED") && sub.problem) {
        if (!solvedProblemsMap.has(sub.problemId)) {
          solvedProblemsMap.set(sub.problemId, {
            id: sub.problem.id,
            difficulty: sub.problem.difficulty,
            tags: sub.problem.tags || [],
          });
        }
      }
    });

    (userRecord?.roomSubmissions || []).forEach((rsub) => {
      if (rsub.verdict === "ACCEPTED" && rsub.problem) {
        if (!solvedProblemsMap.has(rsub.problemId)) {
          solvedProblemsMap.set(rsub.problemId, {
            id: rsub.problem.id,
            difficulty: rsub.problem.difficulty,
            tags: rsub.problem.tags || [],
          });
        }
      }
    });

    const solvedProblems = Array.from(solvedProblemsMap.values());
    const solvedTotal = solvedProblems.length;
    const solvedEasy = solvedProblems.filter((p) => p.difficulty === "EASY").length;
    const solvedMedium = solvedProblems.filter((p) => p.difficulty === "MEDIUM").length;
    const solvedHard = solvedProblems.filter((p) => p.difficulty === "HARD").length;

    // 4. Topic-wise solved counts based on question tags
    const tagCounts: Record<string, number> = {};
    solvedProblems.forEach((p) => {
      p.tags.forEach((tag) => {
        const formattedTag = tag.trim();
        if (formattedTag) {
          tagCounts[formattedTag] = (tagCounts[formattedTag] || 0) + 1;
        }
      });
    });

    // Collect all unique tags in the database
    const allDbTags = new Set<string>();
    allProblems.forEach((p) => (p.tags || []).forEach((t) => allDbTags.add(t.trim())));

    // Fallback common interview topics if database has only few problems seeded yet
    const fallbackTopics = [
      "Arrays",
      "Strings",
      "Hash Table",
      "Two Pointers",
      "Binary Search",
      "Linked List",
      "Stack & Queue",
      "Binary Trees",
      "Dynamic Programming",
      "Graphs",
    ];
    fallbackTopics.forEach((t) => allDbTags.add(t));

    const topicStats = Array.from(allDbTags)
      .filter(Boolean)
      .map((tag) => {
        // match case-insensitively for friendly tag display
        const count =
          tagCounts[tag] ||
          tagCounts[tag.toLowerCase()] ||
          tagCounts[tag.replace(/\s+/g, "-").toLowerCase()] ||
          0;
        return {
          tag: tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, " "),
          rawTag: tag,
          count,
        };
      })
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

    function toDateKey(d: Date): string {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }

    // 5. 52-Week Submission Heatmap Calendar Calculation
    const submissionDates: Date[] = [];
    (userRecord?.submissions || []).forEach((s) => submissionDates.push(new Date(s.createdAt)));
    (userRecord?.roomSubmissions || []).forEach((s) => submissionDates.push(new Date(s.submittedAt)));

    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setUTCDate(now.getUTCDate() - 364); // 52 weeks (365 days)

    const dateCounts: Record<string, number> = {};
    submissionDates.forEach((d) => {
      const key = toDateKey(d);
      dateCounts[key] = (dateCounts[key] || 0) + 1;
    });

    let totalSubmissionsLastYear = 0;
    let activeDays = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    const calendarDays: Array<{ date: string; count: number; level: number }> = [];

    for (let i = 0; i <= 364; i++) {
      const d = new Date(oneYearAgo);
      d.setUTCDate(oneYearAgo.getUTCDate() + i);
      const dateStr = toDateKey(d);
      const count = dateCounts[dateStr] || 0;

      let level = 0;
      if (count >= 10) level = 4;
      else if (count >= 6) level = 3;
      else if (count >= 3) level = 2;
      else if (count >= 1) level = 1;

      calendarDays.push({ date: dateStr, count, level });

      if (count > 0) {
        totalSubmissionsLastYear += count;
        activeDays++;
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    // Calculate current streak backwards from today/yesterday
    const todayStr = toDateKey(now);
    const yesterday = new Date(now);
    yesterday.setUTCDate(now.getUTCDate() - 1);
    const yesterdayStr = toDateKey(yesterday);

    if (dateCounts[todayStr] || dateCounts[yesterdayStr]) {
      let checkDate = dateCounts[todayStr] ? now : yesterday;
      while (true) {
        const key = toDateKey(checkDate);
        if (dateCounts[key]) {
          currentStreak++;
          checkDate = new Date(checkDate);
          checkDate.setUTCDate(checkDate.getUTCDate() - 1);
        } else {
          break;
        }
      }
    }

    // 6. Contests
    const totalContests = await db.roomParticipant.count({
      where: { userId: user.id },
    });

    return c.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      profile: userRecord?.profile,
      consistency: {
        totalSubmissions: totalSubmissionsLastYear,
        activeDays,
        bestStreak: Math.max(bestStreak, currentStreak),
        currentStreak,
        totalContests,
        calendarDays,
      },
      dsaProgress: {
        totalSolved: solvedTotal,
        totalProblems: totalProblemsCount,
        easy: { solved: solvedEasy, total: totalEasyCount },
        medium: { solved: solvedMedium, total: totalMediumCount },
        hard: { solved: solvedHard, total: totalHardCount },
      },
      topicStats,
    });
  } catch (error) {
    console.error("Error computing profile stats:", error);
    return c.json({ error: "Failed to compute profile statistics" }, 500);
  }
});

export default app;