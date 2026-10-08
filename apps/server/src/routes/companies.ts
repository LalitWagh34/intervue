import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { db } from "@intervue/db";
import type { AuthVariables } from "../types";
import { redis, isRedisConnected } from "../lib/redis.js";

const app = new Hono<{ Variables: AuthVariables }>();

// Top featured companies for quick navigation
export const FEATURED_COMPANIES = [
  { name: "Google", slug: "google", totalProblems: 2305, icon: "G" },
  { name: "Amazon", slug: "amazon", totalProblems: 1968, icon: "A" },
  { name: "Meta", slug: "meta", totalProblems: 100, icon: "M" },
  { name: "Microsoft", slug: "microsoft", totalProblems: 100, icon: "MS" },
  { name: "Apple", slug: "apple", totalProblems: 300, icon: "🍎" },
  { name: "Netflix", slug: "netflix", totalProblems: 120, icon: "N" },
  { name: "Bloomberg", slug: "bloomberg", totalProblems: 1200, icon: "BB" },
  { name: "Uber", slug: "uber", totalProblems: 362, icon: "U" },
  { name: "Oracle", slug: "oracle", totalProblems: 431, icon: "OR" },
  { name: "Goldman Sachs", slug: "goldman-sachs", totalProblems: 261, icon: "GS" },
  { name: "JPMorgan", slug: "jpmorgan", totalProblems: 150, icon: "JPM" },
  { name: "Adobe", slug: "adobe", totalProblems: 148, icon: "AD" },
  { name: "LinkedIn", slug: "linkedin", totalProblems: 240, icon: "IN" },
  { name: "Atlassian", slug: "atlassian", totalProblems: 90, icon: "AT" },
  { name: "Salesforce", slug: "salesforce", totalProblems: 188, icon: "SF" },
  { name: "Nvidia", slug: "nvidia", totalProblems: 136, icon: "NV" },
  { name: "PayPal", slug: "paypal", totalProblems: 110, icon: "PY" },
  { name: "Visa", slug: "visa", totalProblems: 85, icon: "VI" },
  { name: "Walmart Labs", slug: "walmart-labs", totalProblems: 144, icon: "W" },
  { name: "Flipkart", slug: "flipkart", totalProblems: 105, icon: "FK" },
  { name: "TCS", slug: "tcs", totalProblems: 228, icon: "TC" },
  { name: "Infosys", slug: "infosys", totalProblems: 100, icon: "INF" },
  { name: "IBM", slug: "ibm", totalProblems: 95, icon: "IBM" },
  { name: "TikTok", slug: "tiktok", totalProblems: 351, icon: "TT" },
  { name: "PhonePe", slug: "phonepe", totalProblems: 93, icon: "PP" },
  { name: "Cisco", slug: "cisco", totalProblems: 87, icon: "CS" },
];

// Use companyService for questions fetching and caching
import { fetchCompanyQuestions } from "../services/companyService";

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
    const parsedQuestions = await fetchCompanyQuestions(companyName, timeframe);

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

export default app;
