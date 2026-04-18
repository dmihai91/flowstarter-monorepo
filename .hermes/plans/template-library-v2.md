# Template Library V2 — Implementation Plan
_Written: April 2026_

## Goal
Build 21 production-quality Astro 5 templates (7 industries × 3 visual variations) matching or exceeding the freelancer-portfolio standard. Each template is standalone with 4 pages, 6 palettes, 3 font options, and 3 functional widgets.

---

## Architecture Decisions

### Tech stack (per template)
- Astro 5, pure CSS custom properties, zero Tailwind
- Single content file: `src/content/site-labels.md` (YAML frontmatter)
- `npm install` + `npm run build` (excluded from pnpm workspace)
- `astro.config.mjs`: `base: '/templates/{slug}/'`, `outDir: '../../preview-dist/templates/{slug}'`

### Widget endpoints (points to our backend at flowstarter.dev)
All widgets POST to `https://flowstarter.dev/api/...`. During preview the widgets display a UI placeholder — a styled form that submits to the real endpoint once `data-project-id` is injected by the editor.

```
Booking widget  → inline embed block + "Book a Call" CTA
                  POST target: handled via Calendly/Cal.com embed URL stored in project config
                  Preview state: styled placeholder with calendar icon + "Booking will be configured in your dashboard"

Newsletter widget → email capture form
                  POST: https://flowstarter.dev/api/leads/capture
                  Body: { projectId, email, source: 'newsletter' }
                  Preview: same form, projectId = '__PREVIEW__' (backend ignores)

Lead capture widget → full contact form (name, email, phone, message)
                  POST: https://flowstarter.dev/api/leads/capture
                  Body: { projectId, name, email, phone, message, source: 'contact' }
                  Preview: same form works live (projectId placeholder shown)
```

### Widget component contract
Each widget is a standalone `.astro` component in `src/components/widgets/`:
```
BookingWidget.astro   — styled CTA block with configurable embed URL slot
NewsletterWidget.astro — single email field + submit, posts to /api/leads/capture
LeadCaptureWidget.astro — full contact form, posts to /api/leads/capture
```

All widgets:
- Have `data-project-id="{{PROJECT_ID}}"` on the root element (injected by editor at deploy time)
- Show a graceful "not yet configured" state if projectId is missing/placeholder
- Handle submit states: idle → loading → success/error
- Fully styled per template's design tokens — NOT generic

### Palette/font system (per template)
- 6 palette files in `palettes/` (already exist for current templates — keep them)
- `config.json` must have `palettes` array (read from palette files) and `fonts` array
- Font switching: palette files include `fonts.heading` + `fonts.body` — the PreviewModal injects CSS vars
- Each template's Layout.astro loads ALL fonts used across palettes via a single Google Fonts link

---

## Naming Convention
```
Industry        V1 slug                    V2 slug                    V3 slug
─────────────────────────────────────────────────────────────────────────────────
Freelancer      freelancer-portfolio       freelancer-minimal         freelancer-bold
Consultant      consultant-pro             consultant-light           consultant-editorial
Coach           coach-pro                  coach-warm                 coach-modern
Therapist       therapist-care             therapist-calm             therapist-modern
Fitness         fitness-coach              fitness-dark               fitness-minimal
Beauty          beauty-stylist             beauty-editorial           beauty-luxury
Photographer    photographer-portfolio     photographer-dark          photographer-editorial
```

---

## Visual Identity Matrix — All 21 Templates

### FREELANCER (Creative/Portfolio)
| Template | Color Base | Accent | Fonts | Feel | Hero Treatment |
|---|---|---|---|---|---|
| **freelancer-portfolio** | Warm cream #F9F7F1 | Orange #fb8857 + Lavender #B3B6FF | Clash Grotesk + Inter | Bold editorial, dark sections | Full-height dark hero, photo right, animated title |
| **freelancer-minimal** | Pure white #FFFFFF | Ink black #111 + warm tan #C8A882 | DM Serif Display + DM Sans | Swiss/minimal, typographic-led | Ultra-minimal: giant left-aligned name, simple nav, no decoration |
| **freelancer-bold** | Near-black #0D0D0D | Electric lime #C6FF00 + white | Bebas Neue + Space Grotesk | Dark, aggressive, agency energy | Full-bleed dark, massive condensed type spanning full width, green stripe |

### CONSULTANT (Strategy/Advisory)
| Template | Color Base | Accent | Fonts | Feel | Hero Treatment |
|---|---|---|---|---|---|
| **consultant-pro** | Deep charcoal #0f1117 | Gold #C9A84C | Playfair Display + DM Sans | Premium authority, boardroom | Dark hero, rotating SVG grid lines, serif headline |
| **consultant-light** | Off-white #F8F6F0 | Navy #1B2A4A + copper #B07040 | Libre Baskerville + Source Sans | Academic authority, editorial | Light hero, navy text, editorial two-column layout |
| **consultant-editorial** | White #FFFFFF | Slate #2D3748 + amber #D97706 | Cormorant Garamond + Inter | Refined, magazine-editorial | Full-width editorial hero, large italic serif, thin rules |

### COACH (Life/Business/Executive)
| Template | Color Base | Accent | Fonts | Feel | Hero Treatment |
|---|---|---|---|---|---|
| **coach-pro** | Warm ivory #FDF8F3 | Coral #E8603C | Fraunces + Inter | Warm transformation, human | Cream hero, large serif, animated marquee ring (CSS textPath) |
| **coach-warm** | Deep forest #0D1F16 | Sage #7FAF7B + cream #F0EBDC | Lora + Nunito | Grounded, holistic, nature | Dark green hero, soft organic shapes, warm palette |
| **coach-modern** | Cool white #F5F7FA | Electric blue #2563EB + dark #111 | Plus Jakarta Sans + Inter | Clean, corporate coaching | White hero, bold sans, clean grid, professional credential strip |

### THERAPIST (Mental Health/Counseling)
| Template | Color Base | Accent | Fonts | Feel | Hero Treatment |
|---|---|---|---|---|---|
| **therapist-care** | Sage/sand #FAFAF7 | Sage green #6B8E6B + copper #C4956A | Cormorant Garamond + Inter | Calm, safe, clinical warmth | Soft gradient hero, botanical SVG element, breathing room |
| **therapist-calm** | Warm white #FEFCF8 | Dusty rose #C5737A + warm grey | Playfair Display + Lato | Gentle, feminine, safe space | Light hero, large italic serif, soft watercolor-style CSS shapes |
| **therapist-modern** | White #FFFFFF | Teal #0D9488 + dark #111 | Inter + Inter | Clean, clinical, trustworthy | Minimal hero, bold sans, credential strip, trust signals prominent |

### FITNESS (Personal Trainer/Coach)
| Template | Color Base | Accent | Fonts | Feel | Hero Treatment |
|---|---|---|---|---|---|
| **fitness-coach** | Near-black #0A0A0A | Electric orange #E8390E + yellow | Barlow Condensed + Barlow | Raw power, athletic, bold | Dark hero, giant condensed type, diagonal CSS element, stats strip |
| **fitness-dark** | Deep charcoal #111827 | Neon green #22C55E + white | Oswald + Inter | Serious, military-grade, strength | Dark full-bleed, green accent lines, bold caps typography |
| **fitness-minimal** | White #FFFFFF | Black #000 + red #EF4444 | DM Sans + DM Sans | Clean Gymshark-like, modern | White hero, bold black type, red accent, lifestyle-product energy |

### BEAUTY (Hair/Makeup/Aesthetics)
| Template | Color Base | Accent | Fonts | Feel | Hero Treatment |
|---|---|---|---|---|---|
| **beauty-stylist** | Blush #FFF9FA | Rose #C9607A + mocha #8B5E3C | Cormorant + Jost | Luxury editorial, soft feminine | Light hero, large serif, thin elegant decorative lines |
| **beauty-editorial** | Black #0A0A0A | Gold #D4AF37 + white | Cormorant Garamond + DM Sans | High fashion, Vogue-esque | Dark editorial hero, gold typographic treatment, bold contrast |
| **beauty-luxury** | Champagne #F7F0E6 | Deep plum #4A0E4E + gold | Gilda Display + Montserrat | Spa luxury, premium services | Warm ivory hero, plum accent, circular CSS decorative element, spa energy |

### PHOTOGRAPHER (Portrait/Wedding/Commercial)
| Template | Color Base | Accent | Fonts | Feel | Hero Treatment |
|---|---|---|---|---|---|
| **photographer-portfolio** | Pure white #FFFFFF | Warm amber #C8956C | Cormorant Garamond (italic) + DM Sans | Editorial magazine, spacious | White hero, italic serif, gallery frame CSS placeholder, lots of air |
| **photographer-dark** | Pure black #000000 | White #FFF + red #FF3A3A | Anton + DM Sans | Stark, dramatic, Magnum Photos | Black hero, massive white type, red accent line, photo frame negative space |
| **photographer-editorial** | Warm grey #F2EDE8 | Forest green #2D5016 + off-white | Freight Display + Gill Sans | Film photography, analogue warmth | Warm grey hero, tall serif, grain texture (CSS noise), darkroom energy |

---

## Pages (4 per template)
1. **index.astro** — Hero + Services/Programs + Process/Approach + Testimonials + Stats + CTA
2. **about.astro** — About hero + Story + Background + FAQ accordion
3. **services.astro** — Services hero + Full service list + FAQ + CTA
4. **contact.astro** — Contact hero + LeadCaptureWidget + booking CTA + details

### Widget placement per page
- **index.astro**: NewsletterWidget in a mid-page section, BookingWidget as a floating CTA or inline section
- **contact.astro**: LeadCaptureWidget as primary form
- **about.astro**: subtle NewsletterWidget at bottom
- All pages: booking CTA in final CTA section

---

## Palette Files (6 per template)
Each palette file at `palettes/palette-{n}.json`:
```json
{
  "id": "palette-1",
  "name": "Studio",
  "colors": {
    "primary": "#fb8857",
    "secondary": "#B3B6FF",
    "accent": "#0a0a0a",
    "background": "#F9F7F1",
    "text": "#0a0a0a"
  },
  "fonts": {
    "heading": "Clash Grotesk",
    "body": "Inter"
  }
}
```

### Font options (3 per template, in config.json)
```json
"fonts": [
  { "id": "font-1", "name": "Heading Font", "heading": "Font Name", "body": "Body Font" },
  { "id": "font-2", "name": "Alternative 1", "heading": "Alt Heading", "body": "Alt Body" },
  { "id": "font-3", "name": "Alternative 2", "heading": "Alt2 Heading", "body": "Alt2 Body" }
]
```

---

## Execution Order

### Phase 1 — V1 templates (1 per industry, 6 full rebuilds + 1 existing)
```
freelancer-portfolio  → KEEP AS IS (the gold standard, already perfect)
consultant-pro        → FULL REBUILD (currently AI slop)
coach-pro             → FULL REBUILD (currently AI slop)
therapist-care        → FULL REBUILD (currently AI slop)  
fitness-coach         → FULL REBUILD (currently AI slop)
beauty-stylist        → FULL REBUILD (currently AI slop)
photographer-portfolio → FULL REBUILD (currently AI slop)
```

Agent batching Phase 1:
- Batch A: consultant-pro + coach-pro
- Batch B: therapist-care + fitness-coach  
- Batch C: beauty-stylist + photographer-portfolio

### Phase 2 — V2 templates (1 new per industry, 7 new)
- Batch D: freelancer-minimal + consultant-light + coach-warm
- Batch E: therapist-calm + fitness-dark + beauty-editorial + photographer-dark

### Phase 3 — V3 templates (1 new per industry, 7 new)
- Batch F: freelancer-bold + consultant-editorial + coach-modern
- Batch G: therapist-modern + fitness-minimal + beauty-luxury + photographer-editorial

### Phase 4 — Thumbnails
- Run Playwright screenshot script for all 21 templates
- Generate: thumbnail.png, thumbnail-light.png, thumbnail-dark.png per template
- Copy to showcase/public/thumbs/{slug}/
- Redeploy showcase

---

## Quality Checklist (per template before done)

### Code quality
- [ ] No Tailwind — pure CSS custom properties only
- [ ] No hardcoded personal names (grep for real names)
- [ ] No hardcoded contact info (emails, phones, addresses)
- [ ] `BASE_URL` used correctly for all internal links
- [ ] Mobile responsive: 320px, 768px, 1024px breakpoints
- [ ] `prefers-reduced-motion` respected in all animations
- [ ] Build succeeds with `npm run build`

### Widgets
- [ ] BookingWidget renders with correct placeholder state
- [ ] NewsletterWidget POSTs to `https://flowstarter.dev/api/leads/capture`
- [ ] LeadCaptureWidget POSTs to `https://flowstarter.dev/api/leads/capture`
- [ ] All widgets handle loading + success + error states
- [ ] `data-project-id` attribute present on widget roots

### Config
- [ ] `config.json` has 6 palettes (from palette files) + 3 fonts
- [ ] `astro.config.mjs` has correct base + outDir
- [ ] Template excluded from pnpm-workspace.yaml

### Design quality
- [ ] Hero is visually distinct from all other templates (no shared shell)
- [ ] Typography pairing is intentional and used consistently
- [ ] At least 1 meaningful scroll animation or interaction
- [ ] Color palette makes sense for the industry
- [ ] Sections flow naturally: hero → proof → services → process → social proof → CTA

---

## Widget Implementation Spec

### NewsletterWidget.astro
```astro
---
interface Props {
  title?: string;
  description?: string;
  placeholder?: string;
  buttonLabel?: string;
  className?: string;
}
const {
  title = "Stay in the loop",
  description = "Get updates, tips, and resources delivered to your inbox.",
  placeholder = "Your email address",
  buttonLabel = "Subscribe",
  className = '',
} = Astro.props;
---
<div class={`newsletter-widget ${className}`} data-project-id="{{PROJECT_ID}}">
  <div class="newsletter-widget__inner">
    <div class="newsletter-widget__copy">
      <h3 class="newsletter-widget__title">{title}</h3>
      <p class="newsletter-widget__desc">{description}</p>
    </div>
    <form class="newsletter-widget__form" data-newsletter-form novalidate>
      <div class="newsletter-widget__row">
        <input type="email" name="email" placeholder={placeholder} required
               class="newsletter-widget__input" autocomplete="email" />
        <button type="submit" class="newsletter-widget__btn">{buttonLabel}</button>
      </div>
      <p class="newsletter-widget__success" hidden>Thanks! You're on the list.</p>
      <p class="newsletter-widget__error" hidden>Something went wrong. Please try again.</p>
    </form>
  </div>
</div>
<script>
  document.querySelectorAll('[data-newsletter-form]').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const widget = form.closest('[data-project-id]');
      const projectId = widget?.dataset.projectId;
      const email = form.querySelector('input[name="email"]').value;
      const btn = form.querySelector('button[type="submit"]');
      const success = form.querySelector('.newsletter-widget__success');
      const error = form.querySelector('.newsletter-widget__error');
      
      btn.disabled = true;
      btn.textContent = 'Sending...';
      success.hidden = true;
      error.hidden = true;
      
      try {
        const res = await fetch('https://flowstarter.dev/api/leads/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, email, source: 'newsletter' }),
        });
        if (res.ok) {
          success.hidden = false;
          form.querySelector('input').value = '';
        } else {
          error.hidden = false;
        }
      } catch {
        error.hidden = false;
      } finally {
        btn.disabled = false;
        btn.textContent = '{buttonLabel}';
      }
    });
  });
</script>
```

### LeadCaptureWidget.astro
POST to `https://flowstarter.dev/api/leads/capture` with:
```json
{ "projectId": "{{PROJECT_ID}}", "name": "...", "email": "...", "phone": "...", "message": "...", "source": "contact" }
```

### BookingWidget.astro
Renders a CTA block. In preview, shows a placeholder. At deploy time, the editor injects `data-booking-url` with the Calendly/Cal.com URL. The script checks for the URL and either shows a CTA button linking to it, or shows the placeholder.

```html
<div class="booking-widget" data-project-id="{{PROJECT_ID}}" data-booking-url="{{BOOKING_URL}}">
  <!-- If booking URL exists: show CTA button -->
  <!-- If not: show "Configure booking in your dashboard" placeholder -->
</div>
```

---

## Thumbnail Generation (Phase 4)

Script: `apps/flowstarter-library/generate-thumbnails.js`

```js
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TEMPLATES_BASE = 'http://localhost:4100';
const slugs = [ /* all 21 */ ];
const OUT_DIR = 'apps/flowstarter-library';

for (const slug of slugs) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  // Light
  await page.goto(`${TEMPLATES_BASE}/templates/${slug}/`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT_DIR}/templates/${slug}/thumbnail-light.png`, clip: { x:0, y:0, width:1280, height:900 } });
  fs.copyFileSync(`${OUT_DIR}/templates/${slug}/thumbnail-light.png`, `${OUT_DIR}/templates/${slug}/thumbnail.png`);
  
  // Copy to showcase
  fs.mkdirSync(`${OUT_DIR}/showcase/public/thumbs/${slug}`, { recursive: true });
  ['thumbnail.png', 'thumbnail-light.png'].forEach(f => {
    fs.copyFileSync(`${OUT_DIR}/templates/${slug}/${f}`, `${OUT_DIR}/showcase/public/thumbs/${slug}/${f}`);
  });
  
  await browser.close();
}
```

---

## Current State (Starting Point)
- `freelancer-portfolio` — KEEP, gold standard ✅
- `consultant-pro` — needs full rebuild
- `coach-pro` — needs full rebuild
- `therapist-care` — needs full rebuild
- `fitness-coach` — needs full rebuild
- `beauty-stylist` — needs full rebuild
- `photographer-portfolio` — needs full rebuild
- Hidden: academic-tutor, edu-course-creator, workshop-host, wellness-holistic, creative-portfolio (stay hidden)
