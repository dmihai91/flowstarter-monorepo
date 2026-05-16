# Pro plan delivery

> **⚠️ Tier names and prices superseded.** `docs/FLOWSTARTER_MASTER_DECISIONS.md` is canonical. The "Pro" tier described here is now the **Ecommerce** build package: **one-time build from €1,499**, plus a **dedicated store subscription of €149/mo** (the monthly plan is decoupled from the build; the standard plans are Starter €39 / Pro €99 / Max €249). The Ecommerce package is open to everyone (no longer "coming soon"). The provider-routing logic and concierge delivery flow below remain accurate for the Ecommerce build; read "Ecommerce" for "Pro" throughout.

How Flowstarter delivers the **Pro tier** (€1,499 setup + €79/mo) when commerce is involved. Companion to `docs/CONCIERGE_COMMERCE_MODEL.md` (provider routing rationale).

## What Pro buys the client

- Everything in Starter (5–7 page site, custom domain, professional email, hosting, smart editor, ongoing support).
- Extended pages (typically 8+).
- Pre-set integrations: Mailchimp, Google Maps embed, Instagram feed, Facebook Pixel, advanced GA4.
- Commerce: depending on what the client sells, we route to one of:
  - **Stripe Payment Link / Checkout** — services, deposits, simple offers.
  - **Lemon Squeezy** — digital downloads, courses, simple SaaS (merchant-of-record handles VAT/tax).
  - **Paddle** — SaaS / software / licenses needing stronger subscription + customer-portal infra.
  - **Shopify** — real physical catalogs (variants, inventory, shipping, returns, POS, multi-channel).
  - **Mixed** — Shopify primary + Lemon Squeezy / Paddle for digital side, or Shopify with a digital-delivery app.

## What we own vs what providers own

| Layer | Owner |
|-------|-------|
| Marketing site + product display copy | **Flowstarter** (lives in our `commerce_products` rows, rendered on the client's site) |
| Lead capture, contact form, booking embed | **Flowstarter** (`leads` table) |
| Cart, checkout UI | **Provider** (Shopify checkout, Stripe Payment Link, etc.) |
| Tax calculation, VAT, sales tax nexus | **Provider** (LS is merchant-of-record; Shopify Tax; Stripe Tax) |
| Fulfillment, shipping labels, tracking | **Provider** (Shopify) |
| Inventory management, SKUs, variants | **Provider** (Shopify) |
| Refunds, chargebacks, customer support on orders | **Provider** + Flowstarter team triage |
| Subscription billing | **Provider** (Paddle, Stripe, Shopify Subscriptions) |
| Domain + DNS for storefront subdomains (e.g. `shop.client.com`) | **Flowstarter** (Cloudflare DNS via operator) |

We never reimplement cart, checkout, tax, or fulfillment.

## Delivery flow (concierge, manual at launch)

```
Discovery call (30 min)
        │
        ▼
Classify products
   • Service / deposit            → Stripe Payment Link
   • Digital downloads / courses  → Lemon Squeezy
   • SaaS / licenses              → Paddle
   • Physical goods               → Shopify
   • Mixed (digital + physical)   → Shopify + Lemon Squeezy
        │
        ▼
Team sets up provider account(s) — included in Pro setup fee:
   • Create the Shopify store / LS account / Paddle account
   • Configure tax / shipping / fulfillment in the provider
   • Add products in the provider, capture provider_product_id + checkout_url
   • Hand client their login credentials
        │
        ▼
Team mirrors product display data into Flowstarter:
   • One row per product in commerce_products (Slice 1 schema):
     name, slug, short_description, price_amount, currency,
     provider_product_id, checkout_url, delivery_url,
     fulfillment_type, inventory_policy
   • Project's commerce_mode, commerce_provider, commerce_status
        │
        ▼
Pro-tier site templates render the Products section
        │
        ▼
"Buy" buttons on the Flowstarter site link to checkout_url at the provider.
Cart / checkout / receipt happens entirely on the provider's surface.
```

## Client editor capabilities (per Slice 3)

A Pro client with `client_editor_access_level = 'commerce_basic'` can:

- Edit product display copy (name, short_description) on their Flowstarter site.
- Reorder featured products.
- Edit checkout button labels.
- Update product images displayed on landing/product sections.

A Pro client **cannot** (these escalate to team via `client_requests`):

- Change tax / shipping / fulfillment rules.
- Edit provider credentials, webhook secrets, or API keys.
- Change inventory sync settings.
- Modify refund-policy automation.

## What's still to build (follow-ups)

1. **Pro-tier site templates** — `apps/flowstarter-library/templates/*` with a Products section that pulls from `commerce_products`. Templates should support both grid (small catalog) and storefront-style (larger catalog) layouts.
2. **Pro client onboarding playbook** (this doc + a checklist) — exact steps for the team to set up Shopify / LS / Paddle accounts on a client's behalf, with screenshots.
3. **Webhook receivers** (optional v1, valuable v2):
   - Shopify Admin API webhook for `orders/create` → log to `leads` table with `source = 'commerce_order'`.
   - Lemon Squeezy webhook for `order_created` → same.
   - Lets the client dashboard show order count + recent orders without leaving Flowstarter.
4. **Storefront subdomain provisioning** — for clients who want `shop.theirdomain.com` to point to Shopify or LS storefront, we add a Cloudflare CNAME. Manual at launch; automate via the operator service later.
5. **Pro tier feature flag in admin UI** — gate the commerce + extended-integrations sections of the project detail page on `project_type = 'pro'` (or similar). Currently the admin shows commerce fields for any project.

## What's already done (Slice 1)

- `commerce_products` schema + GET/POST/PATCH/DELETE API + admin UI tab with add/edit dialog.
- Project-level `commerce_mode`, `commerce_provider`, `commerce_status`, `commerce_product_count`, `commerce_requirements`, `commerce_notes` fields surfaced in the Commerce tab on `/team/dashboard/projects/[id]`.
- Provider routing helpers (`describeCommerceProvider`) that surface in the Commerce tab as a hint for the team during setup.
- Inference helper (`inferCommercePlanFromText`) that pre-fills commerce defaults when a project draft is created from discovery-call notes.

## What's NOT built yet

- Live API sync from Shopify / LS / Paddle (we only mirror static fields right now).
- Storefront API rendering (we display copy + buttons, not live product feeds).
- Subscription dunning / lifecycle UI.

These are explicitly Phase 2 — the concierge delivery model means the team manages provider-side ops manually for the first 10–20 Pro clients.
