# Pipeline hardening plan

Reality check after several iterations of `--no-verify`: the
pre-commit + pre-push hooks fire a real CI-equivalent suite locally
but the suite has structural problems that make it untrustworthy.
This doc lists the gaps, ranks fixes by impact-per-hour, and gives a
concrete sequence we can pick up incrementally.

The point isn't "make all tests green at any cost." It's: **when the
hook fails, it should mean something landed broke**, not "the test
fixture is out of sync with another in-flight change."

---

## What's wrong today

### 1. Hooks block on env-dependent suites
- `pre-push` runs `pnpm run ci:smoke` → Playwright e2e
  ([playwright.config.ts](../playwright.config.ts)).
- The config only auto-starts the **main app** on `:3000`. Three
  other dependencies are NOT auto-started:
  - **Editor server** (`:5773`) — needed by `e2e/editor-smoke.spec.ts`
  - **Library Next.js / preview builds** (`/preview/{slug}/`) — needed
    by `e2e/templates-audit.spec.ts`
  - **Library MCP server** — needed once the editor's `/api/library/*`
    proxy lands
- Result: even on a healthy commit, the suite logs failures purely
  because those services aren't booted.

### 2. Tests probe runtime state the prod app doesn't actually need
- `e2e/dashboards.spec.ts` asserts `consoleErrors.length === 0` on
  unauthenticated admin routes — but Clerk's external SDK logs
  warnings/errors during the unauth flow that are normal browser
  behaviour, not regressions in our code.
- That gate is the reason `b01d5076` (CSP `'strict-dynamic'` fix) was
  even needed to get the hook to stop failing on `/admin/dashboard/*`.

### 3. Sister-files-out-of-sync defeats typecheck
- `apps/flowstarter-main/src/components/HelpContent.tsx` references
  ~40 `help.*` i18n keys that don't exist in
  `src/locales/en.ts` — the sister change adding them is uncommitted
  WIP on this branch.
- `apps/flowstarter-main:typecheck` fails on every commit through the
  pre-commit hook, blocking unrelated work. Same pattern bit us with
  `packages/platform-config/src/index.ts` earlier (`Set<string>`
  iteration / target mismatch).

### 4. Single mega-suite, all-or-nothing
- `ci:quality-gate = ci:lint && ci:typecheck && ci:test` runs full
  lint + typecheck + vitest on every commit.
- `ci:smoke = ci:smoke:platform` runs the full Playwright suite on
  every push.
- One unrelated flake blocks all work — there's no way to land a
  CSS-only change without satisfying every gate.

### 5. Skip cascade obscures real signal
- Last push run reported "31 skipped, 11 passed, exit code 1." All
  31 skips were intentional (`test.skip()` paths fired because their
  backends weren't running) — but the suite still exited non-zero
  and the operator can't tell at a glance whether the failures are
  signal or noise.

---

## Goals

| # | Goal | Why |
|---|------|-----|
| G1 | The pre-push hook only fails when *this commit* introduced a regression. | Trust |
| G2 | Tests that need a service self-skip cleanly when it's not running. | Local DX |
| G3 | Lint / typecheck failures in files unrelated to the staged diff don't block the commit. | Velocity |
| G4 | CI runs the full suite (all services up) — local hook runs a focused, signal-rich subset. | Right tool for the job |
| G5 | First-run experience: `pnpm install && pnpm dev:editor` works, `pnpm commit` works, no rituals. | Onboarding |

---

## Concrete actions, ranked by impact-per-hour

### Tier 1 — do these first (high impact, low effort)

**A. Make pre-commit a staged-files-only check.**
Run lint + typecheck **only on the files staged in this commit**, not
the whole monorepo. Use `lint-staged` (already in
[lint-staged.config.cjs](../apps/flowstarter-main/lint-staged.config.cjs))
plus a per-package `tsc --noEmit` over the changed files' projects.
- Stops `HelpContent.tsx` from blocking a `library.css` edit.
- Cuts hook latency on most commits from ~60s to ~5s.
- Files touched: `.husky/pre-commit`, lint-staged config, possibly a
  small wrapper script under `scripts/`.

**B. Replace `consoleErrors.length === 0` with an allowlist.**
[e2e/dashboards.spec.ts:67](../e2e/dashboards.spec.ts) currently fails
on any console error — including third-party (Clerk) noise we can't
control. Switch to a denylist of error patterns *we own* (e.g. our
own `console.error(...)` strings) or assert the page didn't render
the error boundary, which is what the test actually cares about.
- Removes the entire class of "Clerk logged a warning → push blocked"
  failures.

**C. Auto-skip env-dependent specs at the suite level.**
We already did this for `editor-smoke.spec.ts` ([bf944041](../e2e/editor-smoke.spec.ts)).
Apply the same pattern to:
- `templates-audit.spec.ts` — skip preview-iframe tests when the
  `/preview/{slug}/` static build is missing (already partial — make
  the detail-page tests also skip when the slug isn't in the data
  manifest, instead of failing).
- Any future spec that depends on the editor server or library MCP.
- Pattern: `test.beforeAll` probes the dependency, calls
  `test.skip(true, reason)` on the whole describe block.

### Tier 2 — meaningful follow-ups

**D. Two-tier hook strategy.**
- **pre-commit** (≤5 s): lint-staged + tsc on changed packages only.
- **pre-push** (≤60 s): vitest unit suite + a *smoke* subset of
  Playwright (10–15 fastest tests that cover critical flows).
- **CI on PR** (no time cap): full Playwright suite with all services
  booted in containers — this is where the audit + smoke tests
  actually catch real bugs.
- The `pre-push` shouldn't try to be a CI replacement.

**E. Boot all services for `ci:smoke` via Playwright's `webServer`.**
[playwright.config.ts:30-37](../playwright.config.ts) only starts
flowstarter-main. Add entries for:
- editor server (`bun run apps/flowstarter-editor/server/src/bin.ts`)
- library MCP (`node apps/flowstarter-library/mcp-server/build/index.js --mode=http`)
- the demo workspace's Astro dev server
- (eventually) the local deploy-agent in dry-run mode
Then `editor-smoke.spec.ts`, `templates-audit.spec.ts`, and the
publish flow can actually run end-to-end locally.

**F. Library template data — single source of truth.**
[bf944041](../apps/flowstarter-main/src/app/(library)/library/_data/templates.ts)
backfilled 5 templates manually. Long-term: load
`apps/flowstarter-library/templates/*/config.json` at build time so
the main app's `TEMPLATES` array is always in sync with the MCP's
truth. Either:
- a build-time codegen script, OR
- an Astro/Next.js loader that walks the templates dir at compile time.
Picks up new templates automatically; no audit failures from drift.

### Tier 3 — nice-to-have polish

**G. Split `ci:quality-gate` by project.**
`pnpm nx run-many -t lint --projects=<changed>` instead of a fixed
"main only" target. Lets the editor + library + design-system
projects all benefit from incremental checks.

**H. Snapshot reporter dashboard.**
`pre-push` writes a one-line summary card
("✔ unit  ✔ critical-path  → skipped: 8 (env)  → 0 regressions") so
operators see at a glance whether the failures are real signal.

**I. Editor server in the Playwright web-server graph.**
After (E), the editor smoke describe stops self-skipping and starts
catching real editor regressions on every push.

**J. Type-safe i18n with build-time check.**
Run a script (npm prepublish or pre-commit on changes to
`HelpContent.tsx`/`en.ts`) that diffs `t('...')` calls against the
`En` keys union and prints missing keys. Catches the
`HelpContent.tsx` drift at edit time, not at typecheck time on an
unrelated commit.

---

## Sequence (pick one chunk at a time)

1. **A + B + C (Tier 1)** — half a day. Unblocks the day-to-day commit
   flow. Makes `--no-verify` unnecessary in 90% of cases.
2. **D** — split the hooks. ~2 hours. Stops the `pre-push` from doing
   CI's job.
3. **E** — add services to Playwright `webServer`. Half a day. Makes
   local e2e actually run instead of skipping.
4. **F** — template-data codegen. ~2 hours. Removes a whole drift
   class.
5. **G–J** — polish, do as time allows.

---

## Out of scope

- Replacing Playwright / vitest. Both are fine.
- Adding new tests. The problem isn't coverage — it's that the
  existing gates are too coarse.
- Refactoring the Clerk/CSP plumbing further (the `b01d5076` fix
  already restores the working CSP; further hardening is a security
  review, not a pipeline change).
