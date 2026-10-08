import { redis, isRedisConnected } from "../lib/redis.js";

export interface RawCompanyQuestion {
  difficulty: "EASY" | "MEDIUM" | "HARD";
  title: string;
  slug: string;
  frequency: number;
  acceptanceRate: number | null;
  link: string;
  topics: string[];
}

export interface CuratedCompanyProblem {
  id: string | number;
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | string;
  frequency: number;
  tags: string[];
  matchingTargetCompanies: string[];
  link: string;
}

// In-memory cache to avoid repeated GitHub fetches
const companyCache = new Map<string, { data: RawCompanyQuestion[]; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 2; // 2 hours

export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function processCSV(csvText: string): RawCompanyQuestion[] {
  const lines = csvText.trim().split("\n");
  if (lines.length <= 1) return [];

  const questions: RawCompanyQuestion[] = [];
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine) continue;
    const line = rawLine.trim();
    if (!line) continue;

    const parts = parseCSVLine(line);
    if (parts.length < 5) continue;

    const rawDiff = (parts[0] || "EASY").toUpperCase();
    const difficulty: "EASY" | "MEDIUM" | "HARD" =
      rawDiff === "HARD" ? "HARD" : rawDiff === "MEDIUM" ? "MEDIUM" : "EASY";
    const title = parts[1] || "Problem";
    const frequency = parts[2] || "0";
    const acceptanceRate = parts[3] || "";
    const link = parts[4] || "";
    const topics = parts[5] || "";

    // Ignore placeholder mock problem rows if any
    if (title.toLowerCase().startsWith("mock problem")) continue;

    // Extract slug from link: https://leetcode.com/problems/two-sum
    const slugMatch = link ? link.match(/problems\/([^\/]+)/) : null;
    const slug = slugMatch ? slugMatch[1] : title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    questions.push({
      difficulty,
      title,
      slug,
      frequency: parseFloat(frequency) || 0,
      acceptanceRate: acceptanceRate ? parseFloat(acceptanceRate) : null,
      link: link || `https://leetcode.com/problems/${slug}`,
      topics: topics
        ? topics
            .replace(/^"|"$/g, "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    });
  }

  return questions;
}

const FILE_MAP: Record<string, string> = {
  thirtyDays: "1.%20Thirty%20Days.csv",
  threeMonths: "2.%20Three%20Months.csv",
  sixMonths: "3.%20Six%20Months.csv",
  all: "5.%20All.csv",
};

export async function fetchCompanyQuestions(
  companyName: string,
  timeframe = "thirtyDays"
): Promise<RawCompanyQuestion[]> {
  const fileName = FILE_MAP[timeframe] || FILE_MAP.thirtyDays;
  const cacheKey = `company:${companyName}_${fileName}`;

  // 1. Check Redis
  if (isRedisConnected) {
    try {
      const redisData = await redis.get(cacheKey);
      if (redisData) {
        return JSON.parse(redisData);
      }
    } catch (e) {
      // Redis error fallback
    }
  }

  // 2. Check Memory Cache
  const cached = companyCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // 3. Fetch from GitHub repository
  let parsedQuestions: RawCompanyQuestion[] = [];
  try {
    const url = `https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/${encodeURIComponent(
      companyName
    )}/${fileName}`;

    const res = await fetch(url);
    if (!res.ok) {
      // Fallback to "5. All.csv"
      const fallbackUrl = `https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/${encodeURIComponent(
        companyName
      )}/5.%20All.csv`;
      const fallbackRes = await fetch(fallbackUrl);
      if (fallbackRes.ok) {
        const text = await fallbackRes.text();
        parsedQuestions = processCSV(text);
      }
    } else {
      const text = await res.text();
      parsedQuestions = processCSV(text);
    }
  } catch (err) {
    console.error(`Error fetching questions for company ${companyName}:`, err);
  }

  // Cache results
  if (parsedQuestions.length > 0) {
    if (isRedisConnected) {
      try {
        await redis.set(cacheKey, JSON.stringify(parsedQuestions), "EX", 7200);
      } catch (e) {}
    }
    companyCache.set(cacheKey, { data: parsedQuestions, timestamp: Date.now() });
  }

  return parsedQuestions;
}

/**
 * Fetch deduplicated curated problems across multiple selected target companies.
 * Combines matching target companies on common questions.
 */
export async function getCuratedProblemsForCompanies(
  companyNames: string[]
): Promise<CuratedCompanyProblem[]> {
  if (!companyNames || companyNames.length === 0) return [];

  // Fetch all companies in parallel
  const results = await Promise.all(
    companyNames.map(async (company) => {
      const questions = await fetchCompanyQuestions(company, "thirtyDays");
      // If 30-day question list is small, fetch all-time
      if (questions.length < 20) {
        const allQuestions = await fetchCompanyQuestions(company, "all");
        return { company, questions: allQuestions.length > 0 ? allQuestions : questions };
      }
      return { company, questions };
    })
  );

  // Map by slug to deduplicate and aggregate company tags
  const problemMap = new Map<string, CuratedCompanyProblem>();

  for (const { company, questions } of results) {
    for (const q of questions) {
      const existing = problemMap.get(q.slug);
      if (existing) {
        if (!existing.matchingTargetCompanies.includes(company)) {
          existing.matchingTargetCompanies.push(company);
        }
        // Take highest frequency
        if (q.frequency > existing.frequency) {
          existing.frequency = q.frequency;
        }
      } else {
        problemMap.set(q.slug, {
          id: q.slug,
          title: q.title,
          slug: q.slug,
          difficulty: q.difficulty,
          frequency: q.frequency,
          tags: q.topics,
          matchingTargetCompanies: [company],
          link: q.link,
        });
      }
    }
  }

  // Sort by highest frequency / importance
  const sorted = Array.from(problemMap.values()).sort((a, b) => b.frequency - a.frequency);
  return sorted;
}
