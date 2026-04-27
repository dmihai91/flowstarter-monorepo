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

auth_header=( -H "Authorization: Bearer ${NETLIFY_AUTH_TOKEN}" )

echo "Looking up Netlify deploy for commit ${COMMIT_SHA} on site ${NETLIFY_SITE_ID}..."

# ── Sanity-check the SITE_ID up front ──────────────────────────────────────
# A wrong SITE_ID is the #1 cause of "no deploy yet" loops, so fail fast and
# print which site we're actually pointed at.
site_resp=$(curl -sS -w '\n%{http_code}' "${auth_header[@]}" \
  "${NETLIFY_API}/sites/${NETLIFY_SITE_ID}") || true
site_status=$(echo "$site_resp" | tail -n1)
site_body=$(echo "$site_resp" | sed '$d')

if [ "$site_status" != "200" ]; then
  echo "::error title=Netlify site lookup failed::HTTP ${site_status} from /sites/${NETLIFY_SITE_ID}"
  echo "Response body:"
  echo "$site_body" | head -c 500
  echo
  echo
  echo "Most likely causes:"
  echo "  - NETLIFY_SITE_ID secret is wrong (should be the site's API ID, not the site name)"
  echo "  - NETLIFY_AUTH_TOKEN secret is missing the 'sites:read' scope"
  echo "  - The token belongs to a Netlify account that doesn't have access to this site"
  exit 1
fi

site_name=$(echo "$site_body" | jq -r '.name // "unknown"')
site_repo=$(echo "$site_body" | jq -r '.build_settings.repo_url // "unset"')
site_branch=$(echo "$site_body" | jq -r '.build_settings.repo_branch // "unset"')
echo "  ↳ site: ${site_name}  (repo=${site_repo}, prod branch=${site_branch})"

deadline=$(( $(date +%s) + TIMEOUT_SECONDS ))
diagnostics_printed=0

while [ "$(date +%s)" -lt "$deadline" ]; do
  resp=$(curl -fsS "${auth_header[@]}" \
    "${NETLIFY_API}/sites/${NETLIFY_SITE_ID}/deploys?per_page=50" || true)

  if [ -z "$resp" ]; then
    echo "  …no response from Netlify API yet; retrying in ${POLL_INTERVAL}s"
    sleep "$POLL_INTERVAL"
    continue
  fi

  match=$(echo "$resp" | jq -r --arg sha "$COMMIT_SHA" \
    '[.[] | select(.commit_ref == $sha)] | sort_by(.created_at) | reverse | .[0] // empty')

  if [ -z "$match" ] || [ "$match" = "null" ]; then
    if [ "$diagnostics_printed" -eq 0 ]; then
      total=$(echo "$resp" | jq 'length')
      echo "  …no Netlify deploy yet for ${COMMIT_SHA}. Site has ${total} recent deploy(s). Most recent 5:"
      echo "$resp" | jq -r '
        sort_by(.created_at) | reverse | .[0:5][] |
        "    - \(.created_at)  state=\(.state)  branch=\(.branch // "?")  ctx=\(.context // "?")  ref=\(.commit_ref // "<none>")"
      '
      diagnostics_printed=1
    else
      echo "  …no Netlify deploy yet for ${COMMIT_SHA}; sleeping ${POLL_INTERVAL}s"
    fi
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

echo "::error title=Netlify deploy not found::Timed out after ${TIMEOUT_SECONDS}s waiting for deploy of ${COMMIT_SHA}"
echo "If the diagnostics above show no deploy with this commit_ref, check:"
echo "  - Netlify dashboard → Site settings → Build & deploy → Deploy Previews → enable for all PRs"
echo "  - Netlify dashboard → Site settings → Build & deploy → Continuous deployment → repo is connected"
exit 1
