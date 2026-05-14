#!/usr/bin/env bash
# HMR variant of dev-editor.sh.
#
# Runs three processes:
#   - demo dev server (background, default Astro :4322)
#   - editor server   (background, :5773 / T3CODE_PORT)
#   - Vite dev server (foreground, :5733) — the page you load in the
#     browser, with full module-level HMR
#
# Vite's dev server proxies `/api/*`, `/attachments/*`, `/.well-known/*`
# and `/ws` to the editor server (see `web/vite.config.ts` proxy block)
# so cookies + RPC sockets behave as if they shared an origin. The auth
# flows that read `currentSlug` from `Host` won't see a workspace slug
# in this mode (you're on plain `localhost`), so multi-tenant behaviour
# is still tested with the non-HMR `dev-editor.sh` flow.
#
# Override knobs (env vars):
#   DEMO_PROJECT_DIR        Absolute path to working copy. Same default
#                           as dev-editor.sh.
#   DEMO_SEED_DIR           Seed dir inside the monorepo.
#   EDITOR_WORKSPACE_DIR    Parent dir for the working copy.
#   VITE_PORT               Override Vite dev port (default 5733).
#   HOST                    Bind interface (default 0.0.0.0).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EDITOR_DIR="$REPO_ROOT/apps/flowstarter-editor"
EDITOR_SERVER_DIR="$EDITOR_DIR/server"
EDITOR_WEB_DIR="$EDITOR_DIR/web"

WORKSPACE_BASE="${EDITOR_WORKSPACE_DIR:-$HOME/flowstarter-editor-workspace}"
SEED_DIR="${DEMO_SEED_DIR:-$REPO_ROOT/apps/flowstarter-templates/demo-coach}"
SEED_NAME="$(basename "$SEED_DIR")"
DEMO_PROJECT_DIR="${DEMO_PROJECT_DIR:-$WORKSPACE_BASE/$SEED_NAME}"

# ── Bootstrap working copy from seed (mirrors dev-editor.sh) ────────
if [ ! -d "$DEMO_PROJECT_DIR" ]; then
  if [ ! -d "$SEED_DIR" ]; then
    echo "✕ Seed dir not found: $SEED_DIR" >&2
    exit 1
  fi
  echo "▸ Bootstrapping working copy"
  echo "  seed:   $SEED_DIR"
  echo "  target: $DEMO_PROJECT_DIR"
  mkdir -p "$WORKSPACE_BASE"
  cp -R "$SEED_DIR" "$DEMO_PROJECT_DIR"
  rm -rf "$DEMO_PROJECT_DIR/.git" \
         "$DEMO_PROJECT_DIR/node_modules" \
         "$DEMO_PROJECT_DIR/.astro" \
         "$DEMO_PROJECT_DIR/dist"
  if command -v git >/dev/null 2>&1; then
    (
      cd "$DEMO_PROJECT_DIR"
      git init -q -b main
      git add .
      git -c user.email="editor@flowstarter.local" \
          -c user.name="Flowstarter Editor seed" \
          commit -q -m "chore: seed working copy from $SEED_NAME"
    )
  fi
fi

if [ ! -d "$DEMO_PROJECT_DIR/node_modules" ] && [ -f "$DEMO_PROJECT_DIR/package.json" ]; then
  echo "▸ Installing demo project deps (one-time)"
  (cd "$DEMO_PROJECT_DIR" && npm install --silent --no-audit --no-fund)
fi

# ── Source env files (main → main.local → editor) ──────────────────
MAIN_APP_DIR="$REPO_ROOT/apps/flowstarter-main"
echo "▸ Loading env (main → main.local → editor)"
set -a
[ -f "$MAIN_APP_DIR/.env" ]            && { echo "  · $MAIN_APP_DIR/.env";       source "$MAIN_APP_DIR/.env"; }
[ -f "$MAIN_APP_DIR/.env.local" ]      && { echo "  · $MAIN_APP_DIR/.env.local"; source "$MAIN_APP_DIR/.env.local"; }
[ -f "$EDITOR_SERVER_DIR/.env" ]       && { echo "  · $EDITOR_SERVER_DIR/.env";  source "$EDITOR_SERVER_DIR/.env"; }
set +a

# Vite's dev server is the page the browser loads. The proxy block in
# `web/vite.config.ts` forwards `/api`, `/attachments`, `/.well-known`
# and `/ws` to the editor server — so leave VITE_HTTP_URL / VITE_WS_URL
# empty here. The Web client falls back to same-origin when both are
# unset (see `web/src/environments/primary/target.ts`).
unset VITE_HTTP_URL VITE_WS_URL

# ── Demo dev server (background) ────────────────────────────────────
DEMO_DEV_PID=""
DEMO_DEV_LOG="$DEMO_PROJECT_DIR/.dev-server.log"
EDITOR_SERVER_PID=""
EDITOR_SERVER_LOG="$EDITOR_SERVER_DIR/.dev-server.log"

start_demo_dev_server() {
  if [ ! -f "$DEMO_PROJECT_DIR/package.json" ] || ! grep -q '"dev"' "$DEMO_PROJECT_DIR/package.json"; then
    echo "▸ Demo has no dev script — skipping"
    return
  fi
  echo "▸ Starting demo dev server (logs → $DEMO_DEV_LOG)"
  (cd "$DEMO_PROJECT_DIR" && npm run dev) > "$DEMO_DEV_LOG" 2>&1 &
  DEMO_DEV_PID=$!
  echo "  pid: $DEMO_DEV_PID"
}

start_editor_server() {
  echo "▸ Starting editor server on :${T3CODE_PORT:-5773} (logs → $EDITOR_SERVER_LOG)"
  (cd "$DEMO_PROJECT_DIR" && bun run "$EDITOR_SERVER_DIR/src/bin.ts" --auto-bootstrap-project-from-cwd) > "$EDITOR_SERVER_LOG" 2>&1 &
  EDITOR_SERVER_PID=$!
  echo "  pid: $EDITOR_SERVER_PID"
}

stop_background_workers() {
  echo ""
  if [ -n "$EDITOR_SERVER_PID" ] && kill -0 "$EDITOR_SERVER_PID" 2>/dev/null; then
    echo "▸ Stopping editor server (pid $EDITOR_SERVER_PID)"
    kill -- -"$EDITOR_SERVER_PID" 2>/dev/null || kill "$EDITOR_SERVER_PID" 2>/dev/null || true
    wait "$EDITOR_SERVER_PID" 2>/dev/null || true
  fi
  if [ -n "$DEMO_DEV_PID" ] && kill -0 "$DEMO_DEV_PID" 2>/dev/null; then
    echo "▸ Stopping demo dev server (pid $DEMO_DEV_PID)"
    kill -- -"$DEMO_DEV_PID" 2>/dev/null || kill "$DEMO_DEV_PID" 2>/dev/null || true
    wait "$DEMO_DEV_PID" 2>/dev/null || true
  fi
}

trap stop_background_workers EXIT INT TERM

start_demo_dev_server
start_editor_server

# Wait briefly for the editor server to bind its port so the Vite
# proxy's first `/api/*` request doesn't 502.
for _ in 1 2 3 4 5 6 7 8 9 10; do
  if nc -z localhost "${T3CODE_PORT:-5773}" 2>/dev/null; then
    echo "▸ Editor server is listening on :${T3CODE_PORT:-5773}"
    break
  fi
  sleep 0.5
done

VITE_PORT="${VITE_PORT:-5733}"
echo "▸ Starting Vite dev (HMR) on http://localhost:${VITE_PORT}"
echo "  Open: http://localhost:${VITE_PORT}/"
cd "$EDITOR_WEB_DIR"
exec pnpm run dev
