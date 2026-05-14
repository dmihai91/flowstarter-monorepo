#!/usr/bin/env bash
# Local dev runner for the Flowstarter editor.
#
# Boots the editor pre-loaded with a "demo client site" so the agent
# has something real to work on. The demo's *seed* lives inside the
# monorepo (`apps/flowstarter-templates/demo-coach`) so it's versioned
# and code-reviewable, but the editor's *working copy* lives outside
# the monorepo at `~/flowstarter-editor-workspace/demo-coach` — that
# way the agent's commits, branches, and uncommitted edits never
# pollute the flowstarter-monorepo working tree.
#
# Pipeline:
#   1. If the working copy doesn't exist, copy from the seed, strip
#      .git + node_modules, init a fresh standalone git repo, and
#      `npm install`.
#   2. Build the editor web bundle (picks up UI changes).
#   3. Source the editor server's .env (T3CODE_PORT, T3CODE_HOME,
#      ANTHROPIC_API_KEY).
#   4. cd into the working copy so process.cwd() points there.
#   5. Start the editor server with --auto-bootstrap-project-from-cwd.
#
# Override knobs (env vars):
#   DEMO_PROJECT_DIR        Absolute path to working copy. Defaults to
#                           ~/flowstarter-editor-workspace/demo-coach.
#   DEMO_SEED_DIR           Absolute path to seed inside the monorepo.
#                           Defaults to demo-coach. Set to e.g.
#                           apps/flowstarter-templates/dorin-portfolio
#                           to bootstrap a different seed instead.
#   EDITOR_WORKSPACE_DIR    Parent dir for the working copy. Defaults
#                           to ~/flowstarter-editor-workspace.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EDITOR_DIR="$REPO_ROOT/apps/flowstarter-editor"
EDITOR_SERVER_DIR="$EDITOR_DIR/server"

WORKSPACE_BASE="${EDITOR_WORKSPACE_DIR:-$HOME/flowstarter-editor-workspace}"
SEED_DIR="${DEMO_SEED_DIR:-$REPO_ROOT/apps/flowstarter-templates/demo-coach}"
SEED_NAME="$(basename "$SEED_DIR")"
DEMO_PROJECT_DIR="${DEMO_PROJECT_DIR:-$WORKSPACE_BASE/$SEED_NAME}"

# ── Bootstrap working copy from seed ────────────────────────────────
if [ ! -d "$DEMO_PROJECT_DIR" ]; then
  if [ ! -d "$SEED_DIR" ]; then
    echo "✕ Seed dir not found: $SEED_DIR" >&2
    echo "  Set DEMO_SEED_DIR or restore the demo-coach template." >&2
    exit 1
  fi
  echo "▸ Bootstrapping working copy"
  echo "  seed:   $SEED_DIR"
  echo "  target: $DEMO_PROJECT_DIR"
  mkdir -p "$WORKSPACE_BASE"
  cp -R "$SEED_DIR" "$DEMO_PROJECT_DIR"
  # Strip everything that ties the working copy back to the monorepo
  # so its git history and dep tree are fully its own.
  rm -rf "$DEMO_PROJECT_DIR/.git"
  rm -rf "$DEMO_PROJECT_DIR/node_modules"
  rm -rf "$DEMO_PROJECT_DIR/.astro"
  rm -rf "$DEMO_PROJECT_DIR/dist"
  if command -v git >/dev/null 2>&1; then
    (
      cd "$DEMO_PROJECT_DIR"
      git init -q -b main
      git add .
      git -c user.email="editor@flowstarter.local" \
          -c user.name="Flowstarter Editor seed" \
          commit -q -m "chore: seed working copy from $SEED_NAME"
    )
    echo "  ✓ Initialised standalone git repo on 'main'"
  fi
fi

# ── Install demo project deps if missing ────────────────────────────
if [ ! -d "$DEMO_PROJECT_DIR/node_modules" ] && [ -f "$DEMO_PROJECT_DIR/package.json" ]; then
  echo "▸ Installing demo project deps (one-time)"
  (cd "$DEMO_PROJECT_DIR" && npm install --silent --no-audit --no-fund)
fi

# ── Build editor web bundle ─────────────────────────────────────────
# Initial build blocks so the editor server has a valid `web/dist/` to
# serve before it boots. Once that's done, a background `vite build
# --watch` (see start_web_bundle_watcher below) keeps `dist/` fresh on
# every source edit — a browser reload picks up the new bundle.
echo "▸ Building editor web bundle"
pnpm --dir "$EDITOR_DIR" build:web

# ── Source env files in priority order ─────────────────────────────
# The editor server's `envBootstrap.ts` normally walks up from CWD to
# find `apps/flowstarter-main/.env*`. With the demo project living
# OUTSIDE the monorepo, that walk-up can't reach the main app — so
# secrets like CLERK_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY don't get
# loaded and the editor renders "isn't wired up yet". Source them all
# here in priority order; later `source` calls override earlier ones,
# so the editor's own .env wins for editor-specific tokens.
MAIN_APP_DIR="$REPO_ROOT/apps/flowstarter-main"
echo "▸ Loading env (main → main.local → editor)"
set -a
[ -f "$MAIN_APP_DIR/.env" ]            && { echo "  · $MAIN_APP_DIR/.env";       source "$MAIN_APP_DIR/.env"; }
[ -f "$MAIN_APP_DIR/.env.local" ]      && { echo "  · $MAIN_APP_DIR/.env.local"; source "$MAIN_APP_DIR/.env.local"; }
[ -f "$EDITOR_SERVER_DIR/.env" ]       && { echo "  · $EDITOR_SERVER_DIR/.env";  source "$EDITOR_SERVER_DIR/.env"; }
set +a

# ── Start web bundle watcher in the background ─────────────────────
# Keeps `apps/flowstarter-editor/web/dist/` fresh as we edit web source.
# The editor server still serves the static bundle — there's no Vite
# HMR — so the workflow is: save → bundle rebuilds → reload the tab.
WEB_WATCH_PID=""
WEB_WATCH_LOG="$EDITOR_DIR/web/.build-watch.log"

start_web_bundle_watcher() {
  echo "▸ Starting web bundle watcher (logs → $WEB_WATCH_LOG)"
  (pnpm --dir "$EDITOR_DIR" build:web:watch) > "$WEB_WATCH_LOG" 2>&1 &
  WEB_WATCH_PID=$!
  echo "  pid: $WEB_WATCH_PID"
}

stop_web_bundle_watcher() {
  if [ -n "$WEB_WATCH_PID" ] && kill -0 "$WEB_WATCH_PID" 2>/dev/null; then
    echo "▸ Stopping web bundle watcher (pid $WEB_WATCH_PID)"
    kill -- -"$WEB_WATCH_PID" 2>/dev/null || kill "$WEB_WATCH_PID" 2>/dev/null || true
    wait "$WEB_WATCH_PID" 2>/dev/null || true
  fi
}

# ── Start demo project's own dev server in the background ───────────
# So `pnpm dev:editor` is one command that brings up both:
#   - editor (foreground, port 5773)
#   - demo project (background, default port 4322)
# The editor's "Preview" button opens the demo's dev URL in a new tab,
# and the agent's edits to the demo source hot-reload there.
DEMO_DEV_PID=""
DEMO_DEV_LOG="$DEMO_PROJECT_DIR/.dev-server.log"

start_demo_dev_server() {
  if [ ! -f "$DEMO_PROJECT_DIR/package.json" ]; then
    echo "▸ Demo has no package.json — skipping its dev server"
    return
  fi
  if ! grep -q '"dev"' "$DEMO_PROJECT_DIR/package.json"; then
    echo "▸ Demo has no \"dev\" script — skipping its dev server"
    return
  fi
  echo "▸ Starting demo dev server (logs → $DEMO_DEV_LOG)"
  (cd "$DEMO_PROJECT_DIR" && npm run dev) > "$DEMO_DEV_LOG" 2>&1 &
  DEMO_DEV_PID=$!
  echo "  pid: $DEMO_DEV_PID"
}

stop_demo_dev_server() {
  if [ -n "$DEMO_DEV_PID" ] && kill -0 "$DEMO_DEV_PID" 2>/dev/null; then
    echo ""
    echo "▸ Stopping demo dev server (pid $DEMO_DEV_PID)"
    # Kill the process group so child processes (e.g. astro under npm)
    # don't survive as orphans holding the demo's port.
    kill -- -"$DEMO_DEV_PID" 2>/dev/null || kill "$DEMO_DEV_PID" 2>/dev/null || true
    wait "$DEMO_DEV_PID" 2>/dev/null || true
  fi
}

# Make sure both background workers die with the editor — both on
# clean Ctrl-C and on script exit for any other reason.
cleanup_background_workers() {
  stop_demo_dev_server
  stop_web_bundle_watcher
}
trap cleanup_background_workers EXIT INT TERM

start_web_bundle_watcher
start_demo_dev_server

echo "▸ Demo project: $DEMO_PROJECT_DIR"
cd "$DEMO_PROJECT_DIR"

echo "▸ Booting editor on :${T3CODE_PORT:-3773} (T3CODE_HOME=${T3CODE_HOME:-~/.t3})"
# Foreground the editor. When it exits, the trap above tears the demo
# dev server down. Using `exec` would replace the shell and skip the
# trap, so we run it as a regular command instead.
bun run "$EDITOR_SERVER_DIR/src/bin.ts" --auto-bootstrap-project-from-cwd
