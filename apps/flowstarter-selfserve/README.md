# Flowstarter Self-Serve v1

The "I already have a business" funnel: **describe business → free demo (hero
visible, rest blurred) → €50 build fee → live agent build → preview → €149
delivery (Launch + €39/mo, or Code-only) / walk away with a brand-kit PDF.**

Design ported from the Claude Design handoff bundle (`flowstarter/` at repo
root): studio/midnight themes, General Sans/Inter/JetBrains Mono, agent crew
(Vera/Iris/Quinn/Dash), build-feed theater, fade-up animations, reduced motion.

## Stack

| Concern | Tech |
| --- | --- |
| App | Next.js (App Router) + Tailwind 4, port 3200 |
| Auth | Clerk (account/email gate before demo) |
| Main DB | Supabase (`selfserve_*` tables, service-role only; in-memory fallback in keyless dev) |
| Live agent state | Convex (`convex/` — build feed, progress, task graph; HTTP-polling fallback when unset) |
| One-time payments | Stripe Checkout (€50 build fee, €149 delivery) — mock flow when keyless |
| Subscription | **Clerk Billing** plan (default slug `hosting`, €39/mo — hosting on Hetzner + domain + AI edits) |
| Analytics | PostHog (no-op when keyless) |
| Build engine | `@flowstarter/build-engine` contract; `BUILD_ENGINE_MODE=mock\|orchestrator` |
| Orchestrator | `@flowstarter/build-orchestrator` — brain plan → agent waves (Cursor SDK) → validate |

## Run it (pure mock mode)

Only Clerk keys are required; everything else falls back to mocks
(in-memory store, mock payments, mock engine, console emails).

```bash
# apps/flowstarter-selfserve/.env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

pnpm --dir apps/flowstarter-selfserve dev   # http://localhost:3200
```

Failure-path test markers (put them in the business description):
`[fail]` every attempt fails → terminal failure, auto-refund + apology email path;
`[fail-once]` first attempt fails, retry succeeds; `[slow]` build hangs → watchdog path.

## Environment

| Var | Purpose (default) |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Clerk auth (required) |
| `CLERK_HOSTING_PLAN_SLUG` | Clerk Billing plan slug (`hosting`) — create in Clerk Dashboard → Billing → User plans, €39/mo |
| `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase main DB (else in-memory store) |
| `NEXT_PUBLIC_CONVEX_URL` | Convex live state (else polling). Run `npx convex dev` in this app dir |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe Checkout + webhook (else mock payments) |
| `SELFSERVE_BUILD_FEE_CENTS` / `SELFSERVE_FINAL_FEE_CENTS` / `SELFSERVE_MONTHLY_CENTS` | Amounts (5000 / 14900 / 3900) |
| `BUILD_ENGINE_MODE` | `mock` (default) or `orchestrator` |
| `BUILD_AGENT_ADAPTER` | `mock` (default) or `cursor` (needs Cursor CLI + `CURSOR_API_KEY`) |
| `BUILD_SANDBOX` | `local` (default) or `daytona` (TODO — falls back to local) |
| `OPENROUTER_API_KEY` | Demo model + orchestrator brain (else deterministic fallbacks) |
| `SELFSERVE_DEMO_MODEL` / `BUILD_BRAIN_MODEL` | Cheap demo model / strong brain model (guardrail: never the same) |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | PostHog |
| `RESEND_API_KEY` / `EMAIL_FROM` | Transactional email (else console) — TODO(placeholder) pick provider |
| `ADMIN_ALERT_WEBHOOK_URL` / `ADMIN_ALERT_EMAIL` | Internal failure alerts |
| `WATCHDOG_SECRET` | Token for `/api/internal/watchdog` (cron it every ~15min) |
| `CONTACT_EMAIL` | "Need something custom? Email us" target |

## Build engine contract

- `POST /api/builds` `{ businessDescription, refinements[], projectId? }` → `{ buildId }` (402 until the build fee is paid)
- `GET /api/builds/[id]` — status/feed snapshot · `GET /api/builds/[id]/stream` — SSE
- Convex (`builds`, `buildEvents`, `agentTasks`) is the richer live channel when configured
- Outputs: `SiteSpec` (brand/copy/positioning), self-contained `siteHtml`, `previewUrl`

## Funnel events (PostHog)

`visit → business_submitted → demo_generated → demo_prompt_used(count) →
checkout_50_started → paid_50 → build_completed → preview_viewed →
paid_149_subscription | paid_149_code_only | abandoned_after_build`
(server-side: paid_*, build_completed, build_failed_terminal, build_refunded)

## Deliberately out of v1 (clean extension points)

"I have an idea" door, interview/validation engine, multi-project dashboard,
integrations, agent detail screens, concierge booking (replaced by a
`CONTACT_EMAIL` mailto link).

## Known TODOs (marked in code)

- `TODO(launch-deploy)` — push launched sites to Hetzner via `apps/deploy-agent` (v1 serves `/site/[buildId]`)
- `TODO(daytona)` — run agent waves inside Daytona sandboxes (`packages/build-orchestrator/src/sandbox.ts`)
- `TODO(placeholder)` — transactional email provider + sender domain
- Convex codegen (`convex/_generated`) requires `npx convex dev` once; server writers use string refs and work without it
