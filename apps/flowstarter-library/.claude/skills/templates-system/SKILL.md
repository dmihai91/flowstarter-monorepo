---
name: templates-system
description: Build and maintain Flowstarter website templates. Use when creating new templates or modifying existing ones. Templates must have outstanding design, multi-page structure, theme system, integrations, and content-driven architecture.
---

This skill guides development of Flowstarter website templates — the foundation for AI-generated websites. Templates must be **exceptional** in design, **flexible** in customization, and **robust** enough for AI-driven personalization.

## Template Requirements Overview

Every Flowstarter template MUST have:

1. ✨ **Outstanding, responsive design** — WOW-factor visuals that work on all devices
2. 🌗 **Light & dark mode** — Full theme support with smooth transitions
3. 🎨 **6 unique color palettes** — Each in `palettes/palette-N.json` with distinct personality
4. 📝 **Markdown-driven content** — All content in `content/*.md` files
5. 🔌 **Integration widgets** — Toggleable booking/forms/newsletter in `content/integrations/`
6. 📄 **Multi-page structure** — Minimum 4 pages: Home, About, Services, Contact

## Template Structure

```
template-name/
├── package.json                    # Dependencies (astro, tailwindcss only)
├── astro.config.mjs               # Astro configuration
├── tailwind.config.mjs            # Tailwind with theme configuration
├── config.json                    # Template metadata
├── content.md                     # Legacy content (being phased out)
├── content/
│   ├── site.md                    # Site-wide metadata (name, tagline, contact)
│   ├── hero.md                    # Hero section content
│   ├── services.md                # Services/offerings
│   ├── testimonials.md            # Customer testimonials
│   ├── pricing.md                 # Pricing tiers (optional)
│   └── integrations/
│       ├── booking.md             # Booking widget config
│       ├── contact-form.md        # Contact form config
│       ├── newsletter.md          # Newsletter signup config
│       ├── payments.md            # Payment widget config
│       └── social-feed.md         # Social feed config
├── palettes/
│   ├── palette-1.json             # Default/primary palette
│   ├── palette-2.json             # Alternative palette
│   ├── palette-3.json             # Alternative palette
│   ├── palette-4.json             # Alternative palette
│   ├── palette-5.json             # Alternative palette
│   └── palette-6.json             # Dark mode palette (required)
├── src/
│   ├── layouts/
│   │   └── Layout.astro           # Base HTML layout with theme support
│   ├── pages/
│   │   ├── index.astro            # Home page (required)
│   │   ├── about.astro            # About page (required)
│   │   ├── services.astro         # Services page (required)
│   │   └── contact.astro          # Contact page (required)
│   ├── components/
│   │   ├── Header.astro           # Navigation with theme toggle
│   │   ├── Footer.astro           # Footer with links
│   │   ├── Hero.astro             # Hero section
│   │   ├── Services.astro         # Services grid
│   │   ├── Testimonials.astro     # Testimonials carousel/grid
│   │   └── integrations/          # Integration widgets
│   │       ├── BookingWidget.astro
│   │       ├── ContactForm.astro
│   │       ├── Newsletter.astro
│   │       ├── PaymentWidget.astro
│   │       └── SocialFeed.astro
│   └── styles/
│       └── global.css             # Theme variables, base styles
├── thumbnail.png                  # Template preview (400x300)
├── thumbnail-light.png            # Light mode preview
└── thumbnail-dark.png             # Dark mode preview
```

## 1. Outstanding Responsive Design

### Visual Excellence Standards

Templates must have **WOW-factor design** — the kind that makes users say "an AI made THIS?"

**Hero Sections:**
- Full-viewport height (`min-h-screen`) with dramatic typography
- Striking headline (text-5xl to text-7xl) with perfect leading/tracking
- Clear hierarchy: headline → subheadline → CTA
- Dynamic backgrounds: gradients, patterns, or subtle animations

**Section Rhythm:**
- Vary section heights — tall hero, compact testimonials, spacious features
- Alternate backgrounds for visual depth
- Generous padding (py-16 to py-24) between sections

**Typography:**
- Use distinctive fonts — avoid generic Inter/Roboto
- Pair a display font (headings) with a body font
- Clear hierarchy: h1 > h2 > h3 > body

### Anti-AI-Slop Rules

❌ **NEVER:**
- Purple/violet gradients (unless brand-specific)
- Uniform section heights
- Generic CTAs ("Get Started", "Learn More")
- Fake contact info ("555-1234")
- Low-contrast text

✅ **ALWAYS:**
- Distinctive, intentional color choices
- Visual rhythm through varied sections
- Industry-specific CTAs
- WCAG-compliant contrast

## 2. Light & Dark Mode

### Theme System Architecture

```css
/* src/styles/global.css */
:root {
  --color-bg: #ffffff;
  --color-bg-alt: #f8fafc;
  --color-text: #0f172a;
  --color-text-muted: #64748b;
  --color-primary: var(--palette-primary);
  --color-secondary: var(--palette-secondary);
  --color-accent: var(--palette-accent);
}

.dark {
  --color-bg: #0f172a;
  --color-bg-alt: #1e293b;
  --color-text: #f8fafc;
  --color-text-muted: #94a3b8;
}
```

### Theme Toggle

Every template must include a functional theme toggle in the header that:
- Persists preference to localStorage
- Respects system preference on first visit
- Provides smooth transitions between modes

## 3. Six Color Palettes

Each template ships with **6 distinct color palettes** in `palettes/palette-N.json`.

### Palette JSON Structure

```json
{
  "id": "energetic-blue",
  "name": "Energetic Blue",
  "description": "Bold and motivating. Perfect for high-energy brands.",
  "colors": {
    "primary": "#3B82F6",
    "primary-dark": "#2563EB",
    "secondary": "#10B981",
    "accent": "#F59E0B",
    "background": "#0F172A",
    "surface": "#1E293B",
    "text": "#F8FAFC",
    "text-muted": "#94A3B8"
  },
  "fonts": {
    "heading": "Space Grotesk",
    "body": "DM Sans",
    "weights": {
      "heading": "700",
      "body": "400"
    }
  },
  "preview": {
    "gradient": "from-blue-600 to-blue-400"
  }
}
```

### Palette Requirements

| Palette | Purpose | Notes |
|---------|---------|-------|
| palette-1 | Default/Primary | The "hero" palette shown in previews |
| palette-2 | Alternative light | Different color personality |
| palette-3 | Alternative light | Different color personality |
| palette-4 | Alternative light | Different color personality |
| palette-5 | Alternative light | Different color personality |
| palette-6 | **Dark mode** | Must be a true dark theme |

**palette-6 MUST be a dark theme** with:
- Dark background (#0f172a or similar)
- Light text (#f8fafc or similar)
- Appropriate contrast ratios

## 4. Markdown-Driven Content

ALL content comes from markdown files in `content/`.

### Content File Structure

**content/site.md** — Site-wide metadata:
```yaml
---
name: "Business Name"
tagline: "Your compelling tagline"
description: "SEO description for the site"
contact:
  email: "hello@example.com"
  phone: "+1 (555) 123-4567"
  address: "123 Main St, City, State 12345"
social:
  twitter: "https://twitter.com/handle"
  instagram: "https://instagram.com/handle"
  linkedin: "https://linkedin.com/company/handle"
---
```

**content/hero.md** — Hero section:
```yaml
---
headline: "Transform Your Life"
subheadline: "Professional coaching to help you reach your goals"
cta:
  text: "Get Started"
  url: "/contact"
image: "/images/hero.jpg"
---
```

**content/services.md** — Services/offerings:
```yaml
---
title: "Our Services"
subtitle: "What we offer"
services:
  - title: "Service One"
    description: "Description of this service"
    icon: "star"
    price: "$99/month"
  - title: "Service Two"
    description: "Description of this service"
    icon: "heart"
    price: "$149/month"
---
```

**content/testimonials.md** — Customer testimonials:
```yaml
---
title: "What Our Clients Say"
testimonials:
  - quote: "This service changed everything for me."
    author: "Jane Smith"
    role: "CEO, TechCorp"
    image: "/images/testimonials/jane.jpg"
    rating: 5
---
```

## 5. Integration Widgets

Integrations are **toggleable** — enabled/disabled via markdown config.

### Integration Config Files

**content/integrations/booking.md**:
```yaml
---
enabled: true
provider: "calendly"
url: "https://calendly.com/business/consultation"
title: "Book a Consultation"
description: "Schedule a free 30-minute call"
buttonText: "Book Now"
---
```

**content/integrations/newsletter.md**:
```yaml
---
enabled: true
provider: "mailchimp"
formAction: "https://example.us1.list-manage.com/subscribe/post"
title: "Stay Updated"
description: "Get the latest news and tips"
buttonText: "Subscribe"
---
```

### Widget Implementation Pattern

```astro
---
// src/components/integrations/BookingWidget.astro
import { getEntry } from 'astro:content';

const booking = await getEntry('integrations', 'booking');
if (!booking?.data.enabled) return null;

const { provider, url, title, description, buttonText } = booking.data;
---

{provider === 'calendly' && (
  <section class="booking-widget py-16">
    <h2>{title}</h2>
    <p>{description}</p>
    <a href={url} class="btn-primary">{buttonText}</a>
  </section>
)}
```

### Available Integrations

| Widget | Providers | Config File |
|--------|-----------|-------------|
| BookingWidget | Calendly, Cal.com | booking.md |
| ContactForm | Formspree, Netlify | contact-form.md |
| Newsletter | Mailchimp, ConvertKit | newsletter.md |
| PaymentWidget | Stripe, LemonSqueezy | payments.md |
| SocialFeed | Instagram, Twitter | social-feed.md |

## 6. Multi-Page Structure

Every template must have **at least 4 pages**:

| Page | Path | Purpose |
|------|------|---------|
| Home | `/` | Main landing with hero, features, testimonials |
| About | `/about` | Company story, team, mission |
| Services | `/services` | Service offerings, pricing |
| Contact | `/contact` | Contact form, location, hours |

### Page Template Pattern

```astro
---
// src/pages/about.astro
import Layout from '../layouts/Layout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
---
<Layout title="About Us">
  <Header />
  <main>
    <section class="hero py-20">
      <h1 class="text-5xl font-bold">About Us</h1>
      <!-- Content from content/about.md or inline -->
    </section>
  </main>
  <Footer />
</Layout>
```

### Navigation Consistency

All pages must have consistent navigation with:
- Logo/brand link to home
- Links to all main pages
- Active state indication
- Mobile-responsive menu
- Theme toggle

## Allowed Dependencies

**Only these packages are allowed:**
- `astro` (^4.0.0 or ^5.0.0)
- `tailwindcss` (^3.4.0 or ^4.0.0)
- `@astrojs/tailwind` (^5.1.0)

**DO NOT use:**
- `astro-icon` — use inline SVG instead
- `@astrojs/image` — use native `<img>`
- React/Vue/Svelte integrations
- `@fontsource/*` — use Google Fonts CDN
- Any other npm packages

## Template Compliance Checklist

Before a template is considered complete:

- [ ] **6 color palettes** in `palettes/` directory
- [ ] **palette-6 is dark mode** (dark bg, light text)
- [ ] **4+ pages** (index, about, services, contact)
- [ ] **4+ content files** (site.md, hero.md, services.md, testimonials.md)
- [ ] **Integration widgets** in `content/integrations/`
- [ ] **Theme toggle** works and persists
- [ ] **Responsive** from 320px to 1920px
- [ ] **No hardcoded content** — all text from markdown
- [ ] **Thumbnails** (thumbnail.png, thumbnail-light.png, thumbnail-dark.png)
- [ ] **config.json** with template metadata

## Audit Script

Run this to check template compliance:

```javascript
// audit_templates.mjs
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

const templatesDir = './templates';
const templates = readdirSync(templatesDir);

for (const template of templates) {
  const dir = join(templatesDir, template);
  const palettes = readdirSync(join(dir, 'palettes')).filter(f => f.endsWith('.json'));
  const pages = readdirSync(join(dir, 'src/pages')).filter(f => f.endsWith('.astro'));
  const content = readdirSync(join(dir, 'content')).filter(f => f.endsWith('.md'));
  
  console.log(`${template}:`);
  console.log(`  Palettes: ${palettes.length}/6 ${palettes.length >= 6 ? '✅' : '❌'}`);
  console.log(`  Pages: ${pages.length}/4 ${pages.length >= 4 ? '✅' : '❌'}`);
  console.log(`  Content: ${content.length}/4 ${content.length >= 4 ? '✅' : '❌'}`);
}
```

---

Remember: These templates are the **PRODUCT**. Every site generated should make users say "WOW!"
