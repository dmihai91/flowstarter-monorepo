#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# Source of truth for the T3 server is the in-tree workspace at apps/t3-code.
# Override with FLOWSTARTER_CODE_UPSTREAM_DIR to use a
# `.local/flowstarter-code-upstream` clone instead.
T3_DIR="${FLOWSTARTER_CODE_UPSTREAM_DIR:-$ROOT_DIR/apps/t3-code}"
FLOWSTARTER_CODE_HOME="${FLOWSTARTER_CODE_HOME:-$ROOT_DIR/.local/flowstarter-code-home}"
FLOWSTARTER_CODE_HOST="${FLOWSTARTER_CODE_HOST:-127.0.0.1}"
FLOWSTARTER_CODE_PORT="${FLOWSTARTER_CODE_PORT:-3774}"
FLOWSTARTER_CODE_AUTH_TOKEN="${FLOWSTARTER_CODE_AUTH_TOKEN:-}"

if [ ! -d "$T3_DIR" ]; then
  echo "T3 Code source not found at $T3_DIR" >&2
  echo "Expected the workspace copy at apps/t3-code, or set" >&2
  echo "FLOWSTARTER_CODE_UPSTREAM_DIR to a checkout and run" >&2
  echo "pnpm setup:flowstarter-code:host." >&2
  exit 1
fi

mkdir -p "$FLOWSTARTER_CODE_HOME"

export T3CODE_HOME="$FLOWSTARTER_CODE_HOME"
export T3CODE_HOST="$FLOWSTARTER_CODE_HOST"
export T3CODE_PORT="$FLOWSTARTER_CODE_PORT"
export T3CODE_NO_BROWSER=1

if [ -n "$FLOWSTARTER_CODE_AUTH_TOKEN" ]; then
  export T3CODE_AUTH_TOKEN="$FLOWSTARTER_CODE_AUTH_TOKEN"
fi

echo "Building Flowstarter Code (T3) host"
bun run --cwd "$T3_DIR" build

cat <<EOF
Starting Flowstarter Code in stable host mode
  t3 dir:       $T3_DIR
  T3CODE_HOME:  $T3CODE_HOME
  host URL:     http://$FLOWSTARTER_CODE_HOST:$FLOWSTARTER_CODE_PORT

This mode is the right target for a reverse proxy on the Mac mini.
EOF

# Seed the T3 bootstrap envelope via FD 3 when an auth token is set. The T3
# server reads a single JSON line containing `desktopBootstrapToken` and uses
# it as the seed the Next.js wrapper exchanges for an owner bearer session.
if [ -n "${FLOWSTARTER_CODE_AUTH_TOKEN:-}" ]; then
  export T3CODE_BOOTSTRAP_FD=3
  exec 3< <(printf '{"desktopBootstrapToken":"%s"}\n' "$FLOWSTARTER_CODE_AUTH_TOKEN")
fi

exec bun run --cwd "$T3_DIR" start
