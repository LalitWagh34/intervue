# Intervue

> **AI-Powered Technical Interview & Assessment Platform**

Intervue is an end-to-end technical interview platform that simulates realistic mock interviews across voice and text, evaluates candidate responses with automated multi-dimensional rubrics, provides a full LeetCode-style code sandbox with instant execution and AI review, and includes an administrative CMS for AI-assisted problem generation.

---

## Quick Links

- 📖 **Full System Architecture & Specification**: See [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) for detailed documentation on architecture, database schema, all API endpoints, and external services.

---

## Tech Stack Overview

- **Frontend (`apps/web`)**: React 19, Vite, Tailwind CSS v4, Monaco Code Editor, Web Speech & Voice Activity Detection (VAD), TanStack Query, Radix UI, Framer Motion.
- **Backend (`apps/server`)**: Hono on Bun runtime, Better-Auth, Groq SDK (Llama 3.3 70B, Whisper Large v3, PlayAI TTS), Piston / Judge0 execution engine.
- **Database (`packages/db`)**: PostgreSQL & Prisma ORM.
- **Monorepo Management**: Turborepo & Bun Workspaces.

---

## Quick Start

### 1. Install Dependencies
```bash
bun install
```

### 2. Configure Environment
Ensure environment variables are set in `apps/server/.env` and `packages/db/.env` (refer to [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md#8-environment-variables)).

### 3. Setup Database & Seed
```bash
cd packages/db
bunx prisma db push
bun run prisma/seed.ts
cd ../..
```

### 4. Run Development Servers
```bash
# Run both frontend & backend concurrently via Turborepo
bun dev
```

- **Web Frontend**: [http://localhost:5173](http://localhost:5173)
- **API Server**: [http://localhost:3000](http://localhost:3000)
