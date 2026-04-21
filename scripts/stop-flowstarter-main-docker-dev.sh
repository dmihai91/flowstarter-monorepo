#!/bin/bash
set -euo pipefail

REPO="/Users/darius91/flowstarter-monorepo"
COMPOSE_FILE="$REPO/docker-compose.flowstarter-main-dev.yml"
DOCKER_BIN="/usr/local/bin/docker"

cd "$REPO"
exec "$DOCKER_BIN" compose -f "$COMPOSE_FILE" down
