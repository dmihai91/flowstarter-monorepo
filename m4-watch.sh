#!/bin/bash
REPO="/Users/dmpopescu/flowstarter-monorepo"
DEBOUNCE=1
echo "👀 Watching → auto-syncing to M4... (Ctrl+C to stop)"
last_sync=0
fswatch -r --exclude ".git" --exclude "node_modules" --exclude ".next" --exclude "dist" --exclude ".turbo" --exclude "*.log" -l 0.5 "$REPO" | while read -r event; do
  now=$(date +%s)
  if (( now - last_sync >= DEBOUNCE )); then
    last_sync=$now
    echo "⟳ $(date '+%H:%M:%S') syncing..."
    rsync -az --delete --exclude 'node_modules' --exclude '.git' --exclude '.next' --exclude 'dist' --exclude '.turbo' --exclude '*.log' "$REPO/" m4:/Users/darius91/flowstarter-monorepo/ 2>/dev/null && echo "✓ Synced" || echo "⚠ Sync failed"
  fi
done
