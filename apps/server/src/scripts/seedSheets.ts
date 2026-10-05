import { db } from "@intervue/db";

const SHEETS_CATALOG = [
  {
    slug: "striver_a2z",
    title: "Striver's A2Z DSA Sheet",
    subtitle: "Zero to Hero Comprehensive Roadmap",
    description: "Step-by-step master roadmap covering programming syntax, math, arrays, binary search, recursion, trees, graphs, and dynamic programming.",
    badge: "Most Popular",
    badgeColor: "blue",
    estimatedHours: "120 hrs",
    problems: [
      "two-sum", "valid-parentheses", "best-time-to-buy-and-sell-stock", "merge-sort-algorithm", 
      "maximum-subarray-sum-kadane", "3sum", "next-permutation", "trapping-rainwater", 
      "binary-search-on-sorted-array", "search-in-rotated-sorted-array", "find-peak-element", 
      "longest-substring-without-repeating"
    ]
  },
  {
    slug: "neetcode_150",
    title: "NeetCode 150",
    subtitle: "Pattern-Based FAANG Preparation",
    description: "The global gold standard sheet grouping problems by algorithmic patterns: Sliding Window, Monotonic Stack, Backtracking, and 2D Dynamic Programming.",
    badge: "Pattern Mastery",
    badgeColor: "emerald",
    estimatedHours: "80 hrs",
    problems: [
      "contains-duplicate-hash-set", "valid-anagram", "two-sum", "group-anagrams", 
      "top-k-frequent-elements", "valid-palindrome", "3sum", "container-with-most-water", 
      "trapping-rain-water", "longest-substring-without-repeating", "longest-repeating-character-replacement", 
      "minimum-window-substring"
    ]
  },
  {
    slug: "blind_75",
    title: "Blind 75",
    subtitle: "Essential 75 High-ROI LeetCode Problems",
    description: "The original curated list of 75 high-yield problems designed for rapid revision when you have 3 to 4 weeks before your technical interviews.",
    badge: "Fast Track",
    badgeColor: "amber",
    estimatedHours: "40 hrs",
    problems: [
      "two-sum", "best-time-to-buy-and-sell-stock", "contains-duplicate", "product-of-array-except-self", 
      "maximum-subarray", "3sum", "reverse-linked-list", "merge-two-sorted-lists", "valid-parentheses"
    ]
  }
];

async function main() {
  console.log("Seeding DSA Sheets...");

  for (const sheet of SHEETS_CATALOG) {
    // Upsert the sheet
    const createdSheet = await db.dsaSheet.upsert({
      where: { slug: sheet.slug },
      update: {
        title: sheet.title,
        subtitle: sheet.subtitle,
        description: sheet.description,
        badge: sheet.badge,
        badgeColor: sheet.badgeColor,
        estimatedHours: sheet.estimatedHours
      },
      create: {
        slug: sheet.slug,
        title: sheet.title,
        subtitle: sheet.subtitle,
        description: sheet.description,
        badge: sheet.badge,
        badgeColor: sheet.badgeColor,
        estimatedHours: sheet.estimatedHours
      }
    });

    console.log(`Upserted sheet: ${sheet.title}`);

    // Insert problems
    let orderIndex = 1;
    for (const slug of sheet.problems) {
      // Find the native problem
      const problem = await db.problem.findUnique({
        where: { slug }
      });

      if (problem) {
        await db.dsaSheetProblem.upsert({
          where: {
            sheetId_problemId: {
              sheetId: createdSheet.id,
              problemId: problem.id
            }
          },
          update: { orderIndex },
          create: {
            sheetId: createdSheet.id,
            problemId: problem.id,
            orderIndex
          }
        });
        console.log(`  Linked problem: ${slug}`);
        orderIndex++;
      } else {
        console.log(`  ⚠️ Skipping missing problem: ${slug}`);
      }
    }
  }

  console.log("Seeding complete!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
