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
      'Hand-crafted portfolio template by Dorin: the canonical starter for serious independents.',
    blurb:
      'A portfolio template authored from scratch by Dorin Andrei. Case studies are the page; everything else gets out of their way. Six pages: home, work, case studies, services, about, contact, in fast, lightweight layouts with hand-written CSS. No utility-class framework, no AI-template feel. Designed to age well, ship fast, and let the work itself do the talking. This is the starter we actually deploy when a freelancer or independent professional engages Flowstarter for a portfolio site.',
    built: ['Custom layout & typography', 'Fast, lightweight pages'],
    tags: ['case studies', 'independent professionals', 'creative work'],
    repoUrl: 'https://github.com/DorinAndrei007/Portfolio-Template',
    liveUrl: null,
    thumbnail: 'dorin-portfolio',
    hasDarkThumbnail: false,
    // The real Dorin GitHub portfolio, integrated as its own Astro template
    // under templates/dorin-portfolio and built to /preview/dorin-portfolio/.
    previewPath: '/preview/dorin-portfolio/',
  },
];

export function getTemplate(slug: string): TemplateEntry | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}

export function getTemplateSlugs(): string[] {
  return TEMPLATES.map((t) => t.slug);
}
