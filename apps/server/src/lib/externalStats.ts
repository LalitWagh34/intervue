export interface LeetCodeStats {
  handle: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  calendar: Record<string, number>; // unix timestamp seconds -> count
  lastSyncedAt: string;
}

export interface CodeforcesStats {
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
  solvedCount: number;
  calendar: Record<string, number>; // YYYY-MM-DD -> count
  lastSyncedAt: string;
}

export interface GitHubStats {
  handle: string;
  publicRepos: number;
  followers: number;
  avatarUrl: string;
  profileUrl: string;
  lastSyncedAt: string;
}

export async function fetchLeetCodeStats(username: string): Promise<LeetCodeStats> {
  const cleanUsername = username.trim().toLowerCase();
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    body: JSON.stringify({
      query: `query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            ranking
          }
          submitStats: submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
          submissionCalendar
        }
      }`,
      variables: { username: cleanUsername },
    }),
  });

  if (!res.ok) {
    throw new Error(`LeetCode API request failed with status ${res.status}`);
  }

  const data = (await res.json()) as any;
  const matchedUser = data?.data?.matchedUser;

  if (!matchedUser) {
    throw new Error(`LeetCode user "${username}" not found`);
  }

  const acList: Array<{ difficulty: string; count: number }> =
    matchedUser.submitStats?.acSubmissionNum || [];

  const total = acList.find((x) => x.difficulty === "All")?.count || 0;
  const easy = acList.find((x) => x.difficulty === "Easy")?.count || 0;
  const medium = acList.find((x) => x.difficulty === "Medium")?.count || 0;
  const hard = acList.find((x) => x.difficulty === "Hard")?.count || 0;

  let calendarMap: Record<string, number> = {};
  try {
    if (matchedUser.submissionCalendar) {
      calendarMap = JSON.parse(matchedUser.submissionCalendar);
    }
  } catch {
    calendarMap = {};
  }

  return {
    handle: matchedUser.username || cleanUsername,
    totalSolved: total,
    easySolved: easy,
    mediumSolved: medium,
    hardSolved: hard,
    ranking: matchedUser.profile?.ranking || 0,
    calendar: calendarMap,
    lastSyncedAt: new Date().toISOString(),
  };
}

export async function fetchCodeforcesStats(username: string): Promise<CodeforcesStats> {
  const cleanUsername = username.trim();

  // 1. User info
  const infoRes = await fetch(
    `https://codeforces.com/api/user.info?handles=${encodeURIComponent(cleanUsername)}`
  );
  if (!infoRes.ok) {
    throw new Error(`Codeforces API request failed with status ${infoRes.status}`);
  }

  const infoData = (await infoRes.json()) as any;
  if (infoData.status !== "OK" || !infoData.result?.[0]) {
    throw new Error(`Codeforces user "${username}" not found`);
  }
  const user = infoData.result[0];

  // 2. User submissions (up to 2000 submissions for calendar & solved count)
  const statusRes = await fetch(
    `https://codeforces.com/api/user.status?handle=${encodeURIComponent(cleanUsername)}&from=1&count=2000`
  );

  const calendar: Record<string, number> = {};
  const solvedProblemSet = new Set<string>();

  if (statusRes.ok) {
    const statusData = (await statusRes.json()) as any;
    if (statusData.status === "OK" && Array.isArray(statusData.result)) {
      statusData.result.forEach((sub: any) => {
        // Date calculation (UTC)
        if (sub.creationTimeSeconds) {
          const d = new Date(sub.creationTimeSeconds * 1000);
          const y = d.getUTCFullYear();
          const m = String(d.getUTCMonth() + 1).padStart(2, "0");
          const day = String(d.getUTCDate()).padStart(2, "0");
          const dateKey = `${y}-${m}-${day}`;
          calendar[dateKey] = (calendar[dateKey] || 0) + 1;
        }

        // Distinct solved problem
        if (sub.verdict === "OK" && sub.problem) {
          const problemKey = `${sub.problem.contestId || 0}_${sub.problem.index || ""}_${sub.problem.name || ""}`;
          solvedProblemSet.add(problemKey);
        }
      });
    }
  }

  return {
    handle: user.handle || cleanUsername,
    rating: user.rating || 0,
    maxRating: user.maxRating || 0,
    rank: user.rank || "unrated",
    maxRank: user.maxRank || "unrated",
    solvedCount: solvedProblemSet.size,
    calendar,
    lastSyncedAt: new Date().toISOString(),
  };
}

export async function fetchGitHubStats(username: string): Promise<GitHubStats> {
  const cleanUsername = username.trim();
  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}`, {
    headers: {
      "User-Agent": "Intervue-Platform",
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub user "${username}" not found`);
  }

  const data = (await res.json()) as any;

  return {
    handle: data.login || cleanUsername,
    publicRepos: data.public_repos || 0,
    followers: data.followers || 0,
    avatarUrl: data.avatar_url || "",
    profileUrl: data.html_url || `https://github.com/${cleanUsername}`,
    lastSyncedAt: new Date().toISOString(),
  };
}
