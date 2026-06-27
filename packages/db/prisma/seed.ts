import { PrismaClient } from "../generated/prisma/index.js";

const db = new PrismaClient();

const problems = [
  {
    title: "Two Sum",
    slug: "two-sum",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
    difficulty: "easy",
    tags: ["array", "hash-table"],
    company: ["Google", "Amazon"],
    constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] == 9" },
    ],
    starterCode: {
      javascript: "function twoSum(nums, target) {\n  // your code here\n}",
      python: "def two_sum(nums, target):\n    # your code here\n    pass",
    },
    testCases: [
      { input: "[2,7,11,15]\n9", expected: "[0,1]" },
      { input: "[3,2,4]\n6", expected: "[1,2]" },
    ],
  },
  {
    title: "Reverse Linked List",
    slug: "reverse-linked-list",
    description: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
    difficulty: "easy",
    tags: ["linked-list", "recursion"],
    company: ["Microsoft", "Meta"],
    constraints: "The number of nodes is in range [0, 5000]",
    examples: [{ input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" }],
    starterCode: {
      javascript: "function reverseList(head) {\n  // your code here\n}",
      python: "def reverse_list(head):\n    # your code here\n    pass",
    },
    testCases: [{ input: "[1,2,3,4,5]", expected: "[5,4,3,2,1]" }],
  },
  {
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    description: "Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[`, `]`, determine if the input string is valid.",
    difficulty: "easy",
    tags: ["stack", "string"],
    company: ["Amazon", "Apple"],
    constraints: "1 <= s.length <= 10^4",
    examples: [{ input: 's = "()[]{}"', output: "true" }],
    starterCode: {
      javascript: "function isValid(s) {\n  // your code here\n}",
      python: "def is_valid(s):\n    # your code here\n    pass",
    },
    testCases: [
      { input: '"()"', expected: "true" },
      { input: '"(]"', expected: "false" },
    ],
  },
  {
    title: "Merge Intervals",
    slug: "merge-intervals",
    description: "Given an array of intervals, merge all overlapping intervals and return an array of non-overlapping intervals.",
    difficulty: "medium",
    tags: ["array", "sorting"],
    company: ["Google", "Facebook"],
    constraints: "1 <= intervals.length <= 10^4",
    examples: [{ input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]" }],
    starterCode: {
      javascript: "function merge(intervals) {\n  // your code here\n}",
      python: "def merge(intervals):\n    # your code here\n    pass",
    },
    testCases: [{ input: "[[1,3],[2,6],[8,10],[15,18]]", expected: "[[1,6],[8,10],[15,18]]" }],
  },
  {
    title: "LRU Cache",
    slug: "lru-cache",
    description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache. Implement `get` and `put` operations.",
    difficulty: "hard",
    tags: ["design", "hash-table", "linked-list"],
    company: ["Amazon", "Microsoft", "Google"],
    constraints: "1 <= capacity <= 3000",
    examples: [{ input: 'capacity = 2, ["put",1,1],["put",2,2],["get",1]', output: "1" }],
    starterCode: {
      javascript: "class LRUCache {\n  constructor(capacity) {\n    // your code here\n  }\n  get(key) {}\n  put(key, value) {}\n}",
      python: "class LRUCache:\n    def __init__(self, capacity):\n        pass\n    def get(self, key):\n        pass\n    def put(self, key, value):\n        pass",
    },
    testCases: [{ input: "capacity=2", expected: "varies" }],
  },
];

async function main() {
  for (const p of problems) {
    await db.problem.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }
  console.log(`Seeded ${problems.length} problems`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());