#!/bin/bash
set -euo pipefail

cd /workspace

if [[ ! -f package.json || ! -f pnpm-workspace.yaml ]]; then
  echo "Flowstarter monorepo not mounted at /workspace"
  exit 1
fi

mkdir -p /pnpm/store
pnpm config set store-dir /pnpm/store >/dev/null 2>&1 || true

export CI=true
pnpm install --frozen-lockfile=false

cd apps/flowstarter-main

exec pnpm exec next dev -H 0.0.0.0 -p "${FLOWSTARTER_MAIN_PORT:-3000}"
