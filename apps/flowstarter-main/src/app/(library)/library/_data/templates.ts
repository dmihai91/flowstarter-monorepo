/**
 * Template manifest for the Flowstarter Library.
 *
 * Each entry corresponds to a hand-built site or starter template. New entries
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
  /** Optional credit line — shown as "Built with X" or similar. */
  built: string[];
  /** Tags surface filters/search later. Free-form, lowercase. */
  tags: string[];
  /** Public repo URL. Null for private/in-development. */
  repoUrl: string | null;
  /** Live URL. Null when not deployed. */
  liveUrl: string | null;
  /** Thumbnail base name — file lives at /public/showcase/{slug}.png. */
  thumbnail: string | null;
  /**
   * If a thumbnail isn't available yet, set `placeholder` to render a
   * type-only card (cream paper + Fraunces italic) instead.
   */
  placeholder?: { line: string; sub: string };
  /**
   * Path to the live, interactive preview of the template (Astro static
   * build copied into /public/preview/{slug}/). When set, the detail page
   * renders a full iframe of the template under its title.
   */
  previewPath?: string;
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
      'UX Journey is the practice of a senior UX coach who needed a site that read as carefully as the work itself. We led the brand voice, art-directed the photography, and built the site to feel measured rather than loud. Bookings flow through Cal.com; copy was rewritten with the coach in three sessions. The site has been live since early 2026 and is the proof that hand-built beats template-spammed.',
    built: ['Astro', 'Cal.com', 'Custom typography'],
    tags: ['coaching', 'editorial', 'cal.com'],
    repoUrl: null,
    liveUrl: 'https://ux-journey.com/',
    thumbnail: 'ux-journey',
    placeholder: {
      line: 'ux-journey.com',
      sub: 'shipped · 2026',
    },
  },
  {
    slug: 'coach-pro',
    title: 'Coach Pro',
    kind: 'template',
    status: 'live',
    category: 'Coaching',
    year: '2026',
    kicker: 'A measured starter for ICF-certified coaches and consultants.',
    blurb:
      "Coach Pro is built for working coaches who need credibility before personality — a site that won't flinch in front of a corporate procurement form. Hand-built typography, deliberate spacing, and a coral accent that signals warmth without volume. The hero leans on portrait photography and a single positioning line; the body explains programs honestly; pricing is structured so prospects can self-qualify. Four pages, twenty-six components, zero Tailwind. The whole site is composed from a hand-authored CSS design system that ages gracefully — no utility soup, no gradient buttons, no decorative shadow stacks.",
    built: ['Astro', 'Hand-built CSS', 'Clash Grotesk + Inter'],
    tags: ['coaching', 'consulting', 'editorial'],
    repoUrl: null,
    liveUrl: null,
    thumbnail: 'coach-pro',
    previewPath: '/preview/coach-pro/',
  },
  {
    slug: 'therapist-care',
    title: 'Therapist Care',
    kind: 'template',
    status: 'live',
    category: 'Mental health',
    year: '2026',
    kicker: 'Quiet, trust-first design for therapists and clinical practices.',
    blurb:
      'Therapist Care is a starter for licensed therapists, counselors and small clinical practices. The visual language is intentionally calm — sage accents, long whitespace, no aggressive CTAs — to set the tone before a first contact form. It includes a thoughtful intake form, an honest pricing block (sliding-scale included), and an FAQ structure tuned to the questions clients actually ask: insurance, cancellations, virtual sessions. Composed from the same hand-built CSS design system as Coach Pro; the per-template accent swap is the only thing that changes between them.',
    built: ['Astro', 'Hand-built CSS', 'Clash Grotesk + Inter'],
    tags: ['therapy', 'wellness', 'editorial'],
    repoUrl: null,
    liveUrl: null,
    thumbnail: 'therapist-care',
    previewPath: '/preview/therapist-care/',
  },
  {
    slug: 'freelancer-portfolio',
    title: 'Freelancer Portfolio',
    kind: 'template',
    status: 'live',
    category: 'Independent professional',
    year: '2026',
    kicker:
      'A serious portfolio for serious work — built for independents who hate template-soup.',
    blurb:
      "A portfolio template that doesn't pretend to be a Dribbble shot. Case studies are the page; everything else gets out of their way. The home page mixes selected work with a quiet services preview and a typographic about; the dedicated work index is a grid of eight case studies you can replace one-for-one. Periwinkle accents, italic-serif flourishes in the hero, restraint everywhere else. Designed to age well — no animation will look dated next year, no decoration will fight the work itself. Five pages including a dynamic case-study route.",
    built: ['Astro', 'Hand-built CSS', 'Clash Grotesk + Inter'],
    tags: ['portfolio', 'freelance', 'creative'],
    repoUrl: 'https://github.com/DorinAndrei007/Portfolio-Template',
    liveUrl: null,
    thumbnail: 'freelancer-portfolio',
    previewPath: '/preview/freelancer-portfolio/',
  },
  {
    slug: 'fitness-coach',
    title: 'Fitness Trainer Pro',
    kind: 'template',
    status: 'live',
    category: 'Fitness',
    year: '2026',
    kicker: 'A confident starter for personal trainers and small studios.',
    blurb:
      'Fitness Trainer Pro is built for trainers who want their site to read as confident, not promotional. Terracotta accent, direct verbs, no exclamation marks. The hero handles a single offer clearly; the programs page lists six engagements and a three-tier pricing block (single session, twelve-week transformation, online coaching). A four-step process explains how training actually unfolds. Same hand-built design system as the other Dorin starters; the only template-level difference is the accent and the voice. Aimed at trainers who care more about retention than signup volume.',
    built: ['Astro', 'Hand-built CSS', 'Clash Grotesk + Inter'],
    tags: ['fitness', 'coaching', 'editorial'],
    repoUrl: null,
    liveUrl: null,
    thumbnail: 'fitness-coach',
    previewPath: '/preview/fitness-coach/',
  },
  {
    slug: 'creative-portfolio',
    title: 'Creative Portfolio',
    kind: 'template',
    status: 'live',
    category: 'Creative',
    year: '2026',
    kicker: 'Editorial portfolio for photographers, art directors and studios.',
    blurb:
      'A photo-first template that lets the work breathe. Ochre accent, long slow scrolls, full-bleed image plates, italic-serif accents in the hero. The services page reads as a press kit; the contact page is short on purpose. Built for studios that have one shot to convince an art director and refuse to spend it on animation gimmicks. Four pages composed from the same hand-authored CSS design kit as the other Dorin starters — same disciplined typography, no Tailwind, no AI-template feel anywhere.',
    built: ['Astro', 'Hand-built CSS', 'Clash Grotesk + Inter'],
    tags: ['photography', 'studio', 'editorial'],
    repoUrl: null,
    liveUrl: null,
    thumbnail: 'creative-portfolio',
    previewPath: '/preview/creative-portfolio/',
  },
];

export function getTemplate(slug: string): TemplateEntry | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}

export function getTemplateSlugs(): string[] {
  return TEMPLATES.map((t) => t.slug);
}
