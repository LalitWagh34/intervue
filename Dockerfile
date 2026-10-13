FROM oven/bun:1.2-slim AS base

# Install OpenSSL for Prisma engine compatibility
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root workspace definitions and lockfile
COPY package.json bun.lock turbo.json ./
COPY packages/db/package.json ./packages/db/
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy packages and server source code
COPY packages/db ./packages/db
COPY apps/server ./apps/server

# Generate Prisma client for database connection
RUN bun run --cwd packages/db db:generate

# Pre-build server bundle to eliminate runtime TypeScript compiling overhead
RUN bun run --cwd apps/server build

# Default production environment variables
ENV NODE_ENV=production
ENV PORT=3000
# Tell JavaScriptCore runtime memory limit is 384MB (staying well within Render 512MB free tier limit)
ENV BUN_JSC_forceRAMSize=384000000

EXPOSE 3000

# Start compiled bundle with Bun's low-memory flag (--smol)
CMD ["bun", "--smol", "apps/server/dist/index.js"]
