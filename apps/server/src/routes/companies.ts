import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";

const app = new Hono<{ Variables: AuthVariables }>();

// Top featured companies for quick navigation
export const FEATURED_COMPANIES = [
  { name: "Google", slug: "google", totalProblems: 2305, icon: "G" },
  { name: "Amazon", slug: "amazon", totalProblems: 1968, icon: "A" },
  { name: "Meta", slug: "meta", totalProblems: 100, icon: "M" },
  { name: "Microsoft", slug: "microsoft", totalProblems: 100, icon: "MS" },
  { name: "Apple", slug: "apple", totalProblems: 300, icon: "🍎" },
  { name: "Bloomberg", slug: "bloomberg", totalProblems: 1200, icon: "BB" },
  { name: "Uber", slug: "uber", totalProblems: 362, icon: "U" },
  { name: "TikTok", slug: "tiktok", totalProblems: 351, icon: "TT" },
  { name: "Goldman Sachs", slug: "goldman-sachs", totalProblems: 261, icon: "GS" },
  { name: "Adobe", slug: "adobe", totalProblems: 148, icon: "AD" },
  { name: "Flipkart", slug: "flipkart", totalProblems: 105, icon: "FK" },
  { name: "PhonePe", slug: "phonepe", totalProblems: 93, icon: "PP" },
  { name: "TCS", slug: "tcs", totalProblems: 228, icon: "TC" },
  { name: "Infosys", slug: "infosys", totalProblems: 100, icon: "INF" },
  { name: "Walmart Labs", slug: "walmart-labs", totalProblems: 144, icon: "W" },
  { name: "Salesforce", slug: "salesforce", totalProblems: 188, icon: "SF" },
  { name: "Nvidia", slug: "nvidia", totalProblems: 136, icon: "NV" },
  { name: "Cisco", slug: "cisco", totalProblems: 87, icon: "CS" },
];

// In-memory cache to avoid repeated GitHub fetches
const companyCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

function parseCSVLine(line: string): string[] {
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

// ─── GET /api/companies ────────────────────────────────────────────────
app.get("/", requireAuth, async (c) => {
  return c.json({ companies: FEATURED_COMPANIES });
});

// ─── GET /api/companies/:company ───────────────────────────────────────
app.get("/:company", requireAuth, async (c) => {
  try {
    const companyParam = c.req.param("company");
    if (!companyParam) {
      return c.json({ error: "Company parameter is required" }, 400);
    }
    const timeframe = c.req.query("timeframe") || "thirtyDays";

    // Match company name
    const foundCompany = FEATURED_COMPANIES.find(
      (comp) =>
        comp.slug.toLowerCase() === companyParam.toLowerCase() ||
        comp.name.toLowerCase() === companyParam.toLowerCase()
    );

    const companyName = foundCompany ? foundCompany.name : companyParam;

    // File name mapping in the repo
    const fileMap: Record<string, string> = {
      thirtyDays: "1.%20Thirty%20Days.csv",
      threeMonths: "2.%20Three%20Months.csv",
      sixMonths: "3.%20Six%20Months.csv",
      all: "5.%20All.csv",
    };

    const fileName = fileMap[timeframe] || fileMap.thirtyDays;
    const cacheKey = `${companyName}_${fileName}`;

    let parsedQuestions: any[] = [];

    const cached = companyCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      parsedQuestions = cached.data;
    } else {
      const url = `https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/${encodeURIComponent(
        companyName
      )}/${fileName}`;

      const res = await fetch(url);
      if (!res.ok) {
        // Fallback to "5. All.csv" if 30 days is not available
        const fallbackUrl = `https://raw.githubusercontent.com/liquidslr/leetcode-company-wise-problems/main/${encodeURIComponent(
          companyName
        )}/5.%20All.csv`;
        const fallbackRes = await fetch(fallbackUrl);
        if (!fallbackRes.ok) {
          return c.json({ error: `Questions for company "${companyName}" not found` }, 404);
        }
        const text = await fallbackRes.text();
        parsedQuestions = processCSV(text);
      } else {
        const text = await res.text();
        parsedQuestions = processCSV(text);
      }

      companyCache.set(cacheKey, { data: parsedQuestions, timestamp: Date.now() });
    }

    // Cross-reference with our database problems to see which can be solved natively
    const dbProblems = await db.problem.findMany({
      select: { id: true, slug: true, title: true },
    });
    const dbSlugMap = new Map(dbProblems.map((p) => [p.slug.toLowerCase(), p]));

    const enrichedQuestions = parsedQuestions.map((q) => {
      const native = dbSlugMap.get(q.slug.toLowerCase());
      return {
        ...q,
        isNative: Boolean(native),
        nativeId: native ? native.id : null,
      };
    });

    return c.json({
      company: companyName,
      timeframe,
      totalCount: enrichedQuestions.length,
      questions: enrichedQuestions,
    });
  } catch (err: any) {
    console.error("Error fetching company questions:", err);
    return c.json({ error: err.message || "Failed to fetch company questions" }, 500);
  }
});

function processCSV(csvText: string) {
  const lines = csvText.trim().split("\n");
  if (lines.length <= 1) return [];

  const questions = [];
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine) continue;
    const line = rawLine.trim();
    if (!line) continue;

    const parts = parseCSVLine(line);
    if (parts.length < 5) continue;

    const difficulty = parts[0] || "EASY";
    const title = parts[1] || "Problem";
    const frequency = parts[2] || "0";
    const acceptanceRate = parts[3] || "";
    const link = parts[4] || "";
    const topics = parts[5] || "";

    // Extract slug from link: https://leetcode.com/problems/two-sum
    const slugMatch = link ? link.match(/problems\/([^\/]+)/) : null;
    const slug = slugMatch ? slugMatch[1] : title.toLowerCase().replace(/\s+/g, "-");

    questions.push({
      difficulty: difficulty.toUpperCase(),
      title,
      slug,
      frequency: parseFloat(frequency) || 0,
      acceptanceRate: acceptanceRate ? parseFloat(acceptanceRate) : null,
      link,
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

export default app;
