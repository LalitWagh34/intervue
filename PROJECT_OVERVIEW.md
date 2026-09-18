# Intervue — Full Project Architecture & Specification

> **Intervue** is an AI-powered technical interview preparation and assessment platform built as a high-performance TypeScript monorepo. It combines real-time voice and text conversational interviews, sandboxed multi-language code execution, automated AI evaluation, competitive programming problem sets, and an administrative CMS for problem generation.

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Technology Stack](#3-technology-stack)
4. [Core Features & Modules](#4-core-features--modules)
   - [AI Voice & Text Interviews](#ai-voice--text-interviews)
   - [Automated Multi-Dimensional Evaluation](#automated-multi-dimensional-evaluation)
   - [Coding Practice & Sandbox Execution](#coding-practice--sandbox-execution)
   - [AI Problem Generator & Admin CMS](#ai-problem-generator--admin-cms)
   - [AI Interview Coach Chat](#ai-interview-coach-chat)
   - [User Profiles & Performance Analytics](#user-profiles--performance-analytics)
5. [Database Schema & Data Model](#5-database-schema--data-model)
6. [API Service Endpoints](#6-api-service-endpoints)
7. [External Integrations & Services](#7-external-integrations--services)
8. [Environment Variables](#8-environment-variables)
9. [Setup & Running Locally](#9-setup--running-locally)

---

## 1. High-Level Architecture

```
                                  ┌───────────────────────────────┐
                                  │      Client (Web App)         │
                                  │   React 19 + Vite + Tailwind  │
                                  │   Monaco Editor + VAD Web     │
                                  └───────────────┬───────────────┘
                                                  │ HTTP / SSE / REST
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │      API Server (Hono)        │
                                  │       Bun Fast Runtime        │
                                  │  Better-Auth + Route Handlers │
                                  └───────┬───────┬───────┬───────┘
                                          │       │       │
              ┌───────────────────────────┘       │       └──────────────────────────┐
              ▼                                   ▼                                  ▼
┌───────────────────────────┐   ┌───────────────────────────┐      ┌───────────────────────────┐
│     PostgreSQL + Prisma   │   │       Groq AI APIs        │      │    Code Execution Engine  │
│  - Users & Profiles       │   │  - Llama 3.3 70B          │      │  - Judge0 (Docker)        │
│  - Interviews & Evals     │   │  - Whisper Large v3 (STT) │      │  - Piston Execution API   │
│  - Problems & Submissions │   │  - PlayAI (TTS)           │      │    (JS, PY, C++, Java, TS)│
│  - Chats & Messages       │   └───────────────────────────┘      └───────────────────────────┘
└───────────────────────────┘
```

---

## 2. Monorepo Structure

The repository is managed with **Turborepo** and **Bun Workspaces**:

```
intervue/
├── apps/
│   ├── server/                   # Backend HTTP API (Hono, Bun, Groq, Better-Auth)
│   │   ├── src/
│   │   │   ├── lib/              # Auth configuration (Better-Auth, Prisma adapter)
│   │   │   ├── middleware/       # Auth & role-based guards (requireAuth, requireAdmin)
│   │   │   ├── routes/           # Route controllers
│   │   │   │   ├── admin.ts      # Problem CRUD, AI problem generator
│   │   │   │   ├── chat.ts       # AI coaching chat with SSE streaming
│   │   │   │   ├── code.ts       # Problem retrieval, Piston/Judge0 execution, AI code review
│   │   │   │   ├── interview.ts  # Interview session lifecycle, turn handling, SSE & voice
│   │   │   │   ├── profile.ts    # User profile & onboarding setup
│   │   │   │   └── voice.ts      # Whisper STT & PlayAI TTS audio endpoints
│   │   │   ├── services/
│   │   │   │   └── evaluation.ts # Post-interview grading service (Groq Llama 3.3)
│   │   │   ├── types/            # Hono context and authentication types
│   │   │   └── index.ts          # Server entry point, CORS, logging, route registration
│   │   ├── .env                  # Server environment configuration
│   │   └── package.json
│   │
│   └── web/                      # Frontend Single Page App (React 19, Vite)
│       ├── src/
│       │   ├── components/
│       │   │   ├── layout/       # AppLayout, DashboardLayout, Sidebar, Topbar
│       │   │   └── ui/           # Reusable Radix UI & custom UI components
│       │   ├── hooks/            # React Query hooks (useInterviews, useProblems, etc.)
│       │   ├── lib/              # Axios instance, Better-Auth client, Tailwind utils
│       │   ├── pages/
│       │   │   ├── AdminPage.tsx          # Admin problem creation & AI generator
│       │   │   ├── ChatPage.tsx           # AI coach conversational assistant
│       │   │   ├── CodingPage.tsx         # LeetCode-style code editor, test runner
│       │   │   ├── DashboardPage.tsx      # Overview, stats, streaks, session launcher
│       │   │   ├── HistoryPage.tsx        # Past interview logs & results
│       │   │   ├── InterviewPage.tsx      # Text-based technical interview room
│       │   │   ├── LandingPage.tsx        # Public marketing landing page
│       │   │   ├── LoginPage.tsx          # Authentication (Google OAuth, credentials)
│       │   │   ├── PracticeHubPage.tsx    # Mode selector (Voice, Text, Coding, System Design)
│       │   │   ├── ProfilePage.tsx        # User profile view & edit
│       │   │   ├── ProfileSetupPage.tsx   # Initial onboarding questionnaire
│       │   │   ├── ResultsPage.tsx        # Detailed evaluation breakdown & rubric
│       │   │   └── VoiceInterviewPage.tsx # Real-time voice interview with STT/TTS
│       │   ├── App.tsx           # Client router & protected route guards
│       │   └── main.tsx          # Application mount & React Query provider
│       ├── vite.config.ts        # Vite configuration with ONNX / VAD asset copying
│       └── package.json
│
├── packages/
│   ├── db/                       # Prisma database schema & client
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # Relational database models & enums
│   │   │   └── seed.ts           # Problem bank seeder (Two Sum, LRU Cache, etc.)
│   │   ├── index.ts              # Exports initialized Prisma Client singleton
│   │   └── package.json
│   │
│   └── shared/                   # Shared TypeScript models and utilities
│
├── docker-compose.yml            # Judge0, PostgreSQL, and Redis container orchestration
├── judge0.conf                   # Judge0 configuration parameters
├── package.json                  # Monorepo root with Turbo scripts
└── turbo.json                    # Turborepo task pipeline configuration
```

---

## 3. Technology Stack

### Frontend (`apps/web`)
- **Framework**: [React 19](https://react.dev/) + [Vite 6](https://vite.dev/) (TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + CSS Modules / Lucide Icons / Tabler Icons
- **Code Editor**: [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react) (VS Code editor in the browser)
- **Voice & Speech**:
  - Web Speech API (in-browser speech recognition)
  - [@ricky0123/vad-web](https://github.com/ricky0123/vad) & `onnxruntime-web` for Voice Activity Detection
  - Groq Whisper Large v3 (server-side STT backup)
  - Groq PlayAI (Text-to-Speech audio streaming)
- **State & Data Fetching**:
  - [@tanstack/react-query v5](https://tanstack.com/query) for server caching and optimistic mutations
  - [Zustand](https://zustand-demo.pmnd.rs/) for client state
- **UI & Animation**:
  - [Framer Motion](https://www.framer.com/motion/) for fluid animations
  - [Radix UI](https://www.radix-ui.com/) headless primitives + Sonner toast notifications
  - [next-themes](https://github.com/pacocoursey/next-themes) for dark/light themes
- **Routing**: [React Router 7](https://reactrouter.com/)

### Backend (`apps/server`)
- **Runtime**: [Bun](https://bun.com/) (Fast JavaScript runtime and package manager)
- **Web Framework**: [Hono](https://hono.dev/) (Lightweight, ultra-fast web framework)
- **Authentication**: [better-auth](https://better-auth.com/) (Session-based auth with OAuth and email/password support)
- **AI Engine**: [Groq SDK](https://github.com/groq/groq-typescript)
  - `llama-3.3-70b-versatile` for interview simulation, rubric evaluations, code reviews, and problem generation
  - `whisper-large-v3` for speech-to-text
  - `playai-tts` for high-quality synthetic interviewer speech
- **Code Sandbox Execution**:
  - [Piston API](https://github.com/engineer-man/piston) / [Judge0](https://judge0.com/) Docker engine for secure sandboxed code runs across Python, JavaScript, TypeScript, C++, and Java.

### Database & ORM (`packages/db`)
- **Database**: PostgreSQL
- **ORM**: [Prisma](https://www.prisma.io/) with typed client generation

---

## 4. Core Features & Modules

### AI Voice & Text Interviews
- **Multi-Mode Support**:
  - **Voice Mode**: Fully conversational interview with voice input, transcription, and natural speech synthesis output.
  - **Text Mode**: Real-time Server-Sent Events (SSE) streaming chat interface simulating technical and behavioral interviews.
- **Difficulty & Role Customization**: Select difficulty (`junior`, `mid`, `senior`) and target roles (e.g., *Frontend Engineer*, *Full Stack*, *Backend Engineer*, *DevOps*).
- **Context-Aware AI**: The interviewer adapts to the candidate's declared profile skills, target seniority, and prior answers.

### Automated Multi-Dimensional Evaluation
Once an interview session completes, an automated asynchronous evaluation pipeline grades the candidate:
- **Overall Score**: 1 to 10 numerical assessment.
- **Dimensional Scoring**:
  - *Technical Knowledge* (1–10)
  - *Communication Skills* (1–10)
  - *Problem Solving & Analytical Thinking* (1–10)
- **Detailed Feedback**: Executive summary, explicit key strengths, and targeted areas for improvement.

### Coding Practice & Sandbox Execution
- **Interactive IDE**: Monaco Editor embedded in the browser with language syntax highlighting, auto-completion, and customizable themes.
- **Multiple Languages**: JavaScript, TypeScript, Python 3, C++, and Java.
- **Instant Test Case Verification**: Executes code against public and hidden test cases with execution time, memory usage, stdout, and stderr.
- **Instant AI Code Review**: Analyzes user-submitted code for Time & Space Complexity ($O(n)$ analysis), edge cases, and architectural best practices.

### AI Problem Generator & Admin CMS
- **Administrative Dashboard**: Restricted to users with the `admin` role.
- **Manual Problem Authoring**: Add problem descriptions, constraints, examples, hidden test cases, and language templates.
- **1-Click AI Generation**: Provide topic, difficulty, and tags; Groq AI automatically synthesizes problem statements, constraints, test cases, and clean starter scaffolding.

### AI Interview Coach Chat
- Dedicated conversational assistant (`/chat`) where candidates can ask technical questions, practice system design walk-throughs, review data structures, or ask for behavioral interview tips.
- Real-time streaming response with persistent conversation history.

### User Profiles & Performance Analytics
- **Onboarding Setup**: Capture candidate's name, target role, years of experience, GitHub/LinkedIn links, and technical skills.
- **Dashboard Metrics**:
  - Total interview sessions completed
  - Cumulative average interview score
  - Daily practice streak counter
  - Recent session history with direct links to evaluation reports

---

## 5. Database Schema & Data Model

### Key Enums
- `Mode`: `voice`, `text`, `coding`, `system_design`
- `InterviewStatus`: `active`, `in_progress`, `completed`, `abandoned`
- `InterviewDifficulty`: `junior`, `mid`, `senior`
- `EvalStatus`: `pending`, `processing`, `completed`, `failed`
- `ProblemDifficulty`: `EASY`, `MEDIUM`, `HARD`
- `Language`: `CPP`, `JAVA`, `PYTHON`, `JAVASCRIPT`, `TYPESCRIPT`
- `Verdict`: `ACCEPTED`, `WRONG_ANSWER`, `TLE`, `MLE`, `RUNTIME_ERROR`, `COMPILATION_ERROR`, `PENDING`
- `UserRole`: `user`, `admin`

### Key Models
| Model | Description |
|---|---|
| **User** | Central user record containing email, name, image, role, sessions, and relationships. |
| **Profile** | User portfolio data: target role, experience level, skills array, streak count, GitHub/LinkedIn links. |
| **Interview** | An interview session record with selected mode, role, difficulty, status, duration, and score. |
| **Message** | Individual transcript turns (user or assistant) belonging to an interview. |
| **Evaluation** | Detailed post-interview score breakdown, strengths, improvements, and dimension scores. |
| **Problem** | Coding challenge definition with slug, difficulty, constraints, hints, tags, companies, and time/memory limits. |
| **TestCase** | Inputs and expected outputs for problem validation (with `isHidden` flag). |
| **ProblemExample** | Public examples displayed in the problem description tab. |
| **CodeTemplate** | Language-specific starter boilerplate for the user in the Monaco editor. |
| **Submission** | Code run record with verdict, runtime, memory, compiler output, and AI feedback. |
| **Chat & ChatMessage**| Free-form AI coaching conversation sessions and message history. |
| **Session & Account** | Session tokens and OAuth accounts managed by `better-auth`. |

---

## 6. API Service Endpoints

### Authentication (`/api/auth/*`)
Handled by Better-Auth:
- `POST /api/auth/sign-in/email` — Email & password sign in
- `POST /api/auth/sign-up/email` — Account creation
- `POST /api/auth/sign-out` — Session revocation
- `GET /api/auth/session` — Get authenticated session

### Profile (`/api/profile`)
- `GET /api/profile` — Get full profile with associated user record
- `GET /api/profile/me` — Get current profile
- `POST /api/profile/setup` — Create or update user profile details

### Interviews (`/api/interviews`)
- `POST /api/interviews` — Create a new interview session
- `GET /api/interviews` — List past interviews with evaluations
- `GET /api/interviews/:id` — Get interview details, message history, and evaluation
- `POST /api/interviews/:id/message` — Send message to interviewer (returns JSON for voice, SSE stream for text)
- `PUT /api/interviews/:id/end` — Conclude interview and trigger background evaluation
- `PUT /api/interviews/:id/abandon` — Mark interview as abandoned

### Voice & Speech (`/api/voice`)
- `POST /api/voice/stt` — Speech-to-Text via Groq Whisper (`multipart/form-data`)
- `POST /api/voice/tts` — Text-to-Speech via Groq PlayAI (`audio/wav` response)

### Coding & Sandbox (`/api/code`)
- `GET /api/code/problems` — List published coding problems (with optional `?difficulty=` filter)
- `GET /api/code/problems/:slug` — Fetch problem details, templates, examples, and visible test cases
- `GET /api/code/problems/:slug/submissions` — Fetch user's recent submissions for this problem
- `POST /api/code/execute` — Execute code against sandbox (Piston/Judge0) and record submission
- `POST /api/code/evaluate` — Request AI complexity analysis and feedback on solution

### AI Coaching Chat (`/api/chats`)
- `GET /api/chats` — List all chat sessions for user
- `POST /api/chats` — Start new coaching session
- `GET /api/chats/:id` — Retrieve chat history
- `POST /api/chats/:id/message` — Send prompt and receive SSE streamed response
- `DELETE /api/chats/:id` — Delete chat conversation

### Admin CMS (`/api/admin`) *(Admin Role Only)*
- `GET /api/admin/problems` — List all problems with test case & submission counts
- `GET /api/admin/problems/:id` — Get full problem details
- `POST /api/admin/problems` — Manually create problem with test cases and templates
- `PUT /api/admin/problems/:id` — Update existing problem
- `POST /api/admin/problems/:id/publish` — Publish draft problem
- `DELETE /api/admin/problems/:id` — Remove problem
- `POST /api/admin/problems/generate` — AI generation of complete problem spec from prompt

---

## 7. External Integrations & Services

1. **Groq AI Platform**:
   - `llama-3.3-70b-versatile`: Low-latency LLM inference used for real-time conversation, interview evaluation, code reviews, and problem generation.
   - `whisper-large-v3`: High-accuracy speech transcription.
   - `playai-tts`: Conversational synthetic voice output.
2. **Piston / Judge0**:
   - Isolated sandbox environment for executing untrusted user code safely with customizable memory and time constraints.
3. **Docker Engine**:
   - Multi-container stack in `docker-compose.yml` for local Judge0 server, workers, Redis queue, and PostgreSQL database.

---

## 8. Environment Variables

### Server (`apps/server/.env`)
```env
PORT=3000
DATABASE_URL="postgresql://username:password@localhost:5432/intervue?schema=public"
BETTER_AUTH_SECRET="your-better-auth-secret"
BETTER_AUTH_URL="http://localhost:3000"
GROQ_API_KEY="gsk_..."
PISTON_API_URL="https://emkc.org/api/v2/piston"
```

### Database (`packages/db/.env`)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/intervue?schema=public"
```

---

## 9. Setup & Running Locally

### Prerequisites
- [Bun](https://bun.com/) (v1.1+)
- [PostgreSQL](https://www.postgresql.org/) (local or cloud instance like Supabase / Neon)
- [Docker & Docker Compose](https://www.docker.com/) *(optional, for local Judge0 sandbox)*
- Groq API Key

### Step-by-Step Setup

1. **Install Dependencies**:
   ```bash
   bun install
   ```

2. **Configure Environment Variables**:
   - Populate `apps/server/.env` with your `DATABASE_URL` and `GROQ_API_KEY`.
   - Populate `packages/db/.env` with matching `DATABASE_URL`.

3. **Generate Prisma Client & Seed Problems**:
   ```bash
   cd packages/db
   bunx prisma db push
   bun run prisma/seed.ts
   ```

4. **Start Development Services**:

   - **Option A: Run everything via Turborepo**:
     ```bash
     bun dev
     ```

   - **Option B: Run independently**:
     - **Backend**:
       ```bash
       cd apps/server
       bun dev
       ```
     - **Frontend**:
       ```bash
       cd apps/web
       bun dev
       ```

5. **Access the Applications**:
   - Web App: `http://localhost:5173`
   - Server API: `http://localhost:3000`
   - Health Check: `http://localhost:3000/health`
