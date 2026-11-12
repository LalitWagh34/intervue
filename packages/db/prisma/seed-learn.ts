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
  // ─── DSA Track ─────────────────────────────────────────────────────────────
  {
    moduleSlug: "arrays-patterns",
    slug: "two-pointers",
    orderIndex: 1,
    title: "Two Pointers",
    summary:
      "Replace nested O(n²) loops on sorted arrays, strings, or linked lists with two coordinated indices moving in O(n) time and O(1) space.",
    difficulty: LearnDifficulty.FOUNDATION,
    estimatedMinutes: 10,
    keyTakeaways: [
      "Use opposite-direction pointers (left/right) on sorted arrays or palindromes.",
      "Use same-direction pointers (slow/fast) for in-place deduplication, partitioning, or cycle detection.",
      "Each pointer moves monotonically at most n steps, guaranteeing O(n) total work.",
    ],
    commonMistakes: [
      "Forgetting that opposite-direction pair sum requires a sorted array first.",
      "Using `left <= right` vs `left < right` inconsistently and double-counting the middle element.",
      "Mutating an array in-place while advancing the read pointer without preserving the write boundary.",
    ],
    quickRevisionMd: `## Core Idea
Maintain two indices (\`left\`, \`right\` or \`slow\`, \`fast\`) whose movements are monotonic, eliminating redundant inner-loop scans.

### When to Recognize It
- Sorted array target sum / triplet sum (\`Two Sum II\`, \`3Sum\`)
- Palindrome checks or string reversal
- In-place array compaction (\`Remove Duplicates\`, \`Move Zeroes\`)
- Linked list cycle / middle node (\`fast = 2x\`, \`slow = 1x\`)

### Complexity
| Variant | Time | Space |
| :--- | :--- | :--- |
| Opposite Ends | \`O(n)\` | \`O(1)\` |
| Slow / Fast | \`O(n)\` | \`O(1)\` |

### Mental Template (Opposite Ends)
\`\`\`ts
let left = 0;
let right = nums.length - 1;

while (left < right) {
  const sum = nums[left] + nums[right];
  if (sum === target) return [left, right];
  if (sum < target) left++;
  else right--;
}
\`\`\``,
    deepDiveMd: `## Why Two Pointers Works
In a brute-force pair search, for every \`i\` you scan all \`j > i\`, costing \`O(n²)\`. When the input has **monotonic order** (e.g., sorted ascending), inspecting \`nums[left] + nums[right]\` lets you discard an entire row or column of pairs in one step:
- If \`sum < target\`, \`nums[left]\` paired with *any* smaller index \`< right\` will also be too small, so \`left\` can safely advance.
- If \`sum > target\`, \`nums[right]\` paired with *any* larger index \`> left\` will also be too large, so \`right\` can safely retreat.

## Two Main Flavors

### 1. Opposite-Direction (Converging)
Start at \`0\` and \`n - 1\` and move inward until \`left >= right\`.
- **Classic problems:** *Two Sum II*, *Container With Most Water*, *Trapping Rain Water*, *Valid Palindrome*.
- **Invariant:** All valid unexplored pairs lie strictly inside \`[left, right]\`.

### 2. Same-Direction (Slow & Fast)
Both pointers start at \`0\`: \`fast\` explores every element, while \`slow\` marks the boundary of the processed/valid prefix.
\`\`\`ts
function removeDuplicates(nums: number[]): number {
  if (nums.length === 0) return 0;
  let slow = 1;
  for (let fast = 1; fast < nums.length; fast++) {
    if (nums[fast] !== nums[fast - 1]) {
      nums[slow] = nums[fast];
      slow++;
    }
  }
  return slow;
}
\`\`\`
- **Invariant:** \`nums[0 .. slow - 1]\` contains only unique elements seen so far.

## Interview Checklist
1. Can the input be sorted without breaking index requirements? (Sorting costs \`O(n log n)\`.)
2. What happens on duplicates (e.g., skipping repeated values in \`3Sum\`)?
3. Should the loop condition be \`left < right\` (distinct pair) or \`left <= right\` (single element allowed)?`,
  },
  {
    moduleSlug: "arrays-patterns",
    slug: "sliding-window",
    orderIndex: 2,
    title: "Sliding Window",
    summary:
      "Maintain a contiguous subarray or substring window [left, right] that expands and shrinks incrementally in O(n) time.",
    difficulty: LearnDifficulty.INTERMEDIATE,
    estimatedMinutes: 12,
    keyTakeaways: [
      "Use for contiguous subarray or substring problems looking for min length, max length, or exact target condition.",
      "The outer pointer expands to incorporate elements; the inner pointer contracts only when the window invariant is violated.",
      "Each element enters and exits the window at most once, maintaining linear amortized O(n) runtime.",
    ],
    commonMistakes: [
      "Attempting sliding window when the array contains negative numbers (monotonicity breaks; use Prefix Sum + HashMap instead).",
      "Updating state in the shrink loop before checking the condition, resulting in off-by-one errors.",
      "Recalculating window state from scratch instead of doing incremental O(1) additions and subtractions.",
    ],
    quickRevisionMd: `## Core Idea
Instead of recomputing subarray sums or frequencies from scratch, slide a window by adding \`nums[right]\` when expanding and subtracting \`nums[left]\` when shrinking.

### When to Recognize It
- Longest substring without repeating characters
- Minimum size subarray with sum >= target
- Fixed-size window maximum or moving averages
- String anagram / permutation search

### Mental Template (Variable Window)
\`\`\`ts
let left = 0;
let maxLen = 0;

for (let right = 0; right < arr.length; right++) {
  // 1. Expand: include arr[right] in window state
  add(arr[right]);

  // 2. Shrink: while invariant violated, evict arr[left]
  while (isInvalid()) {
    remove(arr[left]);
    left++;
  }

  // 3. Record: valid window [left, right]
  maxLen = Math.max(maxLen, right - left + 1);
}
\`\`\``,
    deepDiveMd: `## The Monotonicity Requirement
Sliding window is only valid when the window's validity changes **monotonically**:
- Expanding \`right\` must move the state closer to satisfying (or violating) the condition.
- Shrinking \`left\` must move the state in the opposite direction.

If numbers can be negative, expanding might decrease the sum, and shrinking might increase it. Monotonicity is lost, making dynamic windowing invalid.

## Fixed vs Variable Windows
1. **Fixed Window (Size K):**
   - Initialize window \`0 .. k - 1\`.
   - In each step: slide both \`left\` and \`right\` by 1, subtracting \`arr[left]\` and adding \`arr[right]\`.
2. **Variable Window (At Most / At Least K):**
   - Often transformed into "At Most K":
   \`\`\`
   Exact(K) = AtMost(K) - AtMost(K - 1)
   \`\`\`
   - This pattern makes problems like *Subarrays with K Different Integers* trivially linear.`,
  },
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
      "Binary search applies whenever the search space can be partitioned into a monotonic boolean predicate [false, ..., false, true, ..., true].",
      "Prevent integer overflow by computing mid as `left + Math.floor((right - left) / 2)`.",
      "Clearly define whether boundary updates are inclusive `[left, right]` or exclusive `[left, right)`.",
    ],
    commonMistakes: [
      "Using `(left + right) / 2` which can integer-overflow in languages with 32-bit signed integers.",
      "Infinite loops when `right - left === 1` due to truncation direction when updating `left = mid`.",
      "Failing to recognize binary search on non-array problems (e.g., search on answer range).",
    ],
    quickRevisionMd: `## Standard Invariant Template
\`\`\`ts
function lowerBound(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;
  let ans = nums.length;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] >= target) {
      ans = mid;
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }
  return ans;
}
\`\`\``,
    deepDiveMd: `## Beyond Sorted Arrays: Monotonic Predicates
Whenever a problem asks for the **minimum feasible value** or **maximum valid capacity** (e.g., *Koko Eating Bananas*, *Capacity To Ship Packages*), check if feasibility is monotonic:
- If speed \`k\` works, every speed \`> k\` also works.
- That produces \`[false, false, ..., true, true, ...]\`, and binary search finds the **first \`true\`** in \`O(log(Range) * cost(check))\`.

## Avoiding Off-by-One Bugs
Using an explicit \`ans\` variable with an inclusive range \`[left, right]\` removes almost all boundary guesswork:
- Loop condition is always \`while (left <= right)\`.
- Both branches strictly shrink the interval: \`left = mid + 1\` or \`right = mid - 1\`, so termination is mathematically guaranteed.
- Whenever \`mid\` satisfies the condition, save \`ans = mid\` and keep searching the better half.

## Complexity
- **Time:** \`O(log n)\` for array lookup, \`O(n log R)\` when each predicate check scans \`n\` items over answer range \`R\`.
- **Space:** \`O(1)\` iterative.`,
  },

  // ─── DBMS Track ────────────────────────────────────────────────────────────
  {
    moduleSlug: "indexing-storage",
    slug: "b-plus-trees",
    orderIndex: 1,
    title: "B+ Trees & Storage Layout",
    summary:
      "The foundational on-disk storage layout for modern relational databases: shallow tree depth, high fan-out, and sequential leaf node pointer linking for ultra-fast point lookups and range scans.",
    difficulty: LearnDifficulty.FOUNDATION,
    estimatedMinutes: 12,
    keyTakeaways: [
      "B+ Trees store all actual table data or pointers exclusively in leaf nodes; internal nodes store only routing search keys.",
      "High branching factor (fan-out of 100-1000) keeps tree depth shallow (typically 3-4 levels) even for millions or billions of rows.",
      "Leaf nodes form a contiguous doubly-linked list, allowing O(k) sequential range scans without re-traversing tree branches.",
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

### Why Not Binary Search Trees on Disk?
| Metric | Binary Search Tree (AVL/Red-Black) | B+ Tree |
| :--- | :--- | :--- |
| Fan-Out | 2 children per node | 100 - 1,000+ per node |
| Tree Height for 10M rows | ~24 levels (24 random disk seeks) | 3 - 4 levels (3-4 disk seeks) |
| Range Scan Cost | \`O(k log n)\` through in-order tree traversal | \`O(k)\` linear scan along leaf pointers |

### Range Scan Invariant
To execute \`WHERE age BETWEEN 20 AND 30\`:
1. Traverse root to leaf to locate the first key \`>= 20\` in \`O(log_b n)\`.
2. Follow sibling \`next\` leaf pointers sequentially until encountering a key \`> 30\`. Zero tree re-traversals needed!`,
    deepDiveMd: `## Physical Page Layout & Fan-out Math
Relational storage engines like MySQL InnoDB operate in discrete blocks called **Pages** (default 16 KB).

### The Math Behind Tree Depth
Assume a 16 KB page:
- Page header + directory overhead: ~1 KB.
- Usable space: ~15 KB = 15,360 bytes.
- Key size (8-byte integer) + Child Pointer (6-byte page offset) = 14 bytes per entry.
- **Fan-out (b):** \`15,360 / 14 ≈ 1,097 children per internal page\`.

\`\`\`
Level 1 (Root): 1 page = ~1,000 pointer branches
Level 2: 1,000 pages = ~1,000,000 pointer branches
Level 3: 1,000,000 pages = ~1,000,000,000 leaf entries!
\`\`\`
With only **3 page fetches from disk** (and the root page is cached in RAM buffer pool permanently), the database searches across **1 billion records** in ~2 actual I/O operations!

## Page Splits & Fragmentation
- When an insertion occurs on a page that is 100% full:
  1. The page splits 50/50 into two half-full pages.
  2. The median key is promoted up to the parent internal page.
  3. Sibling pointers are updated atomically.
- **Interview Rule:** Monotonically increasing primary keys (Auto-Increment \`BIGINT\`) append to the rightmost leaf without splits. Random keys (UUIDv4) hit random leaf pages, causing frequent 50% page splits, buffer pool churn, and disk bloat.`,
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

## Index Selectivity & Cardinality
The database optimizer will **reject** an index and perform a Full Table Scan if:
- The column has very low cardinality (e.g. \`is_active\` with 90% true).
- If retrieving the indexed rows would require bookmark lookups for >20% of the table, sequential disk scan is faster than random disk I/O.`,
  },
  {
    moduleSlug: "transactions-concurrency",
    slug: "acid-transactions",
    orderIndex: 1,
    title: "ACID & Write-Ahead Logging (WAL)",
    summary:
      "The four foundational transactional guarantees and how modern database storage engines guarantee crash recovery and durability without synchronously flushing every modified data page to disk.",
    difficulty: LearnDifficulty.FOUNDATION,
    estimatedMinutes: 12,
    keyTakeaways: [
      "Atomicity (All-or-Nothing) and Durability (Committed data survives crashes) are powered by Write-Ahead Logging (WAL) and Undo Logs.",
      "The Write-Ahead Log Invariant: log records describing a change MUST reach non-volatile disk before the corresponding dirty data page is written.",
      "Sequential append-only WAL writes are orders of magnitude faster than random data page writes on disk/SSDs.",
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

### 3. Crash Recovery (ARIES Protocol)
If power fails while dirty pages are still in RAM:
- **Phase 1 (Analysis):** Identify active transactions and dirty pages at the time of the crash from the last checkpoint.
- **Phase 2 (Redo):** Replay all changes in the WAL forward to restore the buffer pool to the exact moment of crash.
- **Phase 3 (Undo):** Roll back all uncommitted transactions backwards using Undo Logs to guarantee Atomicity.`,
  },
  {
    moduleSlug: "transactions-concurrency",
    slug: "isolation-levels",
    orderIndex: 2,
    title: "Transaction Isolation Levels & MVCC",
    summary:
      "Balance concurrency throughput against correctness anomalies: understand the 4 ANSI SQL isolation levels, dirty reads, non-repeatable reads, phantom reads, and Multi-Version Concurrency Control (MVCC).",
    difficulty: LearnDifficulty.ADVANCED,
    estimatedMinutes: 15,
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

const RECALL_QUESTIONS: Record<
  string,
  { prompt: string; options: string[]; correctOption: number; explanation: string }
> = {
  // ─── DSA Recall ────────────────────────────────────────────────────────────
  "two-pointers": {
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
  "sliding-window": {
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
  "binary-search": {
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

  // ─── DBMS Recall ───────────────────────────────────────────────────────────
  "b-plus-trees": {
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
  "indexing-strategies": {
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
  "acid-transactions": {
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
  "isolation-levels": {
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
};

async function seedLearn() {
  console.log("Seeding Learn & Revise Hub (DSA & DBMS)...");

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

    const revision = await db.learnConceptRevision.upsert({
      where: { conceptId_version: { conceptId: concept.id, version: 1 } },
      update: {
        status: LearnRevisionStatus.PUBLISHED,
        title: item.title,
        summary: item.summary,
        quickRevisionMd: item.quickRevisionMd,
        deepDiveMd: item.deepDiveMd,
        estimatedMinutes: item.estimatedMinutes,
        difficulty: item.difficulty,
        keyTakeaways: item.keyTakeaways,
        commonMistakes: item.commonMistakes,
        publishedAt: new Date(),
      },
      create: {
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
        publishedAt: new Date(),
      },
    });

    await db.learnConcept.update({
      where: { id: concept.id },
      data: { publishedRevisionId: revision.id },
    });

    const recall = RECALL_QUESTIONS[item.slug];
    if (recall) {
      const existingQ = await db.learnRecallQuestion.findFirst({
        where: { conceptId: concept.id, orderIndex: 1 },
      });
      if (existingQ) {
        await db.learnRecallQuestion.update({
          where: { id: existingQ.id },
          data: {
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
            prompt: recall.prompt,
            options: recall.options,
            correctOption: recall.correctOption,
            explanation: recall.explanation,
            orderIndex: 1,
            isPublished: true,
          },
        });
      }
      console.log(`    ✓ Seeded recall question for ${item.slug}`);
    }

    console.log(`  ✓ Seeded concept: ${item.slug} (revision v1 published)`);
  }

  console.log("Learn & Revise Hub seed complete: DSA and DBMS tracks live.");
}

seedLearn()
  .catch((err) => {
    console.error("Failed to seed Learn & Revise:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
