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

export const BLIND_75_PROBLEMS: CuratedProblem[] = [
  // Arrays & Hashing
  { id: "b75-1", index: 1, title: "Two Sum", slug: "two-sum", difficulty: "Basic", topic: "Arrays & Hashing", moreTopics: 1, companies: ["Google", "Amazon", "Meta", "Apple"] },
  { id: "b75-2", index: 2, title: "Best Time to Buy and Sell Stock", slug: "best-time-to-buy-and-sell-stock", difficulty: "Basic", topic: "Arrays & Hashing", moreTopics: 1, companies: ["Amazon", "Microsoft", "Meta"] },
  { id: "b75-3", index: 3, title: "Contains Duplicate", slug: "contains-duplicate", difficulty: "Basic", topic: "Arrays & Hashing", moreTopics: 1, companies: ["Apple", "Amazon", "Google"] },
  { id: "b75-4", index: 4, title: "Product of Array Except Self", slug: "product-of-array-except-self", difficulty: "Core", topic: "Arrays & Hashing", moreTopics: 1, companies: ["Amazon", "Meta", "Microsoft", "Google"] },
  { id: "b75-5", index: 5, title: "Maximum Subarray", slug: "maximum-subarray", difficulty: "Core", topic: "Dynamic Programming", moreTopics: 1, companies: ["Amazon", "Microsoft", "Apple"] },
  { id: "b75-6", index: 6, title: "Maximum Product Subarray", slug: "maximum-product-subarray", difficulty: "Core", topic: "Dynamic Programming", moreTopics: 1, companies: ["Google", "Amazon", "Meta"] },
  { id: "b75-7", index: 7, title: "Find Minimum in Rotated Sorted Array", slug: "find-minimum-in-rotated-sorted-array", difficulty: "Core", topic: "Binary Search", moreTopics: 1, companies: ["Microsoft", "Amazon", "Meta"] },
  { id: "b75-8", index: 8, title: "Search in Rotated Sorted Array", slug: "search-in-rotated-sorted-array", difficulty: "Core", topic: "Binary Search", moreTopics: 1, companies: ["Meta", "Amazon", "Google", "Microsoft"] },
  { id: "b75-9", index: 9, title: "3Sum", slug: "3sum", difficulty: "Core", topic: "Two Pointers", moreTopics: 1, companies: ["Meta", "Amazon", "Microsoft", "Apple"] },
  { id: "b75-10", index: 10, title: "Container With Most Water", slug: "container-with-most-water", difficulty: "Core", topic: "Two Pointers", moreTopics: 1, companies: ["Amazon", "Google", "Meta"] },

  // Two Pointers & Sliding Window
  { id: "b75-11", index: 11, title: "Valid Palindrome", slug: "valid-palindrome", difficulty: "Basic", topic: "Two Pointers", moreTopics: 1, companies: ["Meta", "Microsoft"] },
  { id: "b75-12", index: 12, title: "Longest Substring Without Repeating Characters", slug: "longest-substring-without-repeating-characters", difficulty: "Core", topic: "Sliding Window", moreTopics: 1, companies: ["Amazon", "Microsoft", "Google", "Meta"] },
  { id: "b75-13", index: 13, title: "Longest Repeating Character Replacement", slug: "longest-repeating-character-replacement", difficulty: "Core", topic: "Sliding Window", moreTopics: 1, companies: ["Google", "Amazon"] },
  { id: "b75-14", index: 14, title: "Minimum Window Substring", slug: "minimum-window-substring", difficulty: "Hard", topic: "Sliding Window", moreTopics: 1, companies: ["Meta", "Amazon", "Google"] },
  { id: "b75-15", index: 15, title: "Valid Anagram", slug: "valid-anagram", difficulty: "Basic", topic: "Arrays & Hashing", moreTopics: 1, companies: ["Uber", "Google", "Amazon"] },
  { id: "b75-16", index: 16, title: "Group Anagrams", slug: "group-anagrams", difficulty: "Core", topic: "Arrays & Hashing", moreTopics: 1, companies: ["Amazon", "Meta", "Apple"] },
  { id: "b75-17", index: 17, title: "Valid Parentheses", slug: "valid-parentheses", difficulty: "Basic", topic: "Stack", moreTopics: 1, companies: ["Meta", "Google", "Amazon", "Bloomberg"] },
  { id: "b75-18", index: 18, title: "Longest Palindromic Substring", slug: "longest-palindromic-substring", difficulty: "Core", topic: "Two Pointers", moreTopics: 1, companies: ["Amazon", "Microsoft", "Google"] },
  { id: "b75-19", index: 19, title: "Palindromic Substrings", slug: "palindromic-substrings", difficulty: "Core", topic: "Two Pointers", moreTopics: 1, companies: ["Meta", "Amazon"] },

  // Linked Lists
  { id: "b75-20", index: 20, title: "Reverse Linked List", slug: "reverse-linked-list", difficulty: "Basic", topic: "Linked List", moreTopics: 1, companies: ["Amazon", "Google", "Microsoft", "Apple"] },
  { id: "b75-21", index: 21, title: "Linked List Cycle", slug: "linked-list-cycle", difficulty: "Basic", topic: "Linked List", moreTopics: 1, companies: ["Amazon", "Microsoft"] },
  { id: "b75-22", index: 22, title: "Merge Two Sorted Lists", slug: "merge-two-sorted-lists", difficulty: "Basic", topic: "Linked List", moreTopics: 1, companies: ["Amazon", "Apple", "Microsoft"] },
  { id: "b75-23", index: 23, title: "Merge k Sorted Lists", slug: "merge-k-sorted-lists", difficulty: "Hard", topic: "Linked List", moreTopics: 2, companies: ["Meta", "Amazon", "Google"] },
  { id: "b75-24", index: 24, title: "Remove Nth Node From End of List", slug: "remove-nth-node-from-end-of-list", difficulty: "Core", topic: "Linked List", moreTopics: 1, companies: ["Meta", "Amazon"] },
  { id: "b75-25", index: 25, title: "Reorder List", slug: "reorder-list", difficulty: "Core", topic: "Linked List", moreTopics: 1, companies: ["Meta", "Amazon"] },

  // Trees & BST
  { id: "b75-26", index: 26, title: "Invert Binary Tree", slug: "invert-binary-tree", difficulty: "Basic", topic: "Trees", moreTopics: 1, companies: ["Google", "Amazon", "Meta"] },
  { id: "b75-27", index: 27, title: "Maximum Depth of Binary Tree", slug: "maximum-depth-of-binary-tree", difficulty: "Basic", topic: "Trees", moreTopics: 1, companies: ["Amazon", "Google", "Apple"] },
  { id: "b75-28", index: 28, title: "Same Tree", slug: "same-tree", difficulty: "Basic", topic: "Trees", moreTopics: 1, companies: ["Amazon", "Google"] },
  { id: "b75-29", index: 29, title: "Subtree of Another Tree", slug: "subtree-of-another-tree", difficulty: "Basic", topic: "Trees", moreTopics: 1, companies: ["Amazon", "Meta"] },
  { id: "b75-30", index: 30, title: "Lowest Common Ancestor of a Binary Search Tree", slug: "lowest-common-ancestor-of-a-binary-search-tree", difficulty: "Core", topic: "Trees", moreTopics: 1, companies: ["Meta", "Amazon"] },
  { id: "b75-31", index: 31, title: "Binary Tree Level Order Traversal", slug: "binary-tree-level-order-traversal", difficulty: "Core", topic: "Trees", moreTopics: 1, companies: ["Amazon", "Microsoft", "Meta"] },
  { id: "b75-32", index: 32, title: "Validate Binary Search Tree", slug: "validate-binary-search-tree", difficulty: "Core", topic: "Trees", moreTopics: 1, companies: ["Amazon", "Meta", "Bloomberg"] },
  { id: "b75-33", index: 33, title: "Kth Smallest Element in a BST", slug: "kth-smallest-element-in-a-bst", difficulty: "Core", topic: "Trees", moreTopics: 1, companies: ["Amazon", "Google"] },
  { id: "b75-34", index: 34, title: "Construct Binary Tree from Preorder and Inorder Traversal", slug: "construct-binary-tree-from-preorder-and-inorder-traversal", difficulty: "Core", topic: "Trees", moreTopics: 1, companies: ["Amazon", "Microsoft"] },
  { id: "b75-35", index: 35, title: "Binary Tree Maximum Path Sum", slug: "binary-tree-maximum-path-sum", difficulty: "Hard", topic: "Trees", moreTopics: 1, companies: ["Meta", "Google"] },
  { id: "b75-36", index: 36, title: "Serialize and Deserialize Binary Tree", slug: "serialize-and-deserialize-binary-tree", difficulty: "Hard", topic: "Trees", moreTopics: 1, companies: ["Meta", "Amazon", "Microsoft"] },

  // Tries & Heaps
  { id: "b75-37", index: 37, title: "Implement Trie (Prefix Tree)", slug: "implement-trie-prefix-tree", difficulty: "Core", topic: "Tries", moreTopics: 1, companies: ["Google", "Amazon", "Meta"] },
  { id: "b75-38", index: 38, title: "Design Add and Search Words Data Structure", slug: "design-add-and-search-words-data-structure", difficulty: "Core", topic: "Tries", moreTopics: 1, companies: ["Meta", "Amazon"] },
  { id: "b75-39", index: 39, title: "Word Search II", slug: "word-search-ii", difficulty: "Hard", topic: "Tries", moreTopics: 2, companies: ["Amazon", "Microsoft", "Google"] },
  { id: "b75-40", index: 40, title: "Top K Frequent Elements", slug: "top-k-frequent-elements", difficulty: "Core", topic: "Heap", moreTopics: 1, companies: ["Amazon", "Meta", "Google"] },
  { id: "b75-41", index: 41, title: "Find Median from Data Stream", slug: "find-median-from-data-stream", difficulty: "Hard", topic: "Heap", moreTopics: 1, companies: ["Google", "Amazon", "Apple"] },

  // Graphs
  { id: "b75-42", index: 42, title: "Number of Islands", slug: "number-of-islands", difficulty: "Core", topic: "Graphs", moreTopics: 1, companies: ["Amazon", "Google", "Meta", "Bloomberg"] },
  { id: "b75-43", index: 43, title: "Clone Graph", slug: "clone-graph", difficulty: "Core", topic: "Graphs", moreTopics: 1, companies: ["Meta", "Amazon"] },
  { id: "b75-44", index: 44, title: "Pacific Atlantic Water Flow", slug: "pacific-atlantic-water-flow", difficulty: "Core", topic: "Graphs", moreTopics: 1, companies: ["Google", "Amazon"] },
  { id: "b75-45", index: 45, title: "Course Schedule", slug: "course-schedule", difficulty: "Core", topic: "Graphs", moreTopics: 1, companies: ["Amazon", "Google", "Meta"] },
  { id: "b75-46", index: 46, title: "Number of Connected Components in an Undirected Graph", slug: "number-of-connected-components-in-an-undirected-graph", difficulty: "Core", topic: "Graphs", moreTopics: 1, companies: ["Meta", "Amazon"] },
  { id: "b75-47", index: 47, title: "Alien Dictionary", slug: "alien-dictionary", difficulty: "Hard", topic: "Graphs", moreTopics: 1, companies: ["Meta", "Amazon", "Google"] },
  { id: "b75-48", index: 48, title: "Graph Valid Tree", slug: "graph-valid-tree", difficulty: "Core", topic: "Graphs", moreTopics: 1, companies: ["Meta", "Google"] },

  // Dynamic Programming
  { id: "b75-49", index: 49, title: "Climbing Stairs", slug: "climbing-stairs", difficulty: "Basic", topic: "Dynamic Programming", moreTopics: 1, companies: ["Amazon", "Google"] },
  { id: "b75-50", index: 50, title: "Coin Change", slug: "coin-change", difficulty: "Core", topic: "Dynamic Programming", moreTopics: 1, companies: ["Amazon", "Bloomberg", "Meta"] },
  { id: "b75-51", index: 51, title: "Longest Increasing Subsequence", slug: "longest-increasing-subsequence", difficulty: "Core", topic: "Dynamic Programming", moreTopics: 1, companies: ["Google", "Amazon", "Microsoft"] },
  { id: "b75-52", index: 52, title: "Longest Common Subsequence", slug: "longest-common-subsequence", difficulty: "Core", topic: "Dynamic Programming", moreTopics: 1, companies: ["Amazon", "Microsoft"] },
  { id: "b75-53", index: 53, title: "Word Break", slug: "word-break", difficulty: "Core", topic: "Dynamic Programming", moreTopics: 1, companies: ["Meta", "Amazon", "Bloomberg"] },
  { id: "b75-54", index: 54, title: "Combination Sum", slug: "combination-sum", difficulty: "Core", topic: "Backtracking", moreTopics: 1, companies: ["Meta", "Amazon", "Microsoft"] },
  { id: "b75-55", index: 55, title: "House Robber", slug: "house-robber", difficulty: "Core", topic: "Dynamic Programming", moreTopics: 1, companies: ["Google", "Amazon"] },
  { id: "b75-56", index: 56, title: "House Robber II", slug: "house-robber-ii", difficulty: "Core", topic: "Dynamic Programming", moreTopics: 1, companies: ["Microsoft", "Google"] },
  { id: "b75-57", index: 57, title: "Decode Ways", slug: "decode-ways", difficulty: "Core", topic: "Dynamic Programming", moreTopics: 1, companies: ["Meta", "Amazon"] },
  { id: "b75-58", index: 58, title: "Unique Paths", slug: "unique-paths", difficulty: "Core", topic: "Dynamic Programming", moreTopics: 1, companies: ["Google", "Amazon"] },
  { id: "b75-59", index: 59, title: "Jump Game", slug: "jump-game", difficulty: "Core", topic: "Greedy", moreTopics: 1, companies: ["Amazon", "Google", "Meta"] },

  // Intervals & Matrix
  { id: "b75-60", index: 60, title: "Insert Interval", slug: "insert-interval", difficulty: "Core", topic: "Intervals", moreTopics: 1, companies: ["Google", "Meta"] },
  { id: "b75-61", index: 61, title: "Merge Intervals", slug: "merge-intervals", difficulty: "Core", topic: "Intervals", moreTopics: 1, companies: ["Meta", "Google", "Bloomberg", "Amazon"] },
  { id: "b75-62", index: 62, title: "Non-overlapping Intervals", slug: "non-overlapping-intervals", difficulty: "Core", topic: "Intervals", moreTopics: 1, companies: ["Meta", "Google"] },
  { id: "b75-63", index: 63, title: "Meeting Rooms", slug: "meeting-rooms", difficulty: "Basic", topic: "Intervals", moreTopics: 1, companies: ["Meta", "Google", "Amazon"] },
  { id: "b75-64", index: 64, title: "Meeting Rooms II", slug: "meeting-rooms-ii", difficulty: "Core", topic: "Intervals", moreTopics: 1, companies: ["Meta", "Google", "Amazon"] },
  { id: "b75-65", index: 65, title: "Set Matrix Zeroes", slug: "set-matrix-zeroes", difficulty: "Core", topic: "Matrix", moreTopics: 1, companies: ["Microsoft", "Amazon"] },
  { id: "b75-66", index: 66, title: "Spiral Matrix", slug: "spiral-matrix", difficulty: "Core", topic: "Matrix", moreTopics: 1, companies: ["Microsoft", "Amazon", "Apple"] },
  { id: "b75-67", index: 67, title: "Rotate Image", slug: "rotate-image", difficulty: "Core", topic: "Matrix", moreTopics: 1, companies: ["Amazon", "Meta"] },
  { id: "b75-68", index: 68, title: "Word Search", slug: "word-search", difficulty: "Core", topic: "Backtracking", moreTopics: 1, companies: ["Amazon", "Microsoft", "Bloomberg"] },

  // Bit Manipulation & Math
  { id: "b75-69", index: 69, title: "Number of 1 Bits", slug: "number-of-1-bits", difficulty: "Basic", topic: "Bit Manipulation", moreTopics: 1, companies: ["Apple", "Microsoft"] },
  { id: "b75-70", index: 70, title: "Counting Bits", slug: "counting-bits", difficulty: "Basic", topic: "Bit Manipulation", moreTopics: 1, companies: ["Amazon", "Google"] },
  { id: "b75-71", index: 71, title: "Missing Number", slug: "missing-number", difficulty: "Basic", topic: "Bit Manipulation", moreTopics: 1, companies: ["Amazon", "Microsoft"] },
  { id: "b75-72", index: 72, title: "Reverse Bits", slug: "reverse-bits", difficulty: "Basic", topic: "Bit Manipulation", moreTopics: 1, companies: ["Apple", "Amazon"] },
  { id: "b75-73", index: 73, title: "Sum of Two Integers", slug: "sum-of-two-integers", difficulty: "Core", topic: "Bit Manipulation", moreTopics: 1, companies: ["Meta", "Google"] },
  { id: "b75-74", index: 74, title: "Longest Consecutive Sequence", slug: "longest-consecutive-sequence", difficulty: "Core", topic: "Arrays & Hashing", moreTopics: 1, companies: ["Google", "Amazon", "Meta"] },
  { id: "b75-75", index: 75, title: "Median of Two Sorted Arrays", slug: "median-of-two-sorted-arrays", difficulty: "Hard", topic: "Binary Search", moreTopics: 2, companies: ["Google", "Amazon", "Microsoft", "Meta"] },
];

export const NEETCODE_150_PROBLEMS: CuratedProblem[] = [
  ...BLIND_75_PROBLEMS,
  { id: "nc-76", index: 76, title: "Trapping Rain Water", slug: "trapping-rain-water", difficulty: "Hard", topic: "Two Pointers", moreTopics: 1, companies: ["Amazon", "Google", "Bloomberg", "Meta"] },
  { id: "nc-77", index: 77, title: "Daily Temperatures", slug: "daily-temperatures", difficulty: "Core", topic: "Stack", moreTopics: 1, companies: ["Meta", "Amazon"] },
  { id: "nc-78", index: 78, title: "Min Stack", slug: "min-stack", difficulty: "Core", topic: "Stack", moreTopics: 1, companies: ["Amazon", "Bloomberg"] },
  { id: "nc-79", index: 79, title: "Evaluate Reverse Polish Notation", slug: "evaluate-reverse-polish-notation", difficulty: "Core", topic: "Stack", moreTopics: 1, companies: ["Amazon", "LinkedIn"] },
  { id: "nc-80", index: 80, title: "Generate Parentheses", slug: "generate-parentheses", difficulty: "Core", topic: "Backtracking", moreTopics: 1, companies: ["Amazon", "Microsoft"] },
  { id: "nc-81", index: 81, title: "Koko Eating Bananas", slug: "koko-eating-bananas", difficulty: "Core", topic: "Binary Search", moreTopics: 1, companies: ["Google", "Meta"] },
  { id: "nc-82", index: 82, title: "Time Based Key-Value Store", slug: "time-based-key-value-store", difficulty: "Core", topic: "Binary Search", moreTopics: 1, companies: ["Google", "Netflix"] },
  { id: "nc-83", index: 83, title: "LRU Cache", slug: "lru-cache", difficulty: "Core", topic: "Linked List", moreTopics: 2, companies: ["Amazon", "Google", "Meta", "Microsoft"] },
  { id: "nc-84", index: 84, title: "Subsets", slug: "subsets", difficulty: "Core", topic: "Backtracking", moreTopics: 1, companies: ["Meta", "Amazon"] },
  { id: "nc-85", index: 85, title: "Subsets II", slug: "subsets-ii", difficulty: "Core", topic: "Backtracking", moreTopics: 1, companies: ["Bloomberg", "Amazon"] },
  { id: "nc-86", index: 86, title: "Permutations", slug: "permutations", difficulty: "Core", topic: "Backtracking", moreTopics: 1, companies: ["Microsoft", "Meta"] },
  { id: "nc-87", index: 87, title: "N-Queens", slug: "n-queens", difficulty: "Hard", topic: "Backtracking", moreTopics: 1, companies: ["Meta", "Amazon"] },
  { id: "nc-88", index: 88, title: "Rotting Oranges", slug: "rotting-oranges", difficulty: "Core", topic: "Graphs", moreTopics: 1, companies: ["Amazon", "Microsoft"] },
  { id: "nc-89", index: 89, title: "Walls and Gates", slug: "walls-and-gates", difficulty: "Core", topic: "Graphs", moreTopics: 1, companies: ["Meta", "Google"] },
  { id: "nc-90", index: 90, title: "Word Ladder", slug: "word-ladder", difficulty: "Hard", topic: "Graphs", moreTopics: 1, companies: ["Amazon", "LinkedIn"] },
  { id: "nc-91", index: 91, title: "Network Delay Time", slug: "network-delay-time", difficulty: "Core", topic: "Advanced Graphs", moreTopics: 1, companies: ["Google", "Amazon"] },
  { id: "nc-92", index: 92, title: "Min Cost Climbing Stairs", slug: "min-cost-climbing-stairs", difficulty: "Basic", topic: "Dynamic Programming", moreTopics: 1, companies: ["Amazon", "Apple"] },
  { id: "nc-93", index: 93, title: "Partition Equal Subset Sum", slug: "partition-equal-subset-sum", difficulty: "Core", topic: "Dynamic Programming", moreTopics: 1, companies: ["Meta", "Amazon"] },
  { id: "nc-94", index: 94, title: "Target Sum", slug: "target-sum", difficulty: "Core", topic: "Dynamic Programming", moreTopics: 1, companies: ["Amazon", "Google"] },
  { id: "nc-95", index: 95, title: "Interleaving String", slug: "interleaving-string", difficulty: "Core", topic: "Dynamic Programming", moreTopics: 1, companies: ["Google", "Amazon"] },
  { id: "nc-96", index: 96, title: "Edit Distance", slug: "edit-distance", difficulty: "Hard", topic: "Dynamic Programming", moreTopics: 1, companies: ["Google", "Amazon", "Microsoft"] },
  { id: "nc-97", index: 97, title: "Burst Balloons", slug: "burst-balloons", difficulty: "Hard", topic: "Dynamic Programming", moreTopics: 1, companies: ["Amazon", "Google"] },
  { id: "nc-98", index: 98, title: "Maximum Subarray Sum with One Deletion", slug: "maximum-subarray-sum-with-one-deletion", difficulty: "Core", topic: "Dynamic Programming", moreTopics: 1, companies: ["Google"] },
  { id: "nc-99", index: 99, title: "Gas Station", slug: "gas-station", difficulty: "Core", topic: "Greedy", moreTopics: 1, companies: ["Amazon", "Google"] },
  { id: "nc-100", index: 100, title: "Hand of Straights", slug: "hand-of-straights", difficulty: "Core", topic: "Greedy", moreTopics: 1, companies: ["Google"] },
];

export const STRIVER_SDE_PROBLEMS: CuratedProblem[] = [
  ...BLIND_75_PROBLEMS.slice(0, 50),
  { id: "sde-51", index: 51, title: "Pascal's Triangle", slug: "pascals-triangle", difficulty: "Basic", topic: "Arrays & Hashing", moreTopics: 1, companies: ["Amazon", "Microsoft"] },
  { id: "sde-52", index: 52, title: "Next Permutation", slug: "next-permutation", difficulty: "Core", topic: "Arrays & Hashing", moreTopics: 1, companies: ["Google", "Meta", "Amazon"] },
  { id: "sde-53", index: 53, title: "Sort Colors", slug: "sort-colors", difficulty: "Core", topic: "Two Pointers", moreTopics: 1, companies: ["Microsoft", "Meta"] },
  { id: "sde-54", index: 54, title: "Majority Element", slug: "majority-element", difficulty: "Basic", topic: "Arrays & Hashing", moreTopics: 1, companies: ["Amazon", "Google"] },
  { id: "sde-55", index: 55, title: "Majority Element II", slug: "majority-element-ii", difficulty: "Core", topic: "Arrays & Hashing", moreTopics: 1, companies: ["Amazon", "Google"] },
  { id: "sde-56", index: 56, title: "Search a 2D Matrix", slug: "search-a-2d-matrix", difficulty: "Core", topic: "Binary Search", moreTopics: 1, companies: ["Amazon", "Microsoft"] },
  { id: "sde-57", index: 57, title: "Pow(x, n)", slug: "powx-n", difficulty: "Core", topic: "Math", moreTopics: 1, companies: ["Meta", "Amazon", "Google"] },
  { id: "sde-58", index: 58, title: "Intersection of Two Linked Lists", slug: "intersection-of-two-linked-lists", difficulty: "Basic", topic: "Linked List", moreTopics: 1, companies: ["Amazon", "Microsoft", "Apple"] },
  { id: "sde-59", index: 59, title: "Palindrome Linked List", slug: "palindrome-linked-list", difficulty: "Basic", topic: "Linked List", moreTopics: 1, companies: ["Amazon", "Microsoft"] },
  { id: "sde-60", index: 60, title: "Flatten a Multilevel Doubly Linked List", slug: "flatten-a-multilevel-doubly-linked-list", difficulty: "Core", topic: "Linked List", moreTopics: 1, companies: ["Bloomberg", "Microsoft"] },
  { id: "sde-61", index: 61, title: "Copy List with Random Pointer", slug: "copy-list-with-random-pointer", difficulty: "Core", topic: "Linked List", moreTopics: 1, companies: ["Amazon", "Microsoft", "Bloomberg"] },
  { id: "sde-62", index: 62, title: "Fractional Knapsack", slug: "fractional-knapsack", difficulty: "Core", topic: "Greedy", moreTopics: 1, companies: ["Amazon", "TCS", "Infosys"] },
  { id: "sde-63", index: 63, title: "N Meetings in One Room", slug: "n-meetings-in-one-room", difficulty: "Basic", topic: "Greedy", moreTopics: 1, companies: ["Amazon", "Flipkart"] },
  { id: "sde-64", index: 64, title: "Sudoku Solver", slug: "sudoku-solver", difficulty: "Hard", topic: "Backtracking", moreTopics: 1, companies: ["Amazon", "Uber"] },
  { id: "sde-65", index: 65, title: "M-Coloring Problem", slug: "m-coloring-problem", difficulty: "Core", topic: "Backtracking", moreTopics: 1, companies: ["Amazon", "Microsoft"] },
  { id: "sde-66", index: 66, title: "Rat in a Maze Problem", slug: "rat-in-a-maze-problem", difficulty: "Core", topic: "Backtracking", moreTopics: 1, companies: ["Amazon", "Microsoft"] },
  { id: "sde-67", index: 67, title: "Kth Element of Two Sorted Arrays", slug: "kth-element-of-two-sorted-arrays", difficulty: "Core", topic: "Binary Search", moreTopics: 1, companies: ["Google", "Amazon"] },
  { id: "sde-68", index: 68, title: "Single Element in a Sorted Array", slug: "single-element-in-a-sorted-array", difficulty: "Core", topic: "Binary Search", moreTopics: 1, companies: ["Amazon", "Google"] },
  { id: "sde-69", index: 69, title: "Aggressive Cows", slug: "aggressive-cows", difficulty: "Core", topic: "Binary Search", moreTopics: 1, companies: ["Google", "Amazon"] },
  { id: "sde-70", index: 70, title: "Book Allocation Problem", slug: "book-allocation-problem", difficulty: "Hard", topic: "Binary Search", moreTopics: 1, companies: ["Google", "Microsoft"] },
  { id: "sde-71", index: 71, title: "Sliding Window Maximum", slug: "sliding-window-maximum", difficulty: "Hard", topic: "Sliding Window", moreTopics: 1, companies: ["Amazon", "Google", "Meta"] },
  { id: "sde-72", index: 72, title: "Largest Rectangle in Histogram", slug: "largest-rectangle-in-histogram", difficulty: "Hard", topic: "Stack", moreTopics: 1, companies: ["Amazon", "Google", "Meta"] },
  { id: "sde-73", index: 73, title: "Next Greater Element I", slug: "next-greater-element-i", difficulty: "Basic", topic: "Stack", moreTopics: 1, companies: ["Amazon", "Bloomberg"] },
  { id: "sde-74", index: 74, title: "LFU Cache", slug: "lfu-cache", difficulty: "Hard", topic: "Linked List", moreTopics: 2, companies: ["Amazon", "Google", "Microsoft"] },
  { id: "sde-75", index: 75, title: "Minimum Cost to Cut a Stick", slug: "minimum-cost-to-cut-a-stick", difficulty: "Hard", topic: "Dynamic Programming", moreTopics: 1, companies: ["Google", "Amazon"] },
];

import { STRIVER_A2Z_PROBLEMS } from "./striverA2ZData";
export { STRIVER_A2Z_PROBLEMS };

export const CURATED_FLAGSHIP_SHEETS: CuratedSheet[] = [
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
    id: "striver-sde",
    subjectId: "dsa",
    title: "Striver's SDE Sheet",
    subtitle: "Top 180+ interview problems curated by Raj Vikramaditya (takeUforward)",
    description:
      "Specially formulated for Tier-1 product companies and FAANG loop rounds. Emphasizes array manipulation, linked list pointers, recursion, greedy algorithms, binary trees, dynamic programming, and graphs.",
    badge: "Most Popular",
    badgeColor: "purple",
    estimatedHours: "120 hrs",
    problemCount: STRIVER_SDE_PROBLEMS.length,
    problems: STRIVER_SDE_PROBLEMS,
  },
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
];
