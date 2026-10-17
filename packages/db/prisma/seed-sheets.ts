import { PrismaClient, ProblemDifficulty } from "../generated/prisma";
import {
  BLIND_75_PROBLEMS,
  NEETCODE_150_PROBLEMS,
  STRIVER_SDE_PROBLEMS,
  STRIVER_A2Z_PROBLEMS,
} from "../../../apps/server/src/data/flagshipSheetsData";

const db = new PrismaClient();

async function main() {
  console.log("🧹 1. Cleaning up any legacy mock sheets & problems...");

  // Delete legacy underscore sheets and relations
  await db.dsaSheetProblem.deleteMany({
    where: {
      sheet: {
        slug: { in: ["striver_a2z", "neetcode_150", "blind_75"] },
      },
    },
  });

  await db.dsaSheet.deleteMany({
    where: {
      slug: { in: ["striver_a2z", "neetcode_150", "blind_75"] },
    },
  });

  // Remove mock problems
  await db.problem.deleteMany({
    where: {
      OR: [
        { slug: { startsWith: "mock-problem" } },
        { title: { startsWith: "Mock Problem" } },
      ],
    },
  });

  // Reset sheet problems for the 4 flagship sheets
  await db.dsaSheetProblem.deleteMany({
    where: {
      sheet: {
        slug: { in: ["blind-75", "neetcode-150", "striver-sde", "striver-a2z"] },
      },
    },
  });

  console.log("🌱 2. Upserting 4 Flagship Curriculums...");
  const SHEETS_CONFIG = [
    {
      slug: "blind-75",
      title: "Blind 75 Essential DSA",
      subtitle: "The definitive 75 LeetCode problems covering all core interview patterns",
      description:
        "Curated by a Facebook engineer, Blind 75 is the industry gold standard for condensing DSA preparation into 75 high-yield problems across Arrays, Strings, Two Pointers, Trees, Graphs, and Dynamic Programming.",
      badge: "FAANG Core",
      badgeColor: "emerald",
      estimatedHours: "40 hrs",
      problems: BLIND_75_PROBLEMS,
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
      problems: NEETCODE_150_PROBLEMS,
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
      problems: STRIVER_SDE_PROBLEMS,
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
      problems: STRIVER_A2Z_PROBLEMS,
    },
  ];

  for (const s of SHEETS_CONFIG) {
    const sheet = await db.dsaSheet.upsert({
      where: { slug: s.slug },
      update: {
        title: s.title,
        subtitle: s.subtitle,
        description: s.description,
        badge: s.badge,
        badgeColor: s.badgeColor,
        estimatedHours: s.estimatedHours,
      },
      create: {
        slug: s.slug,
        title: s.title,
        subtitle: s.subtitle,
        description: s.description,
        badge: s.badge,
        badgeColor: s.badgeColor,
        estimatedHours: s.estimatedHours,
      },
    });

    console.log(`Upserting ${s.problems.length} problems for ${s.title}...`);

    for (const p of s.problems) {
      let diff: ProblemDifficulty = ProblemDifficulty.MEDIUM;
      if (p.difficulty === "Basic") diff = ProblemDifficulty.EASY;
      else if (p.difficulty === "Hard") diff = ProblemDifficulty.HARD;

      const dbProb = await db.problem.upsert({
        where: { slug: p.slug },
        update: {
          title: p.title,
          difficulty: diff,
          tags: [p.topic],
          company: p.companies,
        },
        create: {
          slug: p.slug,
          title: p.title,
          difficulty: diff,
          description: `Problem ${p.title} from ${s.title} (${p.topic})`,
          tags: [p.topic],
          company: p.companies,
        },
      });

      await db.dsaSheetProblem.upsert({
        where: {
          sheetId_problemId: {
            sheetId: sheet.id,
            problemId: dbProb.id,
          },
        },
        update: {
          orderIndex: p.index,
        },
        create: {
          sheetId: sheet.id,
          problemId: dbProb.id,
          orderIndex: p.index,
        },
      });
    }

    console.log(`✓ Loaded ${s.problems.length} problems for "${s.title}".`);
  }

  console.log("🎉 Seeding completed successfully with 100% authentic curated problems!");
}

main()
  .catch((e) => {
    console.error("❌ Error in seed-sheets:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
