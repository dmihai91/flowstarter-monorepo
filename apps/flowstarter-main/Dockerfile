# Flowstarter Main (Marketing Site) - Multi-stage Dockerfile
# Build: docker build -t flowstarter-main .
# Run:   docker run -p 3000:3000 --env-file .env.local flowstarter-main

ARG NODE_VERSION=20-alpine

# ============================================
# Base stage
# ============================================
FROM node:${NODE_VERSION} AS base
WORKDIR /app
RUN npm install -g pnpm

# ============================================
# Dependencies stage
# ============================================
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

# ============================================
# Development stage
# ============================================
FROM base AS development
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=development
ENV PORT=3000

EXPOSE 3000

CMD ["pnpm", "run", "dev"]

# ============================================
# Builder stage
# ============================================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for Next.js
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm run build

# ============================================
# Production stage - standalone Next.js
# ============================================
FROM node:${NODE_VERSION} AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
