import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";
import {
  fetchLeetCodeStats,
  fetchCodeforcesStats,
  fetchGitHubStats,
  type LeetCodeStats,
  type CodeforcesStats,
  type GitHubStats,
} from "../lib/externalStats";

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

// ─── POST /api/profile/connect-platform ─────────────────────────────────
app.post("/connect-platform", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const { platform, handle } = await c.req.json<{
      platform: "leetcode" | "codeforces" | "github";
      handle: string;
    }>();

    if (!handle || !handle.trim()) {
      return c.json({ error: "Handle is required" }, 400);
    }

    const cleanHandle = handle.trim();
    let statsData: any = null;

    if (platform === "leetcode") {
      statsData = await fetchLeetCodeStats(cleanHandle);
      await db.profile.upsert({
        where: { userId: user.id },
        update: {
          leetcodeHandle: cleanHandle,
          leetcodeData: statsData as any,
          lastSyncedAt: new Date(),
        },
        create: {
          userId: user.id,
          leetcodeHandle: cleanHandle,
          leetcodeData: statsData as any,
          lastSyncedAt: new Date(),
        },
      });
    } else if (platform === "codeforces") {
      statsData = await fetchCodeforcesStats(cleanHandle);
      await db.profile.upsert({
        where: { userId: user.id },
        update: {
          codeforcesHandle: cleanHandle,
          codeforcesData: statsData as any,
          lastSyncedAt: new Date(),
        },
        create: {
          userId: user.id,
          codeforcesHandle: cleanHandle,
          codeforcesData: statsData as any,
          lastSyncedAt: new Date(),
        },
      });
    } else if (platform === "github") {
      statsData = await fetchGitHubStats(cleanHandle);
      await db.profile.upsert({
        where: { userId: user.id },
        update: {
          githubHandle: cleanHandle,
          githubUrl: statsData.profileUrl,
          githubData: statsData as any,
          lastSyncedAt: new Date(),
        },
        create: {
          userId: user.id,
          githubHandle: cleanHandle,
          githubUrl: statsData.profileUrl,
          githubData: statsData as any,
          lastSyncedAt: new Date(),
        },
      });
    } else {
      return c.json({ error: "Unsupported platform" }, 400);
    }

    return c.json({ success: true, platform, data: statsData });
  } catch (err: any) {
    console.error("Connect platform error:", err);
    return c.json({ error: err.message || "Failed to connect platform" }, 400);
  }
});

// ─── POST /api/profile/sync-all ─────────────────────────────────────────
app.post("/sync-all", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const profile = await db.profile.findUnique({ where: { userId: user.id } });

    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }

    let updatedLc = profile.leetcodeData;
    let updatedCf = profile.codeforcesData;
    let updatedGh = profile.githubData;

    if (profile.leetcodeHandle) {
      try {
        updatedLc = (await fetchLeetCodeStats(profile.leetcodeHandle)) as any;
      } catch (e) {
        console.warn("LeetCode sync failed:", e);
      }
    }

    if (profile.codeforcesHandle) {
      try {
        updatedCf = (await fetchCodeforcesStats(profile.codeforcesHandle)) as any;
      } catch (e) {
        console.warn("Codeforces sync failed:", e);
      }
    }

    if (profile.githubHandle) {
      try {
        updatedGh = (await fetchGitHubStats(profile.githubHandle)) as any;
      } catch (e) {
        console.warn("GitHub sync failed:", e);
      }
    }

    const updatedProfile = await db.profile.update({
      where: { userId: user.id },
      data: {
        leetcodeData: updatedLc as any,
        codeforcesData: updatedCf as any,
        githubData: updatedGh as any,
        lastSyncedAt: new Date(),
      },
    });

    return c.json({ success: true, profile: updatedProfile });
  } catch (err: any) {
    console.error("Sync all error:", err);
    return c.json({ error: err.message || "Failed to sync profiles" }, 500);
  }
});

// ─── POST /api/profile/disconnect-platform ─────────────────────────────
app.post("/disconnect-platform", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const { platform } = await c.req.json<{
      platform: "leetcode" | "codeforces" | "github";
    }>();

    const updateData: any = {};
    if (platform === "leetcode") {
      updateData.leetcodeHandle = null;
      updateData.leetcodeData = null;
    } else if (platform === "codeforces") {
      updateData.codeforcesHandle = null;
      updateData.codeforcesData = null;
    } else if (platform === "github") {
      updateData.githubHandle = null;
      updateData.githubData = null;
    }

    const profile = await db.profile.update({
      where: { userId: user.id },
      data: updateData,
    });

    return c.json({ success: true, profile });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to disconnect platform" }, 400);
  }
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

    // 5. Build Platform-Specific Date Maps for 52-Week Heatmap
    const intervueDateCounts: Record<string, number> = {};
    const leetcodeDateCounts: Record<string, number> = {};
    const codeforcesDateCounts: Record<string, number> = {};
    const allDateCounts: Record<string, number> = {};

    // 5a. Intervue Submissions
    (userRecord?.submissions || []).forEach((s) => {
      const key = toDateKey(new Date(s.createdAt));
      intervueDateCounts[key] = (intervueDateCounts[key] || 0) + 1;
      allDateCounts[key] = (allDateCounts[key] || 0) + 1;
    });
    (userRecord?.roomSubmissions || []).forEach((s) => {
      const key = toDateKey(new Date(s.submittedAt));
      intervueDateCounts[key] = (intervueDateCounts[key] || 0) + 1;
      allDateCounts[key] = (allDateCounts[key] || 0) + 1;
    });

    // 5b. LeetCode Submissions from cached calendar
    const lcData = userRecord?.profile?.leetcodeData as LeetCodeStats | null;
    if (lcData?.calendar) {
      Object.entries(lcData.calendar).forEach(([ts, count]) => {
        const timestampMs = parseInt(ts, 10) * 1000;
        if (!isNaN(timestampMs)) {
          const key = toDateKey(new Date(timestampMs));
          const numCount = Number(count) || 1;
          leetcodeDateCounts[key] = (leetcodeDateCounts[key] || 0) + numCount;
          allDateCounts[key] = (allDateCounts[key] || 0) + numCount;
        }
      });
    }

    // 5c. Codeforces Submissions from cached calendar
    const cfData = userRecord?.profile?.codeforcesData as CodeforcesStats | null;
    if (cfData?.calendar) {
      Object.entries(cfData.calendar).forEach(([dateStr, count]) => {
        const numCount = Number(count) || 1;
        codeforcesDateCounts[dateStr] = (codeforcesDateCounts[dateStr] || 0) + numCount;
        allDateCounts[dateStr] = (allDateCounts[dateStr] || 0) + numCount;
      });
    }

    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setUTCDate(now.getUTCDate() - 364); // 52 weeks (365 days)

    // Helper to compute calendar grid and streak metrics for any dateCounts map
    function generateCalendarMetrics(countsMap: Record<string, number>) {
      let totalSubmissions = 0;
      let activeDays = 0;
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;

      const calendarDays: Array<{ date: string; count: number; level: number }> = [];

      for (let i = 0; i <= 364; i++) {
        const d = new Date(oneYearAgo);
        d.setUTCDate(oneYearAgo.getUTCDate() + i);
        const dateStr = toDateKey(d);
        const count = countsMap[dateStr] || 0;

        let level = 0;
        if (count >= 10) level = 4;
        else if (count >= 6) level = 3;
        else if (count >= 3) level = 2;
        else if (count >= 1) level = 1;

        calendarDays.push({ date: dateStr, count, level });

        if (count > 0) {
          totalSubmissions += count;
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

      if (countsMap[todayStr] || countsMap[yesterdayStr]) {
        let checkDate = countsMap[todayStr] ? now : yesterday;
        while (true) {
          const key = toDateKey(checkDate);
          if (countsMap[key]) {
            currentStreak++;
            checkDate = new Date(checkDate);
            checkDate.setUTCDate(checkDate.getUTCDate() - 1);
          } else {
            break;
          }
        }
      }

      return {
        calendarDays,
        totalSubmissions,
        activeDays,
        bestStreak: Math.max(bestStreak, currentStreak),
        currentStreak,
      };
    }

    const allMetrics = generateCalendarMetrics(allDateCounts);
    const intervueMetrics = generateCalendarMetrics(intervueDateCounts);
    const leetcodeMetrics = generateCalendarMetrics(leetcodeDateCounts);
    const codeforcesMetrics = generateCalendarMetrics(codeforcesDateCounts);

    // 6. Contests
    const totalContests = await db.roomParticipant.count({
      where: { userId: user.id },
    });

    // 7. Combined Progress across Intervue, LeetCode, Codeforces
    const combinedTotal =
      solvedTotal + (lcData?.totalSolved || 0) + (cfData?.solvedCount || 0);

    return c.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      profile: userRecord?.profile,
      // Default consistency maps to ALL (or Intervue if no external connected)
      consistency: {
        ...allMetrics,
        totalContests,
      },
      // Multi-platform individual calendar views
      calendars: {
        ALL: { ...allMetrics, totalContests },
        INTERVUE: { ...intervueMetrics, totalContests },
        LEETCODE: { ...leetcodeMetrics, totalContests: 0 },
        CODEFORCES: { ...codeforcesMetrics, totalContests: 0 },
      },
      dsaProgress: {
        totalSolved: solvedTotal,
        totalProblems: totalProblemsCount,
        easy: { solved: solvedEasy, total: totalEasyCount },
        medium: { solved: solvedMedium, total: totalMediumCount },
        hard: { solved: solvedHard, total: totalHardCount },
      },
      combinedProgress: {
        totalSolved: combinedTotal,
        easy: { solved: solvedEasy + (lcData?.easySolved || 0) },
        medium: { solved: solvedMedium + (lcData?.mediumSolved || 0) },
        hard: { solved: solvedHard + (lcData?.hardSolved || 0) },
        codeforces: { solved: cfData?.solvedCount || 0 },
        intervue: { solved: solvedTotal },
      },
      leetcodeStats: lcData,
      codeforcesStats: cfData,
      githubStats: (userRecord?.profile?.githubData as GitHubStats | null) || null,
      topicStats,
    });
  } catch (error) {
    console.error("Error computing profile stats:", error);
    return c.json({ error: "Failed to compute profile statistics" }, 500);
  }
});

export default app;