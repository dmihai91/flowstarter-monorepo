# Parallel MVP workstreams (agent-ready)

Branch: `pivot-concierge-v1`  
Checkout: `/Users/darius91/Projects/flowstarter-monorepo`  
Goal: preview → deposit → full site → domain → Cal booking for client leads → **ship latest to domain + re-record full-flow clips on Cloudflare tunnel (WS-I)**.

These streams are **intentionally parallel**. Each owns a file/package boundary so Claude Code, Codex, and Cursor agents can pick any idle stream when limits reset without merge fights.

## Spawn rules

1. **One agent per workstream** at a time. Never two agents on the same `OWN` paths.
2. Shared types/state machine (`packages/agentic-codegen/src/flowstarter/types.ts`, `ProjectState`) — **read-only** unless the stream is WS-G. Prefer extending via new modules over editing shared enums mid-flight.
3. Do not provision Hetzner / write public DNS unless the human explicitly says go (WS-D).
4. No commits/pushes unless the human asks. Local changes only until coordinated.
5. Prefer small PRs/patches per stream: `feat(preview|build|deploy|hosting|domains|cal|billing|messaging|showcase): …`
6. When blocked on another stream’s interface, stub against the **contracts** below and continue.
7. **WS-I is the finish gate** — do not claim it until WS-A is filmable; update the agreed domain with the filmed build and host/record the reel via Cloudflare tunnel.

## Contracts (stable interfaces between streams)

| Contract | Shape | Producer | Consumers |
| --- | --- | --- | --- |
| Preview ready | workspace `PREVIEW_READY` + `funnel_previews` / preview URL | WS-A | WS-B, WS-G |
| Deposit paid | Stripe webhook → `DEPOSIT_PAID` + `FULL_SITE_BUILD` job row | existing + WS-B | WS-B, WS-C |
| Site artifact | built static/output path or git ref for deploy-agent | WS-B | WS-C, WS-E |
| Deploy target | `{ slug, serverId, domain? }` | WS-C / WS-D | WS-E |
| Booking URL | `integrations.calComUrl` (https://cal.com/… or app.cal.com/…) on project config | WS-F intake | WS-F inject, WS-B build |

---

## WS-A — Preview reliability

**OWN**
- `apps/flowstarter-main/src/lib/discovery/**`
- `apps/flowstarter-main/src/app/api/discovery/**`
- preview CSP bits in `src/utils/security-headers.ts` (dev local origins only)

**DO NOT TOUCH**
- build-worker, deploy-agent, deposit-workflow, integrations inject

**Done when**
- Aborted/restarted jobs tear down `astro dev` children
- Failed generations mark job `failed` (no silent hang)
- Imagery stage either applied or honestly skipped with reason
- Local preview iframe not blanked by CSP in `FLOWSTARTER_LOCAL_PREVIEW`

**Verify**
- `pnpm --dir apps/flowstarter-main test` for discovery unit tests
- Manual: start preview, abort mid-run, confirm no orphan `astro` on preview ports

**Good for:** Claude Code (deep local debugging)

---

## WS-B — Build worker dispatch

**OWN**
- `apps/flowstarter-main/src/lib/flowstarter/deposit-workflow.ts`
- `apps/flowstarter-main/src/lib/flowstarter/**/dispatch*` (if any)
- `apps/build-worker/**`
- operator-visible error strings on Pipeline tab related to dispatch

**DO NOT TOUCH**
- discovery live preview, Cal inject, domain registrar

**Done when**
- `FULL_SITE_BUILD` dispatch is configured via env and fails loudly when unset (operator Pipeline shows why)
- Documented env checklist returned in agent summary (no new markdown file required)
- Worker can accept a job in dry/mock mode without Hetzner

**Env (agent lists; human fills)**
- `FLOWSTARTER_SITES_REPO`, `FLOWSTARTER_SITES_GITHUB_TOKEN`, `FLOWSTARTER_WORKTREES_ROOT`, `FLOWSTARTER_BUILD_WORKER_SECRET`

**Good for:** Codex (mechanical wiring + tests)

---

## WS-C — Publish → deploy

**OWN**
- `apps/flowstarter-main/src/app/api/client/site/**/publish/**`
- `apps/flowstarter-main/src/lib/flowstarter/site-editor.ts`
- `apps/flowstarter-main/src/lib/hosting/deploy.ts`
- `apps/flowstarter-main/src/lib/hosting/preview-publisher.ts`
- `apps/deploy-agent/**` (client publish path only)

**DO NOT TOUCH**
- discovery, Cal inject, domain purchase APIs

**Done when**
- Publish builds/uses edited manifest (not dry-run-only when agent configured)
- Clear dry-run vs live behavior; no silent “saved but nowhere”

**Depends on (soft):** WS-B artifact shape; stub if missing

**Good for:** Claude Code or Codex

---

## WS-D — Hetzner hosting provision

**OWN**
- `apps/flowstarter-main/scripts/provision-preview-host.mjs`
- `apps/flowstarter-main/scripts/provision-*.ts|mjs`
- `apps/flowstarter-main/src/lib/hosting/hetzner.ts`
- `apps/flowstarter-main/src/lib/hosting/cloud-init.ts`

**DO NOT TOUCH**
- app UI flows except operator hosting pages if needed for status display

**HUMAN GATE**
- Do not run with `--yes-i-understand-this-costs-money` unless Darius explicitly approves
- Needs `HETZNER_SSH_KEY_ID`, Hetzner API token

**Done when**
- Dry-run path is correct; real provision script ready; `*.preview.flowstarter.net` plan documented in agent return
- Zero surprise DNS edits to existing Cloudflare records

**Good for:** Claude Code (careful infra), after human go

---

## WS-E — Domains (attach + acquire)

**OWN**
- `apps/flowstarter-main/src/api/contracts/domains.ts`
- domain routes under `apps/flowstarter-main/src/app/api/**/domain*`
- `apps/flowstarter-main/src/lib/hosting/cloudflare.ts` (DNS upsert only; don’t delete prod records)
- registrar handoff helpers (Namecheap/Cloudflare/GoDaddy docs already exist)

**DO NOT TOUCH**
- Cal inject, discovery preview, build-worker

**Done when**
- Attach existing client domain → DNS instructions / Cloudflare upsert for A/CNAME to hosted site
- Acquire/register path stubbed or implemented behind feature flag (no real purchases in test)

**Soft depends on:** WS-C/WS-D deploy target

**Good for:** Codex (API + tests)

---

## WS-F — Cal.com booking

**OWN**
- `packages/agentic-codegen/src/integrations.ts` (`injectCalCom`, `normalizeCalLink`)
- `apps/flowstarter-main/src/lib/flowstarter/cal-com.ts` (per-tenant resolve + scaffold inject)
- `workspaces.cal_com_url` + client `/dashboard/projects/[id]/booking` + `/api/client/booking/[id]`
- Intake field `calComUrl` in `intake-script.ts` / `DiscoveryData` (additive keys only)
- Template contact/booking injection points under `apps/flowstarter-templates/**` (only booking-related files)

**DO NOT TOUCH**
- live-jobs, deposit-workflow, hosting provision

**Done when**
- `injectCalCom(files, calUrl)` pure + unit tested
- Wired into post-gen / full-build integrations pass
- Intake collects dedicated `calComUrl` (fallback: parse from `customIntegrations`)
- Claim persists `workspaces.cal_com_url` per tenant
- Funnel preview shows a **blurred Cal demo** only (`injectCalComPreviewDemo`) — never the live embed
- Full-site build wires the live tenant embed from `cal_com_url` (`injectCalCom` / `applyIntegrationsToWorkspace`)
- Dedicated client booking page to view/update the tenant URL
- CSP already allowlists cal.com — don’t broaden casually

**Not in scope (later):** managed Cal org, availability sync, “Flowstarter-hosted scheduling product”

**Good for:** Codex (pure functions + tests) or Claude

---

## WS-G — Balance payment → LIVE

**OWN**
- Balance/checkout Stripe paths, webhook handlers for final payment
- `project-payment.ts`, billing unlock/balance UI
- Transitions into `LIVE_SUBSCRIPTION` (coordinate if touching `state-machine.ts`)

**DO NOT TOUCH**
- Cal inject, discovery, domain registrar

**Done when**
- Client can pay remaining balance; workspace advances; hosting unlock/live flag set (even if deploy still WS-C)

**Soft depends on:** WS-B/WS-C for “site actually up”

**Good for:** Claude Code

---

## WS-H — Messaging / reminders / inbound email

**OWN**
- client messaging modules, reminder scheduler, inbound email parse (when started)

**DO NOT TOUCH**
- preview, build, Cal inject

**Done when**
- Deposit/build blockers can notify client; `expired` status can be set by scheduler
- Inbound email optional v2

**Good for:** either agent; lowest priority for “site live with Cal”

---

## WS-I — Ship prod + film on www.flowstarter.dev tunnel (FINISH GATE)

**When:** After WS-A is stable enough to film, and deposit/claim path (existing + WS-B/G as available) works. Can prepare scripts in parallel; the actual record+publish run is last.

**Hosts (decided 2026-08-31)**
| Host | Role |
| --- | --- |
| **`flowstarter.net` (prod)** | Ship latest `pivot-concierge-v1` here when filming is green |
| **`www.flowstarter.dev`** | Named Cloudflare tunnel → local Next `:3000` for demo + full-flow clip recording |
| `workflows.flowstarter.dev` | Same Next app (showcase rewrite) via same tunnel |
| `flowstarter.dev` apex | **Do not** point at the MVP Next demo — leaves room for other stacks |
| `ereno.flowstarter.dev` | **Other tunnel (sage-dev)** — never change its DNS / ingress |

**OWN**
- `e2e/support/record-funnel.mjs`, `record-showcase.mjs`, `showcase-lib.mjs`, `build-showcase-page.mjs`, `serve-static.mjs`, `retake-users.mjs`
- `artifacts/showcase/**` (clips, `manifest.json`, `serving.json`)
- `scripts/cloudflared-flowstarter-workflows.yml` + `scripts/publish-workflow-showcase.mjs`
- Netlify / prod deploy for **`flowstarter.net`** (do not edit ereno / unrelated Cloudflare DNS)

**DO NOT TOUCH**
- discovery generation logic (WS-A), Cal inject (WS-F), build-worker (WS-B) — only *consume* their results on camera
- `ereno.flowstarter.dev` DNS or sage-dev tunnel config

**Done when (all required)**
1. **Prod updated** — `flowstarter.net` running the tip of `pivot-concierge-v1` that includes the filmed commits.
2. **Tunnel demo up** — `cloudflared tunnel --config scripts/cloudflared-flowstarter-workflows.yml run` with Next on `:3000`; **`https://www.flowstarter.dev`** serves the app (not apex).
3. **Full-flow clips re-recorded** against **`https://www.flowstarter.dev`** (not random trycloudflare URLs unless falling back):
   - `pnpm --dir apps/flowstarter-main dev` on `:3000`
   - named tunnel as above
   - record with `e2e/support/record-funnel.mjs` / showcase tooling using `BASE_URL=https://www.flowstarter.dev`
   - rebuild showcase page; update `artifacts/showcase/serving.json` with `url: https://www.flowstarter.dev`
   - optionally publish reel to `https://assets.flowstarter.dev/workflows/`

**Clip set (entire client flow — re-take all that apply)**
| # | Beat |
| --- | --- |
| 01–02 | Conversational intake + info agent |
| 03 | Preview generation (site + imagery in-pane) |
| 04 | Two free edits → deposit ask |
| 05 | Claim + DEPOSIT_PAID webhook |
| 06–10 | Client dashboard / operator / editor / balance / hosting (as implemented) |
| + | Cal.com booking on generated/contact page once WS-F lands |

**Verify**
- `https://www.flowstarter.dev` loads (Clerk + CSP OK); apex/`ereno.flowstarter.dev` unchanged
- `artifacts/showcase/manifest.json` `recordedAt` is new; failed clips have honest `error`
- Prod `flowstarter.net` commit SHA matches filmed branch tip

**HUMAN GATES**
- Prod Netlify deploy approval for `flowstarter.net`
- Do not delete existing prod DNS; do not re-point apex or ereno
- Mint/clean filming users: `node e2e/support/retake-users.mjs mint`

**Good for:** Claude Code (long recording session); one agent only — not parallel with another WS-I

**Spawn blurb**
```text
Claim WS-I only. Read docs/PARALLEL_MVP_WORKSTREAMS.md § WS-I.
1) Deploy latest pivot-concierge-v1 to flowstarter.net (prod).
2) Run Next on :3000 + named tunnel (scripts/cloudflared-flowstarter-workflows.yml).
3) Film full funnel at https://www.flowstarter.dev (NOT apex, NOT ereno).
4) Rebuild showcase, update serving.json, publish workflows assets if R2 present.
Do not touch ereno DNS or WS-A/B/F code except to film.
Return: prod SHA, www.flowstarter.dev status, clip table.
```

---

## Suggested spawn order when limits reset

| Priority | Stream | Why |
| --- | --- | --- |
| P0 | WS-A | Demo reliability (must be green before filming) |
| P0 | WS-F | Parallel, almost no overlap |
| P0 | WS-B | Unblocks paid → build |
| P1 | WS-C | Parallel to F; soft-deps B |
| P1 | WS-E | Parallel scaffolding |
| P1 | WS-G | Parallel billing |
| P2 | WS-D | Human money gate |
| P2 | WS-H | After core delivery |
| **P3** | **WS-I** | **Finish gate: domain ship + Cloudflare-tunnel full-flow reel** |

## Agent handoff blurb (paste into Claude/Codex)

```text
Repo: /Users/darius91/Projects/flowstarter-monorepo
Branch: pivot-concierge-v1
Read: docs/PARALLEL_MVP_WORKSTREAMS.md
Claim ONE workstream (WS-X). Touch only its OWN paths.
Do not provision Hetzner. Do not commit unless asked.
WS-I (domain + tunnel clips) runs last after A is filmable.
Return: files changed, verify steps, blockers, next agent prompt.
```
