# Flowstarter — Master Decision Document

*Consolidated snapshot of strategic, technical, and pricing decisions from the planning session.*

**Date:** May 2026
**Status:** Pre-implementation, decisions awaiting final review with Dorin
**Authority:** This document is the **source of truth** for code agents. If a request contradicts decisions here, flag the contradiction rather than silently overriding.

---

## Table of Contents

1. [About Flowstarter](#about-flowstarter)
2. [Product Strategy](#product-strategy)
3. [Technical Stack](#technical-stack)
4. [Editor Architecture](#editor-architecture)
5. [Pricing Schema](#pricing-schema)
6. [Founding Customer Model](#founding-customer-model)
7. [Execution Pipeline](#execution-pipeline)
8. [Open Decision Points](#open-decision-points)
9. [Identified Anti-Patterns](#identified-anti-patterns)

---

## About Flowstarter

Flowstarter is a **concierge service** that builds and maintains websites and online stores for businesses needing a professional online presence without the friction of traditional development.

The team consists of **Darius** (lead engineering — full-stack, infrastructure, AI integration) and **Dorin** (design + client relationships + business development). Revenue split is **70/30** in favor of Darius for projects involving heavy technical work.

Each site/store is built by operators using high-quality templates, AI-assisted code generation, and custom design. After delivery, the client receives an **AI-powered constrained editor** for self-service modifications, while operators handle anything outside the editor's scope through a maintenance contract.

### Two Market Segments

- **Service businesses** (coaches, consultants, photographers, freelance creatives) on Astro-based sites
- **E-commerce merchants** on Shopify Liquid stores (or Astro headless when justified)

### Two Geographic Markets with Unified Pricing

- **Romania** — local approach through Dorin's network
- **Western Europe** — approach through digital channels (Shopify Experts directory, outbound, personal brand)

**All prices displayed in EUR** on the official website (English) — a single set of prices for all markets.

For Romanian clients, **invoicing is done in RON** at the BNR (National Bank of Romania) exchange rate on the invoice date (Romanian legal requirement), managed through accounting software. This doesn't affect the client's experience on the site (they see EUR pricing), only back-office operations.

The English website + EUR pricing signals "European agency, not local freelancer" — important for premium positioning.

---

## Product Strategy

### Technical Defaults

- **Default Astro** for service sites and simple e-commerce with performance requirements
- **Shopify Liquid** when client requirements force it (specific Shopify apps, FANBox-style native integrations, ecosystem familiar to client)
- **Astro headless with Storefront API** for premium e-commerce wanting performance + custom design
- **NOT Web Components over Liquid** — antipattern that combines disadvantages of both approaches

### Per-Client Decision Framework

**Forces Liquid (clear signals):**
- Client already has a Shopify store and doesn't want migration
- Specific requirements for Shopify apps without API equivalents
- High transactional volume where checkout redirect would cost conversions
- Client team already uses Shopify admin

**Astro works fine (the default):**
- New store, no Shopify history
- Small-medium catalog (under 500 products)
- Reasonable third-party integration requirements
- Client prioritizes performance, design, branding over Shopify ecosystem

### Product Roadmap

**Phase 1 (now, first 4-8 weeks):** Editor v1 on Astro for service sites. Forking T3 Code + Claude Code backend + multi-tenant on VPS. Deliver first 2-3 clients with testimonials + case studies.

**Phase 2 (2-4 months):** Add Shopify Liquid support to editor. Onboard first e-commerce clients.

**Phase 3 (6+ months):** Astro headless with Storefront API as premium offer for performance-critical e-commerce.

**Phase 4 (12+ months):** Self-serve tier? Open-source layer? — decision based on data.

---

## Technical Stack

### Editor (Flowstarter Editor)

- **Foundation:** Fork of T3 Code (https://github.com/pingdotgg/t3code) — minimal web GUI for coding agents
- **AI Backend:** Claude Code (validated by Darius on the lebadusul client for Liquid editing)
- **Reviewer pattern:** Claude Code in execution + secondary reviewer for pre-validation
- **Auth:** Clerk for login/sessions
- **Database:** Supabase Postgres with RLS policies gated by Clerk JWTs
- **Deployment:** Single deployment, multi-tenant via subdomain routing
- **Per-client workspace:** linked to local Shopify theme or Astro project, sync via Shopify CLI or git
- **Hosting:** Hetzner VPS (**CPX22** for launch, scale up when justified)

### Roles and UI

- **Admin role** (Darius + Dorin): full T3 Code dev UI — file tree, terminal, raw code editor, full agent access
- **Client role:** stripped-down constrained UI — chat + operation buttons, no file tree, no terminal, no raw code editing
- Both roles use the same codebase, role-based UI gating

### Constraints Layer

- Strict system prompt for Claude Code in client mode (limited to text, images, colors, fonts, section visibility, section order, content within existing sections)
- UI with operation buttons that pre-fill structured prompts (stronger constraint than free chat)
- Separate validator that pre-checks requests before execution (anti-prompt-injection and scope creep prevention)

### Frontend Stack for Delivered Sites

- **Service sites:** Astro + Tailwind (Flowstarter templates)
- **Stores:** Shopify Liquid theme (Dawn-based or custom template)

---

## Editor Architecture

### Multi-Tenant Model

Single deployment serves multiple clients via subdomain routing:
- `client1.flowstarter.app` → workspace 1 → theme/project 1
- `client2.flowstarter.app` → workspace 2 → theme/project 2
- Each client sees ONLY their own workspace

Routing happens at runtime by reading `req.headers.host`, lookup in Supabase for workspace metadata.

### Workspace Data Model

Each workspace contains:
- **Type:** `"astro"` or `"shopify-liquid"`
- **Theme path:** local folder on VPS, sync via git (Astro) or Shopify CLI (Liquid)
- **Dev environment:** preview URL (dev server for Astro, Shopify dev store for Liquid)
- **Production target:** live deploy URL + push credentials
- **Client metadata:** name, billing info, role, founding status
- **Usage tracking:** sessions used current month, tokens consumed (internal)

### Sync and Publish Flow

**Astro:**
1. Editor modifies files locally on VPS
2. Preview via dev server (separate subdomain)
3. Client clicks "Publish" → git push to repo + automatic deploy (Cloudflare Pages or VPS)
4. Pre-publish snapshot for one-click rollback

**Shopify Liquid:**
1. Editor modifies theme files locally on VPS
2. Preview via Shopify dev store (sync via Shopify CLI)
3. Client clicks "Publish" → `shopify theme push` to live store
4. Pre-publish snapshot for one-click rollback

### Operations Layer

- Detailed logging per request (input, output, tokens, duration)
- Automatic snapshots before each publish
- One-click rollback to previous version
- Per-client rate limiting (sessions/month enforced)
- Soft blocks at limit with upgrade prompts

---

## Pricing Schema

### Philosophy

- **All prices displayed in EUR** on the official website (English)
- **Single currency** for international consistency
- **Invoicing for Romanian clients** done in RON at BNR exchange rate on invoice date (Romanian legal requirement)
- English website + EUR pricing signals European agency, not local freelancer

> **Updated (this revision):** pricing was restructured. The build (one-time
> setup) and the monthly plan are now **decoupled** — the client picks a build
> package and, separately, a monthly plan sized by AI edit sessions. Prices
> were tuned down for Romanian-market reach and the storefront tier was opened
> to everyone (no longer "coming soon"). The tables below reflect what is
> shipped in code (`landing-copy.ts`, `discovery.logic.ts`).

### Setup Fees — one-time build package

| Build package | From | Notes |
|---------------|------|-------|
| Starter (service site) | €799 | 5–7 page custom site |
| Pro (service+) | €1,199 | More pages, integrations, Stripe for digital products |
| Ecommerce / Commerce | €1,499 | Full Shopify-style storefront, open to everyone |
| Custom | €2,499 | Bespoke build / integrations, scoped on the call |

### Monthly Plan — independent of the build

The subscription is chosen separately from the build and sized by AI edit
sessions. Change or cancel anytime; first month free.

> **AMENDMENT (pending Dorin sign-off — explicit instruction from Darius,
> 2026-05-16):** restructured around the autorouter + per-session
> AI-cost caps + a capability ladder. Runtime source of truth is
> `apps/flowstarter-editor/server/src/usage/planEntitlements.ts`
> (`PLAN_ENTITLEMENTS`); this table mirrors it. The €/session cap and
> the monthly soft/hard thresholds are internal cost guards, not
> customer-facing prices. Ecommerce repositioned to €129/mo with 90 AI
> edit sessions ("Pro+", was €149/60); cost guards scaled down
> proportionally (soft 43, hard 95). Starter monthly raised €39→€49
> (2026-05-16, explicit Darius instruction); launch-discount /
> rate-lock scaffolding dropped — one price: €799 setup + €49/mo.

| Plan | Price | AI edit sessions/mo | €/session cap | Model access | Edit scope | Store ops |
|------|-------|---------------------|---------------|--------------|-----------|-----------|
| Starter | €49/mo | 30 | €1 | Autorouter, locked to small models (sonnet-4.6 / gpt-5.4-mini) | Constrained | — |
| Pro | €99/mo | 60 | €2 | Autorouter + manual model picker | Constrained | — |
| Max | €249/mo | 120 | €3 | Pro + code experimentation (break-risk warning; paid help €20/h) | Code | — |
| Ecommerce | €129/mo | 90 | €2 | Pro+ (more sessions than Pro) | Constrained | Products + collections (separate allowance) |

Internal cost guards (EUR, not shown to customers, tunable in
`planEntitlements.ts`): a monthly **soft threshold** fires an
upgrade/buy-extra nudge (Starter ≈ €25); a monthly **hard ceiling** is a
margin circuit-breaker that soft-blocks and routes the user to a custom
contract (Max = €190 on the €249 plan).

The **Ecommerce** build package still auto-applies its dedicated store
plan for Commerce builds; store editing (products + collections) draws
from a separate store-ops allowance, not the AI-edit-session pool.

### Booking Deposit (pre-call)

To book the discovery call the prospect pays a deposit via Stripe Checkout
(`/api/discovery/deposit`):

| Build tier | Deposit |
|-----------|---------|
| Starter | €79 (10% of €799) |
| Pro | €119 (10% of €1,199) |
| Commerce | €149 (10% of €1,499) |
| Custom | €199 (flat — open-ended scope) |

Refundable in full after the call, before any build work starts. Credited
toward the setup fee if the client proceeds. The Stripe webhook
(`checkout.session.completed`, `kind=booking_deposit`) emails the team;
refunds are issued manually from the Stripe dashboard. Fails open: if Stripe
is unconfigured the funnel proceeds straight to Calendly.

### Billing Rules

- All prices in **EUR**, single set for all markets (RO invoiced in RON at
  BNR rate, back-office only).
- One-time build billed 50% upfront / 50% on sign-off (the existing
  admin-side deposit/final invoice flow in `src/lib/billing/stripe.ts`).
- Monthly plan is a separate Stripe subscription, first month free.
- The pre-call booking deposit is a one-off Stripe Checkout payment,
  separate from both of the above and credited into milestone 1 on proceed.

### Client Guarantees (Three Layers)

#### 1. Spec-Match Guarantee (on setup)

- Discovery session + detailed written spec, signed by both parties
- Full refund on undelivered component if not delivered per spec

#### 2. Milestone Payments (on setup)

**Founding clients (1–10 per tier): 50/50.**
| Milestone | % of setup | Triggered by |
|-----------|-----------|--------------|
| 1. Deposit | 50% | Spec signed by client |
| 2. Final | 50% | Go-live approved |

**Standard pricing (post-founding): 4×25% milestones.**
| Milestone | % of setup | Triggered by |
|-----------|-----------|--------------|
| 1. Contract signing | 25% | Spec approved by client |
| 2. Design mockup approved | 25% | Client approves Dorin's design |
| 3. Complete build on staging | 25% | Client tests site on staging URL |
| 4. Go-live | 25% | Client approves launch on live domain |

**Why hybrid:** at founding pricing (€799 setup), each 25% chunk is €200 — invoicing overhead exceeds cash-flow benefit. At standard pricing (€1,499–€2,999), 25% chunks justify the operational complexity. Decision: ship 50/50 for v1 with `setup_payment_milestones` schema in place; switch to 4×25% when standard pricing kicks in (estimate: after the first 10 founding clients per tier).

#### 3. 30-Day Editor Trial (on subscription)

First 30 days of subscription are free after go-live. Auto-converts at end unless cancelled.

### Consolidated Refund Policy

- **On setup:** refund only if not delivered per signed spec (Spec-Match Guarantee). Otherwise final at each milestone.
- **On subscription:** first 30 days free (Editor Trial), no refund applies.
- **After 30 days on annual:** pro-rated refund on remaining months if cancelled.
- **After 30 days on monthly:** cancellation stops next month, no refund on current.

### Founding Lock-in

- **12 months at founding price** regardless of billing interval
- **At renewal, price moves to standard** with 30-day notice
- Protects "limited launch offer" positioning, not permanent discount

### Subscription Rules

**"Session" definition:** Open editor → any activity → 30 min inactivity or close = end session. Reopening after 30 min = new session.

**Behavior at limit:**
- **Essential:** soft block + upgrade prompt to Pro (no pay-per-extra)
- **Pro:** soft block + upgrade prompt to Commerce OR pay-per-extra at €1/session
- **Commerce:** pay-per-extra at €1/session

**Rollover:** up to 50% above monthly limit.

**Backend:** internal logging of tokens per client per session. Human intervention on outliers.

### Indicative Add-ons (Custom)

- FANBox / pickup point integration: €500-800
- Customer accounts with 2FA: €400-600
- Admin-configurable homepage widget: €300-500
- SEO audit + Yoast/meta optimization: €200-400
- Custom cache layer: €300-500

---

## Founding Customer Model

### Eligibility

- **First 10 clients per tier** (separate counts for service sites and stores)
- Accepts explicit trade terms
- Hard limit on spots, not time-based

### Explicit Trade

In exchange for founding pricing, client commits to:
1. **Written testimonial** within first 60 days post-launch
2. **Permission for public case study** with their name + screenshots
3. **Minimum 1 referral** to another potential client

### Public Communication

- Standard price displayed as "regular"
- Founding price as "Limited launch offer"
- Spots remaining visible in real-time
- Format: "~~€1,499~~ **€799** Founding price — 7 of 10 spots left"

### Transition

At 8/10 spots → LinkedIn post "2 founding spots left, after that prices return to standard"

---

## Execution Pipeline

### Week 1: Foundation
- Fork T3 Code on GitHub
- Spike on T3 Code + Claude Code (10 defined test cases)
- VPS Hetzner CPX22 setup with Ubuntu 24.04
- Pricing document review with Dorin

### Weeks 2-3: Core Editor
- Auth integration (Clerk + Supabase RLS)
- Role-based UI gating (admin vs client)
- Constraints layer for Claude Code
- Operation buttons in client UI

### Weeks 4-5: Multi-Tenant + Workspace
- Subdomain routing
- Workspace data model in Supabase
- Astro workspace integration (git sync)
- First end-to-end test

### Weeks 6-8: Polish + First Delivery
- Snapshots and rollback
- Rate limiting and usage tracking
- Onboarding flow for founding clients
- Deliver first client

### Month 3+: Shopify Liquid Support
- Add Shopify workspace type to editor
- Shopify CLI integration

### Month 6+: Scale and Adjustments

---

## Open Decision Points

1. **Payments and RON Conversion** — invoicing software (SmartBill / FacturaPlus / Oblio); Stripe as primary
2. **VAT and Cross-Border Invoicing** — needs cross-border B2B fiscal consultant before first EU client
3. **Guarantees and Refund** — fully decided; T&C drafting required
4. **Session UI** — how to display "8/15 sessions used"; warning thresholds
5. **Branding** — company structure (RO SRL / UK Ltd / Estonian); LinkedIn profiles
6. **Lead Generation Channel for EU** — Shopify Experts directory; cold outbound; personal brand
7. **Real Pipeline with Dorin** — RO vs EU lead counts; service vs e-commerce focus

---

## Identified Anti-Patterns

1. **Real-time Rationalization** — strategic decisions on documents, not real-time. Sleep on it.
2. **Scope Expansion + Price Reduction** — any scope creep requires reciprocity.
3. **"Behind the Scenes" Complexity** — before adding hidden complexity, verify the real scenario.
4. **Drift Under Fatigue** — recognize signs (changing direction multiple times within an hour).
5. **Self-Undervaluation as Technical Founder** — math on total 12-month value, not production cost.
6. **Pricing Compromise for Both Markets** — single set of EUR prices, premium European positioning.

---

## Notes for AI Agents Using This Document

- All architectural decisions in sections 3-4 are firm
- All pricing in section 5 is firm; do not modify pricing logic without explicit instruction
- Constraints in section 4 (what client role can/cannot do) are core to the product
- If a request contradicts decisions here, flag the contradiction rather than silently overriding
- Anti-patterns in section 9 are warning signs

This document represents extensive thinking and trade-off analysis. Treat it as the source of truth.

---

*Document maintained by Darius. Send updates to Dorin for ongoing alignment.*
