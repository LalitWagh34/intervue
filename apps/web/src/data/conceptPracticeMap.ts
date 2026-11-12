export interface PracticeProblemRef {
  slug: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  source: "LeetCode" | "TakeUForward" | "Practice Hub";
  url: string;
  recommendedInvariants?: string;
}

export const CONCEPT_PRACTICE_MAP: Record<string, PracticeProblemRef[]> = {
  "two-pointers": [
    {
      slug: "two-sum-ii-input-array-is-sorted",
      title: "Two Sum II — Input Array Is Sorted",
      difficulty: "Medium",
      source: "LeetCode",
      url: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
      recommendedInvariants: "Sorted array opposite-ends traversal with sum comparison",
    },
    {
      slug: "3sum",
      title: "3Sum (Zero-Sum Triplets)",
      difficulty: "Medium",
      source: "LeetCode",
      url: "https://leetcode.com/problems/3sum/",
      recommendedInvariants: "Sort + fix one element + two pointers with duplicate skipping",
    },
    {
      slug: "trapping-rain-water",
      title: "Trapping Rain Water",
      difficulty: "Hard",
      source: "LeetCode",
      url: "https://leetcode.com/problems/trapping-rain-water/",
      recommendedInvariants: "Left/Right max tracking with convergent index movement",
    },
    {
      slug: "valid-palindrome",
      title: "Valid Palindrome",
      difficulty: "Easy",
      source: "LeetCode",
      url: "https://leetcode.com/problems/valid-palindrome/",
      recommendedInvariants: "Inward movement skipping alphanumeric characters",
    },
  ],
  "sliding-window": [
    {
      slug: "best-time-to-buy-and-sell-stock",
      title: "Best Time to Buy and Sell Stock",
      difficulty: "Easy",
      source: "LeetCode",
      url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
      recommendedInvariants: "Running minimum tracking with forward profit calculation",
    },
    {
      slug: "longest-substring-without-repeating-characters",
      title: "Longest Substring Without Repeating Characters",
      difficulty: "Medium",
      source: "LeetCode",
      url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
      recommendedInvariants: "Dynamic window [left, right] with character frequency/last-seen map",
    },
    {
      slug: "minimum-size-subarray-sum",
      title: "Minimum Size Subarray Sum",
      difficulty: "Medium",
      source: "LeetCode",
      url: "https://leetcode.com/problems/minimum-size-subarray-sum/",
      recommendedInvariants: "Expand right to satisfy sum >= target, contract left to minimize length",
    },
    {
      slug: "sliding-window-maximum",
      title: "Sliding Window Maximum",
      difficulty: "Hard",
      source: "LeetCode",
      url: "https://leetcode.com/problems/sliding-window-maximum/",
      recommendedInvariants: "Fixed window size k with monotonically decreasing deque",
    },
  ],
  "binary-search": [
    {
      slug: "binary-search",
      title: "Binary Search",
      difficulty: "Easy",
      source: "LeetCode",
      url: "https://leetcode.com/problems/binary-search/",
      recommendedInvariants: "Halving monotonic sorted search space in O(log n)",
    },
    {
      slug: "search-in-rotated-sorted-array",
      title: "Search in Rotated Sorted Array",
      difficulty: "Medium",
      source: "LeetCode",
      url: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
      recommendedInvariants: "Identify sorted half before deciding next boundary move",
    },
    {
      slug: "find-minimum-in-rotated-sorted-array",
      title: "Find Minimum in Rotated Sorted Array",
      difficulty: "Medium",
      source: "LeetCode",
      url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",
      recommendedInvariants: "Compare mid with right boundary to locate deflection point",
    },
  ],
  "b-plus-trees": [
    {
      slug: "design-in-memory-file-system",
      title: "Design In-Memory File System",
      difficulty: "Hard",
      source: "LeetCode",
      url: "https://leetcode.com/problems/design-in-memory-file-system/",
      recommendedInvariants: "Hierarchical tree nodes with fast prefix and range traversal",
    },
    {
      slug: "range-sum-query-mutable",
      title: "Range Sum Query — Mutable",
      difficulty: "Medium",
      source: "LeetCode",
      url: "https://leetcode.com/problems/range-sum-query-mutable/",
      recommendedInvariants: "Balanced tree fanout with O(log n) point updates and range lookups",
    },
  ],
  "indexing-strategies": [
    {
      slug: "customers-who-never-order",
      title: "Customers Who Never Order (Index Left Anti-Join)",
      difficulty: "Easy",
      source: "LeetCode",
      url: "https://leetcode.com/problems/customers-who-never-order/",
      recommendedInvariants: "Left join with NULL filter vs indexed NOT EXISTS subquery",
    },
    {
      slug: "department-highest-salary",
      title: "Department Highest Salary (Composite Indexing)",
      difficulty: "Medium",
      source: "LeetCode",
      url: "https://leetcode.com/problems/department-highest-salary/",
      recommendedInvariants: "Partition key indexing with covering index optimization",
    },
  ],
  "acid-transactions": [
    {
      slug: "design-a-rate-limiting-system",
      title: "Design Atomic Idempotent Store",
      difficulty: "Medium",
      source: "Practice Hub",
      url: "https://leetcode.com/problems/design-log-storage-system/",
      recommendedInvariants: "Atomic state transitions with WAL durability guarantees",
    },
  ],
  "isolation-levels": [
    {
      slug: "concurrency-print-in-order",
      title: "Print in Order (Concurrency Control)",
      difficulty: "Easy",
      source: "LeetCode",
      url: "https://leetcode.com/problems/print-in-order/",
      recommendedInvariants: "Synchronizing state transitions without race conditions",
    },
    {
      slug: "design-bounded-blocking-queue",
      title: "Design Bounded Blocking Queue (2PL)",
      difficulty: "Medium",
      source: "LeetCode",
      url: "https://leetcode.com/problems/design-bounded-blocking-queue/",
      recommendedInvariants: "Lock acquisition protocols to prevent phantom reads and deadlocks",
    },
  ],
};

