# Agentic sandboxed codegen for the discovery funnel — design plan

> **Status:** PROPOSAL — needs Darius + Dorin sign-off before any build.
> This overrides the template-first demo principle in
> `FLOWSTARTER_MASTER_DECISIONS.md` and must be reflected there once
> approved.

## 1. Goal

Turn the step-7 "rough taste" into a real conversion weapon: the prospect
watches a genuine, designed site build itself from their answers, then
gives it up to ~15 plain-English instructions and watches it change. The
"wow" is the close for a premium concierge product.

Decisions already taken (Darius):
- **Real codegen in a sandbox**, not a constrained structured model.
- **Every visitor** can trigger it (hard-capped), not gated behind
  email/deposit.
- ~10–15 interactive prompts per visitor.
- Plan first, then implement gradually.

## 2. Reality check (from a full audit of the codebase)

| Capability | State | Reuse |
|---|---|---|
| Claude Agent SDK runtime (tool use, multi-turn, streaming, cost capture) — `apps/flowstarter-editor/server` `ClaudeAdapter`/`ClaudeProvider`/orchestration | **Working** (editor only) | Yes — core engine |
| SSE streaming pattern (`docs/CODING_AGENT_STREAMING.md`, `useCodingAgentStream`) | **Working** | Yes — progress UX |
| DemoSite render + `demo_edit_counters` server cap | **Working** (live) | Yes — fallback + edit cap |
| Per-IP rate limiting, `discovery_leads` (email at step 1) | **Working** | Yes — gating base |
| Editor session cost/token accounting (`editor_sessions`) | **Working** (editor) | Pattern, not table |
| **Ephemeral per-visitor Docker sandbox + operator service** | **NOT BUILT** — `cloud-init.ts` is a placeholder, the Hetzner operator (Docker lifecycle + DNS) is architected in `CONCIERGE_PIVOT_PLAN.md` only | Build required |

**The blocker:** "sandboxed real codegen for every visitor" cannot ship in
one step — the sandbox layer is multi-week ops work, and an editor-class
agentic run is ~€1–5 + minutes of compute *each*. On an anonymous funnel
that is an open-ended bill and an abuse magnet. Phasing is mandatory.

## 3. Phased architecture

### Phase 1 — streamed agent codegen, no per-visitor container (~1–2 wks)

- Reuse the existing Claude Agent SDK runtime in **one hardened
  server-side worker**. The agent writes a self-contained static bundle
  (HTML + CSS, no JS) into an **isolated ephemeral workspace dir** keyed
  by `demoId`, not a Docker container per visitor.
- Stream phases live over the existing SSE pattern into the step-7 UI
  (the build-progress checklist already shipped is the seed).
- **Render only in a strict sandboxed iframe**: `sandbox` with no
  `allow-scripts` (or `allow-scripts` + CSP `default-src 'none'; img-src
  data:`), served from an isolated origin/path. Non-negotiable — it is
  model-authored markup shown to the public.
- Interactive edits: reuse `demo_edit_counters`, raise cap to 15, same
  fail-open behaviour.
- **Fail open to today's `DemoSite` template** on any error / budget
  exhaustion / model down. The funnel never dead-ends.

Delivers ~90% of the impressiveness with bounded blast radius.

### Phase 2 — true per-visitor ephemeral sandbox (weeks, shared)

Build the Hetzner operator service (Docker lifecycle + Cloudflare DNS +
per-sandbox key injection) from `CONCIERGE_PIVOT_PLAN.md`. This is **the
same infra the real concierge build needs** — build it once for both, not
funnel-only. Phase 1 swaps its workspace-dir step for a real container
with no UX change.

## 4. Cost ceiling + kill switch (the "capped" requirement)

- New `demo_generation_costs` table: `demo_id`, `tokens_in/out`,
  `cost_eur`, `created_at`, `ip`, `lead_email?`.
- **Monthly funnel budget** (proposed default: €___ /mo — needs a
  number). At 70% → switch generation + edits to Haiku. At 100% →
  disable agentic path, fail open to the template demo, alert team.
- **Per-IP + per-email caps**: 1 full generation per email per 24h, N
  per IP per day; edits already server-capped at 15.
- Model tiering: cheap model for edit passes, stronger for first build.
- Every run attributed to a `discovery_leads` row → cost-per-lead is
  measurable from day one.

## 5. Security model (Phase 1, mandatory)

- Agent output is data, never executed server-side; written to a
  per-`demoId` scratch dir with no secrets, no network, size/time caps.
- Rendered exclusively in a locked iframe (no scripts, strict CSP,
  isolated path/origin). No `postMessage` trust.
- Agent tools restricted to the scratch workspace (no repo access, no
  shell beyond a whitelisted formatter).
- Hard per-run wall-clock + token budget; orchestrator kills overruns.

## 6. Open decisions for sign-off

1. **Monthly funnel budget €** and per-email/IP quotas (drives the cap).
2. First-build model (Sonnet for quality vs Haiku for cost) and edit
   model.
3. Phase-2 infra owner/timeline — couple it to the concierge build
   pipeline, not funnel-only.
4. `FLOWSTARTER_MASTER_DECISIONS.md` amendment wording (template-first →
   "template-first default; agentic codegen for the funnel demo and the
   real build, sandboxed and budget-capped") — needs Dorin.

## 7. Milestones (Phase 1)

1. `demo_generation_costs` + budget guard + kill-switch (fail-open path).
2. Server worker wrapping the Agent SDK → static bundle in scratch dir,
   tool/time/token sandboxed.
3. SSE generation route + step-7 wiring (reuse streaming hook + the
   progress checklist).
4. Locked-iframe render + CSP; edit loop on `demo_edit_counters` (cap 15).
5. Load/cost test against the budget; tune model tiering; master-doc
   amendment; ship behind a flag.
