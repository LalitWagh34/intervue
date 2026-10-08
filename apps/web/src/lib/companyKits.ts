import { getCompanyLogo } from "./companyLogos";

export interface CompanyKitMeta {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  interviewFormat: string;
  totalQuestions: number;
  difficultySplit: {
    easy: number;
    medium: number;
    hard: number;
  };
  topPatterns: Array<{
    topic: string;
    percentage: number;
    count: number;
    color: string;
  }>;
}

export const COMPANY_KITS: CompanyKitMeta[] = [
  {
    name: "Google",
    slug: "google",
    tagline: "Algorithmic Precision & Scalable Problem Solving",
    description:
      "Get interview-ready for Google with this dedicated sheet of DSA problems. Regularly updated and prioritized by frequency and difficulty, targeting Google's rigorous bar on graph traversals, dynamic programming, and strict time complexities.",
    interviewFormat: "45-min rounds (1-2 Medium/Hard DSA) + System Design + Googleyness",
    totalQuestions: 250,
    difficultySplit: { easy: 34, medium: 161, hard: 55 },
    topPatterns: [
      { topic: "Arrays & Strings", percentage: 25.8, count: 65, color: "#3B82F6" },
      { topic: "Dynamic Programming", percentage: 17.2, count: 43, color: "#8B5CF6" },
      { topic: "Graphs & BFS/DFS", percentage: 15.6, count: 39, color: "#EC4899" },
      { topic: "Trees & Binary Search Trees", percentage: 12.0, count: 30, color: "#10B981" },
      { topic: "Binary Search", percentage: 8.4, count: 21, color: "#F59E0B" },
      { topic: "Two Pointers & Sliding Window", percentage: 7.2, count: 18, color: "#06B6D4" },
      { topic: "Tries & Hash Maps", percentage: 6.8, count: 17, color: "#6366F1" },
      { topic: "Heap & Priority Queue", percentage: 7.0, count: 17, color: "#F97316" },
    ],
  },
  {
    name: "Amazon",
    slug: "amazon",
    tagline: "Practical Scalability & Leadership Principles",
    description:
      "Focused on Amazon's high-frequency coding patterns. Emphasis on tree traversals, graphs, heaps, string manipulation, and system design alongside customer obsession leadership principles.",
    interviewFormat: "2 Phone Screens + 4 Loop Rounds (DSA, OOD, Leadership Principles)",
    totalQuestions: 240,
    difficultySplit: { easy: 45, medium: 155, hard: 40 },
    topPatterns: [
      { topic: "Trees & Binary Trees", percentage: 22.5, count: 54, color: "#10B981" },
      { topic: "Arrays & Hash Maps", percentage: 20.0, count: 48, color: "#3B82F6" },
      { topic: "Dynamic Programming", percentage: 14.2, count: 34, color: "#8B5CF6" },
      { topic: "Graphs & Topological Sort", percentage: 13.3, count: 32, color: "#EC4899" },
      { topic: "Heap / Top-K Elements", percentage: 11.7, count: 28, color: "#F97316" },
      { topic: "String Parsing", percentage: 9.6, count: 23, color: "#06B6D4" },
      { topic: "Design & LRU Cache", percentage: 8.7, count: 21, color: "#F59E0B" },
    ],
  },
  {
    name: "Microsoft",
    slug: "microsoft",
    tagline: "Solid Fundamentals & Clean Production Code",
    description:
      "Curated collection reflecting Microsoft's engineering loop. Highlights arrays, linked lists, binary trees, sorting, and medium difficulty system problems with emphasis on edge cases and code readability.",
    interviewFormat: "1 Technical Screening + 4 Onsite Rounds (DSA, Low-Level Design, Behavioral)",
    totalQuestions: 220,
    difficultySplit: { easy: 52, medium: 140, hard: 28 },
    topPatterns: [
      { topic: "Arrays & Matrices", percentage: 23.6, count: 52, color: "#3B82F6" },
      { topic: "Linked Lists", percentage: 16.4, count: 36, color: "#06B6D4" },
      { topic: "Trees & Recursion", percentage: 18.2, count: 40, color: "#10B981" },
      { topic: "Dynamic Programming", percentage: 13.6, count: 30, color: "#8B5CF6" },
      { topic: "Strings & Two Pointers", percentage: 14.5, count: 32, color: "#F59E0B" },
      { topic: "Backtracking", percentage: 7.3, count: 16, color: "#EC4899" },
      { topic: "Stack & Queue", percentage: 6.4, count: 14, color: "#6366F1" },
    ],
  },
  {
    name: "Meta",
    slug: "meta",
    tagline: "Rapid Problem Solving & Flawless Speed",
    description:
      "Meta's coding rounds test pure speed and bug-free implementation. Candidates are expected to solve 2 medium-to-hard problems in 45 minutes with zero bugs on the first compile.",
    interviewFormat: "45-min rounds (strict 2 Medium questions requirement) + Architecture",
    totalQuestions: 210,
    difficultySplit: { easy: 38, medium: 148, hard: 24 },
    topPatterns: [
      { topic: "Binary Search & Variations", percentage: 21.0, count: 44, color: "#F59E0B" },
      { topic: "Trees & LCA", percentage: 19.5, count: 41, color: "#10B981" },
      { topic: "Two Pointers & Intervals", percentage: 17.6, count: 37, color: "#06B6D4" },
      { topic: "Graphs & Disjoint Set", percentage: 15.2, count: 32, color: "#EC4899" },
      { topic: "Hash Tables & Subarray Sum", percentage: 14.3, count: 30, color: "#3B82F6" },
      { topic: "Recursion & Backtracking", percentage: 12.4, count: 26, color: "#8B5CF6" },
    ],
  },
  {
    name: "Apple",
    slug: "apple",
    tagline: "Low-Level Performance & Algorithmic Optimization",
    description:
      "Strengthen your preparation with Apple-specific DSA problems sourced from recent interviews. Emphasizes hardware awareness, memory efficiency, arrays, bit manipulation, and optimal trees.",
    interviewFormat: "Screening + 5 Onsite Rounds (DSA, Memory Management, Architecture)",
    totalQuestions: 190,
    difficultySplit: { easy: 40, medium: 125, hard: 25 },
    topPatterns: [
      { topic: "Arrays & Bit Manipulation", percentage: 24.2, count: 46, color: "#3B82F6" },
      { topic: "Trees & Binary Search", percentage: 20.0, count: 38, color: "#10B981" },
      { topic: "Dynamic Programming", percentage: 16.8, count: 32, color: "#8B5CF6" },
      { topic: "Linked Lists & Memory", percentage: 15.3, count: 29, color: "#06B6D4" },
      { topic: "Strings & Palindromes", percentage: 13.2, count: 25, color: "#F59E0B" },
      { topic: "Sorting & Searching", percentage: 10.5, count: 20, color: "#EC4899" },
    ],
  },
  {
    name: "Netflix",
    slug: "netflix",
    tagline: "High-Concurrency Distributed Logic",
    description:
      "Netflix hires senior-leaning problem solvers with heavy focus on concurrency, stream processing, caching architectures, and clean algorithmic foundations.",
    interviewFormat: "Screening + 2 Extensive Technical Loop Sessions (DSA & Distributed Systems)",
    totalQuestions: 120,
    difficultySplit: { easy: 18, medium: 78, hard: 24 },
    topPatterns: [
      { topic: "Design & LRU/LFU Caches", percentage: 25.0, count: 30, color: "#F59E0B" },
      { topic: "Graphs & Concurrency", percentage: 21.7, count: 26, color: "#EC4899" },
      { topic: "Arrays & Sliding Window", percentage: 19.2, count: 23, color: "#3B82F6" },
      { topic: "Dynamic Programming", percentage: 18.3, count: 22, color: "#8B5CF6" },
      { topic: "Trees & Heaps", percentage: 15.8, count: 19, color: "#10B981" },
    ],
  },
  {
    name: "Bloomberg",
    slug: "bloomberg",
    tagline: "Real-Time Data Structures & Financial Systems",
    description:
      "Crack Bloomberg's challenging interview loops with this collection of commonly asked DSA problems tailored for financial feeds, order matching, and real-time queues.",
    interviewFormat: "Phone Screen + 3-4 Rounds (Fast-paced Coding, Design, Culture)",
    totalQuestions: 215,
    difficultySplit: { easy: 35, medium: 150, hard: 30 },
    topPatterns: [
      { topic: "Design & Multi-level Data Structures", percentage: 24.7, count: 53, color: "#F59E0B" },
      { topic: "Strings & Stock/Order Matching", percentage: 22.3, count: 48, color: "#06B6D4" },
      { topic: "Graphs & Network Routing", percentage: 18.6, count: 40, color: "#EC4899" },
      { topic: "Trees & BST Ordering", percentage: 17.2, count: 37, color: "#10B981" },
      { topic: "Heaps & Priority Streaming", percentage: 17.2, count: 37, color: "#F97316" },
    ],
  },
  {
    name: "Uber",
    slug: "uber",
    tagline: "Geospatial Routing, Graphs & High-Throughput DSA",
    description:
      "Master Uber's interview questions focused on shortest path algorithms, intervals, greedy scheduling, dynamic programming, and high-frequency string parsing.",
    interviewFormat: "CodeScreen + 4 Technical Rounds (Graph heavy, Scalability, Bar Raiser)",
    totalQuestions: 205,
    difficultySplit: { easy: 30, medium: 135, hard: 40 },
    topPatterns: [
      { topic: "Graphs & Shortest Path", percentage: 26.8, count: 55, color: "#EC4899" },
      { topic: "Intervals & Scheduling", percentage: 21.0, count: 43, color: "#06B6D4" },
      { topic: "Dynamic Programming", percentage: 18.5, count: 38, color: "#8B5CF6" },
      { topic: "Trees & Trie Routing", percentage: 17.1, count: 35, color: "#10B981" },
      { topic: "Arrays & Two Pointers", percentage: 16.6, count: 34, color: "#3B82F6" },
    ],
  },
  {
    name: "Goldman Sachs",
    slug: "goldman-sachs",
    tagline: "Quantitative Analytics & Mathematical DSA",
    description:
      "Prepare for Goldman Sachs technical rounds featuring string pattern matching, number theory, sorting, matrix transformations, and dynamic programming.",
    interviewFormat: "HackerRank Assessment + 3 CoderPad Technical Interviews",
    totalQuestions: 175,
    difficultySplit: { easy: 42, medium: 110, hard: 23 },
    topPatterns: [
      { topic: "Math & Number Theory", percentage: 23.4, count: 41, color: "#F59E0B" },
      { topic: "Strings & Palindromic Logic", percentage: 21.7, count: 38, color: "#06B6D4" },
      { topic: "Arrays & Subarrays", percentage: 20.0, count: 35, color: "#3B82F6" },
      { topic: "Dynamic Programming", percentage: 17.7, count: 31, color: "#8B5CF6" },
      { topic: "Trees & Binary Search", percentage: 17.2, count: 30, color: "#10B981" },
    ],
  },
  {
    name: "Flipkart",
    slug: "flipkart",
    tagline: "Machine Coding & High Scale E-Commerce DSA",
    description:
      "Tailored for Flipkart SDE loops. Combines intensive data structure problems with machine coding round expectations (clean OOP, design patterns, separation of concerns).",
    interviewFormat: "Machine Coding Round (2h) + 2 Problem Solving DSA Rounds + Hiring Manager",
    totalQuestions: 160,
    difficultySplit: { easy: 32, medium: 105, hard: 23 },
    topPatterns: [
      { topic: "Arrays & Sliding Window", percentage: 23.8, count: 38, color: "#3B82F6" },
      { topic: "Trees & BST Operations", percentage: 21.3, count: 34, color: "#10B981" },
      { topic: "Dynamic Programming", percentage: 20.0, count: 32, color: "#8B5CF6" },
      { topic: "Machine Coding OOP Patterns", percentage: 18.8, count: 30, color: "#F59E0B" },
      { topic: "Graphs & Topological Sort", percentage: 16.1, count: 26, color: "#EC4899" },
    ],
  },
];

export function getCompanyKit(nameOrSlug?: string | null): CompanyKitMeta {
  if (!nameOrSlug) return COMPANY_KITS[0];
  const target = nameOrSlug.toLowerCase().trim().replace(/\s+/g, "-");
  const found = COMPANY_KITS.find(
    (c) =>
      c.slug.toLowerCase() === target ||
      c.name.toLowerCase() === nameOrSlug.toLowerCase().trim()
  );
  if (found) return found;

  // Generic fallback kit
  return {
    name: nameOrSlug,
    slug: target,
    tagline: "Targeted Interview Coding Preparation",
    description: `Curated collection of technical questions frequently asked in ${nameOrSlug} interview loops. Prioritized by frequency and difficulty for maximum retention.`,
    interviewFormat: "1 Online Assessment + 3-4 Technical Problem Solving Rounds",
    totalQuestions: 150,
    difficultySplit: { easy: 35, medium: 95, hard: 20 },
    topPatterns: [
      { topic: "Arrays & Hashing", percentage: 28.0, count: 42, color: "#3B82F6" },
      { topic: "Trees & Graphs", percentage: 24.0, count: 36, color: "#10B981" },
      { topic: "Dynamic Programming", percentage: 20.0, count: 30, color: "#8B5CF6" },
      { topic: "Two Pointers & Sliding Window", percentage: 16.0, count: 24, color: "#06B6D4" },
      { topic: "Binary Search", percentage: 12.0, count: 18, color: "#F59E0B" },
    ],
  };
}
