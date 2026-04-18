#!/usr/bin/env bash
# Runs the T3 Vite web client (apps/flowstarter-editor/t3/web). Paired with
# scripts/dev-flowstarter-code-host.sh, which runs the T3 server.
# Split into two scripts so each can be PM2-managed independently; the server
# needs FD 3 for its bootstrap envelope and the web does not.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
T3_DIR="${FLOWSTARTER_CODE_UPSTREAM_DIR:-$ROOT_DIR/apps/flowstarter-editor/t3}"
FLOWSTARTER_CODE_HOST="${FLOWSTARTER_CODE_HOST:-127.0.0.1}"
BASE_SERVER_PORT=3774
BASE_WEB_PORT=5733
FLOWSTARTER_CODE_PORT="${FLOWSTARTER_CODE_PORT:-3774}"

PORT_OFFSET="$((FLOWSTARTER_CODE_PORT - BASE_SERVER_PORT))"
if [ "$PORT_OFFSET" -lt 0 ]; then
  echo "FLOWSTARTER_CODE_PORT must be >= $BASE_SERVER_PORT." >&2
  exit 1
fi
FLOWSTARTER_CODE_WEB_PORT="${FLOWSTARTER_CODE_WEB_PORT:-$((BASE_WEB_PORT + PORT_OFFSET))}"

if [ ! -d "$T3_DIR/web" ]; then
  echo "T3 web source not found at $T3_DIR/web" >&2
  exit 1
fi

export T3CODE_PORT="$FLOWSTARTER_CODE_PORT"
export T3CODE_PORT_OFFSET="$PORT_OFFSET"
export PORT="$FLOWSTARTER_CODE_WEB_PORT"
export VITE_DEV_SERVER_URL="http://$FLOWSTARTER_CODE_HOST:$FLOWSTARTER_CODE_WEB_PORT"

cat <<EOF
Starting T3 Code WEB (Vite) in dev mode
  web dir:   $T3_DIR/web
  web URL:   http://$FLOWSTARTER_CODE_HOST:$FLOWSTARTER_CODE_WEB_PORT
  server:    ws://$FLOWSTARTER_CODE_HOST:$FLOWSTARTER_CODE_PORT (separate process)
EOF

exec bun run --cwd "$T3_DIR/web" dev
