# E2E MVP report — filmed 2026-09-02

**Branch:** `pivot-concierge-v1`  
**Commit:** `e9a7407c` — local deposit→deploy chain + per-tenant Cal  
**Filmed at:** `https://www.flowstarter.dev` (Cloudflare tunnel → local Next `:3000`)  
**Workspace:** `4ddb019f-8c59-4db5-a74a-d9d17dfa43d4` (Marsh & Fern Counselling)

## Clips recorded

| Clip | Status | Notes |
|------|--------|-------|
| 01 intake | OK | Conversational wizard through tier + subscription |
| 02 info agent | OK | |
| 03 generation | OK | Attempt 2/4; real preview in-pane + mobile pass |
| 04 two edits | OK | Deposit ask after second free change |
| 05 claim + deposit | OK | Unlock page filmed signed-out |
| 06 client dashboard | OK | Thread, asks, reply |
| 07 operator console | OK | Clarification via API (no operator composer UI) |
| 08 editor | Partial | Timeout on a control click; clip kept with failure noted |
| 09 balance + live sites | Partial | Operator stage-advance timeout; balance webhook + site scroll OK |
| 10 preview hosting | OK | Provision + reap |

Showcase page: `artifacts/showcase/index.html` (serve with `node e2e/support/serve-static.mjs artifacts/showcase 8788`).

## Local stack during filming

- Next `:3000`, Supabase local, Stripe listen, deploy-agent `:8443`/`:8790`
- Build worker `:8787` stub mode — **must be running** before deposit webhook
- After deposit: `node scripts/seed-local-hosting.mjs --workspace <id>` then re-dispatch job

## Known gaps (honest)

1. Deposit webhook does not auto-start build worker if it is down — job stays `queued`.
2. New workspaces need `seed-local-hosting.mjs --workspace` before first deploy.
3. Stub-agent packages Astro **source** tree; static host returns 404 until a real `astro build` path runs.
4. Clip 08/09a need UI selector fixes for a clean re-take.

## Verify commands

```bash
pnpm verify:local-deploy
APP_ORIGIN=https://www.flowstarter.dev node e2e/support/record-funnel.mjs
APP_ORIGIN=https://www.flowstarter.dev node e2e/support/record-console.mjs
node e2e/support/build-showcase-page.mjs
```
