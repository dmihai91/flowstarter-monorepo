/**
 * Template manifest for the Flowstarter Library.
 *
 * Each entry corresponds to a hand-crafted site or starter template. New entries
 * should be added here and not auto-generated. The library reads this file at
 * build time; there is no runtime fetch.
 *
 * Source-of-truth invariants:
 *   - Slugs are URL-safe and stable. Renaming a slug breaks bookmarks.
 *   - `kind: 'live'` means a real shipped site (client work). `kind: 'template'`
 *     means a starter template that can be deployed to a new domain.
 *   - `repoUrl` is optional; only set when the template lives in its own
 *     publicly accessible GitHub repo. Private repos should leave this null.
 *   - `liveUrl` is the canonical user-facing URL. Optional — when null, the
 *     detail page renders an "Available on request" state instead of "View live".
 *   - `thumbnail` paths are relative to `/showcase/` and must exist for both
 *     light and dark modes (`{slug}.png` and `{slug}-dark.png`).
 */

export type TemplateKind = 'live' | 'template';
export type TemplateStatus = 'live' | 'in-development' | 'private';

export interface TemplateEntry {
  slug: string;
  title: string;
  kind: TemplateKind;
  status: TemplateStatus;
  category: string;
  year: string;
  /**
   * One-sentence kicker shown in the gallery card. ~10 words. No marketing
   * fluff; pretend you're writing a museum wall label.
   */
  kicker: string;
  /**
   * Long-form description shown on the detail page. ~80–120 words. Plain
   * sentences; describe what was built and for whom. No buzzwords.
   */
  blurb: string;
  /**
   * Short phrases for "Built with" on the detail page — client-facing outcomes
   * and craft signals, not framework names (those stay in the repo/blurb).
   */
  built: string[];
  /** Human labels for browse/filter; prefer roles and outcomes over dev jargon. */
  tags: string[];
  /** Public repo URL. Null for private/in-development. */
  repoUrl: string | null;
  /** Live URL. Null when not deployed. */
  liveUrl: string | null;
  /** Thumbnail base name — file lives at /public/showcase/{slug}.png. */
  thumbnail: string | null;
  /**
   * Whether a dark variant exists at /public/showcase/{thumbnail}-dark.png.
   * Defaults to `true` (most starters have one); set to `false` for live
   * client work where we only have the light capture.
   */
  hasDarkThumbnail?: boolean;
  /**
   * If a thumbnail isn't available yet, set `placeholder` to render a
   * type-only card (cream paper + Fraunces italic) instead.
   */
  placeholder?: { line: string; sub: string };
  /**
   * Path to the live, interactive preview of the template (static export
   * copied into /public/preview/{slug}/). When set, the detail page
   * renders a full iframe of the template under its title.
   */
  previewPath?: string;
  /**
   * Absolute URL of the *live, externally-hosted* site to iframe on the
   * detail page (for shipped client work where the canonical URL is the
   * client's own domain, not a /preview/ static export). Mutually
   * exclusive with `previewPath`; if both are set, `externalPreviewUrl`
   * wins. Subject to the external site's own X-Frame-Options /
   * frame-ancestors headers — if the site refuses to be framed, the
   * iframe will appear blank and the user must rely on the "Open full
   * screen ↗" link instead.
   */
  externalPreviewUrl?: string;
}

export const TEMPLATES: readonly TemplateEntry[] = [
  {
    slug: 'ux-journey',
    title: 'UX Journey',
    kind: 'live',
    status: 'live',
    category: 'Coaching · Live client',
    year: '2026',
    kicker: 'A coaching practice given a quiet, disciplined home online.',
    blurb:
      'UX Journey is the practice of a senior UX coach who needed a site that read as carefully as the work itself. We led the brand voice, art-directed the photography, and built the site to feel measured rather than loud. Bookings flow through Cal.com; copy was rewritten with the coach in three sessions. The site has been live since early 2026 and is the proof that hand-crafted beats template-spammed.',
    built: ['Editorial layout', 'Built-in scheduling', 'Custom typography'],
    tags: ['coaching practice', 'editorial design', 'client bookings'],
    repoUrl: null,
    liveUrl: 'https://ux-journey.com/',
    thumbnail: 'ux-journey',
    hasDarkThumbnail: false,
    placeholder: {
      line: 'ux-journey.com',
      sub: 'shipped · 2026',
    },
    externalPreviewUrl: 'https://ux-journey.com/',
  },
  {
    slug: 'lebadusul',
    title: 'Lebădușul',
    kind: 'live',
    status: 'live',
    category: 'Retail · Live client',
    year: '2026',
    kicker: 'Premium fishing tackle, brought online for a Romanian retailer.',
    blurb:
      'Lebădușul Articole de Pescuit is a family-run premium fishing-tackle store along the Romanian Danube. We helped them move off a generic Shopify theme onto a hand-crafted, editorial commerce site that reads as carefully chosen rather than mass-stocked. The hero leans on Romanian-language copy and locally-shot landscape photography; the catalogue is structured so a customer can find a specific reel as fast as they can browse a curated selection. Bookings to in-store consultations flow through a simple form. Live since 2026 and the second proof that hand-crafted beats template-spammed.',
    built: [
      'Custom storefront design',
      'Editorial product pages',
      'Secure checkout flow',
    ],
    tags: ['premium retail', 'specialty shop', 'catalog experience'],
    repoUrl: null,
    liveUrl: 'https://lebadusularticoledepescuit.ro/',
    thumbnail: 'lebadusul',
    hasDarkThumbnail: false,
    placeholder: {
      line: 'lebadusularticoledepescuit.ro',
      sub: 'shipped · 2026',
    },
    externalPreviewUrl: 'https://lebadusularticoledepescuit.ro/',
  },
  {
    slug: 'dorin-portfolio',
    title: 'Portfolio Template',
    kind: 'template',
    status: 'live',
    category: 'Independent professional',
    year: '2026',
    kicker:
      'Hand-crafted portfolio template by Dorin — the canonical starter for serious independents.',
    blurb:
      'A portfolio template authored from scratch by Dorin Andrei. Case studies are the page; everything else gets out of their way. Six pages — home, work, case studies, services, about, contact — fast, lightweight layouts with hand-written CSS. No utility-class framework, no AI-template feel. Designed to age well, ship fast, and let the work itself do the talking. This is the starter we actually deploy when a freelancer or independent professional engages Flowstarter for a portfolio site.',
    built: ['Custom layout & typography', 'Fast, lightweight pages'],
    tags: ['case studies', 'independent professionals', 'creative work'],
    repoUrl: 'https://github.com/DorinAndrei007/Portfolio-Template',
    liveUrl: null,
    thumbnail: 'dorin-portfolio',
    hasDarkThumbnail: false,
    // dorin-portfolio is the freelancer-portfolio Astro template; there is no
    // separate /preview/dorin-portfolio build, so point at the real one.
    previewPath: '/preview/freelancer-portfolio/',
  },
  {
    slug: 'june-hartley-photo',
    title: 'June Hartley Photography',
    kind: 'template',
    status: 'live',
    category: 'Photography',
    year: '2026',
    kicker:
      'Editorial wedding and portrait studio template, warm and unhurried.',
    blurb:
      "A documentary photographer's site built for the work that fills a season. Full-bleed galleries, collection-based pricing, an honest FAQ, and an inquiry flow built around checking your date rather than a generic contact form. Warm ivory paper, a Fraunces serif, and a soft clay accent keep the attention on the images. Six pages (home, work, about, investment, contact) with a calm dark mode. This is the starter we deploy when a wedding or portrait photographer engages Flowstarter.",
    built: [
      'Full-bleed galleries',
      'Collections pricing',
      'Inquiry flow',
      'Dark mode',
    ],
    tags: ['photographer', 'wedding', 'portrait', 'creative'],
    repoUrl: null,
    liveUrl: null,
    thumbnail: null,
    placeholder: {
      line: 'June Hartley Photography',
      sub: 'wedding & portrait · template',
    },
    previewPath: '/preview/june-hartley-photo/',
  },

  // ── Flowstarter Library starter templates ───────────────────────────
  // Entries below mirror the 5 templates seeded in
  // `apps/flowstarter-library/templates/{slug}/config.json` so the
  // library detail pages render for every slug exposed by the MCP's
  // `list_templates` tool (also iterated by `e2e/templates-audit.spec.ts`).
  // Preview iframes are intentionally omitted — the static
  // `/preview/{slug}/` builds aren't published yet; the audit suite
  // soft-skips preview routes that 404.
  {
    slug: 'coach-pro',
    title: 'Coach Pro',
    kind: 'template',
    status: 'live',
    category: 'Coaching',
    year: '2026',
    kicker:
      'Transformation-first template for life, business, and executive coaches.',
    blurb:
      'A multi-page coaching site with the rails wired for the work that actually pays: a booking calendar (Calendly / Cal.com), coaching packages with clear scope, client success stories, and a newsletter that respects the reader. Sage palette, generous spacing, dark mode by default. Crafted to feel like a working practice from the first scroll instead of a marketing landing page.',
    built: [
      'Booking calendar',
      'Coaching packages',
      'Client success stories',
      'Dark mode',
    ],
    tags: ['life coach', 'business coach', 'executive coach', 'transformation'],
    repoUrl: null,
    liveUrl: null,
    thumbnail: 'coach-pro',
    hasDarkThumbnail: true,
    previewPath: '/preview/coach-pro/',
  },
  {
    slug: 'creative-portfolio',
    title: 'Creative Portfolio',
    kind: 'template',
    status: 'live',
    category: 'Creative',
    year: '2026',
    kicker:
      'Bold monochrome portfolio for photographers, designers, and videographers.',
    blurb:
      'A creative portfolio template built around the work itself. Monochrome canvas with amber accents, full-bleed project galleries, and a project-inquiry form wired up out of the box. Pages are intentionally sparse so the imagery carries the page — exactly the kind of restraint that reads as "premium" without ever using the word.',
    built: [
      'Project gallery',
      'Inquiry form',
      'Creative process showcase',
      'Dark mode',
    ],
    tags: ['photographer', 'designer', 'videographer', 'portfolio'],
    repoUrl: null,
    liveUrl: null,
    thumbnail: 'creative-portfolio',
    hasDarkThumbnail: true,
  },
  {
    slug: 'fitness-coach',
    title: 'Fitness Trainer Pro',
    kind: 'template',
    status: 'live',
    category: 'Fitness',
    year: '2026',
    kicker:
      'High-energy template for personal trainers, yoga teachers, and strength coaches.',
    blurb:
      'Built for the trainers whose pitch is the transformation: before/after gallery, training programs broken down by goal, a booking pipeline that converts cold visitors into discovery calls, and a results page that lets past clients speak for the next ones. Bold type, confident colour, dark mode handled.',
    built: [
      'Transformation gallery',
      'Training programs',
      'Booking system',
      'Client results',
    ],
    tags: ['personal trainer', 'fitness', 'yoga', 'strength'],
    repoUrl: null,
    liveUrl: null,
    thumbnail: 'fitness-coach',
    hasDarkThumbnail: true,
    previewPath: '/preview/fitness-coach/',
  },
  {
    slug: 'freelancer-portfolio',
    title: 'Freelancer Portfolio',
    kind: 'template',
    status: 'live',
    category: 'Creative',
    year: '2026',
    kicker:
      'Editorial dark/light portfolio for designers, developers, and independent creatives.',
    blurb:
      "A premium portfolio for the freelancer who treats their site like a publication, not a brochure. Editorial typography, dedicated case-study pages, a services section that doesn't over-explain, and a booking flow that respects how busy the visitor is. Light and dark modes share the same restraint so the brand reads the same in either.",
    built: ['Case-study showcase', 'Services', 'Booking', 'Dark mode'],
    tags: ['freelancer', 'portfolio', 'ux designer', 'developer'],
    repoUrl: null,
    liveUrl: null,
    thumbnail: 'freelancer-portfolio',
    hasDarkThumbnail: true,
  },
  {
    slug: 'therapist-care',
    title: 'Therapist Care',
    kind: 'template',
    status: 'live',
    category: 'Mental health',
    year: '2026',
    kicker:
      'Calming, professional template for therapists, counselors, and psychologists.',
    blurb:
      'A warm sage-green palette and generous spacing make the site feel like the room itself: quiet, safe, considered. Includes appointment booking, a credentials block that surfaces specialties (EMDR, CBT, LMFT) without alphabet-soup overload, and intake-friendly copy. HIPAA-conscious by design — no embedded chat widgets, no aggressive tracking.',
    built: [
      'Appointment booking',
      'Credential showcase',
      'HIPAA-conscious design',
      'Dark mode',
    ],
    tags: ['therapist', 'counselor', 'psychologist', 'mental health'],
    repoUrl: null,
    liveUrl: null,
    thumbnail: 'therapist-care',
    hasDarkThumbnail: true,
    previewPath: '/preview/therapist-care/',
  },
];

export function getTemplate(slug: string): TemplateEntry | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}

export function getTemplateSlugs(): string[] {
  return TEMPLATES.map((t) => t.slug);
}
