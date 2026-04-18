#!/usr/bin/env bash
set -euo pipefail

# Launches the embedded T3 Code server used by `flowstarter-code dev:all`.
# Pipes the shared seed into the server via the bootstrap envelope FD so the
# wrapper's auth bridge can exchange it for an owner bearer session.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UPSTREAM_DIR="${FLOWSTARTER_CODE_UPSTREAM_DIR:-$ROOT_DIR/.local/flowstarter-code-upstream}"
SEED_TOKEN="${T3CODE_AUTH_TOKEN:-flowstarter-dev-token}"

export T3CODE_AUTH_TOKEN="$SEED_TOKEN"
export T3CODE_AUTO_BOOTSTRAP_PROJECT_FROM_CWD=1
export T3CODE_BOOTSTRAP_FD=3

exec 3< <(printf '{"desktopBootstrapToken":"%s"}\n' "$SEED_TOKEN")
exec bun run "$UPSTREAM_DIR/apps/server/src/bin.ts"
