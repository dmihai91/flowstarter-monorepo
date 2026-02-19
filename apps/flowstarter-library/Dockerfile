# Flowstarter Library (MCP Server) - Multi-stage Dockerfile
# Build: docker build -t flowstarter-library .
# Run:   docker run -p 3001:3001 flowstarter-library

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
ENV PORT=3001

EXPOSE 3001

CMD ["pnpm", "run", "dev"]

# ============================================
# Builder stage
# ============================================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
RUN pnpm run build || echo "No build script, using source"

# ============================================
# Production stage
# ============================================
FROM node:${NODE_VERSION} AS production
WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app/dist ./dist 2>/dev/null || true
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy templates
COPY --from=builder /app/templates ./templates 2>/dev/null || true

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["pnpm", "run", "start"]
