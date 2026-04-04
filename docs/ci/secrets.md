# GitHub Actions — Required Secrets

Add all of these at: Settings → Secrets and variables → Actions

## Authentication & Auth Bypass

| Secret | Description | Where to get it |
|--------|-------------|-----------------|
| `E2E_SECRET` | Bypass token for `requireAuth()` in non-prod | Copy from `.env.local` — must match server |
| `E2E_USER_ID` | Clerk user ID for E2E test account | Clerk dashboard → Users → E2E test user |
| `HANDOFF_SECRET` | HMAC key for signing handoff tokens | Copy from `.env.local` `HANDOFF_SECRET` |
| `CLERK_SECRET_KEY` | Clerk backend secret key | Clerk dashboard → API Keys |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Clerk dashboard → API Keys |

## Supabase

| Secret | Description |
|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://avptvzherjxymmbtbbbr.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (real-build only) |

## Convex

| Secret | Description |
|--------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | `https://outstanding-otter-369.convex.cloud` |
| `CONVEX_SITE_URL` | `https://outstanding-otter-369.convex.site` |
| `CONVEX_DEPLOY_KEY` | Convex deploy key for CI |

## AI & Sandboxes

| Secret | Description |
|--------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key (used in real-build only) |
| `DAYTONA_API_KEY` | Daytona sandbox key (used in real-build only) |

## Deployment (Railway)

| Secret | Description |
|--------|-------------|
| `RAILWAY_TOKEN` | Railway service account token |
| `RAILWAY_PROJECT_ID` | Railway project ID |

## Notifications

| Secret | Description |
|--------|-------------|
| `SLACK_QA_WEBHOOK_URL` | Slack incoming webhook for QA channel (real-build failures) |

## Deployment URLs

| Secret | Description |
|--------|-------------|
| `E2E_BASE_URL` | Staging/preview URL for flowstarter-main (e.g. `https://staging.flowstarter.dev`) |

---

## Workflow → Secrets map

| Workflow | Secrets needed |
|----------|---------------|
| `quality-gate.yml` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `e2e-smoke.yml` | All auth + Supabase + Convex + `E2E_BASE_URL` |
| `e2e-real-build.yml` | Everything |
| `deploy-preview.yml` | `RAILWAY_TOKEN`, `RAILWAY_PROJECT_ID` |
