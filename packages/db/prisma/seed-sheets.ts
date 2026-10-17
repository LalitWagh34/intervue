import { PrismaClient } from "../generated/prisma";

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

async function main() {
  console.log("🌱 Seeding DSA Sheets...");

  // 1. Fetch available problems from the database
  const existingProblems = await db.problem.findMany({
    select: { id: true, slug: true, title: true },
  });
  console.log(`Found ${existingProblems.length} problems in database.`);

  for (const sheetData of SHEETS_TO_SEED) {
    // Upsert DsaSheet
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

    // Connect existing problems to this sheet if not already connected
    let orderIndex = 1;
    for (const prob of existingProblems) {
      await db.dsaSheetProblem.upsert({
        where: {
          sheetId_problemId: {
            sheetId: sheet.id,
            problemId: prob.id,
          },
        },
        update: {
          orderIndex,
        },
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
