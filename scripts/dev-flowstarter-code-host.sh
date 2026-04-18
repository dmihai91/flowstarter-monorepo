#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Source of truth for the T3 server is the in-tree workspace at
# apps/flowstarter-editor/t3 (that is where it is committed in git on this
# branch). A previous iteration moved it to apps/t3-code but that move was
# reverted by an external git reset, so we point back at the committed path.
# Override with FLOWSTARTER_CODE_UPSTREAM_DIR to fall back to a
# `.local/flowstarter-code-upstream` clone created by
# scripts/bootstrap-flowstarter-code-host.sh.
T3_DIR="${FLOWSTARTER_CODE_UPSTREAM_DIR:-$ROOT_DIR/apps/flowstarter-editor/t3}"
FLOWSTARTER_CODE_HOME="${FLOWSTARTER_CODE_HOME:-$ROOT_DIR/.local/flowstarter-code-home}"
FLOWSTARTER_CODE_HOST="${FLOWSTARTER_CODE_HOST:-127.0.0.1}"
BASE_SERVER_PORT=3774
BASE_WEB_PORT=5733
FLOWSTARTER_CODE_PORT="${FLOWSTARTER_CODE_PORT:-3774}"
FLOWSTARTER_CODE_AUTH_TOKEN="${FLOWSTARTER_CODE_AUTH_TOKEN:-}"

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
  echo "Expected the workspace copy at apps/flowstarter-editor/t3, or set" >&2
  echo "FLOWSTARTER_CODE_UPSTREAM_DIR to a checkout and run" >&2
  echo "pnpm setup:flowstarter-code:host." >&2
  exit 1
fi

mkdir -p "$FLOWSTARTER_CODE_HOME"

export T3CODE_HOME="$FLOWSTARTER_CODE_HOME"
export T3CODE_HOST="$FLOWSTARTER_CODE_HOST"
export T3CODE_PORT="$FLOWSTARTER_CODE_PORT"
export T3CODE_PORT_OFFSET="$PORT_OFFSET"
export T3CODE_NO_BROWSER=1

if [ -n "$FLOWSTARTER_CODE_AUTH_TOKEN" ]; then
  export T3CODE_AUTH_TOKEN="$FLOWSTARTER_CODE_AUTH_TOKEN"
fi

cat <<EOF
Starting T3 Code SERVER in dev mode
  t3 dir:       $T3_DIR/server
  T3CODE_HOME:  $T3CODE_HOME
  ws server:    ws://$FLOWSTARTER_CODE_HOST:$FLOWSTARTER_CODE_PORT

(The Vite web client runs as a separate PM2 app: t3-code-web on port
 $FLOWSTARTER_CODE_WEB_PORT. Set FLOWSTARTER_CODE_URL=http://localhost:$FLOWSTARTER_CODE_WEB_PORT
 in apps/flowstarter-code/.env.local to point the shell at it.)
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

exec bun run --cwd "$T3_DIR/server" dev
