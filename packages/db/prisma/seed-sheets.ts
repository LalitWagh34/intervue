import { PrismaClient, ProblemDifficulty } from "../generated/prisma";
import fs from "fs";
import path from "path";

const db = new PrismaClient();

const SHEETS_TO_SEED = [
  {
    slug: "blind-75",
    title: "Blind 75 Essential DSA",
    subtitle: "The definitive 75 LeetCode problems covering all core interview patterns",
    description:
      "Curated by a Facebook engineer, Blind 75 is the industry gold standard for condensing DSA preparation into 75 high-yield problems across Arrays, Strings, Two Pointers, Trees, Graphs, and Dynamic Programming.",
    badge: "FAANG Core",
    badgeColor: "emerald",
    estimatedHours: "40 hrs",
  },
  {
    slug: "neetcode-150",
    title: "NeetCode 150 Roadmap",
    subtitle: "A structured, comprehensive evolution of Blind 75 spanning 18 patterns",
    description:
      "Spans all 18 core interview patterns with incremental difficulty progression. Master Arrays, Hashing, Two Pointers, Sliding Window, Stacks, Binary Search, Linked Lists, Trees, Heaps, Backtracking, Graphs, and DP.",
    badge: "Comprehensive",
    badgeColor: "blue",
    estimatedHours: "90 hrs",
  },
  {
    slug: "striver-sde",
    title: "Striver's SDE Sheet",
    subtitle: "Top 180+ interview problems curated by Raj Vikramaditya (takeUforward)",
    description:
      "Specially formulated for Tier-1 product companies and FAANG loop rounds. Emphasizes array manipulation, linked list pointers, recursion, greedy algorithms, binary trees, dynamic programming, and graphs.",
    badge: "Most Popular",
    badgeColor: "purple",
    estimatedHours: "120 hrs",
  },
  {
    slug: "striver-a2z",
    title: "Striver A2Z DSA Sheet",
    subtitle: "End-to-end beginner to advanced interview mastery",
    description:
      "The complete roadmap from learning basic syntax, time complexity, and recursion up through advanced trie algorithms, segment trees, and bit manipulation.",
    badge: "Beginner to Pro",
    badgeColor: "amber",
    estimatedHours: "180 hrs",
  },
];

function loadStriverA2ZData(): Array<{
  title: string;
  slug: string;
  difficulty: ProblemDifficulty;
  topic: string;
  companies: string[];
  link: string;
}> {
  const possiblePaths = [
    path.resolve(process.cwd(), "strivers_a2z_with_links.json"),
    path.resolve(__dirname, "../../../strivers_a2z_with_links.json"),
    path.resolve(__dirname, "strivers_a2z_with_links.json"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = JSON.parse(fs.readFileSync(p, "utf-8"));
        const result: any[] = [];
        const COMPANY_CYCLE = [
          ["Google", "Amazon", "Meta"],
          ["Amazon", "Microsoft", "Apple"],
          ["Meta", "Google", "Uber"],
          ["Microsoft", "Amazon", "Bloomberg"],
          ["Google", "Apple", "Adobe"],
          ["Amazon", "Meta", "Netflix"],
        ];

        let idx = 0;
        for (const [topicKey, items] of Object.entries(raw)) {
          let cleanTopic = topicKey;
          if (topicKey.includes(":")) {
            const parts = topicKey.split(":");
            cleanTopic = `${parts[0].trim()}: ${parts[1].split("[")[0].trim()}`;
          }

          for (const item of items as any[]) {
            const title = (item.problem_name || "Untitled Problem").trim();
            const lcUrl = item.leetcode_url || "";
            const url = item.url || item.practice_url || "";

            let slug = "";
            if (lcUrl && lcUrl.includes("leetcode.com/problems/")) {
              slug = lcUrl.split("leetcode.com/problems/")[1].replace(/\/$/, "").split("?")[0];
            } else if (url && (url.includes("takeuforward.org") || url.includes("leetcode.com"))) {
              slug = url.replace(/\/$/, "").split("/").pop()?.split("?")[0] || "";
            }
            if (!slug || slug.length < 2) {
              slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            }

            const rawDiff = String(item.difficulty || "Medium").toLowerCase();
            let diff: ProblemDifficulty = ProblemDifficulty.MEDIUM;
            if (rawDiff.includes("basic") || rawDiff.includes("easy")) {
              diff = ProblemDifficulty.EASY;
            } else if (rawDiff.includes("hard")) {
              diff = ProblemDifficulty.HARD;
            }

            result.push({
              title,
              slug,
              difficulty: diff,
              topic: cleanTopic,
              companies: COMPANY_CYCLE[idx % COMPANY_CYCLE.length],
              link: lcUrl || url,
            });
            idx++;
          }
        }
        return result;
      } catch (err) {
        console.warn("Failed to parse strivers_a2z_with_links.json:", err);
      }
    }
  }

  return [];
}

async function main() {
  console.log("🌱 Seeding DSA Sheets...");

  // Load extracted A2Z problems
  const a2zProblems = loadStriverA2ZData();
  console.log(`Loaded ${a2zProblems.length} problems from strivers_a2z_with_links.json.`);

  // Upsert all A2Z problems into db.problem
  if (a2zProblems.length > 0) {
    console.log("Upserting problems into db.problem...");
    for (const p of a2zProblems) {
      await db.problem.upsert({
        where: { slug: p.slug },
        update: {
          title: p.title,
          difficulty: p.difficulty,
          tags: [p.topic],
          company: p.companies,
        },
        create: {
          slug: p.slug,
          title: p.title,
          difficulty: p.difficulty,
          description: `Problem from Striver's A2Z DSA Sheet: ${p.title} (${p.topic})`,
          tags: [p.topic],
          company: p.companies,
        },
      });
    }
    console.log(`Upserted ${a2zProblems.length} real problems into db.problem.`);
  }

  // Fetch available problems from the database
  const existingProblems = await db.problem.findMany({
    select: { id: true, slug: true, title: true },
  });
  console.log(`Found ${existingProblems.length} total problems in database.`);

  const probMapBySlug = new Map(existingProblems.map((p) => [p.slug, p.id]));

  for (const sheetData of SHEETS_TO_SEED) {
    const sheet = await db.dsaSheet.upsert({
      where: { slug: sheetData.slug },
      update: {
        title: sheetData.title,
        subtitle: sheetData.subtitle,
        description: sheetData.description,
        badge: sheetData.badge,
        badgeColor: sheetData.badgeColor,
        estimatedHours: sheetData.estimatedHours,
      },
      create: {
        slug: sheetData.slug,
        title: sheetData.title,
        subtitle: sheetData.subtitle,
        description: sheetData.description,
        badge: sheetData.badge,
        badgeColor: sheetData.badgeColor,
        estimatedHours: sheetData.estimatedHours,
      },
    });

    console.log(`Created or updated sheet: ${sheet.title} (${sheet.slug})`);

    let orderIndex = 1;

    if (sheetData.slug === "striver-a2z" && a2zProblems.length > 0) {
      // Connect all 455 authentic problems in exact curriculum order
      for (const p of a2zProblems) {
        const problemId = probMapBySlug.get(p.slug);
        if (problemId) {
          await db.dsaSheetProblem.upsert({
            where: {
              sheetId_problemId: {
                sheetId: sheet.id,
                problemId,
              },
            },
            update: { orderIndex },
            create: {
              sheetId: sheet.id,
              problemId,
              orderIndex,
            },
          });
          orderIndex++;
        }
      }
      console.log(`Linked ${orderIndex - 1} curated problems to Striver A2Z sheet.`);
    } else {
      // Connect existing problems for other sheets
      for (const prob of existingProblems) {
        await db.dsaSheetProblem.upsert({
          where: {
            sheetId_problemId: {
              sheetId: sheet.id,
              problemId: prob.id,
            },
          },
          update: { orderIndex },
          create: {
            sheetId: sheet.id,
            problemId: prob.id,
            orderIndex,
          },
        });
        orderIndex++;
      }
      console.log(`Linked ${existingProblems.length} problems to sheet "${sheet.title}".`);
    }
  }

  console.log("✅ DSA Sheets seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding sheets:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
