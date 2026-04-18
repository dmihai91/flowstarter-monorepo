# Agent Context — Flowstarter Template Rebuild

## Your job
Completely rebuild a Flowstarter library template from scratch to match the quality of `freelancer-portfolio`. You are replacing ALL source files.

---

## THE GOLD STANDARD: freelancer-portfolio

Study these patterns exactly — they are non-negotiable:

### Architecture
- Astro 5 (^5.4.1), NO Tailwind, NO UI frameworks
- Pure CSS with `:root` custom properties (design tokens)
- Single content file: `src/content/site-labels.md` (YAML frontmatter only)
- Content imported as: `import { frontmatter as siteLabels } from '../content/site-labels.md';`
- Component-scoped `<style>` blocks — every .astro file styles itself
- `npm install` + `npm run build` (NOT pnpm — excluded from pnpm workspace)
- `astro.config.mjs`: `base: '/templates/{slug}/'`, `outDir: '../../preview-dist/templates/{slug}'`

### Required file structure
```
src/
  content/
    site-labels.md           ← ALL content in YAML frontmatter
  styles/
    global.css               ← design tokens + reset + utilities
  layouts/
    Layout.astro             ← minimal HTML shell, loads fonts, imports global.css
  scripts/
    useVisibilityClass.js    ← exact copy (see below)
  components/
    Header.astro             ← fixed nav, logo, mobile drawer with hamburger
    Hero.astro               ← UNIQUE design, full-height, visually distinctive
    Services.astro           ← services/programs grid
    Process.astro            ← numbered steps (approach)
    Testimonials.astro       ← testimonial cards with reveal animation
    Stats.astro              ← stats strip with animated count-up
    CTA.astro                ← final CTA section
    Footer.astro             ← dark footer with columns
    design-system/
      ActionButton.astro     ← reusable button (primary + outline variants)
      SectionBlock.astro     ← section wrapper (tone: light/dark/accent/none, padding: default/compact/tight/none)
      SectionHeading.astro   ← label + title heading block
    widgets/
      BookingWidget.astro    ← booking CTA block posting to our backend
      NewsletterWidget.astro ← email capture posting to our backend
      LeadCaptureWidget.astro← contact form posting to our backend
  pages/
    index.astro
    about.astro
    services.astro
    contact.astro
astro.config.mjs
package.json
tsconfig.json
config.json                  ← DO NOT MODIFY
palettes/                    ← DO NOT MODIFY
```

---

## EXACT CODE PATTERNS — copy these precisely

### Layout.astro
```astro
---
import { frontmatter as siteLabels } from '../content/site-labels.md';
const { siteMeta } = siteLabels;
const { title = siteMeta.title } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={siteMeta.description} />
    <link rel="icon" type="image/svg+xml" href={`${import.meta.env.BASE_URL}favicon.svg`} />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <!-- TEMPLATE-SPECIFIC Google Fonts link here — load ALL fonts used across palettes -->
    <link href="https://fonts.googleapis.com/css2?family=FONT1&family=FONT2&display=swap" rel="stylesheet" />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
<style is:global>
  @import '../styles/global.css';
</style>
```

### global.css (design tokens — values differ per template)
```css
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; scrollbar-gutter: stable; }
body { font-family: var(--font-body); background-color: var(--surface-base); color: var(--text-primary); font-size: var(--fs-body); line-height: 1.6; -webkit-font-smoothing: antialiased; }
img { max-width: 100%; display: block; }
p { font-size: var(--fs-body); color: var(--text-primary); }
a { color: inherit; text-decoration: none; }
ul, ol { list-style: none; }
button { font: inherit; cursor: pointer; border: none; background: none; font-family: var(--font-button); }

:root {
  /* — Colors — differ per template */
  --bg-dark: #0a0a0a;           /* dark bg for header/footer/dark sections */
  --brand-primary: #ACCENT;     /* the main accent color */
  --surface-base: #BACKGROUND;  /* page background */
  --text-primary: #111;
  --text-on-dark: #fff;
  --text-secondary: #888;
  --text-muted: #666;
  --border-color: rgba(0,0,0,0.1);
  --surface-field: #fff;
  --surface-field-border: rgba(0,0,0,0.15);
  --surface-subtle: #f5f5f5;
  --shadow-float: 0 18px 36px rgba(0,0,0,0.12);

  /* — Spacing — */
  --section-padding: 100px 0;
  --container-width: 1200px;
  --container-padding: 0 24px;
  
  /* — Typography — */
  --fs-display: clamp(2.8rem, 5.5vw, 5rem);
  --fs-h1: clamp(2.2rem, 4vw, 3.5rem);
  --fs-h2: clamp(1.8rem, 3vw, 2.75rem);
  --fs-h3: clamp(1.2rem, 2vw, 1.7rem);
  --fs-h4: 1.25rem;
  --fs-body: 1.0625rem;
  --fs-small: 0.875rem;
  --fs-xs: 0.75rem;
  --font-body: 'BODY_FONT', sans-serif;
  --font-title: 'HEADING_FONT', sans-serif;
  --font-button: 'BUTTON_FONT', sans-serif;
  --fw-regular: 400;
  --fw-medium: 500;
  --fw-semibold: 600;
  --fw-bold: 700;
  --fw-black: 900;
  --fw-headline: 700;

  /* — Misc — */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --transition: 0.25s ease;
}

.container { max-width: var(--container-width); margin: 0 auto; padding: var(--container-padding); }

h1, h2, h3, h4, h5, h6 { font-family: var(--font-title); font-weight: var(--fw-headline); line-height: 1.1; }

@media (max-width: 1024px) {
  :root { --fs-display: clamp(2.4rem, 5vw, 3.5rem); --fs-h1: clamp(2rem, 4vw, 3rem); }
}
@media (max-width: 768px) {
  :root {
    --section-padding: 64px 0;
    --container-padding: 0 20px;
    --fs-display: clamp(2rem, 8vw, 2.8rem);
    --fs-h2: clamp(1.6rem, 5vw, 2rem);
  }
}
```

### ActionButton.astro (exact copy from freelancer-portfolio)
```astro
---
interface Props {
  href: string;
  label: string;
  variant?: 'primary' | 'outline';
  className?: string;
}
const { href, label, variant = 'primary', className = '' } = Astro.props;
---
<a href={href} class={`ds-action-button ds-action-button--${variant} ${className}`.trim()}>
  <span class="ds-action-button__label">{label}</span>
</a>
<style>
  .ds-action-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 14px 28px;
    font-size: var(--fs-small);
    font-weight: var(--fw-semibold);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border: 2px solid transparent;
    transition: all var(--transition);
    cursor: pointer;
    white-space: nowrap;
  }
  .ds-action-button--primary {
    background: var(--brand-primary);
    color: var(--text-on-dark);
    border-color: var(--brand-primary);
  }
  .ds-action-button--primary:hover { opacity: 0.88; }
  .ds-action-button--outline {
    background: transparent;
    color: var(--text-primary);
    border-color: currentColor;
  }
  .ds-action-button--outline:hover {
    background: var(--text-primary);
    color: var(--surface-base);
  }
  /* Dark bg variant */
  .ds-action-button--outline-light {
    color: var(--text-on-dark);
    border-color: var(--text-on-dark);
  }
  .ds-action-button--outline-light:hover {
    background: var(--text-on-dark);
    color: var(--bg-dark);
  }
</style>
```

### SectionBlock.astro
```astro
---
interface Props {
  id?: string;
  className?: string;
  tone?: 'light' | 'dark' | 'accent' | 'subtle' | 'none';
  padding?: 'default' | 'compact' | 'tight' | 'none';
  topBorder?: boolean;
  bottomBorder?: boolean;
}
const { id, className = '', tone = 'light', padding = 'default', topBorder = false, bottomBorder = false } = Astro.props;
---
<section id={id} class={`ds-section ds-section--${tone} ds-section--${padding} ${topBorder ? 'ds-section--top-border' : ''} ${bottomBorder ? 'ds-section--bottom-border' : ''} ${className}`.trim()}>
  <slot />
</section>
<style>
  .ds-section--default { padding: var(--section-padding); }
  .ds-section--compact { padding: 60px 0; }
  .ds-section--tight { padding: 32px 0; }
  .ds-section--none { padding: 0; }
  .ds-section--light { background: var(--surface-base); }
  .ds-section--dark { background: var(--bg-dark); }
  .ds-section--accent { background: var(--brand-primary); }
  .ds-section--subtle { background: var(--surface-subtle); }
  .ds-section--none-bg { background: transparent; }
  .ds-section--top-border { border-top: 1px solid var(--border-color); }
  .ds-section--bottom-border { border-bottom: 1px solid var(--border-color); }
</style>
```

### SectionHeading.astro
```astro
---
interface Props {
  label?: string;
  title?: string;
  align?: 'left' | 'center';
  className?: string;
  labelColor?: string;
  titleColor?: string;
  maxWidth?: string;
}
const { label, title, align = 'left', className = '', labelColor, titleColor, maxWidth } = Astro.props;
---
<div class={`ds-heading ds-heading--${align} ${className}`.trim()}>
  {label && <p class="ds-heading__label" style={labelColor ? `color:${labelColor}` : undefined}>{label}</p>}
  {title && <h2 class="ds-heading__title" style={[titleColor ? `color:${titleColor}` : '', maxWidth ? `max-width:${maxWidth}` : ''].filter(Boolean).join(';') || undefined}>{title}</h2>}
</div>
<style>
  .ds-heading__label {
    font-size: var(--fs-small);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 12px;
    color: var(--brand-primary);
    font-weight: var(--fw-semibold);
  }
  .ds-heading__title {
    font-size: var(--fs-h2);
    font-weight: var(--fw-headline);
    text-transform: uppercase;
    letter-spacing: -0.02em;
    line-height: 1.05;
    color: var(--text-primary);
  }
  .ds-heading--center { text-align: center; }
  .ds-heading--center .ds-heading__title { margin: 0 auto; }
</style>
```

### useVisibilityClass.js (exact copy — use in all animations)
```js
export function useVisibilityClass({ selector, className = 'is-visible', observingClassName = 'is-observing', threshold = 0.35, rootMargin = '0px', once = false, respectReducedMotion = true, revealIfAlreadyVisible = true }) {
  const elements = Array.from(document.querySelectorAll(selector));
  if (!elements.length) return;
  const reduceMotion = window.matchMedia('(prefers-reduce-motion: reduce)').matches;
  if (respectReducedMotion && reduceMotion) {
    elements.forEach(el => { el.classList.add(observingClassName); el.classList.add(className); });
    return;
  }
  const isInViewport = el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight; };
  elements.forEach(el => {
    el.classList.add(observingClassName);
    if (revealIfAlreadyVisible && isInViewport(el)) window.requestAnimationFrame(() => window.requestAnimationFrame(() => el.classList.add(className)));
  });
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add(className); if (once) observer.unobserve(entry.target); }
    else if (!once) entry.target.classList.remove(className);
  }), { threshold, rootMargin });
  elements.forEach(el => observer.observe(el));
}
```

---

## WIDGET SPECS — implement exactly as follows

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
  title = 'Stay in the loop',
  description = 'Get updates and resources delivered to your inbox.',
  placeholder = 'Your email address',
  buttonLabel = 'Subscribe',
  className = '',
} = Astro.props;
---
<div class={`newsletter-widget ${className}`} data-project-id="{{PROJECT_ID}}">
  <div class="newsletter-widget__body">
    <div class="newsletter-widget__copy">
      <h3 class="newsletter-widget__title">{title}</h3>
      <p class="newsletter-widget__desc">{description}</p>
    </div>
    <form class="newsletter-widget__form" data-nl-form novalidate>
      <div class="newsletter-widget__row">
        <input type="email" name="email" placeholder={placeholder} required
               class="newsletter-widget__input" autocomplete="email" />
        <button type="submit" class="newsletter-widget__btn">{buttonLabel}</button>
      </div>
      <p class="newsletter-widget__note">No spam. Unsubscribe anytime.</p>
      <p class="newsletter-widget__success" hidden aria-live="polite">
        ✓ You're on the list!
      </p>
      <p class="newsletter-widget__error" hidden aria-live="polite">
        Something went wrong. Please try again.
      </p>
    </form>
  </div>
</div>
<script>
  document.querySelectorAll('[data-nl-form]').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const widget = form.closest('[data-project-id]');
      const projectId = widget?.dataset.projectId ?? '';
      const emailInput = form.querySelector('input[name="email"]');
      const email = emailInput?.value?.trim();
      const btn = form.querySelector('button[type="submit"]');
      const success = form.querySelector('.newsletter-widget__success');
      const error = form.querySelector('.newsletter-widget__error');
      if (!email) return;
      const prev = btn.textContent;
      btn.disabled = true;
      btn.textContent = '…';
      success.hidden = true;
      error.hidden = true;
      try {
        const res = await fetch('https://flowstarter.dev/api/leads/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, email, source: 'newsletter' }),
        });
        if (res.ok) { success.hidden = false; emailInput.value = ''; }
        else { error.hidden = false; }
      } catch { error.hidden = false; }
      finally { btn.disabled = false; btn.textContent = prev; }
    });
  });
</script>
<style>
  /* Style with template's design tokens — no hardcoded colors */
  .newsletter-widget { padding: 48px; background: var(--surface-subtle); border: 1px solid var(--border-color); }
  .newsletter-widget__body { max-width: 560px; margin: 0 auto; text-align: center; }
  .newsletter-widget__title { font-family: var(--font-title); font-size: var(--fs-h3); margin-bottom: 12px; color: var(--text-primary); }
  .newsletter-widget__desc { color: var(--text-secondary); margin-bottom: 24px; }
  .newsletter-widget__row { display: flex; gap: 8px; }
  .newsletter-widget__input { flex: 1; padding: 12px 16px; border: 1px solid var(--surface-field-border); background: var(--surface-field); font-size: var(--fs-body); color: var(--text-primary); }
  .newsletter-widget__input:focus { outline: 2px solid var(--brand-primary); outline-offset: -1px; }
  .newsletter-widget__btn { padding: 12px 24px; background: var(--brand-primary); color: var(--text-on-dark); font-weight: var(--fw-semibold); font-size: var(--fs-small); text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; border: none; transition: opacity var(--transition); }
  .newsletter-widget__btn:hover { opacity: 0.85; }
  .newsletter-widget__btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .newsletter-widget__note { font-size: var(--fs-xs); color: var(--text-muted); margin-top: 10px; }
  .newsletter-widget__success { color: var(--brand-primary); font-size: var(--fs-small); margin-top: 10px; font-weight: var(--fw-semibold); }
  .newsletter-widget__error { color: #c0392b; font-size: var(--fs-small); margin-top: 10px; }
  @media (max-width: 600px) { .newsletter-widget__row { flex-direction: column; } }
</style>
```

### LeadCaptureWidget.astro
Full contact form — name, email, phone (optional), message. Posts to `https://flowstarter.dev/api/leads/capture`:
```json
{ "projectId": "{{PROJECT_ID}}", "name": "...", "email": "...", "phone": "...", "message": "...", "source": "contact" }
```
- `data-project-id="{{PROJECT_ID}}"` on root element
- Submit states: idle → loading (button text changes) → success message shown / error message shown
- NO `@apply`, NO Tailwind classes, pure CSS custom properties
- Style matches the template's visual identity

### BookingWidget.astro
CTA booking block. The booking URL is injected by the editor as `data-booking-url`. In preview mode (no real URL configured), shows a styled placeholder.

```astro
---
interface Props {
  title?: string;
  description?: string;
  buttonLabel?: string;
  className?: string;
}
const {
  title = 'Book a Discovery Call',
  description = 'Let\'s talk about your goals and how I can help.',
  buttonLabel = 'Book a Call',
  className = '',
} = Astro.props;
---
<div class={`booking-widget ${className}`}
     data-project-id="{{PROJECT_ID}}"
     data-booking-url="{{BOOKING_URL}}">
  <div class="booking-widget__inner">
    <div class="booking-widget__icon" aria-hidden="true">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
      </svg>
    </div>
    <h3 class="booking-widget__title">{title}</h3>
    <p class="booking-widget__desc">{description}</p>
    <a href="#" class="booking-widget__btn ds-action-button ds-action-button--primary" data-booking-trigger>
      {buttonLabel}
    </a>
    <p class="booking-widget__placeholder" hidden>
      Booking configuration will be set up in your dashboard.
    </p>
  </div>
</div>
<script>
  document.querySelectorAll('[data-booking-trigger]').forEach(btn => {
    const widget = btn.closest('[data-booking-url]');
    const url = widget?.dataset?.bookingUrl;
    const placeholder = widget?.querySelector('.booking-widget__placeholder');
    if (url && url !== '{{BOOKING_URL}}' && url.startsWith('http')) {
      btn.setAttribute('href', url);
      btn.setAttribute('target', '_blank');
      btn.setAttribute('rel', 'noopener noreferrer');
    } else {
      btn.style.display = 'none';
      if (placeholder) placeholder.hidden = false;
    }
  });
</script>
<style>
  .booking-widget { padding: 48px 32px; background: var(--bg-dark); color: var(--text-on-dark); text-align: center; }
  .booking-widget__icon { color: var(--brand-primary); margin: 0 auto 20px; display: inline-flex; }
  .booking-widget__title { font-family: var(--font-title); font-size: var(--fs-h3); margin-bottom: 12px; }
  .booking-widget__desc { color: rgba(255,255,255,0.7); margin-bottom: 28px; max-width: 380px; margin-left: auto; margin-right: auto; }
  .booking-widget__placeholder { font-size: var(--fs-small); color: rgba(255,255,255,0.4); margin-top: 12px; font-style: italic; }
</style>
```

---

## PAGES spec

### index.astro — section order
1. `<Header activeIndex={0} />`
2. `<Hero />` — full height
3. `<Stats />` — animated count-up strip
4. `<Services />` — services grid
5. `<NewsletterWidget />` — inline mid-page
6. `<Process />` — numbered approach
7. `<Testimonials />` — masonry/grid
8. `<BookingWidget />` — inline booking CTA
9. `<Footer />`

### about.astro
1. `<Header activeIndex={1} />`
2. About hero (large headline with about page specific copy)
3. Story section (2 paragraphs, personal/professional background)
4. FAQ accordion (5-6 common questions)
5. `<NewsletterWidget />`
6. `<Footer />`

### services.astro
1. `<Header activeIndex={2} />`
2. Services hero (different headline from index)
3. Full services list (same data but expanded layout)
4. `<BookingWidget />`
5. FAQ section
6. `<Footer />`

### contact.astro
1. `<Header activeIndex={3} />`
2. Contact hero section
3. `<LeadCaptureWidget />` — primary content
4. `<BookingWidget />` — below the form
5. `<Footer />`

---

## HERO DESIGN PRINCIPLES

The hero MUST be visually distinctive — it's the first thing anyone sees. NO generic two-column text+stats layouts. Study the freelancer-portfolio hero for inspiration:
- Full-height (`min-height: 100vh`)
- Large, bold typography that dominates
- A unique decorative element (CSS only — no external images)
- Scroll-triggered or page-load animation
- Strong visual personality that matches the template's industry and feel

What to AVOID:
- Generic "eyebrow + headline + subtitle + two buttons + stats strip" laid out identically to other templates
- The same layout with different text
- Tailwind-style class utility CSS (`bg-primary`, `text-white`, `rounded-xl`)
- Any external image URLs or `@apply`

---

## ANIMATION PATTERNS

### Reveal on scroll (use for all sections)
```astro
<div class="section-item" data-reveal>...</div>
<script>
import { useVisibilityClass } from '../scripts/useVisibilityClass.js';
useVisibilityClass({ selector: '[data-reveal]', threshold: 0.1, once: true });
</script>
<style>
/* Hide before reveal */
:global([data-reveal].is-observing:not(.is-visible)) {
  opacity: 0;
  transform: translateY(40px);
  filter: blur(6px);
}
:global([data-reveal].is-observing) {
  transition: opacity 600ms cubic-bezier(0.22,1,0.36,1), transform 600ms cubic-bezier(0.22,1,0.36,1), filter 600ms cubic-bezier(0.22,1,0.36,1);
  transition-delay: var(--reveal-delay, 0ms);
}
:global([data-reveal].is-visible) { opacity: 1; transform: none; filter: none; }
@media (prefers-reduced-motion: reduce) {
  :global([data-reveal].is-observing) { opacity: 1; transform: none; filter: none; transition: none; }
}
</style>
```

### Stat count-up animation
```js
// In Stats.astro script block
const statEls = document.querySelectorAll('[data-stat-number]');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseFloat(el.dataset.target.replace(/[^0-9.]/g, ''));
    const suffix = el.dataset.target.replace(/[0-9.]/g, '');
    const duration = 1200;
    const start = performance.now();
    const tick = now => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * ease) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    observer.unobserve(el);
  });
}, { threshold: 0.5 });
statEls.forEach(el => observer.observe(el));
```

---

## CONTENT RULES

- Logo: "Your Name"
- Names in testimonials: keep generic (Alex M., Sarah T., David K.)
- No real email addresses — use `hello@example.com` as placeholder
- No real phone numbers — use `+1 (555) 000-0000`
- No real addresses — use "Your City, Your Country"
- No real social URLs — use `#`
- No certifications specific to real orgs (no "ICF Certified", "NASM Certified") — use generic "Certified [Role]"
- No media mentions (no "Forbes Featured", "Vogue Featured") — use "Industry Recognition"

---

## BUILD COMMANDS

```bash
cd /Users/darius91/flowstarter-monorepo/apps/flowstarter-library/templates/{SLUG}
npm install
npm run build
```

The build should produce files in: `../../preview-dist/templates/{SLUG}/`

Verify build succeeded: `ls ../../preview-dist/templates/{SLUG}/index.html`

---

## QUALITY BAR CHECK (do before finishing)

Run these checks:
```bash
# No Tailwind classes
grep -r "@apply\|className=\|bg-gray\|text-white\|rounded-xl\|flex items" src/ | grep -v ".md"

# No hardcoded personal info
grep -r "forbes\|vogue\|ICF\|NASM\|fitprostudio\|New York City\|Austin, TX\|James Parker\|Sarah Mitchell\|Mike Torres\|Sophia Chen\|Marcus Rivera" src/

# Build succeeds
npm run build
```

All three checks must pass before you're done.
