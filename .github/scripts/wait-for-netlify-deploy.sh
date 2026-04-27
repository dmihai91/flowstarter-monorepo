#!/usr/bin/env bash
###############################################################################
# wait-for-netlify-deploy.sh
#
# Polls Netlify's API to find the Deploy Preview / branch deploy that matches
# the current commit SHA, waits for it to reach state=ready, then writes its
# public URL to $GITHUB_OUTPUT as `url=<https://...>`.
#
# Required env:
#   NETLIFY_AUTH_TOKEN  — personal access token with read access to the site
#   NETLIFY_SITE_ID     — site UUID (Netlify → Site settings → API ID)
#   COMMIT_SHA          — the commit SHA to look up
#
# Optional env:
#   TIMEOUT_SECONDS     — total wait budget (default 600 = 10 min)
#   POLL_INTERVAL       — seconds between API polls (default 15)
#   NETLIFY_API         — base URL (default https://api.netlify.com/api/v1)
#
# Exit codes:
#   0  → deploy is ready, URL written to $GITHUB_OUTPUT
#   1  → unrecoverable error (deploy failed, missing env, timeout, etc.)
###############################################################################

set -euo pipefail

: "${NETLIFY_AUTH_TOKEN:?NETLIFY_AUTH_TOKEN is required}"
: "${NETLIFY_SITE_ID:?NETLIFY_SITE_ID is required}"
: "${COMMIT_SHA:?COMMIT_SHA is required}"

TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-600}"
POLL_INTERVAL="${POLL_INTERVAL:-15}"
NETLIFY_API="${NETLIFY_API:-https://api.netlify.com/api/v1}"

echo "Looking up Netlify deploy for commit ${COMMIT_SHA} on site ${NETLIFY_SITE_ID}..."

deadline=$(( $(date +%s) + TIMEOUT_SECONDS ))

while [ "$(date +%s)" -lt "$deadline" ]; do
  resp=$(curl -fsS \
    -H "Authorization: Bearer ${NETLIFY_AUTH_TOKEN}" \
    "${NETLIFY_API}/sites/${NETLIFY_SITE_ID}/deploys?per_page=50" || true)

  if [ -z "$resp" ]; then
    echo "  …no response from Netlify API yet; retrying in ${POLL_INTERVAL}s"
    sleep "$POLL_INTERVAL"
    continue
  fi

  match=$(echo "$resp" | jq -r --arg sha "$COMMIT_SHA" \
    '[.[] | select(.commit_ref == $sha)] | sort_by(.created_at) | reverse | .[0] // empty')

  if [ -z "$match" ] || [ "$match" = "null" ]; then
    echo "  …no Netlify deploy yet for ${COMMIT_SHA}; sleeping ${POLL_INTERVAL}s"
    sleep "$POLL_INTERVAL"
    continue
  fi

  state=$(echo "$match" | jq -r '.state')
  url=$(echo "$match" | jq -r '.deploy_ssl_url // .ssl_url // .deploy_url // empty')

  case "$state" in
    ready)
      if [ -z "$url" ]; then
        echo "Deploy is ready but no URL returned; payload:"
        echo "$match" | jq .
        exit 1
      fi
      echo "Deploy ready: ${url}"
      echo "url=${url}" >> "${GITHUB_OUTPUT:-/dev/stdout}"
      exit 0
      ;;
    error)
      err=$(echo "$match" | jq -r '.error_message // "unknown"')
      echo "Netlify deploy failed: ${err}"
      exit 1
      ;;
    *)
      echo "  …deploy state=${state}; sleeping ${POLL_INTERVAL}s"
      sleep "$POLL_INTERVAL"
      ;;
  esac
done

echo "Timed out after ${TIMEOUT_SECONDS}s waiting for Netlify deploy of ${COMMIT_SHA}"
exit 1
