# Concierge Commerce Model

> **Status:** the **Ecommerce build package is open to everyone** (one-time
> build from €1,499 + a dedicated €129/mo store plan) — no longer
> "coming soon". The provider-routing model below is current and authoritative
> for how a storefront is delivered. Canonical pricing:
> `docs/FLOWSTARTER_MASTER_DECISIONS.md`.

Flowstarter should not become a custom ecommerce platform by default. The
concierge product should classify each client commerce need, choose the
lowest-risk provider, and expose only safe product/content controls to the
client editor.

## Recommendation

Use a provider ladder:

1. **Stripe Payment Links / Checkout** for services, deposits, simple products,
   small catalogs, and payment-first sites.
2. **Lemon Squeezy** for simple global digital products where merchant-of-record
   tax handling matters and setup should stay lightweight.
3. **Paddle** for SaaS, software licenses, subscriptions, or more serious global
   digital commerce.
4. **Shopify** for physical goods or mixed catalogs where inventory, shipping,
   variants, returns, fulfillment, POS, and multi-channel sales matter.
5. **Gumroad** only for the fastest creator-style digital-product launch when
   the client accepts higher per-sale fees in exchange for low setup friction.

## Why Not One Provider

Digital and physical products have different operational risks.

Digital products usually need checkout, tax/VAT handling, file/license/course
delivery, receipts, refunds, and customer access. Physical products add
inventory, SKUs, variants, shipping rates, fulfillment, returns, tracking, and
possibly POS. Treating both as "ecommerce" creates too much hidden complexity.

## Flowstarter Commerce Modes

`commerce_mode` describes how the project sells:

- `none`: no commerce
- `payment_link`: hosted checkout link or buy button
- `embedded_checkout`: checkout embedded or overlaid on the site
- `digital_delivery`: digital product checkout plus delivery/access workflow
- `external_storefront`: Flowstarter site links/embeds a provider storefront
- `managed_storefront`: Flowstarter manages product presentation while provider
  handles checkout/ops
- `custom`: bespoke cart, marketplace, membership, fulfillment, or app logic

## Product Type Routing

Digital products:

- Use Stripe when the client sells a few products/services and can manage tax
  or stays mostly local.
- Use Lemon Squeezy when they need simple global tax handling for downloads,
  courses, templates, software, or subscriptions.
- Use Paddle when the product is SaaS/software/licensing and needs stronger
  subscription, tax, fraud, and customer-portal infrastructure.
- Use Gumroad for a quick creator launch, not for margin-sensitive growth.

Physical products:

- Use Shopify for real stores: multiple products, variants, shipping, stock,
  refunds, tax, POS, social channels, fulfillment apps.
- Use Stripe only for very simple physical sales, such as one product, manual
  fulfillment, and fixed shipping.
- Avoid custom carts until the client has proven volume or unusual requirements.

Mixed products:

- Default to Shopify if physical operations are material.
- Use Shopify plus a digital delivery app, or keep digital delivery in
  Lemon Squeezy/Paddle only if the digital side is the core business.

## Client Editor Boundaries

Client can safely edit:

- Product display copy on the Flowstarter site
- Product images used on landing/product sections
- Featured products and order of sections
- Checkout button labels
- Links to provider checkout/products

Client should not directly edit:

- Tax settings
- Shipping zones/rates
- Fulfillment rules
- Payment provider credentials
- Webhook secrets
- Inventory sync settings
- Refund policy automation

Complex requests become `client_requests` and are handled by the team.

## First Implementation Slice

The foundation migration adds:

- Concierge delivery stage
- Client editor slug/status/access level/edit limit
- Commerce mode, product type, provider, status, product count, requirements
- `commerce_products` for lightweight product handoff records

This keeps the admin, editor, and future deployment pipeline provider-neutral
while still giving the team enough structure to decide what should happen next.
