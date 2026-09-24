# Intervue ⚡

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Bun-Runtime-fbf0df?logo=bun&logoColor=black" alt="Bun" />
  <img src="https://img.shields.io/badge/Hono-Framework-E36002?logo=hono&logoColor=white" alt="Hono" />
  <img src="https://img.shields.io/badge/PostgreSQL-Prisma-2D3748?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Groq-Llama_3.3_70B-F05A28?logo=meta&logoColor=white" alt="Groq Llama 3.3" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Turborepo-Monorepo-EF4444?logo=turborepo&logoColor=white" alt="Turborepo" />
</p>

<p align="center">
  <strong>Next-Generation AI Technical Interview Platform, Real-Time Battle Arena & LeetCode-Grade Code Sandbox.</strong>
</p>

<p align="center">
  Simulate lifelike AI voice and text interviews, practice curated DSA sheets (NeetCode 150, Striver A2Z), host competitive programming battle rooms with real-time WebSocket leaderboards, and monitor candidates with an authoritative anti-cheat surveillance and live spectator system.
</p>

---

## 📑 Table of Contents

- [Key Features](#-key-features)
  - [1. Real-Time Battle Arena & Contests](#1-real-time-battle-arena--multiplayer-contests)
  - [2. Anti-Cheat Surveillance & Proctoring](#2-authoritative-anti-cheat-surveillance)
  - [3. Live Spectator Command Center](#3-live-spectator-command-center--code-streaming)
  - [4. AI Voice & Text Technical Mock Interviews](#4-ai-voice--text-mock-interviews)
  - [5. LeetCode-Grade Code Sandbox & Learning Hub](#5-leetcode-grade-code-sandbox--learning-hub)
  - [6. AI Problem Generator & Admin CMS](#6-ai-problem-generator--admin-cms)
- [System Architecture](#-system-architecture)
- [Monorepo Structure](#-monorepo-structure)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [Running Locally](#running-locally)
- [Environment Configuration](#-environment-configuration)
- [Authoritative WebSocket Protocol](#-authoritative-websocket-protocol)
- [Scripts Reference](#-scripts-reference)

---

## 🌟 Key Features

### 1. Real-Time Battle Arena & Multiplayer Contests
* **Synchronized Live Contests**: Create or join timed competitive coding contests with unique 6-character room codes (`/rooms/:code`).
* **Live WebSocket Leaderboards**: Standings update authoritatively in real time as participants pass test cases or solve MCQ assessment problems.
* **Tie-Breaking Penalty Clock**: Automatic point computation and second-precision penalty time tracking (`RoomParticipant.penaltyTime`).
* **Instant Auto-Conclude**:
  * Detects when **100% of participants** finish their assessments and automatically flips the room to `FINISHED`, saving remaining idle time.
  * Self-healing logic ensures past-due contests automatically transition to `FINISHED` across all history cards and leaderboards.

### 2. Authoritative Anti-Cheat Surveillance
* **Triple-Sensor Surveillance**:
  * **Tab Switching**: Monitors `visibilitychange` events and detects hidden browser tabs.
  * **Window Defocus**: Debounced window focus loss detection (`window.blur`).
  * **Suspicious Clipboard Injection**: Intercepts paste events exceeding 120 characters to deter large external code dumps.
* **Authoritative 3-Strike Escalation Ladder**:
  * **Strike 1 (Warning)**: Proctoring warning dialogue triggered and logged to the authoritative room incident audit feed.
  * **Strike 2 (Time Penalty)**: Backend authoritatively injects **+180 seconds (+3 minutes)** into the participant's official penalty clock in PostgreSQL.
  * **Strike 3 (Disqualification)**: Candidate is flagged `isDisqualified: true`. Subsequent code and MCQ submissions are rejected with **HTTP 403 Forbidden**, the contest UI is locked, and the candidate is disqualified.

### 3. Live Spectator Command Center & Code Streaming
* **Live Keystroke Mirroring**: Candidates periodically stream debounced code snapshots over WebSockets (`code:sync` $\to$ `code:stream_update`).
* **Full Spectator Command Center**:
  * Full-screen view toggleable with one click in the battle arena header.
  * Live competitor roster showing active rank, score, penalties, and proctoring shields (🟢 Clean, 🟡 Strike 1, 🟠 Strike 2, 🔴 Disqualified).
  * Read-only Monaco Editor mirroring candidate code keystrokes in real time with syntax highlighting and language detection.
* **Standings Drawer Fast-Inspection**:
  * Competitors can click the `<Eye />` icon on any row in the standings drawer to inspect another player's solution in a modal without leaving their active coding editor.
* **Live Room Incident Feed**: Real-time audit log of all anti-cheat violations across the room with candidate names, timestamps, and strike details.

### 4. AI Voice & Text Mock Interviews
* **Voice Activity Detection (VAD)**: Real-time client-side speech detection that starts and stops recording automatically.
* **Whisper Large v3 Speech-to-Text**: Low-latency, high-accuracy audio transcription via Groq.
* **Llama 3.3 70B Conversational Interviewer**:
  * Simulates realistic senior engineering interviews tailored to seniority level, job role, and technical focus (DSA, System Design, Frontend, Backend).
  * Progressive hint ladder and adaptive questioning based on candidate responses.
* **PlayAI Text-to-Speech**: Natural, expressive conversational AI voice output.
* **Multi-Dimensional Automated Evaluation**:
  * Comprehensive post-interview grading across 4 standard rubrics: **Technical Accuracy**, **Problem Solving**, **Communication & Clarity**, and **Code Quality**.
  * Detailed summary report with strengths, areas for improvement, and level calibration (Junior $\to$ Staff).

### 5. LeetCode-Grade Code Sandbox & Learning Hub
* **Multi-Language Sandbox**: Execute solutions in **C++ (GCC)**, **Python 3**, **Java**, **JavaScript (Node)**, and **TypeScript** via Judge0 / Piston execution engines.
* **Interactive Test Runner**: Run sample test cases, inspect stdout/stderr, execution time (ms), and peak memory (KB).
* **AI Code Reviewer & Complexity Analyzer**:
  * Instant in-editor static analysis identifying time & space complexity ($O(N)$ Big-O breakdown).
  * Edge-case detection and bug explanations without giving away the full answer.
* **Curated Learning Hub & Sheets**:
  * **Striver A2Z DSA Sheet**: Comprehensive step-by-step roadmap from basics to advanced graphs & dynamic programming.
  * **NeetCode 150 / NeetCode 75 / Blind 75**: Curated interview preparation problem sets.
  * **Company-Wise Collections**: Problems tagged by top tier tech companies (Google, Meta, Amazon, Microsoft, Uber).

### 6. AI Problem Generator & Admin CMS
* **AI Problem Authoring**: Admins can generate complete, production-ready coding problems using Groq Llama 3.3.
* **Comprehensive Test Suite Generation**: Automatically produces problem descriptions, constraints, examples, starter code templates across all 5 languages, and hidden test cases with input/output pairs.

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
│   │   │   │   ├── profile.ts          # Candidate profiles & onboarding
│   │   │   │   ├── rooms.ts            # Contest rooms, lobbies, arena submissions
│   │   │   │   └── voice.ts            # Whisper STT & PlayAI TTS audio endpoints
│   │   │   ├── services/
│   │   │   │   ├── evaluation.ts       # Post-interview multi-dimensional rubric grading
│   │   │   │   ├── judge.ts            # Judge0 & Piston code execution runner
│   │   │   │   └── roomSocket.ts       # Authoritative WebSocket room & anti-cheat engine
│   │   │   └── index.ts                # Server entry point, CORS, WebSocket routing
│   │   ├── .env                        # Server environment secrets
│   │   └── package.json
│   │
│   └── web/                            # Frontend Single Page App (React 19 + Vite)
│       ├── src/
│       │   ├── components/
│       │   │   ├── layout/             # AppLayout, Sidebar, Navbar, HUD
│       │   │   └── ui/                 # Buttons, Dialogs, Badges, Tabs, Tooltips
│       │   ├── hooks/
│       │   │   ├── useAntiCheat.ts      # Browser sensors (tabs, blur, paste threshold)
│       │   │   ├── useRoomSocket.ts    # WebSocket client (sync, leaderboard, code stream)
│       │   │   └── useVoiceRecorder.ts # Audio recording & VAD speech processing
│       │   ├── pages/
│       │   │   ├── CodingPage.tsx      # LeetCode-style code editor & test suite runner
│       │   │   ├── DashboardPage.tsx   # User analytics, streaks, quick launcher
│       │   │   ├── HistoryPage.tsx     # Past interview logs & contest results
│       │   │   ├── InterviewPage.tsx   # Voice/text AI mock interview room
│       │   │   ├── PracticeHubPage.tsx # Curated DSA sheets & problem catalog
│       │   │   ├── ResultsPage.tsx     # Detailed evaluation rubric & feedback
│       │   │   └── rooms/
│       │   │       ├── RoomsListPage.tsx   # Contest hub, active rooms, room creation
│       │   │       ├── RoomLobbyPage.tsx   # Pre-contest waiting lobby & participant roster
│       │   │       ├── RoomArenaPage.tsx   # Split coding arena, spectator & anti-cheat
│       │   │       └── RoomResultsPage.tsx # Final podium standings & contest breakdown
│       │   └── lib/                    # Axios API client, Better-Auth client
│       └── package.json
│
├── packages/
│   └── db/                             # Shared PostgreSQL Database layer
│       ├── prisma/
│       │   ├── schema.prisma           # Prisma schema definition
│       │   └── seed.ts                 # Problem seed catalog & test cases
│       └── package.json
│
├── turbo.json                          # Turborepo task pipeline configuration
└── package.json                        # Root monorepo dependencies & scripts
```

---

## 🛠️ Tech Stack

| Area | Technologies |
|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite |
| **Styling & Animation** | Tailwind CSS v4, Framer Motion, Lucide Icons, Radix UI |
| **Code Editor** | `@monaco-editor/react` (VS Code Editor engine) |
| **Audio & Speech** | Web Speech API, Voice Activity Detection (`@ricky0123/vad-web`) |
| **Backend Runtime** | Bun, Hono Web Framework |
| **Authentication** | Better-Auth with Google OAuth & Email/Password credentials |
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
   Create `.env` in `apps/server/` and `packages/db/` (see [Environment Configuration](#-environment-configuration)).

4. **Initialize Database Schema & Seed Problems**:
   ```bash
   cd packages/db
   bunx prisma db push
   bun run prisma/seed.ts
   cd ../..
   ```

### Running Locally

Start both the backend server and frontend development server simultaneously using Turborepo:

```bash
bun dev
```

* **Web Application**: [http://localhost:5173](http://localhost:5173)
* **API & WebSocket Server**: [http://localhost:3000](http://localhost:3000)
* **WebSocket Endpoint**: `ws://localhost:3000/ws/rooms`

---

## ⚙️ Environment Configuration

### `apps/server/.env`
```env
# Application Port & URLs
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database Connection
DATABASE_URL="postgresql://postgres:password@localhost:5432/intervue?schema=public"

# Better-Auth Configuration
BETTER_AUTH_SECRET="your-super-secret-random-key"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth Credentials (Optional for social login)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Inference (Groq)
GROQ_API_KEY="gsk_your_groq_api_key"

# Code Execution Engine (Judge0 or Piston)
JUDGE0_URL="http://localhost:2358"
JUDGE0_API_KEY="" # Leave blank if using self-hosted Judge0
```

### `packages/db/.env`
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/intervue?schema=public"
```

---

## 📡 Authoritative WebSocket Protocol

The Battle Arena real-time networking engine is powered by Bun WebSockets connected at `ws://localhost:3000/ws/rooms`.

### Client $\to$ Server Events
| Event | Payload | Purpose |
|---|---|---|
| `contest:start` | `{}` | Host authoritatively starts contest countdown |
| `code:sync` | `{ problemId, sourceCode, language }` | Streams periodic keystroke delta for spectators |
| `code:inspect` | `{ targetUserId }` | Requests live code snapshot of another competitor |
| `anticheat:violation` | `{ type, details }` | Reports client sensor violation (`TAB_SWITCH`, etc.) |

### Server $\to$ Client Broadcasts
| Event | Payload | Purpose |
|---|---|---|
| `room:sync` | `{ participants, status, timer, violations }` | Initial synchronization on room join |
| `leaderboard:update` | `{ participants, recentActivities }` | Real-time standings update on test completion |
| `contest:time_sync` | `{ serverTime, remainingSeconds }` | Drift-free clock synchronization |
| `code:stream_update`| `{ targetUserId, problemId, sourceCode }` | Live keystroke stream sent to spectators |
| `anticheat:violation`| `{ violation, leaderboard }` | Broadcasts incident and updated penalty points |
| `contest:ended` | `{ status: "FINISHED", finalLeaderboard }`| Concludes contest and routes to results podium |

---

## 📜 Scripts Reference

Run these commands from the repository root:

```bash
# Start all apps in watch mode
bun dev

# Build all applications for production
bun run build

# Run TypeScript typechecks across all workspaces
bun run check

# Open Prisma Studio GUI for database inspection
cd packages/db && bunx prisma studio

# Generate Prisma Client after schema changes
cd packages/db && bunx prisma generate
```

---

## 🛡️ License

This project is licensed under the [MIT License](LICENSE).
