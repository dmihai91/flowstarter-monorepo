# Flowstarter Assistant — single editor image.
#
# ONE image, ONE container. The entrypoint is the router/supervisor
# (apps/flowstarter-editor/router) which, per request, parses the
# workspace slug from the preserved Host and spawns/proxies to a
# per-workspace editor process (the editor is single-project-per-process
# — serverRuntimeStartup.ts:169-195). Caddy's DEPLOY_AGENT_EDITOR_UPSTREAM
# (= editor:3773) points here. See docs/EDITOR_DEPLOYMENT.md.
#
# Build context MUST be the monorepo root (pnpm workspace + catalogs):
#   docker build -f apps/flowstarter-editor/Dockerfile -t flowstarter-editor .
#
# The root .dockerignore already excludes node_modules/dist/.git, so the
# build is hermetic (everything compiled inside the image).

# ---------- build ----------------------------------------------------
FROM node:22-bookworm AS build
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
# corepack → pnpm 10 (matches repo); bun for the router (bun's installer
# needs `unzip`); build tools for node-pty's native addon.
RUN apt-get update \
  && apt-get install -y --no-install-recommends unzip \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable && corepack prepare pnpm@10.29.2 --activate \
  && npm i -g @anthropic-ai/claude-code \
  && curl -fsSL https://bun.sh/install | bash \
  && ln -s /root/.bun/bin/bun /usr/local/bin/bun
WORKDIR /app

# Whole monorepo (minus .dockerignore'd paths). Workspace + catalogs
# need the full set of package.json + lockfile to install correctly.
COPY . .

# Vite bakes import.meta.env.VITE_* at build time. Clerk publishable
# keys are public by design (the secret half is the server-side
# CLERK_SECRET_KEY), so receiving the publishable via a build-arg is the
# canonical pattern — supply with `--build-arg VITE_CLERK_PUBLISHABLE_KEY=…`.
ARG VITE_CLERK_PUBLISHABLE_KEY=""
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

RUN pnpm install --frozen-lockfile \
  && pnpm --filter @flowstarter/editor-web build \
  && pnpm --filter @flowstarter/editor-server build \
  # Bundle the web output where the server looks first
  # (config.ts:165 → <serverDist>/client).
  && cp -r apps/flowstarter-editor/web/dist \
        apps/flowstarter-editor/server/dist/client \
  # Router runs on bun; its only deps are @types/bun + typescript (dev).
  # Nothing to install for runtime — it's plain TS executed by bun.
  && bun --version

# ---------- runtime --------------------------------------------------
# Same Debian base (carries node-pty's compiled binding + glibc). We
# copy the whole built /app: the editor resolves sibling workspace
# packages through pnpm's symlinked store, so a partial node_modules
# copy would break those links. Image-size pruning is a later
# optimization (see docs/EDITOR_DEPLOYMENT.md "deferred").
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PATH=/usr/local/bin:$PATH \
    ROUTER_PORT=3773 \
    EDITOR_SERVER_ENTRY=/app/apps/flowstarter-editor/server/dist/bin.mjs \
    EDITOR_WORKSPACES_ROOT=/workspaces \
    EDITOR_STATE_ROOT=/state
RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates curl unzip \
  && rm -rf /var/lib/apt/lists/* \
  && npm i -g @anthropic-ai/claude-code \
  && curl -fsSL https://bun.sh/install | bash \
  && ln -s /root/.bun/bin/bun /usr/local/bin/bun

WORKDIR /app
COPY --from=build /app /app

# Per-workspace source checkouts + editor state (one subdir per slug).
VOLUME ["/workspaces", "/state"]
EXPOSE 3773

# Container healthcheck hits the router's slug-free probe.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3773/__router/health || exit 1

# The router/supervisor is PID 1 (handles SIGTERM → drains children).
ENTRYPOINT ["bun", "/app/apps/flowstarter-editor/router/src/index.ts"]
