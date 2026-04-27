#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Source of truth for the T3 server is the in-tree workspace at apps/t3-code.
# Override FLOWSTARTER_CODE_UPSTREAM_DIR to point at a sibling checkout.
T3_DIR="${FLOWSTARTER_CODE_UPSTREAM_DIR:-$ROOT_DIR/apps/t3-code}"
FLOWSTARTER_CODE_HOME="${FLOWSTARTER_CODE_HOME:-$ROOT_DIR/.local/flowstarter-code-home}"
FLOWSTARTER_CODE_HOST="${FLOWSTARTER_CODE_HOST:-127.0.0.1}"
BASE_SERVER_PORT=3774
BASE_WEB_PORT=5733
FLOWSTARTER_CODE_PORT="${FLOWSTARTER_CODE_PORT:-3774}"
FLOWSTARTER_CODE_AUTH_TOKEN="${FLOWSTARTER_CODE_AUTH_TOKEN:-}"

# ── Two modes this script can run in ────────────────────────────────────────
#
# This script powers the *personal flowstarter-code* on this Mac mini —
# Darius opening `code.flowstarter.dev` (or :3100 locally) to edit the
# monorepo directly. T3 is told to auto-bootstrap a project for the cwd.
#
# The *platform editor* (team/client mode, fronted by main's handoff) is
# a different deployment — see scripts/dev-platform-editor-host.sh (TODO).
# That one starts T3 *without* a monorepo bootstrap. Per-project workspaces
# are provisioned on demand from main's template+specs handoff or loaded
# by t3ProjectId looked up in Convex.
#
# Set FLOWSTARTER_CODE_BOOTSTRAP_MONOREPO=0 to skip the bootstrap even when
# running this script (e.g., dry-run / debugging).
FLOWSTARTER_CODE_PROJECT_DIR="${FLOWSTARTER_CODE_PROJECT_DIR:-$ROOT_DIR}"
FLOWSTARTER_CODE_BOOTSTRAP_MONOREPO="${FLOWSTARTER_CODE_BOOTSTRAP_MONOREPO:-1}"

PORT_OFFSET="$((FLOWSTARTER_CODE_PORT - BASE_SERVER_PORT))"
if [ "$PORT_OFFSET" -lt 0 ]; then
  echo "FLOWSTARTER_CODE_PORT must be >= $BASE_SERVER_PORT in dev mode." >&2
  exit 1
fi

FLOWSTARTER_CODE_WEB_PORT="${FLOWSTARTER_CODE_WEB_PORT:-$((BASE_WEB_PORT + PORT_OFFSET))}"
if [ "$FLOWSTARTER_CODE_WEB_PORT" -ne $((BASE_WEB_PORT + PORT_OFFSET)) ]; then
  echo "FLOWSTARTER_CODE_WEB_PORT must equal $((BASE_WEB_PORT + PORT_OFFSET)) when FLOWSTARTER_CODE_PORT=$FLOWSTARTER_CODE_PORT." >&2
  exit 1
fi

if [ ! -d "$T3_DIR/server" ]; then
  echo "T3 Code server source not found at $T3_DIR/server" >&2
  echo "Expected the workspace copy at apps/t3-code, or set" >&2
  echo "FLOWSTARTER_CODE_UPSTREAM_DIR to a sibling checkout." >&2
  exit 1
fi

mkdir -p "$FLOWSTARTER_CODE_HOME"

export T3CODE_HOME="$FLOWSTARTER_CODE_HOME"
export T3CODE_HOST="$FLOWSTARTER_CODE_HOST"
export T3CODE_PORT="$FLOWSTARTER_CODE_PORT"
export T3CODE_PORT_OFFSET="$PORT_OFFSET"
export T3CODE_NO_BROWSER=1

if [ "$FLOWSTARTER_CODE_BOOTSTRAP_MONOREPO" = "1" ]; then
  # Auto-create a project record for the working dir on startup. ONLY for
  # personal flowstarter-code mode — the platform editor must NOT bootstrap
  # the monorepo; its projects come from main's handoff or Convex lookup.
  export T3CODE_AUTO_BOOTSTRAP_PROJECT_FROM_CWD=1
fi

if [ -n "$FLOWSTARTER_CODE_AUTH_TOKEN" ]; then
  export T3CODE_AUTH_TOKEN="$FLOWSTARTER_CODE_AUTH_TOKEN"
fi

cat <<EOF
Starting T3 Code SERVER in dev mode
  t3 dir:       $T3_DIR/server
  T3CODE_HOME:  $T3CODE_HOME
  project dir:  $FLOWSTARTER_CODE_PROJECT_DIR
  ws server:    ws://$FLOWSTARTER_CODE_HOST:$FLOWSTARTER_CODE_PORT

(The Vite web client runs as a separate PM2 app: t3-code-web on port
 $FLOWSTARTER_CODE_WEB_PORT.)
EOF

# Seed the T3 bootstrap envelope via FD 3 when an auth token is set. The T3
# server reads a single JSON line containing `desktopBootstrapToken` and uses
# it as the seed the Next.js wrapper exchanges for an owner bearer session.
# FD 3 is inherited by the bun child below because there is no intermediate
# process manager (turbo/pnpm) between this script and the server.
if [ -n "${FLOWSTARTER_CODE_AUTH_TOKEN:-}" ]; then
  export T3CODE_BOOTSTRAP_FD=3
  exec 3< <(printf '{"desktopBootstrapToken":"%s"}\n' "$FLOWSTARTER_CODE_AUTH_TOKEN")
fi

# Run the T3 server with the *project directory* as its cwd so that
# T3CODE_AUTO_BOOTSTRAP_PROJECT_FROM_CWD bootstraps a project record for the
# actual codebase on this Mac mini (or whichever dir an override points at).
# We invoke bun on the absolute path to bin.ts rather than `bun run --cwd …
# dev`, because the latter would hand T3 the t3-code/server dir as its cwd.
cd "$FLOWSTARTER_CODE_PROJECT_DIR"
exec bun run "$T3_DIR/server/src/bin.ts"
