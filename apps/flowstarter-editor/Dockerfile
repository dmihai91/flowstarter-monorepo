# Flowstarter Editor - Multi-stage Dockerfile
# Build: docker build -t flowstarter-editor .
# Run:   docker run -p 5173:5173 --env-file .env.local flowstarter-editor

ARG NODE_VERSION=20-alpine

# ============================================
# Base stage - shared dependencies
# ============================================
FROM node:${NODE_VERSION} AS base
WORKDIR /app
RUN npm install -g pnpm

# ============================================
# Dependencies stage - install all deps
# ============================================
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ============================================
# Development stage - with hot reload
# ============================================
FROM base AS development
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=development
ENV VITE_HMR_HOST=0.0.0.0
ENV CHOKIDAR_USEPOLLING=true

EXPOSE 5173

CMD ["pnpm", "run", "dev", "--host", "0.0.0.0"]

# ============================================
# Builder stage - build for production
# ============================================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
RUN pnpm run build

# ============================================
# Production stage - minimal runtime
# ============================================
FROM node:${NODE_VERSION} AS production
WORKDIR /app

RUN npm install -g pnpm

# Copy built assets and production deps only
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=5173

EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5173/health || exit 1

CMD ["pnpm", "run", "start"]
