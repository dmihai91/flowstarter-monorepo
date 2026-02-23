#!/bin/bash

# Setup local dev domains for Flowstarter
# Maps flowstarter.dev and editor.flowstarter.dev to localhost
#
# Usage: sudo ./scripts/setup-local-domains.sh

HOSTS_FILE="/etc/hosts"
DOMAINS=(
  "127.0.0.1 flowstarter.dev"
  "127.0.0.1 editor.flowstarter.dev"
  "127.0.0.1 api.flowstarter.dev"
)

echo "🔧 Setting up local dev domains for Flowstarter..."
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run with sudo: sudo $0"
  exit 1
fi

# Backup hosts file
cp "$HOSTS_FILE" "$HOSTS_FILE.backup.$(date +%Y%m%d%H%M%S)"
echo "✅ Backed up $HOSTS_FILE"

# Add domains if not already present
for domain in "${DOMAINS[@]}"; do
  if grep -q "$domain" "$HOSTS_FILE"; then
    echo "⏭️  Already exists: $domain"
  else
    echo "$domain" >> "$HOSTS_FILE"
    echo "✅ Added: $domain"
  fi
done

echo ""
echo "🎉 Done! Local dev domains configured:"
echo "   - https://flowstarter.dev → localhost:3000"
echo "   - https://editor.flowstarter.dev → localhost:5175"
echo ""
echo "📝 Notes:"
echo "   - You may need to flush DNS: sudo dscacheutil -flushcache"
echo "   - For HTTPS, use mkcert to generate local SSL certs"
echo "   - Or use HTTP for local development"
