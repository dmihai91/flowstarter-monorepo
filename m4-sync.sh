#!/bin/bash
# Sync local changes to M4 Mac mini and optionally run a command
# Usage:
#   ./m4-sync.sh              # just sync
#   ./m4-sync.sh build        # sync + build
#   ./m4-sync.sh test         # sync + run tests
#   ./m4-sync.sh dev          # sync + start dev server
#   ./m4-sync.sh cmd "..."    # sync + run arbitrary command

set -e

M4_HOST="m4"
M4_DIR="/Users/darius91/flowstarter-monorepo"
LOCAL_DIR="/Users/dmpopescu/flowstarter-monorepo"
M4_ENV='export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; nvm use 22 > /dev/null 2>&1'

# Sync (exclude heavy/local-only dirs)
echo "⟳ Syncing to M4..."
rsync -az --delete \
  --exclude 'node_modules' \
  --exclude '.env*' \
  --exclude '.next' \
  --exclude 'dist' \
  --exclude 'preview-dist' \
  --exclude '.convex' \
  --exclude '.turbo' \
  --exclude '.nx' \
  --exclude 'test-results' \
  --exclude '.git' \
  "$LOCAL_DIR/" "$M4_HOST:$M4_DIR/"

echo "✓ Synced"

# Push current branch to M4 git and reset to match M2
CURRENT_BRANCH=$(git -C "$LOCAL_DIR" rev-parse --abbrev-ref HEAD)
CURRENT_SHA=$(git -C "$LOCAL_DIR" rev-parse HEAD)
echo "⟳ Syncing M4 git to $CURRENT_SHA..."
git -C "$LOCAL_DIR" push m4-repo "$CURRENT_BRANCH" --force-with-lease 2>/dev/null || true
ssh "$M4_HOST" "cd $M4_DIR && git reset --hard $CURRENT_SHA 2>/dev/null || true" > /dev/null
echo "✓ M4 git synced ($CURRENT_SHA)"

# Run command if specified
case "${1:-}" in
  build)
    echo "🔨 Building on M4..."
    ssh "$M4_HOST" "$M4_ENV; cd $M4_DIR && pnpm build:all"
    ;;
  test)
    shift
    echo "🧪 Running tests on M4..."
    ssh "$M4_HOST" "$M4_ENV; cd $M4_DIR && ${*:-pnpm test}"
    ;;
  dev)
    echo "🚀 Starting dev server on M4..."
    echo "   Editor: http://192.168.3.210:5173"
    echo "   Main:   http://192.168.3.210:3000"
    ssh "$M4_HOST" "$M4_ENV; cd $M4_DIR && pnpm dev"
    ;;
  cmd)
    shift
    echo "⚡ Running on M4: $*"
    ssh "$M4_HOST" "$M4_ENV; cd $M4_DIR && $*"
    ;;
  "")
    echo "  Usage: ./m4-sync.sh [build|test|dev|cmd \"...\"]"
    ;;
esac
