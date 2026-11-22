# Learn & Revise Content Manifest Pipeline

This directory holds the authoritative curriculum manifests for Intervue's **Learn & Revise Hub**. Each JSON file represents a version-controlled, reviewed concept specification with deep educational theory and revision-bound active recall questions.

---

## 1. Authoring & Publishing Workflow

To maintain high pedagogical quality and prevent unvetted AI hallucinations or broken questions from reaching students, content moves through a strict 6-stage pipeline:

```
┌─────────────────────────┐
│ 1. Manifest Authoring   │  Create or update a concept JSON file in `data/learn/<slug>.json`
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ 2. Technical Review     │  Domain expert validates code examples, proofs, distractors & sources
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ 3. Dry-Run Validation   │  Run `bun run import:learn` (checks schema, options, and invariants)
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ 4. Import as DRAFT      │  Run `bun run import:learn --execute` (creates versioned DRAFT in DB)
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ 5. Admin Preview        │  Preview theory and test student recall experience in `/admin/learn`
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ 6. Shared Publish Path  │  Publish through shared validation (`POST /api/admin/learn/concepts/:id/publish`)
└─────────────────────────┘
```

---

## 2. Invariants & Safety Guarantees

1. **Strict Immutability of Published Content**:
   - Once a revision is `PUBLISHED`, its theory and questions cannot be modified in-place or deleted.
   - Importing an updated manifest for an existing published concept automatically increments the revision (`version = N + 1`) and creates a new `DRAFT`. The live version remains active until explicitly published.
2. **Idempotent Imports**:
   - Re-running the import on unchanged manifests safely detects identical content and skips DB writes.
   - Running on existing un-published drafts updates the draft in-place without generating orphan revisions.
3. **Revision-Bound Recall Questions**:
   - Every recall question is bound to its specific `revisionId`.
   - Active recall questions for version $N$ will never mix with questions from version $N-1$ or $N+1$.
4. **No Auto-Publish Bypass**:
   - Manifest imports **always** land in `DRAFT` status.
   - Publishing requires passing the shared server completeness validator (markdown length, takeaways count, mistake count, option bounds, and minimum 2 active questions).

---

## 3. Manifest Schema Structure

Each file in this directory must conform to the TypeScript schema defined in `manifest.schema.ts`.

### Example Reference Manifest: `two-pointers.json`

```json
{
  "moduleSlug": "arrays-patterns",
  "slug": "two-pointers",
  "orderIndex": 1,
  "title": "Two Pointers",
  "summary": "Replace nested O(n²) loops on sorted arrays, strings, or linked lists with two coordinated indices moving in O(n) time and O(1) space.",
  "difficulty": "FOUNDATION",
  "estimatedMinutes": 12,
  "objectives": [
    "Understand the monotonicity prerequisite required for two-pointer pair elimination.",
    "Master opposite-direction converging pointers for sorted pair sum and palindrome checks."
  ],
  "prerequisites": [
    "Array indexing and traversal",
    "Basic Big-O notation"
  ],
  "quickRevisionMd": "## Core Idea\nMaintain two pointers...",
  "deepDiveMd": "## Theoretical Foundation\nWhy Two Pointers Works...",
  "complexity": {
    "time": "O(n) amortized time",
    "space": "O(1) auxiliary space",
    "tradeOffs": "Requires monotonic input ordering; sorting first takes O(n log n)."
  },
  "commonMistakes": [
    "Attempting opposite-direction pair sum on an unsorted array without sorting first.",
    "Using left <= right vs left < right inconsistently."
  ],
  "keyTakeaways": [
    "Monotonicity is the prerequisite: pair elimination only works when advancing an index predictably eliminates unneeded search space.",
    "Opposite-direction pointers converge to search sorted ranges in O(n) time."
  ],
  "sources": [
    "Introduction to Algorithms (CLRS) - Two Pointers and Partitioning",
    "LeetCode Curated Algorithm Patterns - Two Pointers"
  ],
  "reviewer": "Intervue Curriculum Team",
  "reviewDate": "2026-11-20",
  "changeSummary": "Canonical reference concept manifest for Two Pointers.",
  "recallQuestions": [
    {
      "prompt": "Under what conditions can the Two Pointers opposite-ends technique find a pair summing to target in O(n) time and O(1) space?",
      "options": [
        "The input array must have no duplicate elements.",
        "The input array must be sorted in monotonic order.",
        "The input array must contain only positive numbers.",
        "The input array must have an even length."
      ],
      "correctOption": 1,
      "explanation": "Opposite-direction two pointers requires monotonic ordering (e.g. sorted ascending). If sum < target, left advances; if sum > target, right retreats.",
      "isPublished": true
    }
  ]
}
```

### Field Requirements

| Field | Type | Validation Rules |
| :--- | :--- | :--- |
| `moduleSlug` | `string` | Must exist in `LearnModule` table (e.g., `arrays-patterns`) |
| `slug` | `string` | Kebab-case slug (e.g., `two-pointers`) |
| `orderIndex` | `number` | Integer $\ge 0$ |
| `title` | `string` | Minimum 3 characters |
| `summary` | `string` | Minimum 10 characters |
| `difficulty` | `string` | `"FOUNDATION"` \| `"INTERMEDIATE"` \| `"ADVANCED"` |
| `estimatedMinutes` | `number` | Integer $\ge 1$ |
| `quickRevisionMd` | `string` | Markdown text $\ge 100$ characters |
| `deepDiveMd` | `string` | Markdown text $\ge 300$ characters |
| `keyTakeaways` | `string[]` | At least 2 non-empty items |
| `commonMistakes` | `string[]` | At least 1 non-empty item |
| `sources` | `(string \| object)[]` | At least 1 source with title and optional URL |
| `reviewer` | `string` | Name or team responsible for technical review |
| `reviewDate` | `string` | Valid ISO date (e.g. `YYYY-MM-DD`) |
| `changeSummary` | `string` | Description of changes or initial authoring notes |
| `recallQuestions` | `array` | At least 2 verified MCQs |
| `recallQuestions[].prompt` | `string` | Minimum 5 characters; unique per manifest |
| `recallQuestions[].options` | `string[]` | 2 to 6 non-empty strings; no duplicate options |
| `recallQuestions[].correctOption` | `number` | Valid 0-indexed integer ($0 \le \text{idx} < \text{options.length}$) |
| `recallQuestions[].explanation` | `string` | Minimum 5 characters |

---

## 4. CLI Execution Commands

Run from the monorepo root or inside `packages/db`:

```bash
# 1. Preview changes (Dry-Run mode by default - safe, no database writes)
bun run --filter @intervue/db import:learn

# 2. Preview a specific file
bun run --filter @intervue/db import:learn --file prisma/data/learn/two-pointers.json

# 3. Apply changes and create DRAFT revisions in the database
bun run --filter @intervue/db import:learn --execute
```
