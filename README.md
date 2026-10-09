<div align="center">

# ⚡ interVue

**Next-Generation AI Technical Interview Platform, Real-Time Battle Arena & Target Company Prep Ecosystem**

[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Bun](https://img.shields.io/badge/Bun-Runtime-fbf0df?style=for-the-badge&logo=bun&logoColor=black)](https://bun.sh)
[![Hono](https://img.shields.io/badge/Hono-API_Framework-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-2D3748?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Groq Llama 3.3](https://img.shields.io/badge/Groq-Llama_3.3_70B-F05A28?style=for-the-badge&logo=meta&logoColor=white)](https://groq.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)

<br/>

[🚀 Live Demo](https://intervue-mu.vercel.app) • [📖 Documentation](#-table-of-contents) • [✨ Key Features](#-key-features) • [🛠️ Architecture](#-system-architecture) • [🤝 Contributing](./CONTRIBUTING.md)

</div>

---

## 🌟 Overview

**interVue** is an all-in-one technical interview readiness platform designed for modern software engineers. It bridges the gap between static algorithmic practice and real-world hiring loops by combining:

1. **AI Voice & Text Mock Interviews**: Lifelike conversational interviews powered by Llama 3.3 70B and Whisper Large v3 with multi-dimensional rubric evaluations.
2. **Real-Time Multiplayer Battle Arenas**: Timed competitive rooms with authoritative WebSockets, dynamic countdown clocks, and live podiums.
3. **Triple-Sensor Anti-Cheat Surveillance**: Automated proctoring detecting tab switching, window defocus, and clipboard flooding with a 3-strike escalation penalty system.
4. **Target Company Practice Kits & 470+ Archive**: Curated problem loops for Google, Amazon, Meta, Apple, Microsoft, Netflix, Uber, and 470+ companies ranked by ask rate and interview frequency.
5. **Interview Target Tracker (POTD)**: Daily problem challenge loops, streak tracking, and customizable goals synced with your LeetCode progress.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
  - [1. Real-Time Battle Arena & Multiplayer Contests](#1-real-time-battle-arena--multiplayer-contests)
  - [2. Authoritative Anti-Cheat Surveillance](#2-authoritative-anti-cheat-surveillance)
  - [3. Live Spectator Command Center](#3-live-spectator-command-center--code-streaming)
  - [4. AI Voice & Text Mock Interviews](#4-ai-voice--text-mock-interviews)
  - [5. Target Company Practice Kits & 470+ Archive](#5-target-company-practice-kits--470-archive)
  - [6. Interview Target Tracker (POTD Loops)](#6-interview-target-tracker-potd-loops)
  - [7. Code Sandbox & Learning Hub](#7-code-sandbox--learning-hub)
  - [8. Notes & Hints Notepad](#8-notes--hints-notepad)
  - [9. Unified Analytics & Cross-Platform Sync](#9-unified-analytics--cross-platform-sync)
- [System Architecture](#-system-architecture)
- [Monorepo Directory Structure](#-monorepo-structure)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [Running Locally](#running-locally)
- [Environment Configuration](#-environment-configuration)
- [Authoritative WebSocket Protocol](#-authoritative-websocket-protocol)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Key Features

### 1. Real-Time Battle Arena & Multiplayer Contests
* **Synchronized Live Contests**: Create or join timed competitive coding contests with unique 6-character room codes (`/rooms/:code`).
* **Live WebSocket Leaderboards**: Standings update authoritatively in real time as participants pass test cases or solve MCQ assessment problems.
* **Tie-Breaking Penalty Clock**: Automatic point computation and second-precision penalty time tracking (`RoomParticipant.penaltyTime`).
* **Instant Auto-Conclude**:
  * Detects when **100% of participants** finish their assessments and automatically flips the room to `FINISHED`, saving remaining idle time.
  * Self-healing logic ensures past-due contests automatically transition to `FINISHED` across all history cards and leaderboards.
* **Animated Results & Standings**: Responsive podium showcase, solutions review accordion with test case breakdown, and filterable scorecards.

### 2. Authoritative Anti-Cheat Surveillance
* **Triple-Sensor Surveillance**:
  * **Tab Switching**: Monitors `visibilitychange` events and detects hidden browser tabs.
  * **Window Defocus**: Debounced window focus loss detection (`window.blur`).
  * **Suspicious Clipboard Injection**: Intercepts paste events exceeding 120 characters to deter external code dumps.
* **Authoritative 3-Strike Escalation Ladder**:
  * **Strike 1 (Warning)**: Proctoring warning dialogue triggered and logged to the authoritative room incident audit feed.
  * **Strike 2 (Time Penalty)**: Backend authoritatively injects **+180 seconds (+3 minutes)** into the participant's official penalty clock in PostgreSQL.
  * **Strike 3 (Disqualification)**: Candidate is flagged `isDisqualified: true`. Subsequent code and MCQ submissions are rejected with **HTTP 403 Forbidden**, the contest UI is locked, and the candidate is disqualified.

### 3. Live Spectator Command Center & Code Streaming
* **Live Keystroke Mirroring**: Candidates periodically stream debounced code snapshots over WebSockets (`code:sync` $\to$ `code:stream_update`).
* **Full Spectator Command Center**:
  * Toggleable full-screen spectator view for hosts, proctors, and interviewers.
  * Live competitor roster showing active rank, score, penalties, and proctoring shields (🟢 Clean, 🟡 Strike 1, 🟠 Strike 2, 🔴 Disqualified).
  * Read-only Monaco Editor mirroring candidate code keystrokes in real time with syntax highlighting and language detection.
* **Standings Drawer Fast-Inspection**:
  * Competitors can click the `<Eye />` icon on any row in the standings drawer to inspect another player's solution in a modal without leaving their active coding editor.
* **Live Room Incident Feed**: Real-time audit log of all anti-cheat violations across the room with candidate names, timestamps, and strike details.

### 4. AI Voice & Text Mock Interviews
* **Voice Activity Detection (VAD)**: Real-time client-side speech detection (`@ricky0123/vad-web`) that starts and stops recording automatically.
* **Whisper Large v3 Speech-to-Text**: Low-latency, high-accuracy audio transcription via Groq.
* **Llama 3.3 70B Conversational Interviewer**:
  * Simulates realistic senior engineering interviews tailored to seniority level, job role, and technical focus (DSA, System Design, Frontend, Backend).
  * Progressive hint ladder and adaptive questioning based on candidate responses.
* **PlayAI Text-to-Speech**: Natural, expressive conversational AI voice output.
* **Multi-Dimensional Automated Evaluation**:
  * Comprehensive post-interview grading across 4 standard rubrics: **Technical Accuracy**, **Problem Solving**, **Communication & Clarity**, and **Code Quality**.
  * Detailed summary report with strengths, areas for improvement, and level calibration (Junior $\to$ Staff).

### 5. Target Company Practice Kits & 470+ Archive
* **Curated Company Prep Kits**: High-yield interview problem tracks specifically tailored to **Google**, **Amazon**, **Meta**, **Microsoft**, **Apple**, **Netflix**, **Uber**, and startups.
* **470+ Company Archive**: Deep archive of real questions tagged with popularity metrics:
  * 🔥 *Very Hot* (Frequency $\ge$ 2.5)
  * ⚡ *Hot / Frequent* (Frequency 1.0 – 2.5)
  * Standard interview ask rates
* **Interactive Filtering**: Filter by Difficulty (Easy, Medium, Hard), Ask Rate, Solved Status, and Topics (Arrays, Trees, Graphs, DP).
* **Direct LeetCode Integration**: Quick-launch links directly to original LeetCode problems with optimistic solved-state synchronization.

### 6. Interview Target Tracker (POTD Loops)
* **Active Target Selectors**: Choose up to 5 target companies you are interviewing with.
* **Daily POTD Challenge Generation**: Automatically pulls high-frequency problems matching your selected companies every morning.
* **Configurable Goals**: Toggle daily goals (1, 2, 3, or 5 problems per day) with streak rewards.
* **Cross-Company Tagging**: See exactly which of your target companies ask each daily problem.

### 7. Code Sandbox & Learning Hub
* **Multi-Language Sandbox**: Execute solutions in **C++ (GCC)**, **Python 3**, **Java**, **JavaScript (Node)**, and **TypeScript** via Judge0 / Piston execution engines.
* **Interactive Test Runner**: Run sample test cases, inspect stdout/stderr, execution time (ms), and peak memory (KB).
* **AI Code Reviewer & Complexity Analyzer**:
  * Instant in-editor static analysis identifying time & space complexity ($O(N)$ Big-O breakdown).
  * Edge-case detection and bug explanations without giving away the full answer.
* **Curated Learning Hub & Sheets**:
  * **Striver A2Z DSA Sheet**: Comprehensive step-by-step roadmap from basics to advanced graphs & dynamic programming.
  * **NeetCode 150 / NeetCode 75 / Blind 75**: Curated interview preparation problem sets.

### 8. Notes & Hints Notepad
* **Problem-Linked Notes**: Record intuition, edge cases, and time complexity directly while practicing.
* **Responsive 2-Column Workspace**: Search by problem title or keyword, toggle full-width notes editor on mobile, and sync notes to your account.
* **Revision Bookmarks**: Bookmark questions across kits and sheets for quick revision sessions.

### 9. Unified Analytics & Cross-Platform Sync
* **Cross-Platform Activity Heatmap**: Unified Github-style activity heatmap tracking contributions across **interVue**, **LeetCode**, and **Codeforces**.
* **Daily Streak & Rewards**: Auto-claiming daily streak counter and points economy (`Intervue Coins`).
* **Profile Customization**: Customizable engineering title, target companies, platform usernames, and bio.

---

## 🏗️ System Architecture

```
                                ┌─────────────────────────────────────────┐
                                │            Client (Web App)             │
                                │  React 19 • Vite • Tailwind v4 • Monaco │
                                │   Web Speech / VAD • Socket Client      │
                                └────────────────────┬────────────────────┘
                                                     │
                                   HTTP / SSE / REST │ WebSocket (/ws/rooms)
                                                     ▼
                                ┌─────────────────────────────────────────┐
                                │           API Server (Hono)             │
                                │        Bun Fast Runtime (Port 3000)     │
                                │   Better-Auth • RoomSocketManager       │
                                └────┬───────────────┬───────────────┬────┘
                                     │               │               │
                      ┌──────────────┘               │               └──────────────┐
                      ▼                              ▼                              ▼
       ┌───────────────────────────┐   ┌───────────────────────────┐  ┌───────────────────────────┐
       │    PostgreSQL + Prisma    │   │       Groq AI APIs        │  │   Code Execution Engine   │
       │  - Users & Profiles       │   │  - Llama 3.3 70B          │  │  - Judge0 (Docker)        │
       │  - Rooms & Participants   │   │  - Whisper Large v3 (STT) │  │  - Piston Execution API   │
       │  - Problems & Test Cases  │   │  - PlayAI (TTS)           │  │  (C++, Python, Java, JS)  │
       │  - Submissions & Audits   │   └───────────────────────────┘  └───────────────────────────┘
       └───────────────────────────┘
```

---

## 📁 Monorepo Structure

```
intervue/
├── apps/
│   ├── server/                         # Backend API Server (Hono on Bun runtime)
│   │   ├── src/
│   │   │   ├── lib/                    # Better-Auth, Prisma DB client setup
│   │   │   ├── middleware/             # requireAuth, requireAdmin auth guards
│   │   │   ├── routes/
│   │   │   │   ├── admin.ts            # Problem CMS & AI problem generation
│   │   │   │   ├── chat.ts             # AI interview coaching chat (SSE)
│   │   │   │   ├── code.ts             # Problem execution, AI review, templates
│   │   │   │   ├── interview.ts        # Mock interview lifecycle, turn handling
│   │   │   │   ├── profile.ts          # Candidate profiles, streaks & heatmaps
│   │   │   │   ├── rooms.ts            # Contest rooms, lobbies, arena submissions
│   │   │   │   └── voice.ts            # Whisper STT & PlayAI TTS audio endpoints
│   │   │   ├── services/
│   │   │   │   ├── evaluation.ts       # Post-interview multi-dimensional rubric grading
│   │   │   │   ├── judge.ts            # Judge0 & Piston code execution runner
│   │   │   │   └── roomSocket.ts       # Authoritative WebSocket room & anti-cheat engine
│   │   │   └── index.ts                # Server entry point, CORS, WebSocket routing
│   │   └── package.json
│   │
│   └── web/                            # Frontend Single Page App (React 19 + Vite)
│       ├── src/
│       │   ├── components/
│       │   │   ├── company/            # CompanyKitWorkspace, CompanyKitsCatalog
│       │   │   ├── layout/             # AppLayout, Sidebar, Navbar, HUD
│       │   │   ├── shared/             # TargetCompanyTracker, DailyTargetTracker
│       │   │   └── ui/                 # Buttons, Dialogs, Badges, Tabs, Tooltips
│       │   ├── hooks/
│       │   │   ├── useAntiCheat.ts     # Browser sensors (tabs, blur, paste threshold)
│       │   │   ├── useDailyTargets.ts  # POTD tracking & goal management
│       │   │   ├── useNotes.ts         # In-context notepad management
│       │   │   ├── useRoomSocket.ts    # WebSocket client (sync, leaderboard, code stream)
│       │   │   └── useVoiceRecorder.ts # Audio recording & VAD speech processing
│       │   ├── pages/
│       │   │   ├── CodingPage.tsx      # LeetCode-style code editor & test runner
│       │   │   ├── DashboardPage.tsx   # User analytics, streaks, quick launcher
│       │   │   ├── InterviewPage.tsx   # Voice/text AI mock interview room
│       │   │   ├── NotepadPage.tsx     # Notes & Hints workspace
│       │   │   ├── PracticeHubPage.tsx # Curated company kits & DSA sheets
│       │   │   ├── ProfilePage.tsx     # Cross-platform heatmap & profile stats
│       │   │   └── rooms/
│       │   │       ├── RoomsListPage.tsx   # Contest hub, active rooms, room creation
│       │   │       ├── RoomLobbyPage.tsx   # Pre-contest waiting lobby & participant roster
│       │   │       ├── RoomArenaPage.tsx   # Split coding arena, spectator & anti-cheat
│       │   │       └── RoomResultsPage.tsx # Final podium standings & contest breakdown
│       │   └── lib/                    # Axios API client, Better-Auth client, company logos
│       └── package.json
│
├── packages/
│   └── db/                             # Shared PostgreSQL Database layer
│       ├── prisma/
│       │   ├── schema.prisma           # Prisma schema definition
│       │   └── seed.ts                 # Problem seed catalog & test cases
│       └── package.json
│
├── .github/                            # Issue & PR templates
├── CONTRIBUTING.md                     # Contribution guidelines
├── CODE_OF_CONDUCT.md                  # Contributor Covenant v2.1
├── LICENSE                             # MIT License
├── SECURITY.md                         # Security vulnerability disclosure policy
├── turbo.json                          # Turborepo task pipeline configuration
└── package.json                        # Root monorepo dependencies & scripts
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, TypeScript 5.7, Vite 6 |
| **Styling & Design** | Tailwind CSS v4, Framer Motion, Lucide Icons, Radix UI |
| **Code Editor** | `@monaco-editor/react` (VS Code Monaco Engine) |
| **Audio & Speech** | Web Speech API, Voice Activity Detection (`@ricky0123/vad-web`) |
| **Backend Runtime** | Bun, Hono Web Framework |
| **Authentication** | Better-Auth (Google OAuth & Email/Password) |
| **Database & ORM** | PostgreSQL, Prisma ORM |
| **Real-Time Engine** | Bun WebSockets (Port 3000, path `/ws/rooms`) |
| **Code Execution** | Judge0 (Dockerized) / Piston API |
| **AI Inference** | Groq SDK (Llama 3.3 70B Versatile, Whisper Large v3, PlayAI TTS) |
| **Monorepo Tools** | Turborepo, Bun Workspaces |

---

## 🚀 Getting Started

### Prerequisites

1. **Bun Runtime** ($\ge 1.1.0$): [Install Bun](https://bun.sh)
   ```bash
   # Windows (PowerShell)
   powershell -c "irm bun.sh/install.ps1 | iex"
   
   # Linux / macOS
   curl -fsSL https://bun.sh/install | bash
   ```
2. **PostgreSQL** ($\ge 15$): Running locally or via Supabase / Neon / Docker.
3. **Groq API Key**: Obtain a key from [Groq Console](https://console.groq.com).

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/LalitWagh34/intervue.git
   cd intervue
   ```

2. **Install all dependencies**:
   ```bash
   bun install
   ```

3. **Configure Environment Variables**:
   Create `.env` files in `apps/server/` and `packages/db/` (see [Environment Configuration](#-environment-configuration)).

4. **Initialize Database Schema & Seed Catalog**:
   ```bash
   cd packages/db
   bunx prisma db push
   bun run prisma/seed.ts
   cd ../..
   ```

### Running Locally

Start the full stack (Frontend, Backend & Monorepo pipelines) concurrently:

```bash
bun run dev
```

- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000`
- **WebSocket Endpoint**: `ws://localhost:3000/ws/rooms`

---

## 🔐 Environment Configuration

### `apps/server/.env`
```env
# Server
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/intervue?schema=public"

# Better-Auth Secret
BETTER_AUTH_SECRET="your-secure-random-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# AI Inference (Groq)
GROQ_API_KEY="gsk_..."

# Code Execution (Judge0 / Piston)
PISTON_API_URL="https://emkc.org/api/v2/piston"
JUDGE0_API_URL="http://localhost:2358"
```

### `apps/web/.env`
```env
VITE_API_URL="http://localhost:3000"
VITE_WS_URL="ws://localhost:3000"
```

---

## 📡 Authoritative WebSocket Protocol

The Battle Arena operates over Bun WebSockets with JSON message envelopes:

```typescript
interface SocketMessage {
  type: string;
  payload?: any;
}
```

### Client $\to$ Server Actions
| Event Type | Payload | Description |
|---|---|---|
| `join_room` | `{ roomCode, participantId }` | Establishes authenticated connection to room |
| `ready_toggle` | `{ isReady: boolean }` | Toggles lobby preparation state |
| `start_contest` | `{}` | Host command to commence synchronized contest |
| `code:sync` | `{ questionId, code, language }` | Streams live candidate editor snapshots |
| `anti_cheat:incident` | `{ reason: "TAB_SWITCH" \| "BLUR" \| "PASTE_BUFFER" }` | Emits proctoring sensor violation |
| `finish_contest` | `{}` | Candidate signals assessment conclusion |

### Server $\to$ Client Broadcasts
| Event Type | Payload | Description |
|---|---|---|
| `room_state` | `{ room, participants, status }` | Full authoritative room state update |
| `leaderboard_update` | `Participant[]` (ranked) | Real-time score & penalty standings |
| `code:stream_update` | `{ participantId, code, language }` | Mirrors candidate code to Spectator Console |
| `incident:logged` | `{ participantName, reason, strikeCount }` | Appends violation to room incident feed |
| `contest_concluded` | `{ finalStandings }` | Triggers podium results screen |

---

## 🤝 Contributing

We welcome community contributions, bug reports, and feature suggestions! Please review our [Contributing Guide](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md) before submitting a pull request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feat/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feat/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](./LICENSE).

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/LalitWagh34">Lalit Sudhakar Wagh</a> and the open-source community.</sub>
</div>
