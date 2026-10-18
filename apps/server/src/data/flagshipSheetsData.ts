export interface CuratedProblem {
  id: string;
  index: number;
  title: string;
  slug: string;
  difficulty: "Basic" | "Core" | "Hard";
  topic: string;
  subtopic?: string;
  moreTopics: number;
  companies: string[];
  link?: string;
  videoUrl?: string;
}

export interface CuratedSheet {
  id: string;
  subjectId: "dsa";
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  badgeColor: "blue" | "emerald" | "amber" | "purple";
  problemCount: number;
  estimatedHours: string;
  problems: CuratedProblem[];
}

import { BLIND_75_PROBLEMS } from "./blind75Data";
import { NEETCODE_150_PROBLEMS } from "./neetcode150Data";
import { STRIVER_SDE_PROBLEMS } from "./striverSdeData";
import { STRIVER_A2Z_PROBLEMS } from "./striverA2ZData";

export {
  BLIND_75_PROBLEMS,
  NEETCODE_150_PROBLEMS,
  STRIVER_SDE_PROBLEMS,
  STRIVER_A2Z_PROBLEMS,
};

export const CURATED_FLAGSHIP_SHEETS: CuratedSheet[] = [
  {
    id: "striver-a2z",
    subjectId: "dsa",
    title: "Striver A2Z DSA Sheet",
    subtitle: "End-to-end beginner to advanced interview mastery",
    description:
      "The complete roadmap from learning basic syntax, time complexity, and recursion up through advanced trie algorithms, segment trees, and bit manipulation.",
    badge: "Beginner to Pro",
    badgeColor: "amber",
    estimatedHours: "180 hrs",
    problemCount: STRIVER_A2Z_PROBLEMS.length,
    problems: STRIVER_A2Z_PROBLEMS,
  },
  {
    id: "striver-sde",
    subjectId: "dsa",
    title: "Striver's SDE Sheet",
    subtitle: "Top 190+ interview problems curated by Raj Vikramaditya (takeUforward)",
    description:
      "Specially formulated for Tier-1 product companies and FAANG loop rounds. Emphasizes array manipulation, linked list pointers, recursion, greedy algorithms, binary trees, dynamic programming, and graphs.",
    badge: "Most Popular",
    badgeColor: "purple",
    estimatedHours: "120 hrs",
    problemCount: STRIVER_SDE_PROBLEMS.length,
    problems: STRIVER_SDE_PROBLEMS,
  },
  {
    id: "neetcode-150",
    subjectId: "dsa",
    title: "NeetCode 150 Roadmap",
    subtitle: "A structured, comprehensive evolution of Blind 75 spanning 18 patterns",
    description:
      "Spans all 18 core interview patterns with incremental difficulty progression. Master Arrays, Hashing, Two Pointers, Sliding Window, Stacks, Binary Search, Linked Lists, Trees, Heaps, Backtracking, Graphs, and DP.",
    badge: "Comprehensive",
    badgeColor: "blue",
    estimatedHours: "90 hrs",
    problemCount: NEETCODE_150_PROBLEMS.length,
    problems: NEETCODE_150_PROBLEMS,
  },
  {
    id: "blind-75",
    subjectId: "dsa",
    title: "Blind 75 Essential DSA",
    subtitle: "The definitive 75 LeetCode problems covering all core interview patterns",
    description:
      "Curated by a Facebook engineer, Blind 75 is the industry gold standard for condensing DSA preparation into 75 high-yield problems across Arrays, Strings, Two Pointers, Trees, Graphs, and Dynamic Programming.",
    badge: "FAANG Core",
    badgeColor: "emerald",
    estimatedHours: "40 hrs",
    problemCount: BLIND_75_PROBLEMS.length,
    problems: BLIND_75_PROBLEMS,
  },
];
