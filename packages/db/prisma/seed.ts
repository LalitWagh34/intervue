import { PrismaClient } from "../generated/prisma";

const db = new PrismaClient();

async function main() {
  // Avoid creating duplicate Two Sum problems
  const existing = await db.problem.findUnique({
    where: {
      slug: "two-sum",
    },
  });

  if (existing) {
    console.log(`Two Sum already exists with ID: ${existing.id}`);
    return;
  }

  const problem = await db.problem.create({
    data: {
      title: "Two Sum",
      slug: "two-sum",
      difficulty: "EASY",
      status: "published",

      description: `
Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target.

You may assume that each input has exactly one solution.

You may return the answer in any order.

Use 0-based indexing.
      `.trim(),

      constraints: `
2 <= nums.length <= 100000
-1000000000 <= nums[i] <= 1000000000
-1000000000 <= target <= 1000000000
Exactly one valid answer exists.
      `.trim(),

      inputFormat: `
The first line contains an integer n, the size of the array.
The second line contains n space-separated integers representing nums.
The third line contains an integer target.
      `.trim(),

      outputFormat: `
Print two space-separated indices whose corresponding values add up to target.
      `.trim(),

      hints: [
        "Try using a hash map to store values you have already seen.",
        "For each number x, look for target - x."
      ],

      editorial: `
Use a hash map storing each number and its index.

For every nums[i], calculate complement = target - nums[i].
If complement already exists in the hash map, return its index and i.
Otherwise store nums[i] with index i.

Time complexity: O(n)
Space complexity: O(n)
      `.trim(),

      tags: ["array", "hash-map"],
      company: [],

      timeLimit: 1000,
      memoryLimit: 256,

      testCases: {
        create: [
          {
            input: `4
2 7 11 15
9`,
            expectedOutput: `0 1`,
            isHidden: false,
            orderIndex: 0,
          },
          {
            input: `3
3 2 4
6`,
            expectedOutput: `1 2`,
            isHidden: false,
            orderIndex: 1,
          },
          {
            input: `2
3 3
6`,
            expectedOutput: `0 1`,
            isHidden: false,
            orderIndex: 2,
          },

          // Hidden tests
          {
            input: `5
-1 -2 -3 -4 -5
-8`,
            expectedOutput: `2 4`,
            isHidden: true,
            orderIndex: 3,
          },
          {
            input: `6
10 20 30 40 50 60
90`,
            expectedOutput: `2 4`,
            isHidden: true,
            orderIndex: 4,
          },
          {
            input: `5
1000000000 -1000000000 5 7 3
10`,
            expectedOutput: `2 3`,
            isHidden: true,
            orderIndex: 5,
          },
          {
            input: `8
1 5 9 12 20 25 30 40
65`,
            expectedOutput: `5 7`,
            isHidden: true,
            orderIndex: 6,
          },
        ],
      },
    },
  });

  console.log("✅ Two Sum created successfully!");
  console.log(`Problem ID: ${problem.id}`);
  console.log(`Slug: ${problem.slug}`);
  console.log(`Test cases: ${problem.testCases.length}`);
}

main()
  .catch((error) => {
    console.error("❌ Failed to create Two Sum:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });