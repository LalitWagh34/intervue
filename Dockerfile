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

# Default production environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start server with Bun
CMD ["bun", "run", "--cwd", "apps/server", "src/index.ts"]
