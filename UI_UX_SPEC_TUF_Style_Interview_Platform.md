# Interview / DSA Platform — Premium UI/UX Specification
## TUF-inspired visual quality + modern interview/replay experience

> **Goal:** Make the product feel as polished, calm, focused and cohesive as a premium interview-preparation platform, while keeping its own visual identity and not copying another product pixel-for-pixel.

This specification combines:
- A dark, minimal learning-dashboard aesthetic
- Strong information hierarchy
- DSA/problem-practice workflows
- Personal lists and smart lists
- Progress and daily planning
- Live coding/interview experiences
- Interview replay and event history
- AI-assisted preparation
- Responsive/mobile-first behavior

---

# 1. Product Design Philosophy

The UI should communicate:

**"Open the app → immediately know what to do → start learning/practicing without friction."**

The product should feel:

- Premium
- Fast
- Focused
- Technical
- Trustworthy
- Modern
- Calm
- Information-rich without feeling crowded

### The visual formula

```text
Deep dark surfaces
        +
Subtle borders
        +
Electric blue actions
        +
Excellent typography
        +
Generous spacing
        +
Consistent cards
        +
Subtle motion
        +
Clear progress
        =
Premium learning experience
```

---

# 2. Important Design Direction

The target is **not** to copy TakeUForward.

Instead, take inspiration from the qualities that make its current product effective:

- Clear learning categories
- Strong dashboard hierarchy
- Roadmaps and progress
- Quick access to practice
- Personalized preparation
- Custom lists
- Daily planner
- Sessions
- Mock tests
- Core CS + DSA + design in one ecosystem

The current TUF+ experience exposes areas such as DSA, LLD, OOPS, SQL, OS, CN, DBMS, aptitude, mock tests, progress, calendar/roadmap, daily planner and sessions. citeturn0search0turn0search2

Your product should use a **similar information architecture philosophy**, but with your own branding, components and interaction patterns.

---

# 3. Brand Visual Identity

## Primary colors

```text
Background       #0B0C0F
Background Soft  #101216
Surface          #14161B
Surface Hover    #191C22
Surface Active   #1D2129

Border           #272B33
Border Soft      #1E2229

Text Primary     #F5F7FA
Text Secondary   #A1A7B3
Text Muted       #707784

Primary Blue     #2F80ED
Blue Hover       #3B9CFF
Blue Pressed     #2563EB
```

## Semantic colors

```text
Success          #22C55E
Warning          #F59E0B
Error            #EF4444
Purple / AI      #8B5CF6
Cyan             #06B6D4
```

## Rule

Do not use every accent at the same time.

The default interface should primarily be:

```text
Black / charcoal
+
white / gray
+
blue
```

Purple, cyan, green, yellow and red should communicate specific states.

---

# 4. Color Layer System

Do not make every section the same black.

Use layers:

```text
Layer 0 — Application
#0B0C0F

Layer 1 — Secondary area
#101216

Layer 2 — Cards
#14161B

Layer 3 — Hover
#191C22

Layer 4 — Active / selected
#1D2129

Layer 5 — Modal / elevated
#181B21
```

This creates depth without excessive shadows.

---

# 5. Typography

## Recommended fonts

Primary:

```text
Inter
```

Alternative:

```text
Geist Sans
```

Code:

```text
JetBrains Mono
```

## Scale

```text
Display       40–48px / 700
Page title    28–34px / 700
Section       20–26px / 650
Card title    16–18px / 600
Body          14–16px / 400
Metadata      12–14px / 400
Code          13–15px
```

### Typography rule

Use fewer font sizes, not more.

The feeling of polish comes from hierarchy, not huge typography.

---

# 6. Spacing System

Use an 8px base.

```text
4     micro
8     tight
12    compact
16    default
20    card
24    section
32    large section
40    major
48    page separation
64    hero / empty state
80+   special landing sections
```

---

# 7. Border Radius

```text
Buttons       10–12px
Inputs        10–12px
Cards         14–16px
Panels        16–18px
Modal         18–20px
Pills         999px
```

Avoid excessive rounded "bubble" UI.

---

# 8. Shadows

Use borders first and shadows second.

### Card

```css
box-shadow: 0 8px 30px rgba(0,0,0,.18);
```

### Modal

```css
box-shadow: 0 24px 70px rgba(0,0,0,.45);
```

Avoid large glowing shadows around every component.

---

# 9. Application Shell

Desktop:

```text
┌─────────────────────────────────────────────────────────────┐
│ Logo / Search                         Notifications Profile │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│   SIDEBAR     │                  MAIN CONTENT               │
│               │                                             │
│               │                                             │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

Recommended:

```text
Sidebar expanded: 240–260px
Sidebar collapsed: 68–76px
Topbar: 64–72px
Content max width: 1440px
Content padding: 24–40px
```

---

# 10. Sidebar

## Navigation

```text
LOGO

OVERVIEW
  Dashboard
  Calendar
  Daily Plan

PRACTICE
  Problems
  My Lists
  Bookmarks
  Contests

LEARN
  DSA
  SQL
  DBMS
  Operating Systems
  Computer Networks
  OOPS

DESIGN
  LLD
  System Design

PREPARATION
  Roadmaps
  Companies
  Mock Interviews

──────────────

AI
  AI Coach
  Interview Review

SETTINGS
  Settings
  Help
```

## Active state

```text
background: rgba(47,128,237,.10)
text: #F5F7FA
icon: #3B9CFF
```

Add a subtle left indicator rather than a huge blue rectangle.

---

# 11. Sidebar UX

Sidebar should support:

### Expanded

```text
[icon] Dashboard
[icon] Problems
[icon] My Lists
```

### Collapsed

```text
[icon]
[icon]
[icon]
```

Show tooltip on hover.

Remember sidebar state across sessions.

---

# 12. Topbar

Recommended:

```text
┌────────────────────────────────────────────────────────────┐
│ ☰ / Logo   Search problems...             🔔   ?   Avatar │
└────────────────────────────────────────────────────────────┘
```

Features:

- Global search
- Search shortcut
- Notifications
- Help
- Profile
- Optional streak
- Optional command palette

---

# 13. Command Palette

Add:

```text
⌘ K
```

or

```text
Ctrl K
```

Overlay:

```text
┌───────────────────────────────────────────────┐
│ 🔍 Search anything...                         │
├───────────────────────────────────────────────┤
│ Recent                                        │
│   Two Sum                                     │
│   Sliding Window                              │
│                                               │
│ Navigate                                      │
│   Dashboard                                   │
│   Problems                                    │
│   My Lists                                    │
│                                               │
│ Actions                                       │
│   Create List                                 │
│   Start Practice                              │
└───────────────────────────────────────────────┘
```

This makes the application feel substantially more professional.

---

# 14. Dashboard — The Most Important Screen

The dashboard should answer:

> **What should I do today?**

Recommended hierarchy:

```text
Good morning 👋
Let's continue your preparation.

[Current Goal / Progress]

┌────────────┐ ┌────────────┐ ┌────────────┐
│ DSA        │ │ Solved     │ │ Streak     │
│ 72%        │ │ 183        │ │ 12 days    │
└────────────┘ └────────────┘ └────────────┘

Continue Learning
────────────────────────────────────────────

Today's Plan
────────────────────────────────────────────

Recommended Problems
────────────────────────────────────────────

Recent Activity
────────────────────────────────────────────
```

---

# 15. Dashboard Hero

Do not make the hero too large.

Example:

```text
Good morning, Shaswat 👋

You're 72% through your current DSA roadmap.

[ Continue Learning ]
```

Secondary information:

```text
12 day streak
3 tasks remaining
4 problems solved this week
```

---

# 16. Stat Cards

Structure:

```text
small icon
label

large number

trend / metadata
```

Example:

```text
DSA Progress

72%

+8% this week
```

Keep cards compact.

---

# 17. Continue Learning Card

```text
Continue Learning

Arrays & Hashing

████████████████░░░░ 78%

23 / 30 completed

                         Continue →
```

Interaction:

```text
hover
→ slight lift
→ border becomes slightly brighter
→ arrow moves 2–3px
```

---

# 18. Daily Planner

```text
Today's Plan

✓ Arrays — 2 problems
✓ DBMS — revise normalization
→ System Design — load balancing
○ Mock interview
```

Allow:

- Check/uncheck
- Reorder
- Edit time
- Add task
- Drag and drop

---

# 19. Progress Visualization

Use:

- Progress bars
- Circular progress
- Weekly activity chart
- Topic completion
- Streak
- Heatmap

Avoid excessive charts.

The dashboard should remain actionable.

---

# 20. Problems Page

Structure:

```text
Problems

Practice interview questions and track your progress.

[ Search problems... ]

[All] [Easy] [Medium] [Hard]

Topic    Pattern    Company    Status

────────────────────────────────────────────

✓ Two Sum                         Easy
○ Longest Substring               Medium
✓ Merge Intervals                 Medium
○ Word Ladder                     Hard
```

---

# 21. Problem Row

Each row:

```text
Status
Problem title
Difficulty
Topic
Pattern
Company
Acceptance / metadata
Bookmark
```

On hover:

```text
background: #191C22
```

Do not make rows visually heavy.

---

# 22. Difficulty System

```text
Easy     #22C55E
Medium   #F59E0B
Hard     #EF4444
```

Use badges/text, not large colored blocks.

---

# 23. Problem Detail

Layout:

```text
← Back

Two Sum

Easy   Arrays   Hashing

────────────────────────────────────────

Problem
...

Examples
...

Constraints
...

Approach
...

Code

┌────────────────────────────────────────┐
│ Monaco Editor                          │
│                                        │
│                                        │
└────────────────────────────────────────┘

[ Run ] [ Submit ]
```

---

# 24. Code Editor

Use Monaco Editor.

Recommended layout:

```text
┌────────────────────────────────────────────────────┐
│ Problem                     │ Code                  │
│                             │                       │
│ Statement                   │ editor                │
│ Examples                    │                       │
│ Constraints                 │                       │
│                             │                       │
└────────────────────────────────────────────────────┘
```

Desktop can use a 40/60 or 45/55 split.

Mobile should stack the sections.

---

# 25. Editor Toolbar

```text
Python ▼

⌘ Enter Run

Run
Submit
Reset
Settings
```

Show:

- Language
- Run
- Submit
- Format
- Reset
- Font controls

---

# 26. Submission State

### Running

```text
Running...
```

### Success

```text
✓ Accepted

Runtime: 82 ms
Memory: 14.2 MB
```

### Error

```text
✕ Wrong Answer

Test case 7 failed.
```

Keep feedback compact.

---

# 27. My Lists

This should be one of the strongest pages.

```text
My Lists                                + Add List

Organize problems around your preparation goals.

[All] [Recent] [Completed]

┌───────────────────┐
│ Blind 75          │
│ 43 / 75           │
│ ███████████░░     │
│ 57% complete      │
└───────────────────┘

┌───────────────────┐
│ Placement Prep    │
│ 28 / 50           │
│ █████████░░░      │
└───────────────────┘
```

---

# 28. Empty State

Use the visual style from the provided reference.

```text
                 [minimal illustration]

                    No List yet

       Create your first list to organize
          problems for focused preparation.

          [ + Add List ] [ ✨ Smart List ]
```

### Design

```text
Background: #0B0C0F
Title: #F5F7FA
Description: #9299A8
Primary button: #2F80ED
Secondary border: #2F80ED
```

Illustration:

```text
Dark gray line
Blue detail
Tiny gold/yellow accents
Transparent/dark background
```

The empty state should occupy approximately 55–70% of the available content area, not the entire viewport.

---

# 29. Smart List

Smart List gets a subtle AI identity.

Use:

```text
Blue + Purple
```

Flow:

```text
✨ Smart List

What's your goal?

[ Prepare for product-company interviews ]

Topics

[ Arrays ] [ Trees ] [ Graphs ]

Difficulty

[ Easy ] [ Medium ] [ Hard ]

Time per day

[ 60 min ]

Target

[ Interview in 30 days ]

[ Generate List ]
```

Result:

```text
Your personalized list

15 problems selected

Based on:
• Weak topics
• Previous attempts
• Difficulty
• Available time
• Target role
```

---

# 30. Roadmap

Roadmaps should feel like a journey.

```text
DSA ROADMAP

01 Arrays                 ✓
       │
02 Strings                ✓
       │
03 Linked List            ✓
       │
04 Stack & Queue          →
       │
05 Binary Trees
       │
06 Graphs
       │
07 Dynamic Programming
```

States:

```text
Completed   green
Current     blue
Locked      gray
```

---

# 31. Topic Page

```text
Arrays

Master array problems from fundamentals
to advanced interview patterns.

Progress

██████████████░░ 72%

Topics

Basics
Two Pointer
Sliding Window
Prefix Sum
Kadane's Algorithm
Binary Search
```

Use a clean topic navigation panel.

---

# 32. Company Preparation

Company page:

```text
Company Preparation

Search companies...

Google
Amazon
Microsoft
Meta
Adobe
...
```

Company detail:

```text
Company

Interview Preparation

Problems     184
Solved       96
Progress     52%

Common Topics

Arrays
Trees
Graphs
DP

Practice Problems
...
```

Avoid using company logos everywhere; use them selectively.

---

# 33. Core CS

Create a unified Core CS experience:

```text
Core Subjects

DBMS
OS
Computer Networks
OOPS
SQL
```

Each card:

```text
subject
short description
progress
next topic
continue button
```

---

# 34. System Design

Structure:

```text
System Design

Fundamentals
  Scalability
  Availability
  Caching
  Load Balancing

Databases
  SQL
  NoSQL
  Replication
  Sharding

Architecture
  Microservices
  Event Driven
  Message Queues

Practice
  URL Shortener
  Instagram
  WhatsApp
  Netflix
```

---

# 35. LLD

```text
LLD

OOPS
SOLID
Design Patterns
UML
Class Design
Concurrency

Practice

Parking Lot
Library System
Chess
Splitwise
Cab Booking
```

---

# 36. Live Interview Room

This is where the Intervue-inspired experience should become your differentiator.

Desktop:

```text
┌─────────────────────────────────────────────────────────────┐
│ Interview #104              42:18          End Interview    │
├───────────────────────┬─────────────────────────────────────┤
│                       │                                     │
│ Problem               │ Code Editor                         │
│                       │                                     │
│ Statement             │                                     │
│ Constraints            │                                     │
│ Examples              │                                     │
│                       │                                     │
│ Interviewer Notes     │                                     │
│                       │                                     │
├───────────────────────┴─────────────────────────────────────┤
│ Activity / Console / Test Results                           │
└─────────────────────────────────────────────────────────────┘
```

---

# 37. Interview Room Visual Hierarchy

The editor must dominate.

Recommended:

```text
Problem: 35–40%
Editor: 60–65%
```

Do not let side panels overpower the coding experience.

---

# 38. Interview Timer

Timer should be visible but subtle.

```text
42:18
```

Color changes only when necessary:

```text
Normal → white
Low time → amber
Critical → red
```

Don't constantly flash it.

---

# 39. Interview Event Stream

Capture meaningful actions:

```text
10:42:01 Started interview
10:43:12 Opened problem
10:44:08 Changed language to Python
10:46:31 Edited line 14
10:51:02 Ran code
10:51:06 Test failed
10:56:18 Submitted
```

This creates the foundation for replay.

---

# 40. Interview Replay

Replay screen:

```text
Interview Replay

00:00 ─────────●────────────────── 42:18

▶ Play

Events

10:42 Started
10:43 Problem opened
10:46 Code editing
10:51 Test run
10:56 Submission
```

Controls:

```text
Play
Pause
5s back
5s forward
Speed 0.5x
Speed 1x
Speed 2x
```

---

# 41. Replay Visual

Show:

```text
Problem state
+
Code state
+
Cursor state
+
Language
+
Events
```

The user should be able to scrub the timeline and reconstruct the interview at a specific moment.

---

# 42. Interview Analytics

After an interview:

```text
Interview Summary

Problem solved
✓

Time to first approach
4m 12s

Code runs
7

Failed tests
2

Hints used
1

Final result
Accepted
```

Then:

```text
Timeline

Planning ───── Coding ───────── Debugging ─── Submit
  4m             22m                11m          2m
```

---

# 43. AI Interview Review

AI output should be structured.

```text
Interview Review

Strengths
✓ Good problem decomposition
✓ Correct complexity analysis

Areas to improve
• Started coding before validating edge cases
• Debugging took longer than necessary

Suggested revision
→ Sliding Window
→ Edge Case Handling
→ Complexity Analysis
```

Avoid presenting AI output as an unexplained wall of text.

---

# 44. AI Visual Language

AI features should use:

```text
Primary: #8B5CF6
Secondary: #2F80ED
```

Small sparkle icon:

```text
✨
```

AI should feel like an enhancement, not a completely different website.

---

# 45. Calendar

Calendar should show preparation activity.

```text
September 2026

Mon Tue Wed Thu Fri Sat Sun

 1   2   3   4   5   6   7
 ░   ▓   █   ░   █   ▓   ░
```

Use intensity rather than many colors.

---

# 46. Daily Streak

```text
🔥 12 day streak

You've practiced for 12 consecutive days.
```

Keep it compact.

---

# 47. Analytics

Sections:

```text
Problems Solved
Accuracy
Average Time
Weekly Activity
Topic Strength
Topic Weakness
Company Coverage
```

Example:

```text
Topic Strength

Arrays          ████████████████
Hashing         █████████████
Trees           ██████████
Graphs          ██████
DP              ████
```

---

# 48. Notes

Notes should support:

- Markdown
- Code blocks
- Checklists
- Tags
- Problem linking
- Search

Example:

```text
Sliding Window

Key idea:
Maintain a valid window...

Related problems:
Two Sum
Longest Substring
Minimum Window
```

---

# 49. Bookmarks

Bookmark button:

```text
♡ → ☆ → filled state
```

Saved items:

```text
Bookmarked Problems
Bookmarked Notes
Bookmarked Topics
```

---

# 50. Notifications

Panel:

```text
Notifications

✓ Daily goal completed
  20 min ago

✨ New recommendation
  1 hour ago

📊 Weekly report ready
  Yesterday
```

Unread background:

```text
rgba(47,128,237,.08)
```

---

# 51. Toasts

Success:

```text
✓ List created
```

Info:

```text
Progress synced
```

Error:

```text
✕ Could not save changes
```

Position:

```text
bottom-right
```

Animation:

```text
fade + slide
```

---

# 52. Loading States

Never show empty white/black areas while content is loading.

Use skeletons:

```text
████████████
████████████████████
████████
```

Skeleton:

```text
#191C22
```

Optional shimmer should be extremely subtle.

---

# 53. Animation System

### Default transition

```text
150–200ms
ease-out
```

### Larger transition

```text
250–350ms
```

### Hover

```text
translateY(-1px / -2px)
```

### Press

```text
scale(.98)
```

### Page transition

```text
fade + 4–8px vertical movement
```

Avoid:

- excessive bounce
- large zoom
- constant glowing
- animations on every text element

---

# 54. Micro-interactions That Matter

Implement:

### Button

```text
hover → brighter
active → scale .98
```

### Card

```text
hover → -2px
border → slightly brighter
```

### Progress

```text
animate width on load
```

### Completion

```text
check icon appears
subtle green pulse
```

### Navigation

```text
active indicator slides
```

### List creation

```text
modal → create → card enters
```

---

# 55. Responsive Design

## Desktop

```text
≥ 1280px
```

Full sidebar.

## Tablet

```text
768–1279px
```

Collapsed sidebar.

## Mobile

```text
< 768px
```

Use:

```text
Top bar
+
bottom navigation
```

Mobile nav:

```text
Home
Problems
Lists
Progress
Profile
```

---

# 56. Mobile Dashboard

Priority:

```text
Greeting
↓
Continue learning
↓
Today's plan
↓
Progress
↓
Recommended problems
```

Do not show every desktop widget.

---

# 57. Mobile Interview

Use:

```text
Problem
↓
Code
↓
Console
↓
Interview controls
```

Use a sticky bottom action bar:

```text
[ Run ] [ Submit ]
```

---

# 58. Accessibility

Required:

- Semantic HTML
- Keyboard navigation
- Visible focus
- ARIA labels
- Accessible contrast
- Minimum ~44px touch targets
- Color should not be the only status indicator
- Screen-reader labels
- Reduced-motion support

---

# 59. Icon System

Use one icon library.

Recommended:

```text
Lucide React
```

Examples:

```text
Dashboard       LayoutDashboard
Problems        Code2
Lists           List
Search          Search
Calendar        CalendarDays
Progress        ChartNoAxesColumnIncreasing
Settings        Settings
Profile         User
Bell            Bell
Bookmark        Bookmark
Add             Plus
Smart List      Sparkles
Lock            Lock
Check           Check
Play            Play
Pause           Pause
Replay          RotateCcw
```

Sizes:

```text
16px compact
18px navigation
20px buttons
24px feature
```

---

# 60. Component System

Every page should use reusable components.

```text
components/
├── layout/
│   ├── Sidebar
│   ├── Topbar
│   ├── MobileNav
│   └── PageContainer
│
├── dashboard/
│   ├── WelcomeHeader
│   ├── StatCard
│   ├── ContinueCard
│   ├── DailyPlan
│   ├── ActivityChart
│   └── RecommendationCard
│
├── problems/
│   ├── ProblemTable
│   ├── ProblemRow
│   ├── ProblemFilters
│   ├── DifficultyBadge
│   └── ProblemDetail
│
├── lists/
│   ├── ListCard
│   ├── EmptyState
│   ├── CreateListModal
│   └── SmartListModal
│
├── interview/
│   ├── InterviewRoom
│   ├── CodeEditor
│   ├── InterviewTimer
│   ├── EventTimeline
│   ├── ReplayPlayer
│   └── InterviewSummary
│
└── ui/
    ├── Button
    ├── Card
    ├── Badge
    ├── Input
    ├── Dialog
    ├── Tooltip
    ├── Progress
    ├── Tabs
    ├── Dropdown
    └── Skeleton
```

---

# 61. Recommended Tech Stack

## Frontend

```text
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
```

## Motion

```text
Framer Motion
```

## Icons

```text
Lucide React
```

## Charts

```text
Recharts
```

## Editor

```text
Monaco Editor
```

## Forms

```text
React Hook Form
Zod
```

## Backend

```text
Next.js API
+
PostgreSQL
+
Prisma
```

or:

```text
FastAPI
+
PostgreSQL
```

## Authentication

```text
Auth.js
```

---

# 62. Event-Based Interview Architecture

For the live interview/replay feature, don't only store the final code.

Store events such as:

```text
INTERVIEW_STARTED
PROBLEM_OPENED
LANGUAGE_CHANGED
CODE_CHANGED
CURSOR_MOVED
CODE_EXECUTED
TEST_RESULT
HINT_REQUESTED
SUBMITTED
INTERVIEW_ENDED
```

Example event:

```json
{
  "type": "CODE_CHANGED",
  "timestamp": 1727000000,
  "documentVersion": 42,
  "content": "...",
  "cursor": {
    "line": 18,
    "column": 12
  }
}
```

This makes replay and analytics possible.

---

# 63. Backend Data Model Concept

```text
User
 │
 ├── Progress
 ├── Lists
 ├── Bookmarks
 ├── Notes
 ├── Daily Plans
 ├── Submissions
 └── Interviews
        │
        └── Events
```

Interview:

```text
Interview
├── userId
├── problemId
├── startedAt
├── endedAt
├── language
├── result
├── score
└── events[]
```

---

# 64. Design Tokens

Keep every visual value centralized.

```css
:root {
  --background: #0B0C0F;
  --background-soft: #101216;

  --surface: #14161B;
  --surface-hover: #191C22;
  --surface-active: #1D2129;

  --border: #272B33;
  --border-soft: #1E2229;

  --text-primary: #F5F7FA;
  --text-secondary: #A1A7B3;
  --text-muted: #707784;

  --primary: #2F80ED;
  --primary-hover: #3B9CFF;
  --primary-pressed: #2563EB;

  --success: #22C55E;
  --warning: #F59E0B;
  --error: #EF4444;

  --ai: #8B5CF6;
  --cyan: #06B6D4;
}
```

No random colors scattered through the application.

---

# 65. Tailwind Naming

Prefer semantic classes:

```text
bg-background
bg-surface
bg-surface-hover

text-primary
text-secondary
text-muted

border-border

bg-brand
text-brand
```

Instead of:

```text
bg-[#131313]
text-[#8f8f8f]
border-[#282828]
```

in hundreds of components.

---

# 66. Landing Page

Hero:

```text
Prepare smarter.
Practice with purpose.

DSA, Core CS, System Design and
real interview practice in one place.

[ Start Preparing ] [ Explore Problems ]

              PRODUCT PREVIEW
```

Feature sections:

```text
Structured DSA
Personal Lists
Smart Recommendations
Core CS
System Design
Live Interviews
Interview Replay
Progress Analytics
```

---

# 67. Feature Cards

Use large feature cards sparingly.

Example:

```text
✨ Smart Lists

Turn your preparation goal into
a personalized problem set.

[Explore →]
```

Visual:

```text
surface
subtle border
small icon
heading
description
arrow
```

---

# 68. Pricing / Premium UI

If monetization is added:

Avoid making the entire interface look like a sales page.

Use:

```text
Free
Pro
Premium
```

Clearly state what each tier contains.

The application itself should remain focused.

---

# 69. Empty-State Library

Create reusable empty states:

```text
No Lists
No Bookmarks
No Notes
No Problems
No Activity
No Notifications
No Interviews
No Search Results
No Roadmap
```

Each should contain:

```text
Illustration
Title
Explanation
Primary action
Optional secondary action
```

---

# 70. Error States

Example:

```text
Something went wrong

We couldn't load your problems.

[ Try Again ]
```

Do not expose raw API errors.

For developers, log the technical error separately.

---

# 71. 404 Page

```text
404

This page doesn't exist.

Maybe the problem was moved,
or the URL is incorrect.

[ Go to Dashboard ]
```

Keep the same illustration language.

---

# 72. Login

Minimal:

```text
Welcome back

Continue your preparation.

[ Continue with Google ]

or

Email
Password

[ Sign In ]

Forgot password?
```

Dark surface, blue CTA, minimal distractions.

---

# 73. Onboarding

After signup:

```text
Welcome 👋

What are you preparing for?

[ Placement ]
[ Internship ]
[ Product Company ]
[ Competitive Programming ]

Experience

[ Beginner ]
[ Intermediate ]
[ Advanced ]

Daily time

[ 30 min ]
[ 1 hour ]
[ 2+ hours ]

[ Create My Plan ]
```

This feeds personalization.

---

# 74. Personalization

Dashboard should change based on:

```text
Goal
Experience
Target role
Available time
Completed topics
Weak topics
Upcoming interview
```

Do not overwhelm the user with settings.

---

# 75. Focus Mode

Create a distraction-free mode:

```text
FOCUS MODE

Problem
Timer
Editor

Nothing else.
```

Optional keyboard shortcut:

```text
⌘ Shift F
```

---

# 76. Study Mode

Study Mode:

```text
Concept
↓
Example
↓
Visualization
↓
Problem
↓
Practice
```

This supports learning rather than only problem solving.

---

# 77. Practice Flow

Ideal flow:

```text
Find problem
      ↓
Understand
      ↓
Attempt
      ↓
Run
      ↓
Submit
      ↓
Review
      ↓
Save / Add to List
      ↓
Track progress
```

The UI should make this flow obvious.

---

# 78. Review Flow

After submission:

```text
Result
↓
Complexity
↓
Your approach
↓
Optimal approach
↓
Mistakes
↓
Related problems
↓
Add to revision list
```

---

# 79. Search UX

Search should cover:

```text
Problems
Topics
Companies
Roadmaps
Notes
Lists
System Design questions
```

Results should be categorized.

---

# 80. Keyboard Shortcuts

Recommended:

```text
⌘ / Ctrl K       Search
⌘ / Ctrl P       Problems
⌘ / Ctrl Enter   Run code
⌘ / Ctrl S       Save
⌘ / Ctrl B       Toggle sidebar
Esc              Close modal
```

Show shortcuts inside tooltips.

---

# 81. Design Quality Checklist

Before shipping each page:

### Visual

- [ ] Correct background layers
- [ ] Correct typography
- [ ] Consistent spacing
- [ ] Consistent radius
- [ ] No random colors
- [ ] No excessive shadows

### UX

- [ ] Clear primary action
- [ ] Loading state
- [ ] Empty state
- [ ] Error state
- [ ] Success state
- [ ] Keyboard navigation

### Responsive

- [ ] Desktop
- [ ] Tablet
- [ ] Mobile
- [ ] Touch targets
- [ ] Horizontal overflow checked

### Interaction

- [ ] Hover
- [ ] Focus
- [ ] Active
- [ ] Disabled
- [ ] Loading

---

# 82. Implementation Order

Do not build every feature at once.

## Phase 1 — Visual foundation

```text
Design tokens
Font
Colors
Spacing
Buttons
Cards
Inputs
Badges
Sidebar
Topbar
```

## Phase 2 — Core dashboard

```text
Dashboard
Progress
Daily plan
Activity
Continue learning
```

## Phase 3 — DSA

```text
Problems
Filters
Problem detail
Editor
Submission
```

## Phase 4 — Lists

```text
My Lists
Create List
Empty State
Smart List
Bookmarks
```

## Phase 5 — Learning

```text
Roadmaps
Topics
Core CS
SQL
LLD
System Design
```

## Phase 6 — Interview

```text
Live interview
Timer
Event stream
Replay
Analytics
AI review
```

## Phase 7 — Polish

```text
Animations
Skeletons
Keyboard shortcuts
Accessibility
Mobile
Performance
```

---

# 83. The Most Important UI Improvements

If your current UI already uses approximately the same colors but doesn't look as polished, prioritize these in this order:

```text
1. SPACING
        ↓
2. TYPOGRAPHY
        ↓
3. CARD HIERARCHY
        ↓
4. SIDEBAR / NAVIGATION
        ↓
5. CONSISTENT BUTTONS
        ↓
6. PROGRESS VISUALIZATION
        ↓
7. EMPTY / LOADING STATES
        ↓
8. MICRO-INTERACTIONS
        ↓
9. ILLUSTRATION SYSTEM
        ↓
10. ADVANCED ANIMATION
```

**Do not start by adding more gradients or animations.**

Most of the premium feeling comes from the first six.

---

# 84. Final Visual Target

The final product should look approximately like:

```text
╔══════════════════════════════════════════════════════════════╗
║ LOGO       Search...                         🔔   Profile   ║
╠═══════════╦══════════════════════════════════════════════════╣
║           ║                                                  ║
║ Dashboard ║  Good morning 👋                                ║
║           ║  Continue your preparation.                      ║
║ Problems  ║                                                  ║
║           ║  ┌──────────┐ ┌──────────┐ ┌──────────┐        ║
║ My Lists  ║  │ DSA      │ │ Solved   │ │ Streak   │        ║
║           ║  │ 72%      │ │ 183      │ │ 12 days  │        ║
║ Roadmaps  ║  └──────────┘ └──────────┘ └──────────┘        ║
║           ║                                                  ║
║ Core CS   ║  Continue Learning                              ║
║           ║  ┌──────────────────────────────────────────┐   ║
║ Design    ║  │ Arrays & Hashing                         │   ║
║           ║  │ ███████████████░░░ 78%                   │   ║
║ Interview ║  │                              Continue →   │   ║
║           ║  └──────────────────────────────────────────┘   ║
║           ║                                                  ║
║ Settings  ║  Today's Plan                                   ║
║           ║  ✓ Arrays    ✓ DBMS    → System Design          ║
║           ║                                                  ║
╚═══════════╩══════════════════════════════════════════════════╝
```

---

# 85. Final Principle

The UI should not try to look "fancy."

It should look:

**intentional.**

Every pixel should answer one of these questions:

```text
Where am I?
What should I do?
What have I completed?
What should I do next?
How am I improving?
```

That is the quality bar to target.

---

## Reference Note

The current TUF+ public product emphasizes a unified preparation experience with DSA, design, data engineering, core subjects, aptitude, progress, roadmaps, daily planning, sessions, customized lists, mock tests and AI-assisted features. citeturn0search0turn0search3

Your implementation should borrow these **product-design principles**, while keeping your own brand, visual assets, illustrations, wording and component design.
