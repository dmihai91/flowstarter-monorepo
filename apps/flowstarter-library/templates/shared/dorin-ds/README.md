# Dorin DS — Shared Design Kit

A faithful adaptation of Dorin Andrei's portfolio design language, packaged as a
template-agnostic Astro kit. Used by every Flowstarter template to share one
typography system, one motion vocabulary, and one set of primitives — while
leaving each template room to express its own personality through a single
accent color.

## What's invariant (the same across every template)

- **Type pairing** — Clash Grotesk (display, uppercase, -0.02em tracking) +
  Inter (body, 1.6 line-height) + Space Grotesk fallback for older browsers.
- **Surface** — `#F9F7F1` cream paper / `#0a0a0a` near-black ink. Never pure
  white, never pure black. Dark sections inverse: ink background, paper text.
- **Spatial rhythm** — `1200px` container, `100px` section padding (`64px`
  mobile), 24px container padding. Section padding shrinks to `60px`
  (`compact`) or `40px` (`tight`) variants.
- **Motion** — staggered word reveals (70ms cascade), card hover lifts (-8px),
  fill-from-left outline buttons. All respect `prefers-reduced-motion`.
- **Hard nos** — no rounded-full pills (except `TagPill`), no gradient buttons,
  no shadow as primary affordance, no decorative emojis, no centered marketing
  paragraphs.

## What varies (per-template accent)

Each template sets `data-template="<slug>"` on `<html>`. The kit's
`tokens.css` swaps `--brand-primary` (and `--accent`, `--accent-light`)
accordingly:

| Template              | Accent       | Hex       | Feel                          |
| --------------------- | ------------ | --------- | ----------------------------- |
| `coach-pro`           | Coral        | `#fb8857` | Authoritative, energetic      |
| `therapist-care`      | Sage         | `#7C9885` | Calm, grounded, trust-first   |
| `freelancer-portfolio`| Periwinkle   | `#B3B6FF` | Studio, considered, editorial |
| `fitness-coach`       | Terracotta   | `#E07856` | Warm, urgent, embodied        |
| `creative-portfolio`  | Ochre        | `#D4A574` | Tactile, gallery-considered   |

## How a template consumes the kit

```astro
---
// src/layouts/Layout.astro
import '../../../shared/dorin-ds/tokens.css';
import '../../../shared/dorin-ds/reset.css';
import DSHead from '../../../shared/dorin-ds/components/DSHead.astro';
---
<!doctype html>
<html lang="en" data-template="coach-pro">
  <head>
    <DSHead title="Sarah Bennett — Executive Coaching" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

Then pages compose from `shared/dorin-ds/components/*` instead of writing their
own primitives. See `coach-pro/src/pages/index.astro` as the canonical example.

## Component inventory

- `Layout primitives`: `DSHead.astro`, `SectionBlock.astro`, `Container.astro`
- `Type`: `SectionHeading.astro`, `OverlineText.astro`, `MultiLineTitle.astro`,
  `AnimatedWordTitle.astro`
- `Action`: `ActionButton.astro`, `IconLinkList.astro`
- `Cards`: `ServiceCard.astro`, `CaseStudyCard.astro`, `PricingCard.astro`,
  `TestimonialBlock.astro`
- `Lists`: `NumberedFeatureItem.astro`, `FaqAccordionItem.astro`,
  `TagPill.astro`, `StatItem.astro`
- `Layout chrome`: `Header.astro`, `Footer.astro`, `BrandLogo.astro`

All components ship their own scoped `<style>` block. No external CSS
dependencies beyond `tokens.css` + `reset.css`.

## Why we don't use Tailwind here

Dorin's templates don't use it, and forcing Tailwind on top would either
duplicate tokens or fight the design language. Hand-authored CSS scoped to each
component matches the editorial aesthetic and keeps each template's bundle
small (no JIT pass, no purge config, no plugin chain).
