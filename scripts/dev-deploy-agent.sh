#!/usr/bin/env bash
# Local deploy-agent, configured to agree with the Next app.
#
# The agent and flowstarter-main must present the same DEPLOY_AGENT_SHARED_SECRET
# or every deploy comes back 401, and the value lives in the app's .env.local
# (which is also what `scripts/seed-local-hosting.mjs` points the
# hosting_servers row at). Reading it here removes the one drift that makes the
# local deploy path fail for a reason nobody can see from either log.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/apps/flowstarter-main/.env.local"

if [[ -z "${DEPLOY_AGENT_SHARED_SECRET:-}" && -f "$ENV_FILE" ]]; then
  DEPLOY_AGENT_SHARED_SECRET="$(
    grep -E '^DEPLOY_AGENT_SHARED_SECRET=' "$ENV_FILE" | tail -n 1 |
      cut -d= -f2- | tr -d '"'"'"'' | tr -d '[:space:]'
  )"
fi

export DEPLOY_AGENT_SHARED_SECRET="${DEPLOY_AGENT_SHARED_SECRET:-dev-secret}"
export DEPLOY_AGENT_SITES_ROOT="${DEPLOY_AGENT_SITES_ROOT:-/tmp/fs-sites}"
export DEPLOY_AGENT_CADDY_SITES_DIR="${DEPLOY_AGENT_CADDY_SITES_DIR:-/tmp/fs-caddy-sites}"
# No Caddy on a laptop. The static server below is what actually serves.
export DEPLOY_AGENT_CADDY_RELOAD_CMD="${DEPLOY_AGENT_CADDY_RELOAD_CMD:-echo reloaded}"
export DEPLOY_AGENT_STATIC_PORT="${DEPLOY_AGENT_STATIC_PORT:-8788}"

exec pnpm --dir "$ROOT/apps/deploy-agent" dev
