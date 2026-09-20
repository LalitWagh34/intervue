import { PrismaClient } from "../generated/prisma";

const db = new PrismaClient();

async function main() {
  // Avoid creating duplicate Two Sum problems
  const existing = await db.problem.findUnique({
    where: {
      slug: "two-sum",
    },
  });

  const templates = [
    {
      language: "CPP" as const,
      code: `#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) return 0;

    vector<int> nums(n);
    for (int i = 0; i < n; i++) {
        cin >> nums[i];
    }

    int target;
    cin >> target;

    // Write your code here

    return 0;
}`,
    },
    {
      language: "PYTHON" as const,
      code: `import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    nums = [int(x) for x in input_data[1:1+n]]
    target = int(input_data[1+n])

    # Write your code here


if __name__ == '__main__':
    solve()`,
    },
    {
      language: "JAVASCRIPT" as const,
      code: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length < 3) return;
    const n = parseInt(input[0], 10);
    const nums = input.slice(1, 1 + n).map(Number);
    const target = parseInt(input[1 + n], 10);

    // Write your code here

}

solve();`,
    },
    {
      language: "TYPESCRIPT" as const,
      code: `import * as fs from 'fs';

function solve(): void {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length < 3) return;
    const n = parseInt(input[0], 10);
    const nums = input.slice(1, 1 + n).map(Number);
    const target = parseInt(input[1 + n], 10);

    // Write your code here

}

solve();`,
    },
    {
      language: "JAVA" as const,
      code: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) {
            nums[i] = sc.nextInt();
        }
        int target = sc.nextInt();

        // Write your code here

    }
}`,
    },
  ];

  const testCasesData = [
    {
      input: `4\n2 7 11 15\n9`,
      expectedOutput: `0 1`,
      isHidden: false,
      orderIndex: 0,
    },
    {
      input: `3\n3 2 4\n6`,
      expectedOutput: `1 2`,
      isHidden: false,
      orderIndex: 1,
    },
    {
      input: `2\n3 3\n6`,
      expectedOutput: `0 1`,
      isHidden: false,
      orderIndex: 2,
    },

    // Hidden tests
    {
      input: `5\n-1 -2 -3 -4 -5\n-8`,
      expectedOutput: `2 4`,
      isHidden: true,
      orderIndex: 3,
    },
    {
      input: `5\n10 25 30 45 70\n100`,
      expectedOutput: `2 4`,
      isHidden: true,
      orderIndex: 4,
    },
    {
      input: `5\n1000000000 -1000000000 5 7 3\n10`,
      expectedOutput: `3 4`,
      isHidden: true,
      orderIndex: 5,
    },
    {
      input: `8\n1 5 9 12 20 25 30 40\n65`,
      expectedOutput: `5 7`,
      isHidden: true,
      orderIndex: 6,
    },
  ];

  if (existing) {
    console.log(`Two Sum already exists with ID: ${existing.id}. Ensuring templates and test cases are up-to-date...`);
    for (const t of templates) {
      await db.codeTemplate.upsert({
        where: {
          problemId_language: {
            problemId: existing.id,
            language: t.language,
          },
        },
        create: {
          problemId: existing.id,
          language: t.language,
          code: t.code,
        },
        update: {
          code: t.code,
        },
      });
    }

    // Refresh test cases
    await db.testCase.deleteMany({
      where: { problemId: existing.id },
    });
    for (const tc of testCasesData) {
      await db.testCase.create({
        data: {
          ...tc,
          problemId: existing.id,
        },
      });
    }

    console.log("Templates and test cases updated!");
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
        create: testCasesData,
      },
      templates: {
        create: templates,
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