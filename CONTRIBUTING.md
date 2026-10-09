# Contributing to interVue ⚡

Thank you for your interest in contributing to **interVue**! We welcome community contributions to build the ultimate open-source technical interview prep, battle arena, and assessment platform.

---

## 📌 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Fork & Clone](#fork--clone)
  - [Environment Setup](#environment-setup)
- [Monorepo Architecture](#monorepo-architecture)
- [Development Workflow](#development-workflow)
  - [Branch Naming](#branch-naming)
  - [Commit Message Format](#commit-message-format)
  - [Running Tests & Build](#running-tests--build)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs & Requesting Features](#reporting-bugs--requesting-features)

---

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). Please be respectful, inclusive, and professional in all communications.

---

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:
- [Bun](https://bun.sh) (v1.1.0 or newer) — Package manager & runtime
- [Node.js](https://nodejs.org) (v18 or newer, for tooling compatibility)
- [PostgreSQL](https://www.postgresql.org/) (v15 or newer, or Supabase / Neon connection)
- [Git](https://git-scm.com/)

### Fork & Clone

1. Fork the repository on GitHub: `https://github.com/LalitWagh34/intervue`
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/intervue.git
   cd intervue
   ```
3. Set the upstream remote:
   ```bash
   git remote add upstream https://github.com/LalitWagh34/intervue.git
   ```

### Environment Setup

1. Install root dependencies:
   ```bash
   bun install
   ```

2. Copy example environments:
   ```bash
   # Server environment
   cp apps/server/.env.example apps/server/.env

   # Database environment
   cp packages/db/.env.example packages/db/.env
   ```

3. Set up the database:
   ```bash
   cd packages/db
   bunx prisma db push
   bun run prisma/seed.ts
   cd ../..
   ```

4. Start development mode:
   ```bash
   bun run dev
   ```
   - Web Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3000`

---

## 🏗️ Monorepo Architecture

interVue is structured as a Turborepo monorepo:

- **`apps/web`**: React 19 + Vite single-page application styled with modern Tailwind CSS, Framer Motion, and Monaco Editor.
- **`apps/server`**: High-performance backend API written with Hono on Bun runtime, powering WebSockets, AI endpoints, and proctoring.
- **`packages/db`**: Shared Prisma schema, migrations, and database seed scripts.

---

## 🔄 Development Workflow

### Branch Naming

Create a feature or bugfix branch before writing code:

- `feat/feature-name` (e.g. `feat/leetcode-sync`)
- `fix/issue-description` (e.g. `fix/mobile-tab-wrap`)
- `docs/documentation-update` (e.g. `docs/api-guide`)
- `refactor/component-name` (e.g. `refactor/room-socket`)

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description>
```

Examples:
- `feat(arena): add tie-breaking penalty calculations for live rooms`
- `fix(mobile): resolve overflowing table in company questions view`
- `docs(readme): add system design architecture diagram`
- `refactor(auth): simplify google oauth callback redirect`

### Running Tests & Build

Before pushing your changes, ensure TypeScript and production bundles compile with zero errors:

```bash
# Build all workspaces
bun run build

# Or test web app build specifically
cd apps/web && bun run build
```

---

## 📬 Pull Request Process

1. **Rebase against main**: Keep your branch up to date:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
2. **Push your branch**:
   ```bash
   git push origin <your-branch-name>
   ```
3. **Open a Pull Request**:
   - Provide a clear title and description referencing any related issues (e.g., `Closes #42`).
   - Include screenshots or screen recordings for frontend UI changes.
   - Confirm that `bun run build` passes.
4. **Code Review**: Project maintainers will review your PR. Be open to feedback and iterate as needed.

---

## 🐞 Reporting Bugs & Requesting Features

- **Bug Reports**: Please open an issue using the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) with reproduction steps, expected behavior, and browser info.
- **Feature Requests**: Open an issue using the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md) describing the problem you want to solve and suggested designs.

---

Thank you for helping make **interVue** incredible! 🚀
