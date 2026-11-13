import { db, LearnDifficulty, LearnRevisionStatus } from "../index";

interface ConceptSeed {
  moduleSlug: string;
  slug: string;
  orderIndex: number;
  title: string;
  summary: string;
  difficulty: LearnDifficulty;
  estimatedMinutes: number;
  keyTakeaways: string[];
  commonMistakes: string[];
  quickRevisionMd: string;
  deepDiveMd: string;
}

const CONCEPTS: ConceptSeed[] = [
  // ───────────────────────────────────────────────────────────────────────────
  // DSA Track — Arrays & Patterns
  // ───────────────────────────────────────────────────────────────────────────
  {
    moduleSlug: "arrays-patterns",
    slug: "two-pointers",
    orderIndex: 1,
    title: "Two Pointers",
    summary:
      "Replace nested O(n²) loops on sorted arrays, strings, or linked lists with two coordinated indices moving in O(n) time and O(1) space.",
    difficulty: LearnDifficulty.FOUNDATION,
    estimatedMinutes: 12,
    keyTakeaways: [
      "Monotonicity is the prerequisite: pair elimination only works when advancing an index predictably increases or decreases the search space.",
      "Opposite-direction pointers (left/right) converge to search sorted ranges or verify palindromes.",
      "Same-direction pointers (slow/fast) compact arrays in-place or detect cycles (Floyd's Tortoise and Hare algorithm).",
      "Dutch National Flag (3 pointers) partitions an array into three distinct slices in a single pass.",
    ],
    commonMistakes: [
      "Attempting opposite-direction pair sum on an unsorted array (sorting costs O(n log n); ensure index stability is not required).",
      "Using `left <= right` vs `left < right` inconsistently and double-counting the middle element for distinct-pair problems.",
      "Overwriting array values during in-place compaction before reading them.",
      "Failing to handle duplicate values, causing redundant duplicate triplets in problems like 3Sum.",
    ],
    quickRevisionMd: `## Core Idea
Maintain two pointers (\`left\`, \`right\` or \`slow\`, \`fast\`) whose movements are **strictly monotonic**. Each step evaluates the state and permanently discards an entire slice of search space, cutting brute force \`O(n²)\` down to **\`O(n)\` amortized time**.

\`\`\`
Array:  [ 2,  3,  7, 11, 15 ], Target = 18
Pointers: ^               ^
         left            right   -> Sum = 17 < 18: left must advance!
\`\`\`

---

### When to Recognize It
- **Sorted Array Target Pair / Triplet:** *Two Sum II*, *3Sum*, *4Sum*.
- **Palindrome Verification & String Manipulation:** Reversing words, validating alphanumeric symmetry.
- **In-Place Array Compaction:** *Remove Duplicates*, *Move Zeroes*, *Remove Element*.
- **Linked List Topology:** Fast & Slow pointers for finding the midpoint or cycle detection.
- **3-Way Partitioning:** *Sort Colors (Dutch National Flag)*.

---

### Complexity Comparison
| Technique | Time Complexity | Auxiliary Space | Input Requirement |
| :--- | :--- | :--- | :--- |
| **Brute Force Nested Loops** | \`O(n²)\` | \`O(1)\` | Any |
| **Hash Map Complements** | \`O(n)\` | \`O(n)\` | Any |
| **Opposite-Direction Two Pointers** | \`O(n)\` | \`O(1)\` | **Must be sorted** |
| **Fast & Slow Pointers** | \`O(n)\` | \`O(1)\` | Any sequential structure |

---

### Quick Code Template: Opposite-Direction Target Sum
\`\`\`ts
function twoSumSorted(numbers: number[], target: number): [number, number] | null {
  let left = 0;
  let right = numbers.length - 1;

  while (left < right) {
    const sum = numbers[left] + numbers[right];

    if (sum === target) {
      return [left, right];
    } else if (sum < target) {
      // Sum is too small: all pairs (left, < right) are even smaller!
      left++;
    } else {
      // Sum is too large: all pairs (> left, right) are even larger!
      right--;
    }
  }

  return null;
}
\`\`\``,
    deepDiveMd: `## Theoretical Foundation: Why Two Pointers Works

In a brute-force search over a sorted array \`nums\`, you consider all pairs \`(i, j)\` where \`i < j\`. This forms an \`n × n\` matrix of potential sums:

\`\`\`
       j=0   j=1   j=2   j=3   j=4
i=0  (0,0) (0,1) (0,2) (0,3) (0,4)
i=1        (1,1) (1,2) (1,3) (1,4)
i=2              (2,2) (2,3) (2,4)
i=3                    (3,3) (3,4)
i=4                          (4,4)
\`\`\`

When the array is sorted monotonically:
- If \`nums[left] + nums[right] < target\`, then \`nums[left]\` paired with **any element at or to the left of \`right\`** (\`nums[left] + nums[j]\` for \`j < right\`) will also strictly be \`< target\`.
- Therefore, we can discard an entire row of pairs in **one single \`left++\` step**!
- Similarly, if \`sum > target\`, we discard an entire column of pairs with **\`right--\`**.
- Since each step increments \`left\` or decrements \`right\`, we make at most \`n\` comparisons. **Total work is strictly \`O(n)\`.**

---

## The Four Core Flavors

### 1. Opposite-Direction (Converging Pointers)
Used when searching for pairs from the extremes inward.
- **Invariant:** The solution, if one exists, is guaranteed to lie within the inclusive subsegment \`[left, right]\`.
- **Termination:** Stops when \`left >= right\` (for distinct elements) or \`left > right\`.
- **Handling Duplicates (e.g. in 3Sum):**
  After finding a valid match, both pointers must bypass identical neighboring values:
  \`\`\`ts
  while (left < right && nums[left] === nums[left + 1]) left++;
  while (left < right && nums[right] === nums[right - 1]) right--;
  left++;
  right--;
  \`\`\`

---

### 2. Fast & Slow Pointers (Array Compaction)
Both pointers start at the front and traverse forward at different speeds.
- \`fast\` (the reader): iterates through every element sequentially.
- \`slow\` (the writer): tracks the boundary of the processed, valid prefix.

\`\`\`ts
function removeDuplicates(nums: number[]): number {
  if (nums.length === 0) return 0;
  let slow = 1;

  for (let fast = 1; fast < nums.length; fast++) {
    // Only write when encountering a fresh distinct value
    if (nums[fast] !== nums[fast - 1]) {
      nums[slow] = nums[fast];
      slow++;
    }
  }

  return slow; // New length
}
\`\`\`
- **Invariant:** \`nums[0 ... slow - 1]\` contains the deduplicated array in original relative order.

---

### 3. Fast & Slow on Linked Lists (Floyd's Cycle Detection)
- \`slow\` advances by 1 step: \`slow = slow.next\`
- \`fast\` advances by 2 steps: \`fast = fast.next.next\`

**Mathematical Proof of Meeting:**
Suppose the linked list has a cycle of length \`C\`. Once \`slow\` enters the cycle, \`fast\` is at some distance \`d\` behind \`slow\` (\`0 <= d < C\`). In each iteration, the distance between them decreases by \`2 - 1 = 1\`. After exactly \`d\` steps, the distance becomes 0, guaranteeing they meet without an infinite loop in at most \`O(n)\` steps.

---

### 4. Dutch National Flag (3 Pointers / 3-Way Partitioning)
Partitions an array into three segments (e.g. \`0\`s, \`1\`s, \`2\`s or \`< pivot\`, \`== pivot\`, \`> pivot\`) in a single \`O(n)\` pass with \`O(1)\` space:
- \`low\`: boundary where all indices \`< low\` are \`0\`.
- \`mid\`: current inspection pointer.
- \`high\`: boundary where all indices \`> high\` are \`2\`.

\`\`\`ts
function sortColors(nums: number[]): void {
  let low = 0;
  let mid = 0;
  let high = nums.length - 1;

  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;
      // Notice: mid is NOT incremented because the swapped element from high must be inspected!
    }
  }
}
\`\`\`

---

## Senior Engineer Interview Traps
1. **Integer Overflow on Sums:** In languages like Java or C++, \`nums[left] + nums[right]\` can overflow 32-bit signed integers. In TypeScript/JS, integers up to \`2^53 - 1\` are safe, but in C++ write \`long long sum = (long long)nums[left] + nums[right]\`.
2. **Double-counting mid elements:** When checking palindromes, expanding outward from center requires handling both odd centers \`(i, i)\` and even centers \`(i, i+1)\`.`,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // DSA Track — Sliding Window
  // ───────────────────────────────────────────────────────────────────────────
  {
    moduleSlug: "arrays-patterns",
    slug: "sliding-window",
    orderIndex: 2,
    title: "Sliding Window",
    summary:
      "Maintain a contiguous subarray or substring window [left, right] that expands and shrinks incrementally in O(n) time.",
    difficulty: LearnDifficulty.INTERMEDIATE,
    estimatedMinutes: 14,
    keyTakeaways: [
      "Sliding window operates strictly on contiguous sequences where condition validity changes monotonically.",
      "The outer right pointer expands the universe; the inner left pointer contracts only to restore invariant compliance.",
      "Each element enters the window once and exits at most once, guaranteeing amortized O(n) runtime.",
      "If the input array contains negative numbers, standard sliding window is invalid; use Prefix Sum + Hash Map instead.",
    ],
    commonMistakes: [
      "Using sliding window on subarray sum problems with negative values (negative numbers destroy monotonicity).",
      "Re-scanning the entire window to calculate frequencies or sums on every step instead of doing O(1) state updates.",
      "Contracting the window with `if` instead of `while` when multiple elements must be evicted to restore validity.",
      "Off-by-one errors in window size calculation: window `[left, right]` length is `right - left + 1`, not `right - left`.",
    ],
    quickRevisionMd: `## Core Idea
Instead of recomputing contiguous subarray properties from scratch (\`O(n²)\` or \`O(n³)\`), maintain an active window \`[left, right]\`. As \`right\` expands, incrementally incorporate \`arr[right]\`. As \`left\` contracts, incrementally evict \`arr[left]\`.

\`\`\`
Window: [ left ... right ]
Expand:  left ... right ->  (add arr[right] to state)
Shrink:  left -> ... right  (remove arr[left] from state until invariant holds)
\`\`\`

---

### Universal Mental Template (Variable Window)
\`\`\`ts
function slidingWindowTemplate(nums: number[]): number {
  let left = 0;
  let maxLen = 0;
  const state = new Map<number, number>(); // or runningSum

  for (let right = 0; right < nums.length; right++) {
    // 1. Expand: include nums[right]
    state.set(nums[right], (state.get(nums[right]) || 0) + 1);

    // 2. Shrink: while window invariant is violated, evict nums[left]
    while (isConditionViolated(state)) {
      state.set(nums[left], state.get(nums[left])! - 1);
      if (state.get(nums[left]) === 0) state.delete(nums[left]);
      left++;
    }

    // 3. Record: [left, right] is now guaranteed valid!
    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}
\`\`\``,
    deepDiveMd: `## The Monotonicity Prerequisite: Why It Fails with Negative Numbers

Sliding window fundamentally depends on **monotonic state progression**:
- Adding an element via \`right\` must push the state strictly in one direction (e.g. increase the sum).
- Evicting an element via \`left\` must push the state strictly in the opposite direction (e.g. decrease the sum).

### What Happens with Negative Numbers?
Suppose we seek a subarray summing to \`target = 7\` in \`[3, 4, -2, 1, 5, 2]\`:
1. Window expands: \`[3, 4]\` -> \`sum = 7\` (Match!).
2. Next element is \`-2\`: window \`[3, 4, -2]\` has \`sum = 5\`.
3. Does moving \`left\` forward increase or decrease the sum?
   - If we evict \`3\`, \`sum = 2\` (decreased).
   - But if we had evicted a negative number, the sum would have *increased*!
- Because negative numbers can either increase or decrease the sum upon eviction, you can never know whether you should expand \`right\` or shrink \`left\`.
- **The Correct Solution for Negative Numbers:** Use a **Prefix Sum + Hash Map** (\`prefixSum - target\`), which runs in \`O(n)\` without requiring monotonicity.

---

## Fixed vs Variable Size Windows

### 1. Fixed Window (Size K)
The window size is strictly constant. You initialize the first \`k\` elements, then slide both pointers together in lockstep:
\`\`\`ts
function maxSubarraySumK(nums: number[], k: number): number {
  let windowSum = 0;
  for (let i = 0; i < k; i++) windowSum += nums[i];

  let maxSum = windowSum;
  for (let right = k; right < nums.length; right++) {
    windowSum += nums[right] - nums[right - k]; // O(1) slide
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum;
}
\`\`\`

---

### 2. Variable Window (Longest vs Shortest)
- **Longest Valid Window (e.g. Longest Substring Without Repeating Characters):**
  Expand \`right\` greedily. When invalid, shrink \`left\` until valid again. Update \`maxLen = Math.max(maxLen, right - left + 1)\`.
- **Shortest Valid Window (e.g. Minimum Size Subarray Sum >= S):**
  Expand \`right\` until the condition is met. Then shrink \`left\` inside a \`while\` loop as long as the condition *remains* met, recording \`minLen = Math.min(minLen, right - left + 1)\` at each step.

---

### 3. The "Exact(K) = AtMost(K) - AtMost(K-1)" Technique
For problems asking for subarrays with *exact* constraints (e.g. *Subarrays with K Different Integers* or *Binary Subarrays With Sum*):
Finding "exact \`k\`" directly with sliding window is tricky because shrinking \`left\` might cause you to miss valid intermediate windows.
Instead, use the mathematical equivalence:
\`\`\`
Exact(K) = AtMost(K) - AtMost(K - 1)
\`\`\`
Both \`AtMost(K)\` and \`AtMost(K-1)\` are monotonically continuous, making each solvable in simple \`O(n)\` sliding window!`,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // DSA Track — Searching
  // ───────────────────────────────────────────────────────────────────────────
  {
    moduleSlug: "searching",
    slug: "binary-search",
    orderIndex: 1,
    title: "Binary Search & Variants",
    summary:
      "Halve a monotonic search space in O(log n) steps — from exact lookup to lower/upper bounds and binary search on answer.",
    difficulty: LearnDifficulty.FOUNDATION,
    estimatedMinutes: 12,
    keyTakeaways: [
      "Binary search applies whenever a domain can be partitioned by a monotonic boolean predicate into [false, ..., false, true, ..., true].",
      "Always compute midpoint using `mid = left + Math.floor((right - left) / 2)` to eliminate 32-bit integer overflow.",
      "Maintain a dedicated `ans` variable with inclusive `[left, right]` bounds to completely eliminate off-by-one infinite loops.",
      "Binary Search on Answer solves optimization problems: min capacity, max speed, or min allocated distance in O(log(range) * cost(check)).",
    ],
    commonMistakes: [
      "Using `(left + right) / 2` which overflows 32-bit signed integers when `left + right > 2,147,483,647`.",
      "Infinite loops when `right - left === 1` caused by updating `left = mid` with floor division.",
      "Assuming binary search only works on sorted arrays, failing to apply it to answer-space optimization problems.",
      "Misidentifying which half of a rotated sorted array is sorted when duplicates are present.",
    ],
    quickRevisionMd: `## Core Idea
Binary search divides a search space in half at each step by evaluating a predicate at midpoint \`mid\`. Eliminating half the domain on every check yields **\`O(log n)\` runtime**.

\`\`\`
Search Space: [ 1, 3, 5, 8, 12, 16, 21 ], Target = 12
Step 1: mid = 8 (< 12)   -> Discard left half [1, 3, 5, 8]
Step 2: mid = 16 (> 12)  -> Discard right half [16, 21]
Step 3: mid = 12 (== 12) -> Match found!
\`\`\`

---

### The Foolproof Invariant Template (Lower Bound / First True)
\`\`\`ts
function lowerBound(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;
  let ans = nums.length; // Default if target exceeds all elements

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);

    if (nums[mid] >= target) {
      ans = mid;        // Record feasible index
      right = mid - 1;  // Try to find an even earlier index on the left
    } else {
      left = mid + 1;   // Must search right
    }
  }

  return ans;
}
\`\`\``,
    deepDiveMd: `## The General Monotonic Predicate Theorem

Binary search is **not** an array algorithm; it is a **functional partition algorithm**.
Let \`f: X -> {false, true}\` be a boolean predicate over a domain \`X\`. If \`f\` is monotonic:
\`\`\`
Domain:    x0,    x1,    x2,    x3,    x4,    x5,    x6
f(x):    false, false, false,  true,  true,  true,  true
                                ^
                           Boundary (First True)
\`\`\`
Binary search finds the transition boundary between \`false\` and \`true\` in exactly \`ceil(log2(|X|))\` evaluations of \`f\`.

---

## Binary Search on Answer Space

Whenever a problem asks for:
- "Minimum capacity to complete tasks within D days"
- "Maximum speed such that total time <= H"
- "Maximum minimum distance between cows in stalls"

Ask: **Is feasibility monotonic?**
- If capacity \`C\` works, does any capacity \`> C\` also work? **Yes!**
- If speed \`S\` is too slow, will any speed \`< S\` also be too slow? **Yes!**

### Step-by-Step Implementation Pattern
\`\`\`ts
function shipWithinDays(weights: number[], days: number): number {
  // 1. Define search range [minFeasible, maxFeasible]
  let left = Math.max(...weights); // Cannot ship if capacity < heaviest package
  let right = weights.reduce((a, b) => a + b, 0); // Max capacity is shipping everything on day 1
  let ans = right;

  // 2. Monotonic feasibility predicate
  function canShip(capacity: number): boolean {
    let neededDays = 1;
    let currentWeight = 0;
    for (const w of weights) {
      if (currentWeight + w > capacity) {
        neededDays++;
        currentWeight = 0;
      }
      currentWeight += w;
    }
    return neededDays <= days;
  }

  // 3. Binary search on answer range
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (canShip(mid)) {
      ans = mid;
      right = mid - 1; // Look for smaller capacity
    } else {
      left = mid + 1;  // Need bigger capacity
    }
  }

  return ans;
}
\`\`\`

---

## Rotated Sorted Arrays: Identifying the Sorted Half
In a rotated sorted array without duplicates (\`[4, 5, 6, 7, 0, 1, 2]\`), one half is **always strictly sorted**:
- If \`nums[left] <= nums[mid]\`: The **left half is sorted**.
  - Check if target falls in \`[nums[left], nums[mid]]\`. If yes, \`right = mid - 1\`; else \`left = mid + 1\`.
- Else: The **right half is sorted**.
  - Check if target falls in \`[nums[mid], nums[right]]\`. If yes, \`left = mid + 1\`; else \`right = mid - 1\`.`,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // DBMS Track — Indexing & Storage Engines
  // ───────────────────────────────────────────────────────────────────────────
  {
    moduleSlug: "indexing-storage",
    slug: "b-plus-trees",
    orderIndex: 1,
    title: "B+ Trees & Storage Layout",
    summary:
      "The foundational on-disk storage layout for modern relational databases: shallow tree depth, high fan-out, and sequential leaf node pointer linking for ultra-fast point lookups and range scans.",
    difficulty: LearnDifficulty.FOUNDATION,
    estimatedMinutes: 14,
    keyTakeaways: [
      "B+ Trees store all actual table data or pointers exclusively in leaf nodes; internal nodes store only routing search keys.",
      "High branching factor (fan-out of 100-1000) keeps tree depth shallow (typically 3-4 levels) even for millions or billions of rows.",
      "Leaf nodes form a contiguous doubly-linked list, allowing O(k) sequential range scans without re-traversing tree branches.",
      "Monotonically increasing primary keys prevent costly 50% leaf page splits; random UUIDv4 keys cause severe buffer pool thrashing and index bloat.",
    ],
    commonMistakes: [
      "Confusing B-Trees with B+ Trees: B-Trees store data records in internal nodes too, which dramatically reduces fan-out and increases tree height.",
      "Assuming Binary Search Trees (BST/AVL) work well on disk (they cause excessive random disk seeks due to tiny fan-out).",
      "Ignoring page fill factor: random UUID inserts cause frequent page splits and 50% fragmentation.",
    ],
    quickRevisionMd: `## Core Idea
A **B+ Tree** is a balanced, multi-way search tree optimized for block-based disk storage systems (e.g. 16KB InnoDB pages).

### Internal vs. Leaf Nodes
- **Internal Nodes:** Contain only separator keys and child page pointers (routing only).
- **Leaf Nodes:** Contain all key-value entries (or row pointers) plus bidirectional sibling pointers (\`prev\` and \`next\`).

\`\`\`
                     [ 50 | 100 ]                      <- Internal Node (Routing only)
                    /     |      \\
        [ 10 | 25 ]   [ 60 | 75 ]  [ 120 | 150 ]       <- Internal Node
       /     |    \\
[1..9] <-> [10..24] <-> [25..49] <-> [50..59] ...      <- Leaf Nodes (Data + Doubly Linked List)
\`\`\`

---

### Why Not Binary Search Trees on Disk?
| Metric | Binary Search Tree (AVL/Red-Black) | B+ Tree |
| :--- | :--- | :--- |
| **Fan-Out (Children per node)** | 2 | 100 - 1,000+ |
| **Tree Depth for 10M rows** | ~24 levels | **3 - 4 levels** |
| **Disk Page Alignment** | None (pointers across RAM) | Exact match to 4KB-16KB OS/database pages |
| **Range Scan Overhead** | \`O(k log n)\` in-order tree traversal | \`O(k)\` linear scan along leaf pointers |

---

### Range Scan Invariant
To execute \`WHERE age BETWEEN 20 AND 30\`:
1. Traverse root to leaf to locate the first key \`>= 20\` in \`O(log_b n)\`.
2. Follow sibling \`next\` leaf pointers sequentially until encountering a key \`> 30\`. Zero tree re-traversals needed!`,
    deepDiveMd: `## Physical Page Layout & Fan-out Math

Relational storage engines like MySQL InnoDB operate in discrete blocks called **Pages** (default 16 KB).

### The Math Behind Tree Depth
Assume a standard 16 KB database page:
- Page header + directory overhead: ~1 KB.
- Usable space: ~15 KB = 15,360 bytes.
- Key size (8-byte bigint) + Child Page Pointer (6-byte page offset) = 14 bytes per entry.
- **Fan-out (b):** \`15,360 / 14 ≈ 1,097 children per internal page\`.

\`\`\`
Level 1 (Root Page):      1 page       ≈ 1,000 pointer branches
Level 2 (Internal Pages): 1,000 pages  ≈ 1,000,000 pointer branches
Level 3 (Leaf Pages):     1,000,000 pages ≈ 1,000,000,000 leaf entries!
\`\`\`

With only **3 page fetches from disk** (and the root page is cached in RAM buffer pool permanently), the database searches across **1 billion records** in ~2 actual physical I/O operations!

---

## Page Splits & Fragmentation

When an insertion occurs on a leaf page that is 100% full:
1. The page splits 50/50 into two half-full pages.
2. The median key is promoted up to the parent internal page.
3. Sibling pointers are updated atomically.
4. **Result:** Each of the two pages is now only 50% full.

### Why Auto-Increment BIGINT Beats UUIDv4 for Clustered Keys
- **Monotonically Increasing Keys (Auto-Increment / ULID / UUIDv7):**
  - Always append to the rightmost leaf page.
  - Pages stay 90-95% densely packed.
  - Minimal page splits; zero random disk seeks.
- **Random Keys (UUIDv4):**
  - Inserts hit random leaf pages across the entire storage engine.
  - Causes frequent page splits everywhere, leaving pages 50% empty (**50% disk bloat**).
  - Forces dirty pages to be evicted and re-read from disk, thrashing the Buffer Pool.

---

## B+ Trees vs. LSM Trees (Log-Structured Merge-Trees)
| Feature | B+ Tree (Postgres, MySQL InnoDB) | LSM Tree (RocksDB, Cassandra, ScyllaDB) |
| :--- | :--- | :--- |
| **Write Pattern** | In-place random page updates | Append-only sequential writes to MemTable + WAL |
| **Read Latency** | Ultra-predictable (3-4 I/Os max) | Multiple SSTable levels + Bloom filter checks |
| **Write Amplification** | Higher (full 16KB page rewrite for 10-byte edit) | Lower on writes; compaction overhead later |
| **Optimal Workload** | Read-heavy, OLTP transactions | High-throughput write-heavy logging/metrics |`,
  },

  {
    moduleSlug: "indexing-storage",
    slug: "indexing-strategies",
    orderIndex: 2,
    title: "Clustered vs Secondary Indexes",
    summary:
      "Physical data arrangement on disk: clustered indexes store physical table rows directly at leaf pages, while secondary indexes hold primary key bookmarks requiring index lookups.",
    difficulty: LearnDifficulty.INTERMEDIATE,
    estimatedMinutes: 14,
    keyTakeaways: [
      "A table can have exactly ONE clustered index because physical rows can only be ordered in one way on disk.",
      "Secondary indexes store the indexed column(s) plus the clustered index key as a pointer (the bookmark).",
      "Covering Indexes satisfy all queried columns entirely from the secondary index leaf, completely bypassing table page lookups.",
      "The Leftmost Prefix Rule dictates that composite indexes `INDEX(a, b, c)` only accelerate queries with leading conditions on `a`.",
    ],
    commonMistakes: [
      "Thinking adding an index on every column speeds up queries: write amplification causes massive slowdowns on `INSERT`/`UPDATE`.",
      "Writing `WHERE b = 5` expecting `INDEX(a, b)` to be used for a fast range seek (violates leftmost prefix rule).",
      "Using `SELECT *` which forces a bookmark lookup on every row, defeating covering index optimizations.",
    ],
    quickRevisionMd: `## Clustered vs Secondary (Non-Clustered)

### 1. Clustered Index (Table IS the Index)
- Leaf nodes contain the **entire actual table row data**.
- Every table has exactly one (usually the Primary Key).
- Reading a row by primary key requires **1 index lookup**.

### 2. Secondary Index
- Leaf nodes contain **(indexed_column, primary_key)**.
- Looking up a row by secondary index requires:
  1. Search secondary B+ Tree for the value → retrieve primary key.
  2. **Bookmark Lookup:** Search clustered B+ Tree using primary key → retrieve full row.
  Total: 2 B+ Tree traversals!

\`\`\`
Query: SELECT name, email FROM users WHERE email = 'alice@example.com';

[Secondary Index on email] ──► Finds email ──► Yields Primary Key: id = 42
                                                        │
[Clustered Index on id]    ◄────────────────────────────┘
         └──► Traverses B+ Tree to id = 42 ──► Returns full row: (id, name, email, ...)
\`\`\`

---

### Covering Index Super-Power
If your query is:
\`\`\`sql
SELECT email, user_id FROM users WHERE email = 'test@example.com';
\`\`\`
And you have \`INDEX (email, user_id)\`, the database finds all columns inside the secondary index leaf!
**No bookmark lookup to the clustered table is performed.** This is often 10x-50x faster.`,
    deepDiveMd: `## The Leftmost Prefix Rule

A composite index on columns \`(col1, col2, col3)\` is sorted lexicographically: first by \`col1\`, then ties broken by \`col2\`, then \`col3\`.

### Usability Matrix
| Query Condition | Uses Index? | Type of Operation |
| :--- | :--- | :--- |
| \`WHERE col1 = 5\` | **Yes** | Index Seek (O(log n)) |
| \`WHERE col1 = 5 AND col2 = 10\` | **Yes** | Index Seek (O(log n)) |
| \`WHERE col1 = 5 AND col3 = 20\` | **Partial** | Seeks on \`col1\`, filters \`col3\` in memory |
| \`WHERE col2 = 10\` | **No** | Full Index Scan or Full Table Scan (Leftmost prefix missing) |
| \`WHERE col1 > 5 AND col2 = 10\` | **Partial** | Seeks on range \`col1\`; cannot seek on \`col2\` because range stops seek |

---

## Index Selectivity & Cardinality

The database optimizer will **reject** an index and perform a Full Table Scan if:
- The column has very low cardinality (e.g. \`is_active\` with 90% true).
- If retrieving the indexed rows would require bookmark lookups for >20-30% of the table, sequential disk scan is faster than random disk I/O.

### Write Amplification
Every secondary index on a table requires an additional B+ tree update on every \`INSERT\`, \`UPDATE\` (if the indexed column changed), and \`DELETE\`.
- 1 table with 8 secondary indexes = **9 separate B+ Tree modifications per insert**!`,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // DBMS Track — Transactions & Concurrency Control
  // ───────────────────────────────────────────────────────────────────────────
  {
    moduleSlug: "transactions-concurrency",
    slug: "acid-transactions",
    orderIndex: 1,
    title: "ACID & Write-Ahead Logging (WAL)",
    summary:
      "The four foundational transactional guarantees and how modern database storage engines guarantee crash recovery and durability without synchronously flushing every modified data page to disk.",
    difficulty: LearnDifficulty.FOUNDATION,
    estimatedMinutes: 14,
    keyTakeaways: [
      "Atomicity (All-or-Nothing) and Durability (Committed data survives crashes) are powered by Write-Ahead Logging (WAL) and Undo Logs.",
      "The Write-Ahead Log Invariant: log records describing a change MUST reach non-volatile disk before the corresponding dirty data page is written.",
      "Sequential append-only WAL writes are orders of magnitude faster than random data page writes on disk/SSDs.",
      "ARIES recovery protocol reconstructs exact database state via Analysis, Redo (history repeat), and Undo passes.",
    ],
    commonMistakes: [
      "Assuming a transaction commit immediately writes updated table rows to their disk pages (it writes to WAL first, buffering dirty pages in RAM).",
      "Confusing Consistency (business rules/foreign keys) with Isolation (concurrency anomaly prevention).",
      "Disabling `fsync` or WAL flushing in production for artificial benchmark gains, causing permanent data loss on power cuts.",
    ],
    quickRevisionMd: `## ACID Definitions at a Glance
- **A — Atomicity:** A transaction is an indivisible unit of work. Either all modifications succeed, or all changes are rolled back via **Undo Logs**.
- **C — Consistency:** Database transitions only from one valid state to another, preserving constraints, foreign keys, and invariants.
- **I — Isolation:** Concurrent transactions execute without interfering with one another's intermediate states.
- **D — Durability:** Once committed, changes are permanent and survive system crashes, power failures, or crashes via **Write-Ahead Logging (WAL)**.

### The WAL Invariant
\`\`\`
[RAM Buffer Pool]          [Write-Ahead Log (Disk)]          [Table Pages (Disk)]
Dirty Page in Memory  ──►  Sequential Append Log (fsync)  ──►  Lazy Background Flush
                           MUST COMPLETE BEFORE DATA BLOCK WRITTEN!
\`\`\``,
    deepDiveMd: `## How Databases Achieve Durability: WAL & Checkpointing

### 1. The Dilemma
If the database flushed every modified 16 KB data page to disk on every \`COMMIT\`, throughput would collapse due to random I/O bottlenecks.

### 2. The Solution: Write-Ahead Logging (WAL)
When a transaction commits:
1. It creates an append-only log entry describing the diff (Redo Log: "Change row 42 field balance to 100").
2. It flushes this log to disk sequentially via \`fsync()\`.
3. The actual 16 KB data page remains in RAM (the **Buffer Pool**) marked as *dirty*.
4. A background thread asynchronously checkpoints and writes dirty pages to disk at its own leisure.

---

### 3. Crash Recovery (ARIES Protocol)
If power fails while dirty pages are still in RAM:
- **Phase 1 (Analysis):** Identify active transactions and dirty pages at the time of the crash from the last checkpoint.
- **Phase 2 (Redo):** Replay all changes in the WAL forward to restore the buffer pool to the exact moment of crash.
- **Phase 3 (Undo):** Roll back all uncommitted transactions backwards using Undo Logs to guarantee Atomicity.

---

### 4. Group Commit Optimization
When 1,000 transactions commit at the exact same millisecond, the database batches their WAL flushes into a single synchronous \`fsync()\` syscall, achieving 50,000+ commits per second on high-performance NVMe storage.`,
  },

  {
    moduleSlug: "transactions-concurrency",
    slug: "isolation-levels",
    orderIndex: 2,
    title: "Transaction Isolation Levels & MVCC",
    summary:
      "Balance concurrency throughput against correctness anomalies: understand the 4 ANSI SQL isolation levels, dirty reads, non-repeatable reads, phantom reads, and Multi-Version Concurrency Control (MVCC).",
    difficulty: LearnDifficulty.ADVANCED,
    estimatedMinutes: 16,
    keyTakeaways: [
      "The 4 ANSI SQL isolation levels: Read Uncommitted, Read Committed, Repeatable Read, and Serializable.",
      "Multi-Version Concurrency Control (MVCC) ensures readers never block writers, and writers never block readers.",
      "Read Committed creates a new read snapshot on every single query; Repeatable Read preserves the snapshot from the start of the transaction.",
      "Write Skew is an anomaly that Repeatable Read CANNOT prevent — it requires Serializable or explicit row locking (`SELECT ... FOR UPDATE`).",
    ],
    commonMistakes: [
      "Assuming Repeatable Read prevents all race conditions (it still permits Write Skew unless Serializable or row locking is used).",
      "Thinking MVCC requires acquiring read locks on rows (MVCC reads historical immutable versions without locking).",
      "Leaving long-running transactions open, which blocks vacuum/garbage collection of old row versions and causes database bloat.",
    ],
    quickRevisionMd: `## Isolation Level Anomaly Matrix
| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read | Write Skew |
| :--- | :---: | :---: | :---: | :---: |
| **Read Uncommitted** | ⚠️ Allowed | ⚠️ Allowed | ⚠️ Allowed | ⚠️ Allowed |
| **Read Committed** (Default PG) | ❌ Prevented | ⚠️ Allowed | ⚠️ Allowed | ⚠️ Allowed |
| **Repeatable Read** (Default MySQL) | ❌ Prevented | ❌ Prevented | ❌ Prevented* | ⚠️ Allowed |
| **Serializable** | ❌ Prevented | ❌ Prevented | ❌ Prevented | ❌ Prevented |

### Concurrency Anomalies Defined
- **Dirty Read:** T1 reads data modified by T2 that has NOT yet committed. If T2 rolls back, T1 read garbage.
- **Non-Repeatable Read:** T1 reads row X. T2 modifies row X and commits. T1 reads row X again and sees different values.
- **Phantom Read:** T1 queries rows where \`age > 30\` (gets 5 rows). T2 inserts a new person \`age 35\` and commits. T1 re-runs the query and gets 6 rows.
- **Write Skew:** Two transactions concurrently read disjoint rows that satisfy a global constraint, and each updates a different row violating the constraint.`,
    deepDiveMd: `## Multi-Version Concurrency Control (MVCC)

In traditional two-phase locking (2PL), read locks conflict with write locks, choking throughput. Modern databases (PostgreSQL, MySQL InnoDB, CockroachDB) use **MVCC**:
- **Rule:** Readers never block writers. Writers never block readers.

### How Row Versioning Works
Every row on disk stores invisible transaction metadata:
- \`xmin\` / \`created_by_tx\`: Transaction ID that inserted this version.
- \`xmax\` / \`deleted_by_tx\`: Transaction ID that deleted or superseded this version.

When an \`UPDATE\` occurs:
The old row is NOT overwritten in-place! Instead:
1. The old row's \`xmax\` is set to the current transaction ID.
2. A brand-new row version is appended with \`xmin\` = current transaction ID.
3. Other concurrent transactions reading the table inspect their snapshot rules to determine which version of the row is visible to them!

---

## Write Skew Example (Why Repeatable Read Fails)

**Hospital Doctor On-Call Rule:** *At least one doctor must be on call at all times.*
- Currently Alice and Bob are both on call (\`on_call = true\`).
- **Transaction 1 (Alice):** Checks \`SELECT count(*) FROM doctors WHERE on_call = true\` (returns 2). Sets Alice \`on_call = false\`.
- **Transaction 2 (Bob):** Simultaneously checks \`SELECT count(*) FROM doctors WHERE on_call = true\` (returns 2). Sets Bob \`on_call = false\`.
- Both transactions commit under Repeatable Read because neither modified the same row!
- **Result:** ZERO doctors on call!
- **Fix:** Use \`SERIALIZABLE\` isolation or explicit locking: \`SELECT ... FOR UPDATE\`.`,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Active Recall Questions (3 Verified MCQs per Concept)
// ─────────────────────────────────────────────────────────────────────────────
const RECALL_QUESTIONS: Record<
  string,
  Array<{ prompt: string; options: string[]; correctOption: number; explanation: string }>
> = {
  // ─── Two Pointers ──────────────────────────────────────────────────────────
  "two-pointers": [
    {
      prompt:
        "Under what conditions can the Two Pointers opposite-ends technique find a pair summing to target in O(n) time and O(1) space?",
      options: [
        "The input array must have no duplicate elements.",
        "The input array must be sorted in monotonic order.",
        "The input array must contain only positive numbers.",
        "The input array must have an even length.",
      ],
      correctOption: 1,
      explanation:
        "Opposite-direction two pointers requires monotonic ordering (e.g. sorted ascending). If sum < target, left advances to increase sum; if sum > target, right retreats. Without monotonicity, pair elimination is invalid.",
    },
    {
      prompt:
        "In the Dutch National Flag algorithm (3-way partition), why is the inspection index `mid` NOT incremented when `nums[mid] === 2` is swapped with `nums[high]`?",
      options: [
        "Because `high` is already guaranteed to contain a 0.",
        "Because the element swapped from `high` has not been inspected yet and could be a 0, 1, or 2.",
        "Because `mid` always lags behind `low` by at least one index.",
        "Because incrementing `mid` would violate the sorted invariant of `low`.",
      ],
      correctOption: 1,
      explanation:
        "When swapping `nums[mid]` with `nums[high]`, the value originally at `high` was unexamined. It might be a 0, 1, or 2, so `mid` must examine this newly received element in the next iteration before advancing.",
    },
    {
      prompt:
        "In Floyd's Cycle-Finding Algorithm on linked lists, if `fast` moves at 2 steps per iteration and `slow` moves at 1 step, what guarantees they must meet if a cycle exists?",
      options: [
        "The fast pointer reverses direction upon reaching the tail.",
        "Once both are in the cycle of length C, the relative distance between them decreases by exactly 1 in each iteration.",
        "The slow pointer stops at the midpoint of the cycle until fast catches up.",
        "The hash table tracks visited node memory addresses.",
      ],
      correctOption: 1,
      explanation:
        "Inside a cycle of length C, each step reduces the relative distance between `fast` and `slow` by (2 - 1) = 1. Therefore, `fast` is mathematically guaranteed to close the gap and meet `slow` in at most C steps.",
    },
  ],

  // ─── Sliding Window ────────────────────────────────────────────────────────
  "sliding-window": [
    {
      prompt:
        "Why does standard sliding window fail when searching for a contiguous subarray summing to target k if the array contains negative numbers?",
      options: [
        "Contiguous subarrays cannot be formed with negative numbers.",
        "Negative numbers break monotonicity: expanding right or shrinking left does not guarantee predictable sum changes.",
        "Negative numbers cause runtime stack overflow in dynamic window loops.",
        "Hash maps cannot store negative values as keys.",
      ],
      correctOption: 1,
      explanation:
        "Sliding window relies on monotonicity (e.g., adding positive numbers always grows the sum). When negative numbers exist, shrinking left might increase the sum, breaking the invariant. Use Prefix Sum + HashMap instead.",
    },
    {
      prompt:
        "What is the mathematical runtime complexity of a variable-size sliding window over an array of size n where each element is visited by both `right` and `left`?",
      options: [
        "O(n²) because of the nested while loop.",
        "O(n log n) because of window state lookups.",
        "Amortized O(n) because each element is added to the window at most once and evicted at most once.",
        "O(k) where k is the maximum window size.",
      ],
      correctOption: 2,
      explanation:
        "Even though there is a nested while loop for shrinking, `left` can only increment at most `n` times across the entire algorithm execution. Hence, total operations across both pointers are bounded by 2n, yielding strictly O(n) amortized time.",
    },
    {
      prompt:
        "How do you transform a problem asking for 'number of subarrays with EXACTLY k distinct integers' using sliding window?",
      options: [
        "Use two independent nested while loops inside one window.",
        "Compute: AtMost(K) - AtMost(K - 1).",
        "Sort the input array before computing the window length.",
        "Convert the array to a binary search tree.",
      ],
      correctOption: 1,
      explanation:
        "Computing 'exact k' directly is non-monotonic, but 'at most k' is strictly monotonic and solvable in O(n). By calculating AtMost(k) - AtMost(k - 1), you isolate the exact count cleanly in O(n) time.",
    },
  ],

  // ─── Binary Search ─────────────────────────────────────────────────────────
  "binary-search": [
    {
      prompt: "Which problem structure is solvable via binary search on answer?",
      options: [
        "Finding the longest palindrome in an unsorted string.",
        "Finding the minimum feasible ship capacity to deliver all packages within D days.",
        "Reversing a singly linked list with pointers in-place.",
        "Finding the shortest path in an unweighted general cyclic graph.",
      ],
      correctOption: 1,
      explanation:
        "Binary search on answer applies whenever feasibility is monotonic: if capacity C works, any capacity > C also works [false, false, ..., true, true]. Binary search finds the minimum feasible boundary in O(log(range) * cost(check)).",
    },
    {
      prompt:
        "Why is `mid = left + Math.floor((right - left) / 2)` preferred over `mid = Math.floor((left + right) / 2)` in binary search implementations?",
      options: [
        "It executes in fewer CPU instruction cycles.",
        "It prevents 32-bit signed integer overflow when `left + right` exceeds 2,147,483,647.",
        "It allows binary search to work on negative array indices.",
        "It automatically detects whether the array is sorted ascending or descending.",
      ],
      correctOption: 1,
      explanation:
        "When `left` and `right` are large positive integers, `left + right` can exceed the 32-bit integer limit and wrap around to a negative number, causing out-of-bounds access. The subtraction form avoids this overflow.",
    },
    {
      prompt:
        "In a rotated sorted array without duplicates, how do you determine which half of the array is strictly sorted around `mid`?",
      options: [
        "Compare `nums[mid]` with `target`.",
        "If `nums[left] <= nums[mid]`, the left half is sorted; otherwise the right half is sorted.",
        "Check whether `mid` is an even or odd index.",
        "Both halves are always sorted simultaneously.",
      ],
      correctOption: 1,
      explanation:
        "Since the array was originally sorted and rotated once, the pivot inflection point can only exist in one half. If `nums[left] <= nums[mid]`, no pivot exists between `left` and `mid`, proving the left half is strictly sorted.",
    },
  ],

  // ─── B+ Trees ──────────────────────────────────────────────────────────────
  "b-plus-trees": [
    {
      prompt:
        "Why are B+ Trees preferred over Binary Search Trees (AVL/Red-Black) for relational database disk storage?",
      options: [
        "B+ Trees consume zero RAM memory.",
        "B+ Trees have high fan-out (100-1000+), keeping tree depth to 3-4 levels to minimize costly disk page seeks.",
        "Binary search trees do not support binary search algorithms.",
        "B+ Trees do not require balanced rebalancing algorithms.",
      ],
      correctOption: 1,
      explanation:
        "Disk I/O is block-based. By matching node size to OS disk pages (e.g., 16KB), B+ Trees achieve massive fan-out (100-1000+), allowing trees of billions of records to remain only 3-4 levels deep, requiring minimal disk seeks.",
    },
    {
      prompt:
        "What is the key architectural difference between internal nodes and leaf nodes in a B+ Tree?",
      options: [
        "Internal nodes hold table rows; leaf nodes hold indexes.",
        "Internal nodes hold only separator search keys and child pointers; leaf nodes hold all actual data records and sibling pointers.",
        "Internal nodes are stored on disk; leaf nodes are stored in RAM.",
        "Leaf nodes are unordered; internal nodes are ordered.",
      ],
      correctOption: 1,
      explanation:
        "In a B+ Tree, internal nodes act strictly as routing roadmaps. All key-value data records reside in the leaf nodes, which are linked as a doubly-linked list for sequential range scans.",
    },
    {
      prompt:
        "Why does using random UUIDv4 as a clustered primary key degrade B+ Tree insert performance compared to auto-incrementing integers?",
      options: [
        "UUID strings cannot be indexed by relational databases.",
        "Random inserts hit arbitrary leaf pages across disk, causing frequent 50% page splits, fragmentation, and buffer pool eviction thrashing.",
        "B+ Trees only support numeric integer keys.",
        "Auto-incrementing integers bypass the Write-Ahead Log.",
      ],
      correctOption: 1,
      explanation:
        "Random UUIDs scatter writes across the entire B+ Tree. Full pages frequently split 50/50, leaving nodes half-empty (fragmentation) and constantly ejecting cached pages from the RAM Buffer Pool.",
    },
  ],

  // ─── Indexing Strategies ───────────────────────────────────────────────────
  "indexing-strategies": [
    {
      prompt:
        "Given an index on (department_id, hire_date), why does `WHERE hire_date = '2024-01-01'` fail to perform an index seek?",
      options: [
        "Dates cannot be indexed in relational databases.",
        "It violates the Leftmost Prefix Rule: the composite index is sorted first by department_id.",
        "Secondary indexes only support range scans, not equality checks.",
        "Clustered indexes always override composite indexes.",
      ],
      correctOption: 1,
      explanation:
        "Composite indexes are sorted lexicographically by their leading column first. Without specifying department_id, the database cannot navigate the tree branch and must scan all entries.",
    },
    {
      prompt:
        "What is a 'Covering Index' and why does it drastically improve query performance?",
      options: [
        "An index that encrypts all columns in the table.",
        "An index that contains all columns requested by the SELECT query, completely eliminating the clustered index bookmark lookup.",
        "An index created automatically by the database on every foreign key.",
        "An index that spans across multiple physical database servers.",
      ],
      correctOption: 1,
      explanation:
        "When an index covers all columns in the query's SELECT and WHERE clauses, the database engine satisfies the entire query directly from the secondary index leaf page, avoiding random I/O bookmark lookups.",
    },
    {
      prompt:
        "Why might a database query optimizer intentionally choose a Full Table Scan over using an existing secondary index?",
      options: [
        "When the table contains more than 1,000 rows.",
        "When the index has high cardinality.",
        "When the query matches more than ~20-30% of the table rows, making sequential disk I/O faster than hundreds of thousands of random bookmark lookups.",
        "When the query uses the PRIMARY KEY in the WHERE clause.",
      ],
      correctOption: 2,
      explanation:
        "Bookmark lookups require random disk seeks. If a query matches 25% of a 10M row table, performing 2.5 million random page reads is far slower than reading the whole table sequentially.",
    },
  ],

  // ─── ACID Transactions ─────────────────────────────────────────────────────
  "acid-transactions": [
    {
      prompt:
        "What is the fundamental invariant of Write-Ahead Logging (WAL) in database crash recovery?",
      options: [
        "All user transactions must commit before the WAL file can be read.",
        "Log records describing changes must be flushed to non-volatile disk before the corresponding dirty data pages are written to disk.",
        "Dirty pages in the buffer pool must be flushed immediately on every single SQL statement.",
        "Undo logs are stored exclusively in temporary RAM caches.",
      ],
      correctOption: 1,
      explanation:
        "The WAL invariant guarantees that if a crash occurs while dirty data pages are in memory, the append-only log on disk contains sufficient information to REDO or UNDO the transactions during recovery.",
    },
    {
      prompt:
        "In the ARIES recovery protocol, what occurs during the 'Redo' phase?",
      options: [
        "All active transactions at the time of crash are immediately deleted.",
        "The engine repeats history forward from the last checkpoint, reapplying all logged operations to restore the buffer pool to the exact crash state.",
        "The engine prompts the administrator to re-enter lost SQL commands.",
        "The database rebuilds all B+ tree indexes from scratch.",
      ],
      correctOption: 1,
      explanation:
        "The Redo phase 'repeats history' forward to bring the database to the exact state it was in at the instant of failure (including changes by transactions that were later aborted). The subsequent Undo phase rolls back uncommitted changes.",
    },
    {
      prompt:
        "Why is committing transactions via sequential WAL writes much faster than writing updated data pages directly to table storage?",
      options: [
        "WAL writes do not require disk storage.",
        "WAL writes are append-only sequential disk writes, whereas updating data pages requires random I/O writes across scattered 16KB disk blocks.",
        "WAL writes bypass operating system file buffers entirely.",
        "Data pages are only written once a year during database backups.",
      ],
      correctOption: 1,
      explanation:
        "Sequential append-only writes allow disk heads and SSD flash controllers to write contiguous blocks at maximum hardware throughput, avoiding the costly random seek latencies of scattered table page updates.",
    },
  ],

  // ─── Isolation Levels ──────────────────────────────────────────────────────
  "isolation-levels": [
    {
      prompt:
        "Why is Repeatable Read isolation insufficient to prevent the 'Write Skew' anomaly?",
      options: [
        "Repeatable Read permits dirty reads of uncommitted rows.",
        "Transactions read disjoint sets of rows that satisfy a shared constraint, and each updates a different row without a lock collision.",
        "Repeatable Read does not use MVCC row snapshots.",
        "PostgreSQL and MySQL disable Repeatable Read by default.",
      ],
      correctOption: 1,
      explanation:
        "Under Repeatable Read, each transaction sees a consistent snapshot. However, if Transaction 1 updates Row A and Transaction 2 updates Row B to maintain a global constraint, neither transaction locks the other's row, allowing both to commit and violate the invariant. Serializable isolation or explicit row locks are required.",
    },
    {
      prompt:
        "In Multi-Version Concurrency Control (MVCC), how do transactions read rows that are currently being updated by another active transaction?",
      options: [
        "Readers acquire exclusive write locks on the table.",
        "Readers block until the writer transaction commits or rolls back.",
        "Readers inspect hidden row version metadata (xmin/xmax) and read the historical committed version visible to their snapshot.",
        "The writer transaction is immediately aborted.",
      ],
      correctOption: 2,
      explanation:
        "In MVCC, writers append a new row version rather than overwriting in-place. Readers use their transaction snapshot to view the prior committed version, fulfilling the rule: 'Readers never block writers, and writers never block readers.'",
    },
    {
      prompt:
        "What is a 'Phantom Read' anomaly and under which ANSI SQL isolation level is it formally permitted?",
      options: [
        "Reading data that has been rolled back; permitted in Serializable.",
        "A query scanning a range of rows sees newly inserted rows that were committed by another transaction after the range scan began; permitted in Read Committed.",
        "Two transactions deadlocking on the same primary key.",
        "Modifying a row that has been deleted by an administrator.",
      ],
      correctOption: 1,
      explanation:
        "A phantom read occurs when a range query (`WHERE age > 25`) yields new rows inserted and committed by a concurrent transaction upon re-execution. It is permitted in Read Committed (and technically in Repeatable Read under pure 2PL, though Postgres/MySQL MVCC prevents it).",
    },
  ],
};

async function seedLearn() {
  console.log("Seeding Learn & Revise Hub (Supercharged Theory & Multi-Question MCQs)...");

  // 1. Seed Subjects
  const dsaSubject = await db.learnSubject.upsert({
    where: { slug: "dsa" },
    update: {
      title: "Data Structures & Algorithms",
      description:
        "Core problem-solving patterns, invariants, and complexity intuition for coding interviews.",
      icon: "Code2",
      orderIndex: 1,
      isPublished: true,
    },
    create: {
      slug: "dsa",
      title: "Data Structures & Algorithms",
      description:
        "Core problem-solving patterns, invariants, and complexity intuition for coding interviews.",
      icon: "Code2",
      orderIndex: 1,
      isPublished: true,
    },
  });

  const dbmsSubject = await db.learnSubject.upsert({
    where: { slug: "dbms" },
    update: {
      title: "Database Management Systems",
      description:
        "Indexing, B+ Trees, storage engines, ACID transactions, and concurrency isolation levels.",
      icon: "Database",
      orderIndex: 2,
      isPublished: true,
    },
    create: {
      slug: "dbms",
      title: "Database Management Systems",
      description:
        "Indexing, B+ Trees, storage engines, ACID transactions, and concurrency isolation levels.",
      icon: "Database",
      orderIndex: 2,
      isPublished: true,
    },
  });

  // 2. Seed Modules
  const arraysModule = await db.learnModule.upsert({
    where: { subjectId_slug: { subjectId: dsaSubject.id, slug: "arrays-patterns" } },
    update: {
      title: "Arrays & Patterns",
      description: "Linear-time index coordination and contiguous window techniques.",
      orderIndex: 1,
      isPublished: true,
    },
    create: {
      subjectId: dsaSubject.id,
      slug: "arrays-patterns",
      title: "Arrays & Patterns",
      description: "Linear-time index coordination and contiguous window techniques.",
      orderIndex: 1,
      isPublished: true,
    },
  });

  const searchingModule = await db.learnModule.upsert({
    where: { subjectId_slug: { subjectId: dsaSubject.id, slug: "searching" } },
    update: {
      title: "Searching",
      description: "Logarithmic search spaces and monotonic predicate techniques.",
      orderIndex: 2,
      isPublished: true,
    },
    create: {
      subjectId: dsaSubject.id,
      slug: "searching",
      title: "Searching",
      description: "Logarithmic search spaces and monotonic predicate techniques.",
      orderIndex: 2,
      isPublished: true,
    },
  });

  const indexingModule = await db.learnModule.upsert({
    where: { subjectId_slug: { subjectId: dbmsSubject.id, slug: "indexing-storage" } },
    update: {
      title: "Indexing & Storage Engines",
      description: "B+ Tree layouts, clustered vs secondary indexing, index seeks, and disk I/O optimization.",
      orderIndex: 1,
      isPublished: true,
    },
    create: {
      subjectId: dbmsSubject.id,
      slug: "indexing-storage",
      title: "Indexing & Storage Engines",
      description: "B+ Tree layouts, clustered vs secondary indexing, index seeks, and disk I/O optimization.",
      orderIndex: 1,
      isPublished: true,
    },
  });

  const transactionsModule = await db.learnModule.upsert({
    where: { subjectId_slug: { subjectId: dbmsSubject.id, slug: "transactions-concurrency" } },
    update: {
      title: "Transactions & Concurrency Control",
      description: "ACID guarantees, Write-Ahead Logging (WAL), transaction isolation levels, and lock-free MVCC.",
      orderIndex: 2,
      isPublished: true,
    },
    create: {
      subjectId: dbmsSubject.id,
      slug: "transactions-concurrency",
      title: "Transactions & Concurrency Control",
      description: "ACID guarantees, Write-Ahead Logging (WAL), transaction isolation levels, and lock-free MVCC.",
      orderIndex: 2,
      isPublished: true,
    },
  });

  const moduleMap: Record<string, string> = {
    "arrays-patterns": arraysModule.id,
    searching: searchingModule.id,
    "indexing-storage": indexingModule.id,
    "transactions-concurrency": transactionsModule.id,
  };

  // 3. Seed Concepts & Published Revisions
  for (const item of CONCEPTS) {
    const moduleId = moduleMap[item.moduleSlug];
    if (!moduleId) throw new Error(`Unknown moduleSlug: ${item.moduleSlug}`);

    const existingConcept = await db.learnConcept.findUnique({
      where: { slug: item.slug },
      select: { id: true, publishedRevisionId: true },
    });

    const concept = await db.learnConcept.upsert({
      where: { slug: item.slug },
      update: {
        moduleId,
        orderIndex: item.orderIndex,
      },
      create: {
        moduleId,
        slug: item.slug,
        orderIndex: item.orderIndex,
      },
    });

    const existingV1 = await db.learnConceptRevision.findUnique({
      where: { conceptId_version: { conceptId: concept.id, version: 1 } },
    });

    let revision;
    if (!existingV1) {
      revision = await db.learnConceptRevision.create({
        data: {
          conceptId: concept.id,
          version: 1,
          status: LearnRevisionStatus.PUBLISHED,
          title: item.title,
          summary: item.summary,
          quickRevisionMd: item.quickRevisionMd,
          deepDiveMd: item.deepDiveMd,
          estimatedMinutes: item.estimatedMinutes,
          difficulty: item.difficulty,
          keyTakeaways: item.keyTakeaways,
          commonMistakes: item.commonMistakes,
          sources: ["Intervue Curriculum Team"],
          changeSummary: "Initial seed lesson",
          publishedAt: new Date(),
        },
      });
    } else {
      revision = existingV1;
    }

    // Only set publishedRevisionId if currently unset, preserving admin edits & newer published revisions
    if (!existingConcept?.publishedRevisionId) {
      await db.learnConcept.update({
        where: { id: concept.id },
        data: { publishedRevisionId: revision.id },
      });
    }

    const recallList = RECALL_QUESTIONS[item.slug] || [];
    for (let qIdx = 0; qIdx < recallList.length; qIdx++) {
      const recall = recallList[qIdx];
      const existingQ = await db.learnRecallQuestion.findFirst({
        where: { conceptId: concept.id, orderIndex: qIdx + 1 },
      });
      if (existingQ) {
        await db.learnRecallQuestion.update({
          where: { id: existingQ.id },
          data: {
            revisionId: existingQ.revisionId || revision.id,
            prompt: recall.prompt,
            options: recall.options,
            correctOption: recall.correctOption,
            explanation: recall.explanation,
            isPublished: true,
          },
        });
      } else {
        await db.learnRecallQuestion.create({
          data: {
            conceptId: concept.id,
            revisionId: revision.id,
            prompt: recall.prompt,
            options: recall.options,
            correctOption: recall.correctOption,
            explanation: recall.explanation,
            orderIndex: qIdx + 1,
            isPublished: true,
          },
        });
      }
    }

    console.log(`  ✓ Seeded concept: ${item.slug} with ${recallList.length} recall questions.`);
  }

  console.log("Learn & Revise Hub seed complete: Comprehensive theory and multi-question recall active.");
}

seedLearn()
  .catch((err) => {
    console.error("Failed to seed Learn & Revise:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
