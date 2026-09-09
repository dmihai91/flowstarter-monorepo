# Flowstarter agent architecture

## Lifecycle

```text
INTAKE
  -> scrape text + images
  -> Brand Intelligence Agent -> validated BrandConfig
  -> template selector -> Flowstarter Library MCP search/details/scaffold
  -> bounded preview coding agent -> validation -> isolated preview
PREVIEW_READY
  -> Stripe Checkout charges exactly 20% of the server-owned quote
DEPOSIT_PAID
  -> durable build job -> isolated client/flowstarter-<uuid> worktree
  -> full-site coding agent -> tests/format/SEO/sitemap/integrations -> internal PR
AGENTS_WORKING -> HUMAN_QA
  -> human typography/spacing polish and explicit approval
  -> Stripe charges remaining 80%
  -> monthly or yearly care subscription becomes active/trialing
  -> production deploy, custom domain and SSL
LIVE_SUBSCRIPTION
  -> guardrailed inline content editor; atomic commits and incremental deploys
```

State transitions are intentionally monotonic. Payment webhooks cannot skip
preview approval; deploy workers cannot skip human QA, final payment, or the
recurring subscription gate.

## Code map

- `packages/agentic-codegen/src/flowstarter/types.ts`: intake, social targets,
  brand config, template and lifecycle contracts.
- `state-machine.ts`: allowed transitions and exact 20/80 minor-unit math.
- `brand-config.ts`: strict JSON/key/hex/voice validation and WCAG contrast
  calculation.
- `intake-guard.ts`: deterministic public-input, consent, social-host and
  prompt-injection screening before scraper or model work begins.
- `editor-policy.ts`: server-side operator/client capability routing. Content
  reaches the micro-agent; wider client requests become maintenance tickets.
- `prompts.ts`: production system prompts for brand intelligence, template
  selection, preview/full builds and the inline editor.
- `template-library-mcp.ts`: authenticated Streamable HTTP MCP client for
  `search_templates`, `get_template_details` and `scaffold_template`.
- `pi-sdk.ts`: isolated Pi SDK sessions and Flowstarter-owned bounded tools.
- `workflows.ts`: preview and full-site orchestration pipelines.
- `worktree.ts`: shell-free `execFile` git worktrees with validated UUID branch
  names and repository containment.
- `apps/flowstarter-main/src/lib/flowstarter/deposit-workflow.ts`: signed Stripe
  event verification, durable/idempotent build queueing and production gate.
- `apps/flowstarter-main/src/app/api/flowstarter/projects/[id]/deposit-checkout/route.ts`:
  client Checkout creation using only the server-owned quote.
- `apps/build-worker/`: the private Pi worker. Serves the `/jobs/full-site`
  dispatch that `deposit-workflow.ts` calls, and drives `FullSiteBuildWorker`
  with a Supabase-backed job store, a bounded concurrency queue, trusted
  install/build validation and a GitHub draft-PR publisher.
- `supabase/migrations/20260810121819_flowstarter_agent_workflow.sql`: lifecycle,
  artifacts and service-role-only job ledger.

## Template MCP contract

The model receives only two read-only tools during selection:

1. `search_templates` with niche, location, desired pages, tone and features.
2. `get_template_details` for at most four slugs returned by search.

After the model returns one discovered slug, trusted application code invokes
`scaffold_template`. The scaffold payload is bounded by file count and byte
size, and every relative path is checked before it is written. The model never
sees the MCP internal token and never chooses a filesystem destination.

Canonical templates live in `apps/flowstarter-templates/*/config.json`.
Templates with `catalogEnabled: false` remain on disk but cannot be selected.

## Agent boundaries

The analysis agent has no tools. The template selector has MCP catalog reads
only. Preview and full-build sessions do not use Pi's general filesystem or
shell tools; they receive Flowstarter-owned `read_file`, `write_file` and
`edit_file` tools rooted to a real-path-verified workspace. Absolute paths,
traversal, backslashes, symlink escapes, `.git`, dependency folders, lockfiles,
environment/secrets, package manifests and CI configuration are rejected.

Preview writes are narrower still: content/data/style token surfaces and
Flowstarter preview assets only. Structural template code remains immutable
until the deposit webhook creates the isolated full-build worktree.

The inline editor has exactly one tool, `modify_element_content`. It accepts
one known `data-flowstarter-id` and plain text. It has no filesystem, layout,
package, network, Git or deployment access; trusted application code creates
the atomic commit after validating the returned content.

The editor follows the operator/client split adopted from the newer
Flowstarter editor prototype. Operators retain an isolated full workbench.
Clients with an active care subscription receive only the localized content
micro-agent. Image, color, font, section, layout, integration and code requests
are routed to the Flowstarter maintenance queue; hiding those controls in the
browser is never treated as authorization.

## Payment and deployment invariants

- Amounts are calculated in integer minor units from `final_value_minor`.
- Deposit is exactly 20%; balance is the exact remainder, so rounding cannot
  lose a cent.
- Stripe signature validation precedes all mutations.
- A unique `(workspace_id, FULL_SITE_BUILD)` job and unique Stripe event ID make
  webhook redelivery idempotent.
- `payment_intent.succeeded` must match workspace, currency, state and expected
  amount before it can enqueue a build.
- Final invoice payment does not mark a site live.
- Production activation requires `HUMAN_QA`, final payment and a real Stripe
  subscription ID with an active/trialing status.

## Required deployment services

- Scraper workers for Instagram/LinkedIn targets, subject to platform terms and
  user authorization, writing normalized corpus records and private image
  objects.
- Private template-library MCP service.
- Private Pi worker with an approved provider/model and build-validator image.
- PostgreSQL/Supabase for durable state and the job ledger.
- Stripe Checkout/webhooks for 20/80 and recurring billing.
- PR/staging publisher and Vercel Platforms deployment adapter.
- Object storage with short-lived signed URLs and tenant-scoped keys.

Secrets belong only in the relevant server/worker environment. Never prefix
provider keys, service-role credentials, internal MCP tokens or worker secrets
with `NEXT_PUBLIC_`.
