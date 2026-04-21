#!/bin/bash
set -euo pipefail

REPO="/Users/darius91/flowstarter-monorepo"
COMPOSE_FILE="$REPO/docker-compose.flowstarter-main-dev.yml"
DOCKER_BIN="/usr/local/bin/docker"

cd "$REPO"

open -a Docker >/dev/null 2>&1 || true

for _ in {1..60}; do
  if "$DOCKER_BIN" info >/dev/null 2>&1; then
    exec "$DOCKER_BIN" compose -f "$COMPOSE_FILE" up -d --build
  fi
  sleep 5
done

echo "Docker daemon did not become ready in time" >&2
exit 1
