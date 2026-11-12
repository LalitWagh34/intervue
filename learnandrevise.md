Intervue — Learn & Revise Hub
Product Requirements, Architecture & Controlled Implementation Plan
Status: Proposed — awaiting repository verification and approval
Document type: Product specification + implementation roadmap for Antigravity/Codex
Priority: Next major product feature after the existing UI redesign
Proposed navigation label: Learn & Revise
Core principle: Learn → Recall → Apply → Evaluate → Revise
Execution rule: This document is a plan, not permission to implement every feature. Inspect the current repository first. Work on one small, explicitly approved micro-task at a time. After each change, run applicable tests, inspect the visual result and diff, report findings, and stop for approval. Never assume an item in this proposal already exists in the codebase.

1. Executive Summary
Build a database-backed, interview-oriented concept learning and revision system within Intervue. Students should be able to discover structured concepts, learn at a depth appropriate for their goals, test recall, practice related questions, and schedule further revision.

The feature must complement rather than duplicate existing areas:
Existing feature	Responsibility	Learn & Revise connection
Prep Hub	Solving problems, practice sheets, company questions	Deep links to relevant problems; do not replicate question banks
AI Interview	Simulating interviews, generating evaluations	Eventually link verified topic-level weaknesses to lessons
AI Mentor	Personalized explanations and probing questions	Launch a mentor conversation with concept context
Notes & Bookmarks	Personal learning artifacts	Reuse or integrate existing mechanisms where suitable
Admin CMS	Managing application content	Extend to manage reviewed lessons and recall questions
Learn & Revise (new)	Concept understanding, recall, progress, revision	The connecting learning layer


Product differentiation: Not a generic article library. Intervue should help users understand what to study, why it matters in interviews, whether they can explain it, and when to revisit it.
Intended users
- Students preparing for internships and entry-level SWE interviews.
- Developers preparing for backend, frontend, full-stack, DevOps, and system-design interviews.
- Experienced engineers preparing for broader design and trade-off discussions.
Product success outcomes
- Users can find and begin a relevant concept without struggling through navigation.
- They can read short summaries or deeper material within a consistent interface.
- Reading progress is not confused with proven understanding.
- A knowledge check records a meaningful result and leads to a review action.
- Links to practice and AI Mentor work without duplicating existing functionality.
- Editors can safely draft, preview, review, publish, and update content.
- Content is fetched on demand instead of shipping all lessons in the initial app bundle.
Non-goals for V1: A separate CMS vendor, vector database, AI-generated curriculum at request time, unreviewed bulk content, auto-generated interview weakness scores, full senior/staff curriculum, elaborate adaptive learning algorithms, and wholesale frontend redesign.
2. UX and Information Architecture
Navigation
Add Learn & Revise to the authenticated navigation, near Practice Hub. Keep these clearly distinct:
- Learn & Revise: Learn or revisit an idea.
- Practice Hub: Solve or practice an existing question.
Preserve the existing Intervue brand and the approved Warm Precision design language:
- Light: warm beige canvas (#F6F4EF) and clean white reading surfaces.
- Dark: restrained graphite canvas (#171819) and layered neutral surfaces.
- Maintain both Light / Dark / System theme behavior if available in the current code.
- Use existing semantic design tokens and shared components; do not introduce unrelated visual systems.
- Avoid large nested cards, decorative gradients, neon/glows, tiny type, and needless animations.
2.1 Revision home (/learn — proposed route)
Purpose: Help a returning student choose the next meaningful action.

Suggested elements, in order:
1. Header and searchable concepts input.
2. Optional target role and experience-level preferences (not mandatory to browse).
3. Continue learning if there is a real persisted activity to resume; otherwise show a sensible first step.
4. Due for revision and Needs practice, only when real progress data supports the counts.
5. Explore subjects, with brief descriptions and concept counts.
6. Your learning path, if selected; otherwise a gentle invitation to choose one.
Do not invent counts, estimated times, or personalized recommendations. Empty states should be genuinely useful.

Illustrative wireframe:
Learn & Revise
[Search concepts, patterns, technologies ...]
Target: Backend Engineer        Level: Intermediate

[Continue learning: Database Indexing →]
[Due for revision: 6] [Needs practice: 4]

Explore subjects
[DSA]             [System Design]
[Core CS]         [Low-Level Design]
[Backend]         [Frontend]
[Behavioral]      [Engineering Practices]

Your learning path
✓ Complexity basics
✓ Arrays and hashing
◉ Two pointers
○ Sliding window
The example values are placeholders in this document only; they must never be hardcoded as production user data.
2.2 Subject/catalog page (/learn/subjects/:slug — proposed)
- List modules in curricular order, then concepts within each module.
- Offer search and filters by level, study status, and optionally reading time.
- Display concept title, summary, relevant level, progress state, and estimated reading time only if editorially defined.
- Support both browse-anything and recommended-path experiences; do not gate advanced lessons.
- Paginate or cursor-load larger catalogs.
- Include loading, empty, filtered-empty, error, and retry states.
2.3 Concept reader (/learn/concepts/:slug — proposed)
On desktop:
- Left: optional collapsible module/concept navigation.
- Center: comfortable reading width with Quick revision and Deep dive views.
- Right: sticky on-page headings when space permits.
On mobile, collapse navigation/outline into accessible menus and preserve a single readable content column.

Recommended lesson composition:
1. Title, subject/module, level and scope, reading time (if verified).
2. Quick revision: concise explanation and essential points.
3. Understand deeply: worked examples, diagrams, code, alternatives.
4. When to use / when not to use: context, trade-offs, failure modes.
5. Common mistakes: misconceptions and interview traps.
6. Check your understanding: recall questions and explanations.
7. Practice: contextual links to existing Prep Hub problems or design exercises.
8. Ask AI Mentor: contextual link/open conversation; show clear separation between reviewed material and AI output.
9. Review again / Mark studied / Self-assessed confidence actions, with accurate meaning.
Use readable prose and code blocks, not a separate card around each paragraph. Ensure diagrams have accessible alternatives.
2.4 Learning paths
Two valid user journeys:
- Follow a path: A curated order of concepts for a role and level.
- Explore freely: Browse any subject or concept with no prerequisites enforced.
Prerequisites guide recommendations; they must not lock reading access.
2.5 Level model
Maintain one canonical concept, with shared fundamentals and optional depth sections (e.g., foundation, intermediate, advanced, staff-level reasoning). Do not clone the same lesson four times.

Example, Caching:
Level	Expected understanding
Foundation / junior	Cache hits/misses, TTL, basic use cases
Intermediate / mid	Cache-aside, eviction, invalidation, stale data
Advanced / senior	Stampedes, hot keys, consistency, failures, operational trade-offs
Staff	Cross-service strategy, cost/reliability targets, migrations, organizational impact


Recommended level determines default depth, not permission to access other content. Levels describe expected reasoning, not necessarily harder trivia.
3. Curriculum and Editorial Quality
Subject taxonomy (long-term)
1. DSA: complexity, arrays, hashing, linked lists, stacks/queues, trees, heaps, graphs, recursion, greedy, backtracking, DP, patterns.
2. Core CS: operating systems, networking, DBMS, OOP, concurrency.
3. Low-level design: modeling, SOLID, design patterns, API contracts, design exercises.
4. System design: requirements, estimation, caching, queues, replication, partitioning, consistency, reliability, case studies.
5. Engineering practices: testing, debugging, security, observability, performance, deployment.
6. Role-specific: frontend, backend, full stack, DevOps, language fundamentals.
7. Behavioral and leadership: ownership, conflict, collaboration, mentoring, decision making.
V1 curriculum strategy — one complete vertical slice first
Recommended pilot: DBMS learning path — enough related concepts to test ordering, prerequisites, recall, and scheduling:
- Database indexing and composite indexes
- Normalization and denormalization
- Transactions and ACID
- Isolation levels and anomalies
- Locks, deadlocks, and concurrency control
- Query planning and optimization
- SQL joins and query reasoning
Start with one complete concept (Database Indexing) end-to-end. Once the catalog, reader, authoring, checks, and persistence are proven, expand to a coherent DBMS path. Then expand to DSA, OS, CN, and system design. Do not start with 100 shallow lessons.
Per-concept editorial checklist
- Precise learning objective and target audience.
- Correct, reviewed explanations and working examples.
- Quick revision and deeper sections are mutually consistent.
- Trade-offs and counterexamples where relevant.
- Source references, attribution, last-reviewed date, and content version.
- Recall questions with clear expected answers and explanations.
- Related practice links only when they resolve to real existing content.
- Estimate reading time consistently or omit.
- No unsupported claims about interview frequency, employer requirements, or measured readiness.
Content workflow
Draft → Review → Publish → Revise
- AI may help create a draft or alternative explanation, but publication requires editorial review.
- Never silently replace a published lesson with unreviewed AI output.
- Support preview before publish.
- Record publisher/editor, review timestamp, version, and status.
- Keep an audit trail for content changes if feasible.
- Prevent accidental publication of untrusted external links or unsafe Markdown.
4. Proposed Technical Architecture (Verify Against Repository)
The current project is expected to use React + TypeScript, React Router, Tailwind CSS, React Query, a backend API, PostgreSQL/Prisma, and an existing Admin CMS. Antigravity must inspect and confirm actual packages, routing, authentication, schema, deployment limits and API conventions before implementing.
Student UI (React)
  Learn home | Catalog | Concept reader | Recall | Revision queue
        |
        v
Existing API server (auth + validation + rate limits)
  Catalog reads | Lesson reads | Progress writes | Recall attempts
        |
        v
PostgreSQL + Prisma
  Content + versions | Paths | Progress | Attempts | Review schedule
        ^
        |
Existing Admin CMS
  Draft | Preview | Review | Publish | Revisions

Existing integrations (incrementally):
  Practice Hub | Notes/Bookmarks | AI Mentor | Interview feedback
4.1 Storage design principles
- Database-backed content: use PostgreSQL for curriculum, lesson text, status, progress, and attempts.
- On-demand frontend fetching: catalog receives small summaries; lesson body is fetched only on opening a concept.
- Markdown as content body, stored as text in DB and rendered safely with a vetted renderer.
- Structured metadata for filtering (subject, slug, level, tags, ordering, status, minutes).
- Diagrams/images stored in an appropriate object storage or existing asset pipeline; DB keeps references, not raw image binaries.
- Do not bundle full lesson corpora into the main JavaScript entry chunk.
- Do not add a vector DB or separate search engine in V1. Begin with indexed DB filtering and text search as requirements justify.
4.2 Conceptual data model
These are logical entities, not final Prisma models; verify existing naming/conventions and avoid duplicate tables.
Entity	Key responsibilities
LearningSubject	Subject slug, title, description, display order, visibility
LearningModule	Belongs to subject; module ordering, metadata
LearningConcept	Stable ID, slug, module, summary, tags, reading time, publish state, current published revision
ConceptRevision	Immutable published lesson snapshot/version, section content, references, timestamps
ConceptSection	Structured quick review / deep dive / examples / mistakes / level-specific parts (as fields or revision-owned records)
RecallQuestion	Type, prompt, response specification, explanation, difficulty/level, version association
LearningPath	Role/level path metadata
LearningPathItem	Ordered concept membership in a path
ConceptPrerequisite	Directed concept-to-concept relationship; prevent cycles
ConceptPracticeLink	Links to valid existing questions, sheets or exercises
UserConceptProgress	User+concept status, timestamps, self-confidence, next-review date, references to last attempt
RecallAttempt	User, concept/question snapshot or version, submitted answer/result, hints used, time, timestamp
ContentAuditEvent (optional initially)	Editorial action, editor, revision and timestamp


Schema constraints and safety:
- Unique stable slugs per chosen scope, unique user+concept progress record.
- Index by subject/module/order/status and by (userId, nextReviewAt) for due queue.
- Reference integrity for prerequisites, path items, question links, attempts.
- Explicit publication status and published revision pointer; students can only fetch published revisions.
- Do not expose unpublished question solutions or editorial notes through public/student catalog APIs.
- Define deletion and archival semantics; do not cascade-delete students' assessment history accidentally.
- Version published lessons and recall questions so historical attempts remain interpretable after editing.
- Draft schema and migration strategy should be reviewed before applying migrations.
4.3 Suggested lesson representation
Concept: database-indexing
  title: Database Indexing
  subject: DBMS
  module: Query Optimization
  levelTags: [foundation, intermediate]
  summary: ...
  estimatedReadingMinutes: 12
  currentPublishedRevision: 3
  revision:
    quickRevisionMarkdown: ...
    foundationMarkdown: ...
    intermediateMarkdown: ...
    advancedMarkdown: ...
    staffDiscussionMarkdown: ...
    examplesMarkdown: ...
    commonMistakesMarkdown: ...
    sourceReferences: ...
The specific field structure can be a single versioned JSON document plus strongly typed filterable metadata, or normalized section rows. Choose based on editorial workflow and query needs; avoid premature over-normalization.
4.4 API outline (illustrative, not pre-approved contracts)
Method	Endpoint	Response/action
GET	/api/learning/subjects	Published subject metadata and summary counts
GET	/api/learning/concepts?subject=dbms&cursor=...	Paginated metadata only, not every lesson body
GET	/api/learning/concepts/:slug	One published lesson, relevant metadata, version
GET	/api/learning/concepts/:slug/questions	Recall question prompts; avoid leaking correct answers prematurely
GET	/api/learning/paths	Curated role/level paths
GET	/api/learning/reviews/due	Authenticated user's due revision queue
PUT	/api/learning/progress/:conceptId	Authenticated progress/self-rating update
POST	/api/learning/concepts/:conceptId/attempts	Validated assessment submission and feedback
POST/PUT	/api/admin/learning/...	Admin-authorized create, edit, review, publish


Exact endpoints must follow established API conventions and authorization middleware. Consider stable concept IDs for writes even if URLs use slugs. Do not trust client-supplied user IDs, answer keys, scores, publish status, or timestamps.
4.5 API/data delivery safeguards
- Separate catalog payloads from full lesson payloads.
- Restrict drafts and answer keys to authorized editors or appropriate post-submission feedback paths.
- Scope progress and attempts to the current authenticated user.
- Validate payloads and enforce sensible size limits and rate limits.
- Safe Markdown rendering: sanitize/disable unsafe raw HTML and URLs; protect against XSS.
- Apply pagination and stable sort order.
- Use React Query caching and invalidation; don't cache private progress as public content.
- Consider stale-while-revalidate or content-version cache keys where appropriate.
- Prefetch adjacent lesson metadata only when useful; no blanket eager download.
- Track and measure payload size and page responsiveness before introducing extra infrastructure.
5. Progress, Assessment and Revision Scheduling
5.1 Separate the meanings of progress
Do not use a single "completed" or "mastered" flag for everything.
Event/state	Meaning
not_started	User has not actively studied the concept
studying	User opened/started a concept
studied	User explicitly marked reading complete (or met documented study criterion)
needs_revision	User marked uncertainty or missed recall checks
confident	Self-rated confidence; not proof of understanding
demonstrated_understanding	Passed a defined check with a recorded scoring basis
due_for_review	Scheduling status derived from next review date, not necessarily a learning-state enum


The final data model may represent reading status, confidence, assessment outcome and review due date as separate fields, rather than one overloaded enum.
5.2 Recall questions
- Start with short-answer and simple objective questions where correctness can be evaluated credibly.
- Show explanation after user submission or deliberate reveal, with transparent status.
- For free-text self-checks, prefer self-assessed outcomes unless a validated evaluation system exists.
- Track question/content version, result, hints used and attempt timestamp.
- Avoid calling a self-revealed answer a scored pass.
- Allow repeated practice; maintain historical attempts.
5.3 V1 revision scheduling
Use a simple and explainable schedule (example policy to validate, not a mandatory algorithm):
- First completed review: next review in ~1 day.
- Confident/correct review: extend interval (e.g., 3, 7, 14 days).
- Incorrect/uncertain review: schedule sooner (e.g., next day), with a focus suggestion.
- Users can manually choose Review again.
Define exact interval rules and timezone/date behavior in a dedicated task. Store an explicit next-review timestamp in a consistent timezone. Do not pretend this is adaptive ML.
5.4 Interview feedback connection — later phase
Only create an "Interview weak topic → Concept" recommendation when evaluation output includes real, stable topic identifiers or a defensible mapping. Show why it was recommended and permit the user to review the underlying feedback. Avoid interpreting invented/synthetic trend fields as demonstrated weaknesses.
6. Admin Content Management
Extend existing admin capabilities rather than introducing a separate CMS.
Minimum editorial capabilities
1. Manage subjects and modules.
2. Create/edit concept metadata and Markdown sections.
3. Preview content in the actual student rendering style, in both themes.
4. Manage recall questions and answer explanations.
5. Order concepts, specify prerequisites and link real practice problems.
6. Draft, submit for review, publish, unpublish/archive, revise.
7. Display sources, review date, revision number, and publishing status.
8. Prevent accidental overwrite of someone else's edits where feasible (optimistic concurrency/version checks).
9. Validate slug collisions, broken internal links, malformed Markdown, and unsafe external content.
Authorization and editorial rules
- Existing admin-role enforcement must apply on the server, not only by hiding frontend controls.
- Student endpoints return only published content and appropriate question fields.
- Publishing must be a distinct authorized action; editing a draft must not silently affect the live version.
- Preserve attempts and published revisions when content is updated.
- Audit and scope any use of AI-generated drafts; human review precedes publish.
Bootstrap/import workflow
- Author a small, reviewed curriculum using version-controlled lesson source files.
- Implement a repeatable, idempotent import process into the DB, with dry-run and duplicate safeguards.
- Import scripts populate real editorial content; they are not test fixtures or fake production progress data.
- Do not ship source lesson files inside the public frontend bundle.
- Define whether the DB or the version-controlled authoring files become the authoritative source after importing; avoid silent two-way drift.
7. Controlled Roadmap: Small Tasks Only
Mandatory workflow for every micro-task:
1. Inspect relevant source, existing contracts and dependencies.
2. Propose exact change, files, risks, tests and acceptance criteria.
3. Wait for explicit approval.
4. Implement only approved scope.
5. Test TypeScript/build + appropriate unit/integration/API/browser checks.
6. Review Git diff, light/dark rendering where applicable, mobile and keyboard behavior.
7. Report pass/fail/blocked, files, tests actually run, screenshots or observations, limitations.
8. Stop until the next explicit approval.
Never combine an entire phase into one coding task. No unapproved pushes, merges, deployments, destructive database commands or schema migrations. Protect existing user data and ongoing work.
Phase 0 — Repository audit & design approval (read-only)
- 0.1 Inspect navigation/routing and existing Prep Hub, Notes/Bookmarks, Mentor, Admin CMS.
- 0.2 Inspect Prisma schema, migrations, auth/authorization, API conventions and environment setup.
- 0.3 Inventory shared UI tokens and theme status after the redesign.
- 0.4 Produce actual entity relationships and API contract proposal; identify potential collisions with existing models.
- 0.5 Draft wireframes for revision home, catalog, concept reader and admin editor (desktop/mobile; light/dark).
- 0.6 Define test strategy, deployment/migration risks, initial curriculum and V1 acceptance criteria.
Gate: Approved architecture, migration plan, UI approach and first micro-task. No code modifications in Phase 0 unless separately authorized.
Phase 1 — Content foundation
- 1.1 Introduce only necessary subject/module/concept schema and constraints; separately review migration.
- 1.2 Add content revision/publishing model with draft vs published isolation.
- 1.3 Define a schema-validated Markdown content format and safe renderer (tests for unsafe content).
- 1.4 Build idempotent import tooling with dry run and a single reviewed DBMS concept.
- 1.5 Add server-side admin authorization checks for content mutations.
Gate: One reviewed Database Indexing concept can be stored, versioned and retrieved safely without affecting existing users.
Phase 2 — Read-only student API & single reader
- 2.1 Published subject summaries endpoint.
- 2.2 Paginated concept metadata endpoint (without lesson bodies).
- 2.3 Single published concept endpoint; enforce draft invisibility.
- 2.4 Concept reading page using the existing design system, quick/deep sections and clean content typography.
- 2.5 Responsive reader, navigation/outline and loading/error/empty states.
- 2.6 Add a minimal Learn & Revise entry in navigation once the destination works.
Gate: Student can find and read the pilot lesson on desktop/mobile and both themes; tests confirm drafts remain private.
Phase 3 — Catalog, browsing and paths
- 3.1 Subject landing and module order.
- 3.2 Search and level/progress filters with stable pagination.
- 3.3 Add optional role and level preferences (only if an existing preference mechanism can be reused safely).
- 3.4 Add basic learning path entity and path browsing (not progress yet).
- 3.5 Validate prerequisite graph, cycle prevention and deep linking.
Gate: Users can explore freely or follow a curated sequence without content being incorrectly gated.
Phase 4 — Minimal admin editor and publication workflow
- 4.1 Admin subject/module listing and editing.
- 4.2 Concept metadata and Markdown editing.
- 4.3 Live lesson preview with reusable student renderer.
- 4.4 Recall question authoring UI (if questions schema is approved).
- 4.5 Review/publish/update/archive controls and version conflict handling.
- 4.6 Import additional reviewed DBMS lessons, validating ordering and links.
Gate: Admin can safely author a draft, preview it, publish a revision and verify students see only the published version.
Phase 5 — Recall and progress
- 5.1 Define and migrate user progress schema distinctly from lesson content.
- 5.2 Add user-scoped read/write APIs for studied status and confidence.
- 5.3 Define and migrate recall questions/attempts (if not already included) with content-version capture.
- 5.4 Render recall questions and explanations in the reader.
- 5.5 Implement validated attempt submission and transparent scoring/self-check behavior.
- 5.6 Show accurate progress on catalog, lesson and dashboard (no false "mastery").
Gate: Studied vs demonstrated understanding are differentiated, persisted and tested across accounts.
Phase 6 — Revision queue
- 6.1 Approve a simple, documented interval policy.
- 6.2 Implement review scheduling and due-date persistence.
- 6.3 Expose paginated user-specific due queue.
- 6.4 Add due/needs-practice cards to Learn & Revise home, backed by real data.
- 6.5 Test timezones, repeated reviews, missed days, concurrency and empty states.
Gate: A student can study, attempt recall, receive a review date and complete a later review without losing history.
Phase 7 — Existing Intervue integration
- 7.1 Add validated concept-to-Practice-Hub question mappings and deep links.
- 7.2 Reuse Notes and Bookmarks where feasible (avoid duplicating user artifacts).
- 7.3 Add "Ask AI Mentor" with explicit concept context and graceful fallback.
- 7.4 Add topic-specific interview entry only if current interview capabilities support it reliably.
Gate: Existing practice/mentor routes work, relevant context is correct, and legacy workflows are not broken.
Phase 8 — Interview weakness integration (conditional, later)
- 8.1 Audit actual interview evaluation schema and quality; identify reliable topic evidence.
- 8.2 Design explainable mapping from evaluation topics to stable concept IDs.
- 8.3 Build optional related-concept recommendations with links to original feedback.
- 8.4 Validate recommendation relevance, missing-data behavior and opt-out/control.
Gate: No synthetic or unsupported weakness claims are shown to students.
Phase 9 — Curriculum expansion & release hardening
- 9.1 Review and publish a coherent complete DBMS path.
- 9.2 Verify accuracy, citations, prerequisites, question coverage and edition control.
- 9.3 Run accessibility checks, responsive audits, both themes, security review and API performance tests.
- 9.4 Validate measured bundle impact, catalog response sizes, pagination, indexes and caching.
- 9.5 Add OS, CN, DSA and system design in reviewed subject-sized increments.
Gate: Release checklist approved; no auto-deployment.
Sequencing note: The precise order of Admin authoring, recall-schema work and content import can change after the Phase 0 repository audit. Preserve small tasks and dependency gates rather than forcing the numbering when it creates unnecessary rework.

8. Testing and Quality Gates
Automated
- TypeScript checking and production build.
- Unit tests for content validation, reading status transitions and review scheduling.
- API tests for publication filtering, authentication, authorization, pagination and user scoping.
- Integration tests for draft → publish → read, content revision history and attempts.
- Regression tests for Prep Hub links, Mentor launch, notes/bookmark preservation.
Security and data integrity
- Students cannot see drafts or protected correct answers before appropriate disclosure.
- Non-admins cannot edit/publish even through direct API calls.
- Users cannot read/write another user's progress or attempts.
- Markdown cannot execute untrusted scripts or unsafe links.
- Validate database migrations on a non-production copy; back up before production changes.
- No accidental deletion of historical attempts when lessons change.
- Rate limits and payload limits where necessary.
UI/UX acceptance
- Test light, dark and system preference.
- Test 1440px desktop, 1024px, 768px, 390px and 320px widths.
- Keyboard-only navigation, visible focus, touch interactions, responsive diagrams/tables/code.
- Loading, error/retry, empty, draft-not-found and archived-content states.
- Color contrast against actual rendered foreground/background combinations; target WCAG 2.2 AA.
- No unrelated global layout regressions.
Performance
- Keep catalog listings metadata-only and bounded.
- Fetch full lesson content on the concept page only.
- Lazy-load the Learn & Revise route.
- Verify bundled assets and page payloads empirically rather than assuming database storage alone solves frontend performance.
- Index catalog filters and (userId, nextReviewAt); measure query latency.
- Avoid unnecessary third-party services and premature caching complexity.
9. Definition of Done — Initial Vertical Slice
The first end-to-end pilot is done only when all these are true:
- [ ] Database model and migration reviewed, applied safely in a non-production environment.
- [ ] One accurate, human-reviewed Database Indexing lesson stored as a published revision.
- [ ] Catalog returns metadata without eager full-body downloads.
- [ ] Concept page displays quick revision and deeper content reliably.
- [ ] Reading interface works in warm beige/light and graphite/dark modes.
- [ ] Admin draft is not visible to students; preview and publication work.
- [ ] A real recall question can be attempted with transparent result semantics.
- [ ] Study/attempt state persists per authenticated user.
- [ ] Related practice link opens a real existing practice destination.
- [ ] Basic navigation, API and security tests pass.
- [ ] Antigravity has provided actual test results, Git diff summary and a review report.
The larger V1 launch subsequently adds a coherent DBMS path, revision scheduling, user-facing queue and essential editorial workflows.
10. Risks and Product Decisions to Resolve Before Coding
1. Existing schema overlap: Does Intervue already define concepts, lessons or question structures? Reuse rather than duplicate.
2. Content source of truth: After import, is DB editing authoritative, or are reviewed files versioned upstream? Document one clear policy.
3. Question grading: Which formats permit objective grading? Avoid unreliable automated "mastery" claims.
4. Reading progress: Define whether viewing, scrolling, explicit marking or completion of a section means "studied".
5. Publish/version semantics: Determine immutable revision ownership and how attempts reference prior versions.
6. Public vs authenticated reading: Decide whether lessons are freely accessible; progress writes require login regardless.
7. Role/level vocabulary: Align with existing profile preferences where applicable without making navigation cumbersome.
8. Assets: Confirm diagram/image storage, allowed domains, attribution and fallback behavior.
9. Existing AI interview evidence: Verify topic granularity before connecting weaknesses to lessons.
10. Scope discipline: Keep first pilot about one high-quality concept and a functional content lifecycle, not a large content count.
11. Required Antigravity Work Protocol and Reporting Template
For every task, produce:
Task ID / title:
Goal:
Current behavior / source evidence:
Exact proposed change:
Files expected to change:
Dependencies and risks:
Acceptance criteria:
Tests planned:
Approval requested:

--- after approval and implementation ---

Files changed:
Git diff summary:
Automated tests actually executed + results:
Browser / light-dark / responsive verification actually completed:
Security and accessibility observations:
Remaining issues and blocked checks:
Status: PASS / FAIL / BLOCKED
Recommended next micro-task:
STOP — awaiting approval.
Do not call a task complete because it builds. Never claim browser or API tests ran when they did not. Do not silently advance. No package installation, database migration, push, merge or deployment without task-specific approval.
12. Immediate Next Instruction to Antigravity
Start with Phase 0 only, read-only.
1. Read this entire specification.
2. Inspect the current Intervue repo and confirm the recently completed redesign and existing application architecture.
3. Check for existing learning/content models, reusable Markdown rendering, Admin CMS functionality, route guards, React Query patterns, and current Prisma migrations.
4. Critically compare this plan with actual existing functionality. Identify incorrect assumptions, dependencies, gaps, simplifications and any changes to task order.
5. Propose the smallest viable DBMS/Database Indexing vertical slice, including conceptual Prisma schema, endpoints, UI wireframe, publishing workflow, migration safety plan and testing approach.
6. Present a revised micro-task sequence with exact deliverables and independent approval checkpoints.
7. Recommend only the first micro-task.
DO NOT modify code, create migrations, install packages, seed the database, or begin building the UI during Phase 0. Stop after the audit and await approval.