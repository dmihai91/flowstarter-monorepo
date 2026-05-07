// Aligned to docs/FLOWSTARTER_MASTER_DECISIONS.md (May 2026).
// Three subscription tiers: Essential / Pro / Commerce.
// Setup fees are SEPARATE from subscriptions (Service Site / Shopify Store / Custom).
// Founding pricing for first 10 clients per tier; Standard pricing thereafter.
// Annual = 10× monthly (2 months free).
//
// Existing key names (starter / pro / commerce / custom) are preserved so the
// rendering components don't need a rename pass — only the VALUES and LABELS
// changed. Internally:
//   - "starter" key → Essential tier (Service site setup + €49/mo)
//   - "pro" key     → Pro tier        (Service site setup + €79/mo)
//   - "commerce" key→ Commerce tier   (Shopify store setup + €129/mo)
//   - "custom" key  → Custom          (from €4,999 setup + €99/mo)
//   - "growth" key  → mirror of Pro for backward compat
//   - "relaunch" key→ kept as a separate Custom-style offering (audit + rebuild)

export const landingPricingSectionKeys = {
  'landing.pricingSection.title': 'Clear pricing. EUR. No surprises.',
  'landing.pricingSection.subtitle':
    'One-time setup + monthly or annual subscription. Annual = 10× monthly (2 months free). Founding pricing for the first 10 clients per tier — second year moves to standard with 30 days notice.',
  'landing.pricingSection.socialProof':
    'First 10 clients per tier get founding pricing locked in for 12 months. First month of subscription is free after go-live.',
  'landing.pricingSection.note':
    'Spec-Match Guarantee + 4-stage milestone payments + 30-day editor trial.',
  'landing.pricingSection.relaunchNote':
    "Already have a site that isn't converting? Ask about Flowstarter Relaunch on your discovery call.",
  'landing.pricingSection.customNote':
    'Need bespoke integrations or a complex web app? Custom plan starts from €4,999 setup (€2,999 founding).',
  'landing.pricingSection.guarantee':
    'Setup is paid in 4 milestones (signing / mockup / staging / go-live). Refund only if we do not deliver per the signed spec. First 30 days of subscription are free; cancel before month 2 to keep the site at no recurring cost.',
  'landing.pricingSection.kicker': 'Pricing',
  'landing.pricingSection.foundingBadge': 'Founding price',
  'landing.pricingSection.foundingNote': 'Locked for 12 months',
  'landing.pricingSection.annualBadge': 'Save 2 months',

  // ─── Essential — service site, simple presentation ────────────────────────
  'landing.pricingSection.starter.name': 'ESSENTIAL',
  'landing.pricingSection.starter.label': 'Simple presentation site',
  'landing.pricingSection.starter.setupPrice': '€799',
  'landing.pricingSection.starter.setupOriginalPrice': '€1,499',
  'landing.pricingSection.starter.monthlyPrice': '€39/mo',
  'landing.pricingSection.starter.monthlyOriginalPrice': '€49/mo',
  'landing.pricingSection.starter.annualPrice': '€390/year',
  'landing.pricingSection.starter.annualOriginalPrice': '€490/year',
  'landing.pricingSection.starter.feature1':
    'Service-site Astro template, custom-designed for your brand',
  'landing.pricingSection.starter.feature2':
    'Up to 5 pages — home, about, services, contact, one extra',
  'landing.pricingSection.starter.feature3':
    'Custom domain, professional email, hosting on Hetzner',
  'landing.pricingSection.starter.feature4':
    'Online booking + contact form (leads land in your inbox)',
  'landing.pricingSection.starter.feature5':
    'AI-powered editor — 15 sessions/month for self-service edits',
  'landing.pricingSection.starter.feature6':
    'Visitor analytics + page-view tracking',
  'landing.pricingSection.starter.feature7':
    'First month free, locked at founding rate for 12 months',
  'landing.pricingSection.starter.feature8':
    'Spec-Match Guarantee — refund if not delivered per signed spec',
  'landing.pricingSection.starter.feature9':
    '4-stage milestone payments: signing, mockup, staging, go-live',
  'landing.pricingSection.starter.cta': 'Claim your Essential spot',

  // ─── Relaunch — audit + rebuild of an existing site ──────────────────────
  'landing.pricingSection.relaunch.name': 'RELAUNCH',
  'landing.pricingSection.relaunch.label':
    'Your existing site, rebuilt to convert',
  'landing.pricingSection.relaunch.setupPrice': 'from €999',
  'landing.pricingSection.relaunch.monthlyPrice': '€49/mo or €490/year',
  'landing.pricingSection.relaunch.feature1':
    'Full audit of what is costing you leads',
  'landing.pricingSection.relaunch.feature2':
    'Content migration from your existing site',
  'landing.pricingSection.relaunch.feature3':
    'SEO redirect mapping so you keep your rankings',
  'landing.pricingSection.relaunch.feature4':
    'New structure built around conversion',
  'landing.pricingSection.relaunch.feature5':
    'Same AI editor + 15 sessions/mo as Essential',
  'landing.pricingSection.relaunch.feature6':
    'Spec-Match Guarantee + 4-stage milestone payments',
  'landing.pricingSection.relaunch.feature7': 'First month free',
  'landing.pricingSection.relaunch.feature8':
    'Includes Essential tier subscription',
  'landing.pricingSection.relaunch.cta': 'Claim your Relaunch spot',

  // ─── Pro — service site, advanced (multi-page, blog, integrations) ────────
  'landing.pricingSection.pro.name': 'PRO',
  'landing.pricingSection.pro.label': 'Advanced multi-page site with blog',
  'landing.pricingSection.pro.setupPrice': '€799',
  'landing.pricingSection.pro.setupOriginalPrice': '€1,499',
  'landing.pricingSection.pro.monthlyPrice': '€59/mo',
  'landing.pricingSection.pro.monthlyOriginalPrice': '€79/mo',
  'landing.pricingSection.pro.annualPrice': '€590/year',
  'landing.pricingSection.pro.annualOriginalPrice': '€790/year',
  'landing.pricingSection.pro.badge': 'Most popular',
  'landing.pricingSection.pro.feature1':
    'Everything in Essential, plus extended pages',
  'landing.pricingSection.pro.feature2':
    'Blog with CMS-style editing in the AI editor',
  'landing.pricingSection.pro.feature3':
    'Mailchimp newsletter integration + Stripe Payment Links',
  'landing.pricingSection.pro.feature4':
    'Google Maps embed, Instagram feed, Facebook Pixel',
  'landing.pricingSection.pro.feature5':
    'Traffic-source analytics + visitor trends',
  'landing.pricingSection.pro.feature6':
    'AI editor — 50 sessions/month (rolls over up to 75)',
  'landing.pricingSection.pro.feature7':
    'First month free, founding rate locked for 12 months',
  'landing.pricingSection.pro.feature8':
    'Spec-Match Guarantee + 4-stage milestone payments',
  'landing.pricingSection.pro.cta': 'Claim your Pro spot',

  // ─── Commerce — Shopify store (or Astro headless when justified) ─────────
  'landing.pricingSection.commerce.name': 'COMMERCE',
  'landing.pricingSection.commerce.label': 'Shopify store, designed and built',
  'landing.pricingSection.commerce.setupPrice': '€1,799',
  'landing.pricingSection.commerce.setupOriginalPrice': '€2,999',
  'landing.pricingSection.commerce.monthlyPrice': '€99/mo',
  'landing.pricingSection.commerce.monthlyOriginalPrice': '€129/mo',
  'landing.pricingSection.commerce.annualPrice': '€990/year',
  'landing.pricingSection.commerce.annualOriginalPrice': '€1,290/year',
  'landing.pricingSection.commerce.feature1':
    'Custom Shopify Liquid theme tailored to your brand',
  'landing.pricingSection.commerce.feature2':
    'Product catalog setup, checkout configured, tax + shipping handled',
  'landing.pricingSection.commerce.feature3':
    'Astro headless option for performance-critical stores (Phase 2)',
  'landing.pricingSection.commerce.feature4':
    'Email + SMS notifications, abandoned cart recovery',
  'landing.pricingSection.commerce.feature5':
    'AI editor — 75 sessions/month (rolls over up to 110)',
  'landing.pricingSection.commerce.feature6':
    'Pay-per-extra at €1/session beyond limit, or upgrade conversation',
  'landing.pricingSection.commerce.feature7':
    'First month free, founding rate locked for 12 months',
  'landing.pricingSection.commerce.feature8':
    'Spec-Match Guarantee + 4-stage milestone payments',
  'landing.pricingSection.commerce.cta': 'Claim your Commerce spot',

  // ─── Growth (kept as backward-compat mirror of Pro for older components) ──
  'landing.pricingSection.growth.name': 'PRO',
  'landing.pricingSection.growth.label': 'Advanced multi-page site with blog',
  'landing.pricingSection.growth.setupPrice': '€799',
  'landing.pricingSection.growth.monthlyPrice': '€59/mo',
  'landing.pricingSection.growth.badge': 'Most popular',
  'landing.pricingSection.growth.feature1':
    'Everything in Essential, plus extended pages',
  'landing.pricingSection.growth.feature2':
    'Blog with CMS-style editing in the AI editor',
  'landing.pricingSection.growth.feature3':
    'Mailchimp newsletter + Stripe Payment Links',
  'landing.pricingSection.growth.feature4':
    'Google Maps, Instagram feed, Facebook Pixel',
  'landing.pricingSection.growth.feature5':
    'Traffic analytics + visitor trends',
  'landing.pricingSection.growth.feature6': '50 AI editor sessions/month',
  'landing.pricingSection.growth.feature7':
    'First month free, founding rate for 12 months',
  'landing.pricingSection.growth.feature8':
    'Spec-Match Guarantee + 4-stage milestones',
  'landing.pricingSection.growth.cta': 'Claim your Pro spot',

  // ─── Custom — bespoke integrations, web apps, complex features ────────────
  'landing.pricingSection.custom.name': 'CUSTOM',
  'landing.pricingSection.custom.label':
    'Bespoke integrations or a custom web app',
  'landing.pricingSection.custom.setupPrice': 'from €2,999',
  'landing.pricingSection.custom.setupOriginalPrice': 'from €4,999',
  'landing.pricingSection.custom.monthlyPrice': '€99/mo',
  'landing.pricingSection.custom.annualPrice': '€990/year',
  'landing.pricingSection.custom.feature1':
    'Fully custom design + architecture, not a template',
  'landing.pricingSection.custom.feature2':
    'Complex integrations (FANBox, customer accounts, custom cache, etc.)',
  'landing.pricingSection.custom.feature3':
    'Multi-page site or full web application',
  'landing.pricingSection.custom.feature4':
    'Astro headless storefront with Storefront API (Phase 3)',
  'landing.pricingSection.custom.feature5':
    'Dedicated project manager, priority support',
  'landing.pricingSection.custom.feature6':
    'AI editor with custom session limits — sized to project',
  'landing.pricingSection.custom.feature7':
    'Spec-Match Guarantee + custom milestone schedule',
  'landing.pricingSection.custom.feature8':
    'First month free, founding pricing if among the first 10 of this tier',
  'landing.pricingSection.custom.feature9':
    'Add-ons: FANBox €500-800, customer 2FA €400-600, SEO audit €200-400',
  'landing.pricingSection.custom.cta': 'Discuss your project',
} as const;
