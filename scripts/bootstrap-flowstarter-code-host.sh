#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UPSTREAM_DIR="${FLOWSTARTER_CODE_UPSTREAM_DIR:-$ROOT_DIR/.local/flowstarter-code-upstream}"
UPSTREAM_REPO="${FLOWSTARTER_CODE_UPSTREAM_REPO:-https://github.com/pingdotgg/t3code}"

if ! command -v git >/dev/null 2>&1; then
  echo "git is required to bootstrap Flowstarter Code." >&2
  exit 1
fi

if ! command -v bun >/dev/null 2>&1; then
  echo "bun is required to run the upstream T3 Code monorepo." >&2
  echo "Install Bun first: https://bun.sh" >&2
  exit 1
fi

mkdir -p "$(dirname "$UPSTREAM_DIR")"

if [ ! -d "$UPSTREAM_DIR/.git" ]; then
  echo "Cloning upstream T3 Code into $UPSTREAM_DIR"
  git clone "$UPSTREAM_REPO" "$UPSTREAM_DIR"
else
  echo "Updating upstream T3 Code in $UPSTREAM_DIR"
  git -C "$UPSTREAM_DIR" pull --ff-only
fi

echo "Installing upstream dependencies with Bun"
bun install --cwd "$UPSTREAM_DIR"

cat <<EOF

Flowstarter Code host bootstrap complete.

Upstream checkout: $UPSTREAM_DIR

Next steps:
  1. Start the local dev host:
     pnpm dev:flowstarter-code:host

  2. Point the shell app at the local web client:
     FLOWSTARTER_CODE_URL=http://localhost:5733

  3. For a stable single-port host behind Caddy:
     pnpm start:flowstarter-code:host

EOF
