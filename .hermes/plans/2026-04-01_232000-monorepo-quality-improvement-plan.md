# Flowstarter Monorepo Quality Improvement Plan

> For Hermes: planning only. Do not implement during this task.

Goal

Stabilize the flowstarter-monorepo so that lint, typecheck, and core tests become trustworthy repo-wide quality gates, while reducing maintenance friction in the largest and riskiest parts of the codebase.

Architecture Summary

The monorepo uses Nx + pnpm with several product surfaces:
- apps/flowstarter-main: main Next.js app
- apps/flowstarter-editor: Remix/Vite editor app
- apps/flowstarter-code: smaller Next.js app
- apps/flowstarter-library: template library and related tooling
- apps/flowstarter-library/mcp-server: MCP server
- packages/editor-engine: shared business logic
- packages/flow-design-system: shared UI

The highest-value approach is not a rewrite. It is a staged stabilization program:
1. Fix repo-wide tooling and dependency drift
2. Restore green quality gates
3. Repair test environments and stale suites
4. Refactor oversized files once the platform is stable

Tech Stack / Tools Involved

- pnpm workspaces
- Nx
- TypeScript
- ESLint
- Vitest
- Playwright
- Next.js
- Remix/Vite
- React 19
- Daytona
- Supabase
- Clerk

Current Observations / Assumptions

Observed issues from inspection:
- Root packageManager is pnpm 10.x, but app-level packageManagers still point to pnpm 9.x
- App-level pnpm.overrides / resolutions produce warnings and do not apply reliably in a workspace
- Lint is broken across several projects for different reasons:
  - packages/editor-engine and packages/flow-design-system have no valid ESLint 9 flat config
  - apps/flowstarter-main has a broken Playwright ESLint plugin declaration
  - apps/flowstarter-library/showcase has no ESLint config
  - flowstarter-library and mcp-server lint targets appear to traverse build output
  - flowstarter-code uses interactive next lint behavior
  - flowstarter-editor has many real lint violations in tests
- Typecheck is partially healthy, but flowstarter-editor currently fails typecheck
- Some template projects report disabled typecheck targets
- Tests are numerous but not fully trustworthy:
  - apps/flowstarter-main tests mostly pass, but environment/version issues remain
  - apps/flowstarter-library/mcp-server tests fail heavily due to stale paths, duplicated build/src execution, and mock drift
- Several source files are too large and likely carry too many responsibilities

Success Criteria

Phase 1 success:
- One workspace-wide dependency policy
- One consistent lint strategy
- No interactive lint/test commands
- Build/generated folders excluded from lint/test by default

Phase 2 success:
- pnpm nx run-many -t lint --all passes, or the exact excluded projects are documented and intentional
- pnpm nx run-many -t typecheck --all passes, or exact exclusions are documented and intentional

Phase 3 success:
- apps/flowstarter-main test suite is green in CI mode
- apps/flowstarter-library/mcp-server test suite stops running duplicated src/build tests
- template validation tests reflect actual template structure

Phase 4 success:
- Largest orchestration files are split into smaller modules with preserved behavior

---

## Phase 0: Baseline and guardrails

Objective

Capture the current failure surface and define the target contract before making changes.

Files likely to create/modify

- /Users/darius91/flowstarter-monorepo/docs/quality/monorepo-health-baseline.md
- /Users/darius91/flowstarter-monorepo/docs/quality/monorepo-quality-policy.md
- /Users/darius91/flowstarter-monorepo/.github/workflows/quality.yml (if CI is present or planned)

Tasks

1. Capture current outputs for:
   - pnpm nx run-many -t lint --all --output-style=static
   - pnpm nx run-many -t typecheck --all --output-style=static
   - pnpm --dir apps/flowstarter-main test
   - pnpm --dir apps/flowstarter-library/mcp-server test
2. Save a summarized baseline document listing:
   - failing projects
   - root causes
   - intentional exclusions if any
3. Write a short quality policy covering:
   - supported package manager version
   - supported Node version
   - dependency override ownership at root only
   - no generated/build output in lint/test
   - no interactive scripts in CI

Verification

- Baseline doc exists and matches current failures
- Team can point to one document that defines “green”

---

## Phase 1: Standardize workspace dependencies and package manager behavior

Objective

Remove dependency drift and workspace misconfiguration that undermines reproducibility.

Priority

Highest

Files likely to modify

- /Users/darius91/flowstarter-monorepo/package.json
- /Users/darius91/flowstarter-monorepo/pnpm-workspace.yaml
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-main/package.json
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-editor/package.json
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-code/package.json
- /Users/darius91/flowstarter-monorepo/.npmrc
- /Users/darius91/flowstarter-monorepo/README.md

Tasks

1. Choose one pnpm version for the whole repo
   - Recommended: keep root on pnpm 10 if current tooling is already using it successfully
2. Remove per-app packageManager declarations that conflict with root
3. Move all pnpm.overrides, pnpm.peerDependencyRules, and resolutions to the root package.json only
4. Align React and ReactDOM versions across apps where cross-package rendering/testing occurs
   - especially flowstarter-main, flowstarter-editor, flow-design-system
5. Align core testing/tooling versions where practical:
   - TypeScript
   - Vitest
   - ESLint
   - @types/react / @types/react-dom
6. Document the version policy in README or docs/quality

Risks / Notes

- Full version unification should be done carefully; avoid mixing framework upgrades with quality cleanup if not needed
- Prefer the smallest change set that eliminates invalid-hook-call / duplicate-react style failures

Verification

- pnpm install emits no warnings about ignored workspace overrides/resolutions
- React/ReactDOM versions are intentional and documented
- root lockfile is regenerated cleanly

---

## Phase 2: Fix lint architecture repo-wide

Objective

Make lint deterministic and non-interactive for every included project.

Priority

Highest

Files likely to modify

Root / shared config:
- /Users/darius91/flowstarter-monorepo/eslint.config.mjs or eslint.config.js
- /Users/darius91/flowstarter-monorepo/.eslintignore or flat-config ignores (if used)
- /Users/darius91/flowstarter-monorepo/nx.json

Packages:
- /Users/darius91/flowstarter-monorepo/packages/editor-engine/package.json
- /Users/darius91/flowstarter-monorepo/packages/flow-design-system/package.json
- /Users/darius91/flowstarter-monorepo/packages/editor-engine/eslint.config.mjs
- /Users/darius91/flowstarter-monorepo/packages/flow-design-system/eslint.config.mjs

Apps:
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-main/.eslintrc.cjs or migrate to flat config
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-editor/eslint.config.mjs
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-library/showcase/eslint.config.*
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-library/project.json
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-library/mcp-server/project.json
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-code/package.json
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-main/project.json
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-editor/project.json

Tasks

1. Decide lint model:
   - Preferred: migrate repo to ESLint 9 flat config consistently
   - Alternative: pin ESLint to a legacy-compatible version temporarily, then migrate later
2. Fix packages/editor-engine and packages/flow-design-system so their lint commands use a valid config file
3. Fix flowstarter-main Playwright plugin config
   - Current issue suggests plugin entry is malformed
   - Ensure extends and plugins are declared correctly for eslint-plugin-playwright
4. Add or inherit lint config for flowstarter-library/showcase
5. Exclude generated/build output from all lint targets
   - build/
   - dist/
   - public/assets generated bundles
   - preview-dist/
   - test-results/
   - playwright-report/
6. Replace flowstarter-code’s interactive next lint script with direct eslint CLI
7. Keep app-specific rules minimal; move common rules to shared root config if possible
8. After config stabilization, address real lint violations in flowstarter-editor
   - start with test files since that is where many failures were observed

Recommended lint target end state

- Every project has either:
  - a passing lint target, or
  - an explicit documented reason why lint is intentionally disabled
- No project relies on interactive tooling

Verification

- pnpm nx run-many -t lint --all --output-style=static completes without configuration errors
- Remaining failures, if any, are real code issues only

---

## Phase 3: Restore typecheck trust

Objective

Make typecheck meaningful and green across all intended projects.

Priority

High

Files likely to modify

- /Users/darius91/flowstarter-monorepo/tsconfig.base.json
- /Users/darius91/flowstarter-monorepo/tsconfig.json
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-editor/tsconfig.json
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-editor/__tests__/config/vitest.config.ts
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-editor/app/components/editor/EditorLayout.tsx
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-editor/app/components/editor/*
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-editor/__tests__/**/*.ts
- template app tsconfig files under /Users/darius91/flowstarter-monorepo/apps/flowstarter-library/templates/*/tsconfig.json
- relevant project.json files for template apps

Tasks

1. Fix flowstarter-editor type errors first, because it is the biggest failing app
2. Triage editor errors into categories:
   - broken test config typing
   - mock typing drift
   - component prop mismatches
   - test-only vs production errors
3. Fix the EditorLayout / EditorHeader prop contract mismatch
4. Fix Vitest config typing under __tests__/config
5. Review mock helpers and typed wrappers in failing gretly/editor tests
   - create reusable typed mock helpers if repeated patterns are causing failures
6. Decide how template projects should be handled:
   - either real typecheck targets, or
   - explicitly disabled and documented
   Current “typecheck disabled because references set noEmit: true” should not remain ambiguous
7. Ensure Nx project targets reflect intended behavior consistently

Verification

- pnpm nx run-many -t typecheck --all --output-style=static passes or has a short intentional exclusion list
- No ambiguous “disabled” typecheck targets without documentation

---

## Phase 4: Repair test environments and stale suites

Objective

Turn test quantity into trustworthy signal.

Priority

High

### 4A. flowstarter-main test stabilization

Files likely to modify

- /Users/darius91/flowstarter-monorepo/apps/flowstarter-main/vitest.config.mts
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-main/test/setup.ts
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-main/src/hooks/__tests__/useLocalStorage.test.ts
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-main/src/app/__tests__/Navbar.test.tsx
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-main/src/components/ui/__tests__/app-loading.test.tsx
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-main/src/app/(dynamic-pages)/(main-pages)/components/__tests__/useMockEditor.test.ts
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-main/src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/hooks/__tests__/useDashboardMilestones.test.ts
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-main/src/app/(dynamic-pages)/(main-pages)/(logged-in-pages)/dashboard/hooks/useDashboardMilestones.ts

Tasks

1. Fix test environment setup to provide a proper localStorage implementation
2. Resolve invalid hook call / useId issues
   - likely version alignment plus test renderer consistency
3. Update Navbar tests to match current render conditions or restore intended test ids
4. Fix useMockEditor timing/async expectations
5. Resolve greeting boundary mismatch by either:
   - fixing production logic, or
   - fixing stale tests if logic is intentional
6. Remove deprecated Vitest poolOptions usage and migrate to Vitest 4-compatible config

Verification

- pnpm --dir apps/flowstarter-main test passes

### 4B. flowstarter-library/mcp-server test stabilization

Files likely to modify

- /Users/darius91/flowstarter-monorepo/apps/flowstarter-library/mcp-server/vitest.config.ts
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-library/mcp-server/src/utils/auth.test.ts
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-library/mcp-server/src/utils/template-validation.test.ts
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-library/mcp-server/src/utils/auth.ts
- /Users/darius91/flowstarter-monorepo/apps/flowstarter-library/mcp-server/package.json
- template directories under /Users/darius91/flowstarter-monorepo/apps/flowstarter-library/templates/*

Tasks

1. Ensure Vitest does not execute tests from both src and build output
   - exclude build/** from test discovery
2. Fix Clerk mock strategy in auth tests
   - verify the actual @clerk/backend exports being mocked
3. Update template validation tests to reflect actual template structure
   - current assumptions about start/src/content/content.md appear stale for several templates
4. Decide whether template validation should:
   - validate all templates under one current schema, or
   - validate only templates participating in current product flow
5. Ensure missing shared/config folders are either created intentionally or excluded intentionally
6. Reduce excessive fixture/path brittleness in template tests

Verification

- pnpm --dir apps/flowstarter-library/mcp-server test passes
- No duplicate failures from build output

---

## Phase 5: Clean up project targets and repo ergonomics

Objective

Make Nx targets predictable and easy to reason about.

Priority

Medium

Files likely to modify

- /Users/darius91/flowstarter-monorepo/nx.json
- /Users/darius91/flowstarter-monorepo/apps/*/project.json
- /Users/darius91/flowstarter-monorepo/packages/*/package.json
- /Users/darius91/flowstarter-monorepo/package.json

Tasks

1. Standardize target names across projects where sensible:
   - lint
   - typecheck
   - test
   - build
   - dev
2. Ensure every project target points at a non-interactive command
3. Remove dead or misleading targets
4. Add a root quality script set, for example:
   - quality:lint
   - quality:typecheck
   - quality:test
   - quality:all
5. If CI exists, wire it to these stable root commands

Verification

- New contributors can run one small set of root commands and get predictable results

---

## Phase 6: Refactor oversized and high-risk files

Objective

Reduce complexity after the platform is stable.

Priority

Medium

Highest-priority refactor targets

1. /Users/darius91/flowstarter-monorepo/apps/flowstarter-editor/app/routes/api.build.ts
Current risk
- Very large orchestration route mixing request parsing, build orchestration, error healing, sandbox logic, integration injection, and SSE concerns

Refactor direction
- Extract request normalization into a pure module
- Extract build pipeline orchestration into a service layer
- Extract error healing / retry logic into isolated modules
- Keep route file focused on HTTP/SSE handling only

Suggested destination files
- apps/flowstarter-editor/app/lib/build/normalizeRequest.ts
- apps/flowstarter-editor/app/lib/build/pipeline.ts
- apps/flowstarter-editor/app/lib/build/healing.ts
- apps/flowstarter-editor/app/lib/build/sse.ts
- apps/flowstarter-editor/app/routes/api.build.ts

2. /Users/darius91/flowstarter-monorepo/apps/flowstarter-main/src/app/(dynamic-pages)/team/dashboard/new/NewProjectWizard.tsx
Current risk
- Large client component handling step orchestration, UI, pricing, templates, mutation flow, and user interaction state

Refactor direction
- Split into step components and orchestration hooks
- Keep top-level component as composition shell only

Suggested destination files
- .../new/NewProjectWizard.tsx
- .../new/hooks/useNewProjectWizard.ts
- .../new/components/StepIndicator.tsx
- .../new/components/PaymentStep.tsx
- .../new/components/TemplateStep.tsx
- .../new/components/ReviewStep.tsx

3. /Users/darius91/flowstarter-monorepo/apps/flowstarter-main/src/app/(dynamic-pages)/team/dashboard/services/page.tsx
Current risk
- High UI and data density; likely hard to review and regression-prone

Refactor direction
- Separate data loaders/selectors, view model mapping, and UI sections

Verification

- Existing tests preserved or expanded during refactor
- File size and responsibility boundaries improve measurably

---

## Phase 7: Strengthen quality gates in CI

Objective

Keep the repo from drifting back.

Priority

Medium

Files likely to create/modify

- /Users/darius91/flowstarter-monorepo/.github/workflows/quality.yml
- /Users/darius91/flowstarter-monorepo/.github/workflows/pr-checks.yml
- /Users/darius91/flowstarter-monorepo/README.md
- /Users/darius91/flowstarter-monorepo/docs/quality/ci-policy.md

Suggested CI stages

1. install
2. lint
3. typecheck
4. unit/integration tests
5. optional: selected e2e smoke tests

Suggested policy

- lint and typecheck must pass on changed projects at minimum
- no new project without lint/typecheck/test targets or explicit documented exemption
- generated files should not be committed unless intentionally versioned

Verification

- PRs fail fast when repo health regresses

---

## Recommended Execution Order

Week 1: Stabilize foundation
1. Phase 0 baseline docs
2. Phase 1 dependency/package-manager cleanup
3. Phase 2 lint architecture cleanup

Week 2: Restore trust
4. Phase 3 typecheck cleanup
5. Phase 4A flowstarter-main tests
6. Phase 4B mcp-server/template tests

Week 3: Normalize operations
7. Phase 5 Nx target cleanup
8. Phase 7 CI gating

Week 4+: Code health refactors
9. Phase 6 oversized file refactors

---

## Concrete command checklist for validation

After each major phase, run:

Repository-wide
- cd /Users/darius91/flowstarter-monorepo
- pnpm install
- pnpm nx run-many -t lint --all --output-style=static
- pnpm nx run-many -t typecheck --all --output-style=static

App-specific
- pnpm --dir apps/flowstarter-main test
- pnpm --dir apps/flowstarter-library/mcp-server test
- pnpm --dir apps/flowstarter-editor test

Optional smoke checks
- pnpm nx show projects
- pnpm nx graph --file=project-graph.html

---

## Risks and tradeoffs

1. ESLint migration risk
Moving fully to flat config is the cleanest path, but can cause a temporary burst of config churn. If time is tight, a short-term compatibility strategy may be acceptable.

2. Version alignment risk
Upgrading or downgrading React/tooling to align versions can surface latent runtime issues. Do this in isolation from feature work.

3. Template suite scope creep
The template library appears broad. Avoid trying to perfect every historical template immediately. Decide what is actively supported.

4. Refactor timing
Do not start large file refactors until lint, typecheck, and tests are stable. Otherwise debugging becomes ambiguous.

---

## Open questions

1. Are all templates under apps/flowstarter-library/templates actively supported, or should some be archived/excluded?
2. Do you want to standardize fully on ESLint 9 flat config now, or take a temporary compatibility path first?
3. Is flowstarter-code an actively maintained product surface, or can it be deprioritized / simplified?
4. Should CI gate on all projects, or only active production-facing projects initially?

---

## Suggested first implementation slice

If you want the fastest path to visible improvement, do this first:

Slice A
- unify workspace package manager and overrides at root
- fix lint configuration architecture
- remove interactive next lint behavior
- exclude build/generated directories from lint/test

Expected result
- repo tooling stops failing for configuration reasons
- remaining failures become real code issues

Slice B
- fix flowstarter-editor typecheck
- fix flowstarter-main test environment issues
- stop mcp-server duplicate build/src test execution

Expected result
- quality gates become credible

This sequence gives the best return before deeper refactors.
