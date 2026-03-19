#!/bin/bash
# Build all (or one) FlowStarter templates to preview-dist/
# Usage: ./build-previews.sh [slug]   — build one
#        ./build-previews.sh          — build all

set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATES="$DIR/templates"
DIST="$DIR/preview-dist"

ALL_SLUGS=(
  therapist-care fitness-coach coach-pro academic-tutor
  coding-bootcamp edu-course-creator language-teacher music-teacher
  workshop-host beauty-stylist creative-portfolio wellness-holistic
)

if [ -n "$1" ]; then
  SLUGS=("$1")
else
  SLUGS=("${ALL_SLUGS[@]}")
fi

mkdir -p "$DIST/templates"

total=${#SLUGS[@]}
i=0
for slug in "${SLUGS[@]}"; do
  i=$((i+1))
  template_dir="$TEMPLATES/$slug"
  if [ ! -d "$template_dir" ]; then
    echo "[$i/$total] SKIP $slug (not found)"
    continue
  fi
  echo "[$i/$total] Building $slug..."
  cd "$template_dir"
  # Source nvm if needed
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
  pnpm build 2>&1 | tail -3
  echo "  ✓ $slug → preview-dist/templates/$slug/"
done

echo ""
echo "Done. Built ${#SLUGS[@]} template(s)."
echo "Start server: node $DIR/preview-server.js"
