# Flowstarter Engine v1 Audit

## Executive Summary

Flowstarter already contains three important ingredients of the v1 vision:

1. Intake-adjacent UX exists in `flowstarter-main`, especially the concierge scaffold and AI enrichment flow.
2. A real template library exists in `apps/flowstarter-library/templates` with structured metadata and integration hints.
3. An editor/runtime stack exists across `flowstarter-editor` and `packages/editor-engine`.

The missing core is the engine itself. The repo did not have a single typed, spec-first pipeline that turns business input into a deterministic build plan. Intake data, template selection, editor handoff, and build execution were fragmented across multiple apps with overlapping models and inconsistent contracts.

This branch introduces the first minimal engine spine for concierge delivery:

- `project-brief`
- `template-selection`
- `assembly-spec`
- `content-map`
- `validation-report`

It also wires the concierge scaffold to use that pipeline and persists the resulting artifacts into draft handoff data.

## Current Repo Audit

### Monorepo shape

- `apps/flowstarter-main`
  - Next.js app used for concierge intake, projects, dashboards, integrations, and editor handoff.
- `apps/flowstarter-library`
  - Real template catalog with Astro templates and metadata.
- `apps/flowstarter-library/mcp-server`
  - Exposes template metadata, scaffolding, and project lookup over MCP/HTTP.
- `apps/flowstarter-editor`
  - Separate Remix editor product with template customization, sandbox workflows, and multiple agent experiments.
- `packages/editor-engine`
  - Shared editor/runtime utilities for Daytona, Claude Code, template cloning, and publishing.
- `packages/leads-core`, `packages/leads-adapters`, `packages/database`
  - Currently stubs.

### What already aligned with the target vision

- Intake UX exists:
  - Concierge scaffold in `flowstarter-main`.
  - AI enrichment route in `/api/ai/enrich-project`.
- Template inventory exists:
  - Real template metadata in `apps/flowstarter-library/templates/*/config.json`.
  - MCP server can list, detail, and scaffold templates.
- Integrations exist in controlled form:
  - User integration persistence in `flowstarter-main`.
  - Template metadata already describes provider options for booking/newsletter.
- Editor/customization layer exists:
  - Handoff token flow from `flowstarter-main` to `flowstarter-editor`.
  - Runtime/editor infrastructure in `packages/editor-engine`.

### What was misaligned

- No typed source-of-truth project brief.
- No deterministic template-selection contract.
- No assembly spec for builder execution.
- No block registry with editable-field constraints.
- No validation report.
- `flowstarter-main` had a fallback-only local template service that does not reflect the real template library.
- Multiple overlapping project models existed:
  - `projectConfig`
  - Supabase `projects.data`
  - editor context payloads
  - AI prompt payloads
- Build pipeline was effectively absent:
  - `src/lib/ai/pipelines/site-generation.ts` is a stub.

### Technical debt and inconsistencies

- Template systems are duplicated:
  - static data in `src/data/project-templates.ts`
  - fallback templates in `src/lib/local-template-service.ts`
  - actual templates in `apps/flowstarter-library/templates`
  - structural archetypes in `flowstarter-editor`
- Editor handoff already had engine-oriented imports from `@flowstarter/editor-engine`, but the concierge path was not consistently producing those artifacts.
- Stub packages suggest intended package boundaries were not yet realized.
- Several broader tests in `flowstarter-main` are already failing independently of this branch.

## Gap Analysis Against Target Vision

### Present

- Intake layer
- Template library
- AI enrichment and classification helpers
- Integrations persistence
- Editor handoff and editor runtime

### Partially present

- Template selection
  - existed as recommendation helpers, but not as a deterministic persisted result
- Builder/build execution
  - editor/sandbox infrastructure exists, but not a spec-first website build pipeline
- Validation
  - ad hoc validation exists in forms/routes, not as engine QA output

### Missing before this branch

- `project-brief` contract
- `template-selection` contract
- `assembly-spec` contract
- `content-map` contract
- `validation-report` contract
- Block registry
- Concierge pipeline that emits all engine artifacts together

### Should be refactored later

- Replace remaining fallback template logic in `flowstarter-main`.
- Collapse overlapping template/archetype logic into a single shared registry.
- Unify engine logic between `flowstarter-main`, `flowstarter-editor`, and `packages/editor-engine`.
- Move the new engine spine into a dedicated shared package once the contracts stabilize.

### Should be postponed

- Full autonomous builder-agent execution from `assembly-spec`.
- Full refinement/review loop with code-aware QA.
- Open-source/proprietary plugin separation.
- Multi-framework output support.

## Recommended Architecture

### Source-of-truth contracts

- `project-brief`
  - normalized business input
- `template-selection`
  - deterministic selected template plus ranked alternatives
- `assembly-spec`
  - pages, approved blocks, integrations, builder instructions
- `content-map`
  - approved editable content slots derived from brief + plan
- `validation-report`
  - initial QA output

### Module boundaries

- `apps/flowstarter-main/src/lib/engine/contracts.ts`
  - core contracts and schemas
- `apps/flowstarter-main/src/lib/engine/intake.ts`
  - normalization into `project-brief`
- `apps/flowstarter-main/src/lib/engine/template-registry.ts`
  - reads real library templates
- `apps/flowstarter-main/src/lib/engine/template-selector.ts`
  - deterministic selection
- `apps/flowstarter-main/src/lib/engine/block-registry.ts`
  - approved block definitions and constraints
- `apps/flowstarter-main/src/lib/engine/planner.ts`
  - assembly spec and content map
- `apps/flowstarter-main/src/lib/engine/validator.ts`
  - validation report
- `apps/flowstarter-main/src/lib/engine/pipeline.ts`
  - orchestration

### API boundary

- `/api/engine/concierge`
  - authenticated intake endpoint for concierge flow

## Step-by-Step Build Plan

### Milestone 1

- Normalize business input into `project-brief`
- Reuse existing AI enrichment only as an input helper
- Persist artifacts into draft handoff

Status: complete in this branch

### Milestone 2

- Use real template library metadata for deterministic selection
- Retire fallback-only selection paths from concierge flow

Status: partially complete in this branch

### Milestone 3

- Make builder consume `assembly-spec` instead of prompt-only project data
- Add template execution adapters per framework

Status: pending

### Milestone 4

- Add validation + refinement loop after build
- Persist build artifacts and QA outputs per project

Status: pending

### Milestone 5

- Expose limited client editor customization from approved editable fields in `content-map`

Status: pending

## Smallest Viable v1

For concierge clients, v1 should do exactly this:

1. Collect business input.
2. Normalize it into a project brief.
3. Select one approved template deterministically.
4. Produce a page/block/integration assembly plan.
5. Pass those artifacts into the editor/builder workflow.
6. Validate before delivery.

That is sufficient to move Flowstarter from “AI-assisted intake plus templates” to “first real engine pass.”

## Implemented on This Branch

- Added the engine contract set and pipeline under `apps/flowstarter-main/src/lib/engine`.
- Added `/api/engine/concierge`.
- Updated the concierge scaffold to call the engine pipeline and retain artifacts in state.
- Updated editor handoff schema/persistence so generated drafts carry engine artifacts and selected template IDs.
- Added engine-focused tests in `src/lib/__tests__/flowstarter-engine.test.ts`.
