// The house demo template — real elements lifted from
// apps/flowstarter-templates/dorin-portfolio (intro overlay, full-height dark
// hero with highlight spans, accent stats strip, service-card grid with the
// template's icon set, dark about strip, CTA band, footer) collapsed into one
// parameterized single-file page. The agent only fills CONTENT (copy, palette,
// stats, services); the design is deterministic, so quality never varies.
import 'server-only';
import type { SiteSpec } from '@flowstarter/build-engine';

export interface TemplateFill {
  brand: {
    name: string;
    tagline: string;
    /** Saturated primary fitting the trade (hex). */
    primary: string;
    /** Soft secondary/pastel accent (hex). */
    accent: string;
    voice: string[];
  };
  hero: {
    /** Tiny kicker line above the title — the positioning angle (≤ 40 chars). */
    kicker: string;
    /** Short, punchy — set in huge uppercase display type (≤ 60 chars). */
    title: string;
    /** 1–2 sentences; `highlight` must appear verbatim inside it. */
    text: string;
    highlight: string;
    cta1: string;
    cta2: string;
  };
  /** The one-liner that separates this business from everyone else. */
  positioning: string;
  /** The signature offer, made concrete. */
  offer: {
    name: string;
    description: string;
    includes: string[]; // 4 concrete things the client gets
    note: string; // e.g. "First session free" or "No long contracts"
  };
  /** "This is for you if…" — 3 sharp audience checks. */
  audience: string[];
  /** Optional bespoke modules, included only when they fit the trade. */
  process?: { title: string; steps: Array<{ title: string; text: string }> };
  faq?: Array<{ q: string; a: string }>;
  /** Exactly 4 — facts from the description only (offer, hours, format), never invented metrics. */
  stats: Array<{ number: string; label: string }>;
  services: {
    label: string;
    titleLine1: string;
    titleLine2: string;
    items: Array<{ title: string; description: string }>; // 6
  };
  about: { label: string; title: string; p1: string; p2: string };
  cta: { title: string; text: string; button: string };
  contact: { heading: string; text: string; email: string };
  /** Art direction the agent designs — template is inspiration, not a cage. */
  style?: StyleFill;
}

export interface StyleFill {
  /** Display font (curated Google Fonts whitelist). */
  fontDisplay: string;
  /** Body font (curated whitelist). */
  fontBody: string;
  hero: 'dark' | 'light' | 'gradient' | 'split';
  caseStyle: 'uppercase' | 'normal';
  radius: 'sharp' | 'soft' | 'round';
  /** Page background tint (light, near-white). */
  paper: string;
  /** Dark surface tint (near-black, may lean toward the brand). */
  dark: string;
  /** Hero visual motif. */
  visual: 'blob' | 'arch' | 'rings' | 'tiles';
  /** Stock photo category (see STOCK_CATEGORIES); inferred from copy when missing. */
  image?: string;
  /** Section order: which story the page tells first. */
  layout?: string;
}

/** Vendored photo library in /public/stock — <cat>-hero.jpg + <cat>-about.jpg each. */
export const STOCK_CATEGORIES = [
  'barber', 'beauty', 'cafe', 'restaurant', 'bakery', 'florist', 'fitness', 'craft',
  'retail', 'coaching', 'wellness', 'photography', 'auto', 'outdoor', 'generic',
] as const;

const CATEGORY_HINTS: Array<[RegExp, string]> = [
  [/barber|haircut|fade/i, 'barber'],
  [/salon|hair|beauty|nail|lash/i, 'beauty'],
  [/coffee|cafe|café|espresso|brew/i, 'cafe'],
  [/baker|bread|pastry|cake|sourdough/i, 'bakery'],
  [/restaurant|bistro|menu|chef|kitchen|food/i, 'restaurant'],
  [/flower|floral|florist|bouquet/i, 'florist'],
  [/gym|fitness|strength|training|workout|trainer/i, 'fitness'],
  [/fish|angl|outdoor|hik|hunt|river|mountain/i, 'outdoor'],
  [/photo|camera|portrait|shoot/i, 'photography'],
  [/car|auto|garage|mechanic|repair|detail/i, 'auto'],
  [/massage|spa|wellness|therap|yoga/i, 'wellness'],
  [/wood|craft|atelier|workshop|maker|pottery|ceramic/i, 'craft'],
  [/boutique|store|shop|retail|tackle/i, 'retail'],
  [/coach|consult|advis|mentor|strateg/i, 'coaching'],
];

export const DISPLAY_FONTS = [
  'Space Grotesk',
  'Fraunces',
  'Playfair Display',
  'Sora',
  'Bricolage Grotesque',
  'DM Serif Display',
  'Syne',
  'Manrope',
] as const;
export const BODY_FONTS = ['Inter', 'Manrope', 'DM Sans', 'Work Sans', 'Source Sans 3', 'Karla'] as const;

const RADIUS: Record<StyleFill['radius'], { sm: string; md: string; lg: string }> = {
  sharp: { sm: '2px', md: '4px', lg: '8px' },
  soft: { sm: '8px', md: '12px', lg: '16px' },
  round: { sm: '12px', md: '18px', lg: '26px' },
};

export function resolveStyle(fill: TemplateFill): Required<StyleFill> {
  const st = fill.style;
  const pick = <T extends string>(v: unknown, list: readonly T[], fb: T): T =>
    list.includes(v as T) ? (v as T) : fb;
  const hex = (v: unknown, fb: string) => (/^#[0-9a-fA-F]{3,8}$/.test(String(v ?? '')) ? String(v) : fb);
  return {
    fontDisplay: pick(st?.fontDisplay, DISPLAY_FONTS, 'Space Grotesk'),
    fontBody: pick(st?.fontBody, BODY_FONTS, 'Inter'),
    hero: pick(st?.hero, ['dark', 'light', 'gradient', 'split'] as const, 'dark'),
    caseStyle: pick(st?.caseStyle, ['uppercase', 'normal'] as const, 'uppercase'),
    radius: pick(st?.radius, ['sharp', 'soft', 'round'] as const, 'soft'),
    paper: hex(st?.paper, '#F9F7F1'),
    dark: hex(st?.dark, '#0a0a0a'),
    visual: pick(st?.visual, ['blob', 'arch', 'rings', 'tiles'] as const, 'blob'),
    image: String(st?.image ?? '').slice(0, 24),
    layout: pick(st?.layout, ['classic', 'offer-first', 'story', 'proof-first'] as const, 'classic'),
  };
}

const esc = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// dorin-portfolio service icon set (design-system ServiceCard icons)
const ICONS = [
  '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>',
  '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
  '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
  '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
];

export function renderTemplate(fill: TemplateFill): string {
  const f = fill;
  const st = resolveStyle(fill);
  const r = RADIUS[st.radius];
  const heroText = esc(f.hero.text).replace(
    esc(f.hero.highlight),
    `<span class="hl">${esc(f.hero.highlight)}</span>`,
  );
  const fontHref = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(st.fontDisplay).replace(/%20/g, '+')}:wght@500;600;700&family=${encodeURIComponent(st.fontBody).replace(/%20/g, '+')}:wght@400;500;600;700&display=swap`;
  // hero visual motif variants (pure CSS art)
  const VISUALS: Record<string, string> = {
    blob: '<div class="blob"></div><span class="ring"></span><span class="dot"></span>',
    arch: '<div class="arch"></div><span class="dot"></span>',
    rings: '<div class="rings"><span></span><span></span><span></span></div>',
    tiles: '<div class="tiles"><span></span><span></span><span></span><span></span></div>',
  };
  const heroVisual = VISUALS[st.visual];
  // topical photography for the hero/about from the vendored /stock library:
  // the fill model picks a category; when missing we infer one from the copy.
  // The brand-tinted gradient stays underneath as the graceful fallback.
  const inferText = `${f.brand.name} ${f.brand.tagline} ${f.hero.kicker} ${f.services.label} ${f.services.titleLine1} ${f.services.titleLine2}`;
  const imageCat = (STOCK_CATEGORIES as readonly string[]).includes(st.image)
    ? st.image
    : (CATEGORY_HINTS.find(([re]) => re.test(inferText))?.[1] ?? 'generic');

  const statsHtml = `  <section class="stats">
    <div class="container stats-inner">
      ${f.stats.slice(0, 4).map((s) => `<div class="stat"><b>${esc(s.number)}</b><span>${esc(s.label)}</span></div>`).join('\n      ')}
    </div>
  </section>`;

  const quoteHtml = `  <section class="position">
    <div class="container">
      <blockquote>“<em>${esc(f.positioning)}</em>”</blockquote>
      <div class="who">${esc(f.brand.name)} · ${esc(f.brand.tagline)}</div>
    </div>
  </section>`;

  const servicesHtml = `  <section class="services" id="services">
    <div class="container">
      <div class="services-head">
        <div>
          <div class="section-label">${esc(f.services.label)}</div>
          <h2 class="section-title">${esc(f.services.titleLine1)}<br/>${esc(f.services.titleLine2)}</h2>
        </div>
        <a class="btn btn-primary" href="#contact">${esc(f.cta.button)}</a>
      </div>
      <div class="services-grid">
        ${f.services.items.slice(0, 6).map((it, i) => `<div class="card"><div class="icon">${ICONS[i % ICONS.length]}</div><h4>${esc(it.title)}</h4><p>${esc(it.description)}</p></div>`).join('\n        ')}
      </div>
    </div>
  </section>`;

  const offerHtml = `  <section class="offer">
    <div class="container">
      <div class="section-label">The signature offer</div>
      <h2 class="section-title">${esc(f.offer.name)}</h2>
      <div class="offer-card">
        <div class="offer-main">
          <div class="tagp">What it is</div>
          <h3>${esc(f.offer.name)}</h3>
          <p>${esc(f.offer.description)}</p>
          <span class="note">${esc(f.offer.note)}</span>
        </div>
        <ul class="offer-list">
          <b>What you get</b>
          ${f.offer.includes.slice(0, 4).map((x) => `<li>${esc(x)}</li>`).join('\n          ')}
        </ul>
      </div>
    </div>
  </section>`;

  const audienceHtml = `  <section class="audience">
    <div class="pin-wrap">
      <div class="pin-stage">
        <div class="container pin-grid">
          <div>
          <div class="section-label">Is this you?</div>
          <h2 class="section-title">This is for you if</h2>
          <div class="pin-panels">
            ${f.audience.slice(0, 3).map((a, i) => `<div class="pin-panel${i === 0 ? ' is-on' : ''}"><b>0${i + 1} · 0${Math.min(f.audience.length, 3)}</b><p>${esc(a)}</p></div>`).join('\n            ')}
          </div>
          <div class="pin-hint">Keep scrolling</div>
          </div>
          <div class="pin-circles" aria-hidden="true"><span></span><span></span><span></span></div>
        </div>
      </div>
    </div>
  </section>`;

  const aboutHtml = `  <section class="about" id="about">
    <div class="container about-inner">
      <div>
        <div class="section-label">${esc(f.about.label)}</div>
        <h2 class="section-title">${esc(f.about.title)}</h2>
        <p>${esc(f.about.p1)}</p>
        <p>${esc(f.about.p2)}</p>
      </div>
      <div class="about-photo" aria-hidden="true"></div>
    </div>
  </section>`;

  // bespoke modules the agent includes only when they fit the trade
  const processHtml = f.process?.steps?.length
    ? `  <section class="process" id="process">
    <div class="container">
      <div class="section-label">How it works</div>
      <h2 class="section-title">${esc(f.process.title)}</h2>
      <div class="process-grid">
        ${f.process.steps.slice(0, 4).map((sp, i) => `<div class="step"><i>0${i + 1}</i><h4>${esc(sp.title)}</h4><p>${esc(sp.text)}</p></div>`).join('\n        ')}
      </div>
    </div>
  </section>`
    : '';
  const faqHtml = f.faq?.length
    ? `  <section class="faqs">
    <div class="container">
      <div class="section-label">Good to know</div>
      <h2 class="section-title">Questions, answered</h2>
      ${f.faq.slice(0, 4).map((x) => `<details><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`).join('\n      ')}
    </div>
  </section>`
    : '';

  // the agent picks the narrative order; modules slot in where they belong
  const LAYOUTS: Record<string, string[]> = {
    classic: ['stats', 'quote', 'services', 'offer', 'audience', 'about'],
    'offer-first': ['offer', 'stats', 'services', 'quote', 'audience', 'about'],
    story: ['quote', 'about', 'services', 'stats', 'offer', 'audience'],
    'proof-first': ['stats', 'services', 'quote', 'audience', 'offer', 'about'],
  };
  const sectionMap: Record<string, string> = {
    stats: statsHtml, quote: quoteHtml, services: servicesHtml, offer: offerHtml,
    audience: audienceHtml, about: aboutHtml, process: processHtml, faq: faqHtml,
  };
  const order = [...(LAYOUTS[st.layout] ?? LAYOUTS.classic)];
  if (processHtml) order.splice(order.indexOf('services') + 1, 0, 'process');
  if (faqHtml) order.push('faq');
  const sectionsHtml = order.filter((k) => sectionMap[k]).map((k) => sectionMap[k]).join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(f.brand.name)} · ${esc(f.brand.tagline)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="${fontHref}" rel="stylesheet" />
<!--FILL${JSON.stringify(fill)}FILL-->
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  :root {
    --bg-dark: ${esc(st.dark)};
    --surface-base: ${esc(st.paper)};
    --brand-primary: ${esc(f.brand.primary)};
    --accent: ${esc(f.brand.accent)};
    --text-primary: #0a0a0a;
    --text-secondary: #6b6b6b;
    --text-on-dark: #ffffff;
    --surface-panel: rgba(255,255,255,.72);
    --panel-border: rgba(10,10,10,.14);
    --shadow-float: 0 18px 36px rgba(10,10,10,.12);
    --container: 1200px;
    --section-pad: 100px 0;
    --fs-display: clamp(2.6rem, 6vw, 4.2rem);
    --fs-h2: clamp(2rem, 4vw, 2.75rem);
    --fs-h4: 1.35rem;
    --fs-body: 1.05rem;
    --r-sm: ${r.sm}; --r-md: ${r.md}; --r-lg: ${r.lg};
    --case: ${st.caseStyle === 'uppercase' ? 'uppercase' : 'none'};
    --font: '${st.fontBody}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-display: '${st.fontDisplay}', '${st.fontBody}', -apple-system, sans-serif;
    --hero-img: url('/stock/${imageCat}-hero.jpg');
    --about-img: url('/stock/${imageCat}-about.jpg');
  }
  body { font-family: var(--font); background: var(--surface-base); color: var(--text-primary); font-size: var(--fs-body); line-height: 1.5; -webkit-font-smoothing: antialiased; }
  .container { max-width: var(--container); margin: 0 auto; padding: 0 24px; }
  h1,h2,h3,h4 { line-height: 1.08; letter-spacing: -0.02em; font-weight: 650; font-family: var(--font-display); }
  a { color: inherit; text-decoration: none; }
  .btn { display: inline-block; font-weight: 600; font-size: .95rem; padding: 14px 28px; border-radius: var(--r-md); transition: transform .3s ease, box-shadow .3s ease; text-align: center; }
  .btn:hover { transform: translateY(-2px); }
  .btn-primary { background: var(--brand-primary); color: #fff; box-shadow: 0 10px 22px -10px var(--brand-primary); }
  .btn-outline-light { border: 1.5px solid rgba(255,255,255,.4); color: #fff; }
  .btn-on-dark { background: var(--accent); color: var(--bg-dark); box-shadow: 0 10px 22px -10px rgba(0,0,0,.5); }
  .btn-outline-light:hover { border-color: #fff; }
  .section-label { font-size: .85rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; color: var(--brand-primary); font-weight: 600; }
  .section-title { font-size: var(--fs-h2); text-transform: var(--case); }

  /* intro overlay — brand name blur-in, then the page reveals (dorin hero) */
  .intro { position: fixed; inset: 0; z-index: 200; background: var(--bg-dark); display: flex; align-items: center; justify-content: center; padding: 0 clamp(20px,5vw,80px); pointer-events: none; animation: intro-exit .6s cubic-bezier(.4,0,.2,1) forwards; animation-delay: .9s; }
  .intro span { font-family: var(--font-display); font-weight: 650; text-transform: var(--case); letter-spacing: -0.03em; color: #fff; text-align: center; line-height: 1.05; font-size: clamp(2.6rem, 9vw, 7rem); opacity: 0; animation: intro-text .7s cubic-bezier(.22,1,.36,1) forwards; animation-delay: .08s; }
  @keyframes intro-text { from { opacity: 0; filter: blur(24px); transform: scale(.88); } to { opacity: 1; filter: blur(0); transform: scale(1); } }
  @keyframes intro-exit { to { opacity: 0; visibility: hidden; } }
  @keyframes enter { from { opacity: 0; transform: translateX(-28px); filter: blur(10px); } to { opacity: 1; transform: none; filter: blur(0); } }
  @media (prefers-reduced-motion: reduce) { .intro { display: none; } .hero-title, .hero-text, .hero-actions { opacity: 1 !important; animation: none !important; } }

  /* header */
  header { position: absolute; top: 0; left: 0; right: 0; z-index: 10; }
  .nav { display: flex; align-items: center; justify-content: space-between; padding: 22px 24px; max-width: var(--container); margin: 0 auto; color: #fff; }
  .nav .word { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; }
  .nav nav { display: flex; gap: 26px; font-size: .92rem; color: rgba(255,255,255,.75); align-items: center; }
  .nav nav a:hover { color: #fff; }
  .nav .btn { padding: 10px 20px; }

  /* hero — variants (dorin-inspired) */
  .hero { background: var(--bg-dark); color: var(--text-on-dark); overflow: clip; }
  .hero--gradient { background: linear-gradient(140deg, var(--bg-dark) 30%, var(--brand-primary) 160%); }
  .hero--light { background: var(--surface-base); color: var(--text-primary); }
  .hero--light .hero-text { color: rgba(10,10,10,.72); }
  .hero--light .hero-text .hl { color: var(--brand-primary); }
  .hero--light .btn-on-dark { background: var(--brand-primary); color: #fff; }
  .hero--light .btn-outline-light { border-color: rgba(10,10,10,.3); color: var(--text-primary); }
  .hero--light + .stats { border-top: 1px solid var(--panel-border); }
  header.on-light, header.on-light .nav { color: var(--text-primary); }
  header.on-light .nav nav { color: rgba(10,10,10,.6); }
  header.on-light .nav nav a:hover { color: var(--text-primary); }
  header.on-light + .intro { display: none; }
  .hero--split .hero-visual::before { content: ''; position: absolute; inset: -120px -100vw -120px 18%; background: var(--brand-primary); z-index: -1; }
  .hero--split .hero-visual .blob, .hero--split .hero-visual .arch { inset: 12% 4% 16% 26%; }
  .hero-inner { display: grid; grid-template-columns: minmax(0,1fr) minmax(320px,44%); gap: 56px; align-items: center; min-height: max(680px, 92vh); padding-block: 120px 80px; }
  .hero-kicker { font-size: .85rem; text-transform: uppercase; letter-spacing: 2.4px; color: var(--accent); font-weight: 700; margin-bottom: 18px; opacity: 0; animation: enter .75s cubic-bezier(.22,1,.36,1) forwards; animation-delay: .12s; }
  .hero--light .hero-kicker { color: var(--brand-primary); }
  .hero-title { font-size: var(--fs-display); text-transform: var(--case); letter-spacing: -0.03em; margin-bottom: 24px; opacity: 0; animation: enter .75s cubic-bezier(.22,1,.36,1) forwards; animation-delay: .22s; }
  .hero-text { font-size: 1.25rem; line-height: 1.45; max-width: 480px; margin-bottom: 32px; color: rgba(255,255,255,.82); opacity: 0; animation: enter .75s cubic-bezier(.22,1,.36,1) forwards; animation-delay: .35s; }
  .hero-text .hl { color: var(--accent); }
  .hero-actions { display: flex; gap: 16px; flex-wrap: wrap; opacity: 0; animation: enter .75s cubic-bezier(.22,1,.36,1) forwards; animation-delay: .48s; }
  .hero-visual { position: relative; min-height: 440px; align-self: stretch; }
  .hero-visual .blob { position: absolute; inset: 8% 0 12% 6%; border-radius: 32px 120px 32px 32px; background-color: var(--brand-primary); background-image: linear-gradient(160deg, color-mix(in srgb, var(--accent) 26%, transparent), color-mix(in srgb, var(--brand-primary) 34%, transparent) 75%), var(--hero-img), linear-gradient(160deg, var(--accent), var(--brand-primary) 75%); background-size: cover; background-position: center; }
  .hero-visual .arch { position: absolute; inset: 8% 4% 0 10%; border-radius: 999px 999px 0 0; background-color: var(--brand-primary); background-image: linear-gradient(180deg, color-mix(in srgb, var(--accent) 22%, transparent), color-mix(in srgb, var(--brand-primary) 30%, transparent) 85%), var(--hero-img), linear-gradient(180deg, var(--accent), var(--brand-primary) 85%); background-size: cover; background-position: center; }
  .hero-visual .rings { position: absolute; inset: 0; display: grid; place-items: center; }
  .hero-visual .rings span { position: absolute; border-radius: 50%; border: 2px solid var(--accent); }
  .hero-visual .rings span:nth-child(1) { width: 78%; aspect-ratio: 1; opacity: .35; }
  .hero-visual .rings span:nth-child(2) { width: 62%; aspect-ratio: 1; opacity: 1; border-color: var(--brand-primary); background-color: var(--brand-primary); background-image: linear-gradient(color-mix(in srgb, var(--brand-primary) 18%, transparent), color-mix(in srgb, var(--brand-primary) 18%, transparent)), var(--hero-img), radial-gradient(circle at 35% 30%, var(--accent), transparent 70%); background-size: cover; background-position: center; }
  .hero-visual .rings span:nth-child(3) { width: 26%; aspect-ratio: 1; background: var(--accent); border: none; transform: translate(120%, 95%); }
  .hero-visual .tiles { position: absolute; inset: 6% 2% 10% 8%; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .hero-visual .tiles span { border-radius: var(--r-lg); }
  .hero-visual .tiles span:nth-child(1) { background-color: var(--brand-primary); background-image: linear-gradient(150deg, color-mix(in srgb, var(--accent) 24%, transparent), color-mix(in srgb, var(--brand-primary) 30%, transparent)), var(--hero-img), linear-gradient(150deg, var(--accent), var(--brand-primary)); background-size: cover; background-position: top; }
  .hero-visual .tiles span:nth-child(2) { background: var(--brand-primary); border-radius: 50% 50% var(--r-lg) var(--r-lg); }
  .hero-visual .tiles span:nth-child(3) { border: 2px solid var(--accent); }
  .hero-visual .tiles span:nth-child(4) { border-radius: var(--r-lg) var(--r-lg) 50% 50%; background-color: var(--brand-primary); background-image: linear-gradient(40deg, color-mix(in srgb, var(--brand-primary) 30%, transparent), color-mix(in srgb, var(--accent) 24%, transparent)), var(--hero-img), linear-gradient(40deg, var(--brand-primary), var(--accent)); background-size: cover; background-position: bottom; }
  .hero-visual .blob::after { content: ''; position: absolute; inset: 0; border-radius: inherit; background: radial-gradient(120% 90% at 28% 8%, rgba(255,255,255,.16), transparent 55%); }
  .hero-visual .ring { position: absolute; width: 120px; height: 120px; border-radius: 50%; border: 2px solid var(--accent); bottom: 4%; left: -8px; opacity: .8; }
  .hero-visual .dot { position: absolute; width: 52px; height: 52px; border-radius: 50%; background: var(--accent); top: 4%; right: 10%; }
  .hv-card { position: absolute; left: -4%; bottom: 12%; background: #fff; color: var(--text-primary); border-radius: var(--r-md); box-shadow: var(--shadow-float); padding: 16px 20px; max-width: 250px; display: flex; flex-direction: column; gap: 4px; animation: hv-float 7s ease-in-out infinite; }
  .hv-card .hv-k { font-weight: 700; font-size: .95rem; line-height: 1.3; }
  .hv-card .hv-t { font-size: .8rem; color: var(--text-secondary); line-height: 1.45; }
  .hv-chip { position: absolute; top: 10%; right: 0; background: var(--bg-dark); color: #fff; border-radius: 99px; padding: 10px 18px; font-size: .85rem; font-weight: 600; box-shadow: var(--shadow-float); animation: hv-float 9s ease-in-out infinite reverse; }
  .hv-chip b { color: var(--accent); margin-right: 7px; }
  @keyframes hv-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  @media (prefers-reduced-motion: reduce) { .hv-card, .hv-chip { animation: none; } }

  /* stats strip — accent background (dorin Stats) */
  .stats { background: var(--accent); padding: 72px 0; }
  .stats-inner { display: grid; grid-template-columns: repeat(4,1fr); gap: 48px; }
  .stat b { display: block; font-size: 2.4rem; font-weight: 700; letter-spacing: -0.02em; }
  .stat span { font-size: .8rem; text-transform: uppercase; letter-spacing: 1.6px; color: rgba(10,10,10,.6); font-weight: 600; }

  /* services — card grid (dorin ServiceCard) */
  .services { padding: var(--section-pad); }
  .services-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 56px; flex-wrap: wrap; }
  .services-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
  .card { background: var(--surface-panel); border: 1px solid var(--panel-border); border-radius: var(--r-lg); padding: 30px 26px; transition: transform .3s ease, box-shadow .3s ease; }
  .card:hover { transform: translateY(-4px); box-shadow: var(--shadow-float); }
  .card .icon { color: var(--brand-primary); margin-bottom: 18px; }
  .card h4 { font-size: var(--fs-h4); margin-bottom: 10px; }
  .card p { font-size: .95rem; color: var(--text-secondary); line-height: 1.55; }

  /* positioning pull-quote strip */
  .position { padding: 88px 0; background: #fff; border-top: 1px solid var(--panel-border); border-bottom: 1px solid var(--panel-border); }
  .position blockquote { font-family: var(--font-display); font-size: clamp(1.7rem, 3.4vw, 2.6rem); line-height: 1.2; letter-spacing: -0.02em; max-width: 22ch; font-weight: 650; }
  .position blockquote em { font-style: normal; color: var(--brand-primary); }
  .position .who { margin-top: 18px; font-size: .85rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text-secondary); font-weight: 600; }

  /* signature offer showcase */
  .offer { padding: var(--section-pad); }
  .offer-card { display: grid; grid-template-columns: 1.1fr .9fr; gap: 0; border-radius: var(--r-lg); overflow: hidden; box-shadow: var(--shadow-float); margin-top: 48px; }
  .offer-main { background: var(--bg-dark); color: #fff; padding: clamp(32px, 5vw, 56px); }
  .offer-main .tagp { font-size: .8rem; text-transform: uppercase; letter-spacing: 2px; color: var(--accent); font-weight: 700; }
  .offer-main h3 { font-size: clamp(1.6rem, 3vw, 2.2rem); margin: 12px 0 14px; text-transform: var(--case); }
  .offer-main p { color: rgba(255,255,255,.78); line-height: 1.6; margin-bottom: 22px; }
  .offer-main .note { display: inline-block; background: var(--accent); color: var(--bg-dark); font-weight: 700; font-size: .85rem; padding: 8px 14px; border-radius: 99px; }
  .offer-list { background: var(--brand-primary); color: #fff; padding: clamp(32px, 5vw, 56px); display: flex; flex-direction: column; justify-content: center; gap: 16px; }
  .offer-list b { font-size: .8rem; text-transform: uppercase; letter-spacing: 2px; opacity: .8; }
  .offer-list li { list-style: none; display: flex; gap: 12px; align-items: flex-start; font-size: 1rem; line-height: 1.45; }
  .offer-list li::before { content: '✓'; font-weight: 800; flex-shrink: 0; }

  /* audience — scroll-pinned "for you if" tour; static list on mobile/reduced motion */
  .audience { padding: 0 0 100px; }
  .pin-panel { border-left: 3px solid var(--brand-primary); padding: 6px 0 6px 20px; margin-top: 24px; font-size: 1.02rem; line-height: 1.5; }
  .pin-panel b { color: var(--brand-primary); display: block; font-size: .8rem; text-transform: uppercase; letter-spacing: 1.6px; margin-bottom: 6px; }
  .pin-hint { display: none; }
  .pin-circles { display: none; }
  @media (min-width: 900px) and (prefers-reduced-motion: no-preference) {
    .audience { padding: 0; }
    .pin-wrap { height: 240vh; }
    .pin-stage { position: sticky; top: 0; min-height: 100vh; display: flex; align-items: center; }
    .pin-panels { position: relative; min-height: 10em; margin-top: 36px; }
    .pin-panel { position: absolute; inset: 0; margin: 0; border: none; padding: 0; opacity: 0; transform: translateY(16px); transition: opacity .45s ease, transform .45s ease; }
    .pin-panel.is-on { opacity: 1; transform: none; }
    .pin-panel p { font-family: var(--font-display); font-size: clamp(1.6rem, 3vw, 2.4rem); line-height: 1.2; letter-spacing: -0.02em; font-weight: 650; max-width: 26ch; }
    .pin-hint { display: block; margin-top: 48px; font-size: .8rem; letter-spacing: 2px; text-transform: uppercase; color: var(--text-secondary); }
    .pin-grid { display: grid; grid-template-columns: 1.1fr .9fr; gap: 48px; align-items: center; }
    .pin-circles { display: flex; align-items: center; justify-content: center; --apart: calc((1 - var(--pin-p, 0)) * 78px); }
    .pin-circles span { width: clamp(110px, 11vw, 168px); height: clamp(110px, 11vw, 168px); border-radius: 50%; mix-blend-mode: multiply; will-change: transform; }
    .pin-circles span:nth-child(1) { background: var(--accent); transform: translateX(calc(var(--apart) * -1)); }
    .pin-circles span:nth-child(2) { background: #EBE8DF; margin-left: -30px; }
    .pin-circles span:nth-child(3) { background: var(--brand-primary); margin-left: -30px; transform: translateX(var(--apart)); }
  }

  /* process timeline + faq (agent-included modules) */
  .process { padding: var(--section-pad); }
  .process-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 48px; }
  .step { border-top: 2px solid var(--brand-primary); padding-top: 22px; }
  .step i { font-style: normal; font-weight: 700; font-size: .85rem; color: var(--brand-primary); letter-spacing: 2px; }
  .step h4 { margin: 10px 0; font-size: var(--fs-h4); }
  .step p { color: var(--text-secondary); font-size: .95rem; line-height: 1.55; }
  .faqs { padding: 0 0 100px; }
  .faqs details { border: 1px solid var(--panel-border); border-radius: 14px; background: #fff; padding: 0 22px; margin-top: 10px; }
  .faqs summary { cursor: pointer; font-weight: 650; padding: 18px 0; list-style: none; display: flex; justify-content: space-between; gap: 14px; }
  .faqs summary::-webkit-details-marker { display: none; }
  .faqs summary::after { content: '+'; color: var(--brand-primary); font-size: 1.3rem; line-height: 1; }
  .faqs details[open] summary::after { content: '–'; }
  .faqs details p { padding: 0 0 18px; color: var(--text-secondary); line-height: 1.6; }

  /* about — dark strip with the dorin circles */
  .about { background: var(--bg-dark); color: var(--text-on-dark); padding: var(--section-pad); }
  .about-inner { display: grid; grid-template-columns: 1.1fr .9fr; gap: 64px; align-items: center; }
  .about p { color: rgba(255,255,255,.78); margin-top: 18px; line-height: 1.6; }
  .about .section-title { color: #fff; }
  .about-photo { aspect-ratio: 4 / 3; border-radius: var(--r-lg); background-color: var(--brand-primary); background-image: linear-gradient(color-mix(in srgb, var(--bg-dark) 14%, transparent), color-mix(in srgb, var(--bg-dark) 14%, transparent)), var(--about-img), linear-gradient(150deg, var(--accent), var(--brand-primary)); background-size: cover; background-position: center; box-shadow: var(--shadow-float); }

  /* CTA band */
  .cta { padding: var(--section-pad); }
  .cta-band { background: var(--brand-primary); color: #fff; border-radius: 24px; padding: clamp(48px, 7vw, 88px) clamp(28px, 6vw, 80px); text-align: center; box-shadow: 0 30px 60px -30px var(--brand-primary); }
  .cta-band h2 { font-size: var(--fs-h2); text-transform: uppercase; max-width: 18ch; margin: 0 auto 14px; }
  .cta-band p { color: rgba(255,255,255,.85); max-width: 52ch; margin: 0 auto 32px; }
  .cta-band .btn { background: #fff; color: var(--text-primary); }

  /* contact + footer */
  .contact { padding: 0 0 100px; text-align: center; }
  .contact p { color: var(--text-secondary); max-width: 52ch; margin: 14px auto 26px; }
  footer { background: var(--bg-dark); color: rgba(255,255,255,.7); padding: 34px 0; }
  .foot { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; font-size: .9rem; }
  .foot b { color: #fff; font-size: 1.05rem; }

  @media (max-width: 820px) {
    .hero-inner { grid-template-columns: 1fr; min-height: auto; padding: 110px 0 56px; gap: 36px; }
    .hero-visual { min-height: 300px; }
    .stats-inner { grid-template-columns: repeat(2,1fr); gap: 32px; }
    .services-grid { grid-template-columns: 1fr; }
    .process-grid { grid-template-columns: 1fr; }
    .about-inner { grid-template-columns: 1fr; gap: 40px; }
    .offer-card { grid-template-columns: 1fr; }
    .aud-grid { grid-template-columns: 1fr; }
    .nav nav { display: none; }
    :root { --section-pad: 64px 0; }
  }
</style>
</head>
<body>
  ${st.hero === 'light' ? '' : `<div class="intro" aria-hidden="true"><span>${esc(f.brand.name)}</span></div>`}

  <header class="${st.hero === 'light' ? 'on-light' : ''}">
    <div class="nav">
      <span class="word">${esc(f.brand.name)}</span>
      <nav>
        <a href="#services">Services</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
        <a class="btn btn-on-dark" href="#contact">${esc(f.hero.cta1)}</a>
      </nav>
    </div>
  </header>

  <section class="hero hero--${st.hero}">
    <div class="container hero-inner">
      <div>
        <div class="hero-kicker">${esc(f.hero.kicker)}</div>
        <h1 class="hero-title">${esc(f.hero.title)}</h1>
        <p class="hero-text">${heroText}</p>
        <div class="hero-actions">
          <a class="btn btn-on-dark" href="#contact">${esc(f.hero.cta1)}</a>
          <a class="btn btn-outline-light" href="#services">${esc(f.hero.cta2)}</a>
        </div>
      </div>
      <div class="hero-visual" aria-hidden="true">
        ${heroVisual}
        ${f.offer.name ? `<div class="hv-card"><span class="hv-k">${esc(f.offer.name)}</span><span class="hv-t">${esc(f.offer.note || f.brand.tagline)}</span></div>` : ''}
        ${f.stats[0]?.number ? `<div class="hv-chip"><b>${esc(f.stats[0].number)}</b>${esc(f.stats[0].label)}</div>` : ''}
      </div>
    </div>
  </section>

${sectionsHtml}

  <section class="cta">
    <div class="container">
      <div class="cta-band">
        <h2>${esc(f.cta.title)}</h2>
        <p>${esc(f.cta.text)}</p>
        <a class="btn" href="mailto:${esc(f.contact.email)}">${esc(f.cta.button)}</a>
      </div>
    </div>
  </section>

  <section class="contact" id="contact">
    <div class="container">
      <div class="section-label">Contact</div>
      <h2 class="section-title">${esc(f.contact.heading)}</h2>
      <p>${esc(f.contact.text)}</p>
      <a class="btn btn-primary" href="mailto:${esc(f.contact.email)}">${esc(f.cta.button)}</a>
    </div>
  </section>

  <footer>
    <div class="container foot">
      <b>${esc(f.brand.name)}</b>
      <span>${esc(f.brand.tagline)}</span>
      <a href="mailto:${esc(f.contact.email)}">${esc(f.contact.email)}</a>
    </div>
  </footer>
  <script>
  (function () {
    var wrap = document.querySelector('.pin-wrap');
    if (!wrap) return;
    var panels = wrap.querySelectorAll('.pin-panel');
    if (!panels.length) return;
    var mq = matchMedia('(min-width: 900px)');
    var rm = matchMedia('(prefers-reduced-motion: reduce)');
    function onScroll() {
      if (!mq.matches || rm.matches) return;
      var total = wrap.offsetHeight - innerHeight;
      if (total <= 0) return;
      var passed = Math.min(Math.max(-wrap.getBoundingClientRect().top, 0), total);
      wrap.style.setProperty('--pin-p', (passed / total).toFixed(3));
      var idx = Math.min(panels.length - 1, Math.floor((passed / total) * panels.length));
      for (var i = 0; i < panels.length; i++) panels[i].classList.toggle('is-on', i === idx);
    }
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();
  </script>
</body>
</html>`;
}

/** Recover the fill from a rendered page (for refinement turns). */
export function parseFillFromHtml(html: string): TemplateFill | null {
  const m = html.match(/<!--FILL([\s\S]*?)FILL-->/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]) as TemplateFill;
  } catch {
    return null;
  }
}

export function fillToSpec(f: TemplateFill): SiteSpec {
  return {
    brand: {
      name: f.brand.name,
      tagline: f.brand.tagline,
      palette: [f.brand.primary, f.brand.accent, '#0a0a0a', '#F9F7F1'],
      voice: f.brand.voice.slice(0, 3),
    },
    copy: {
      hero: f.hero.title,
      sub: f.hero.text,
      cta: f.hero.cta1,
      sections: f.services.items.slice(0, 3).map((s) => ({ h: s.title, p: s.description })),
    },
    positioning: f.positioning || f.brand.tagline,
  };
}

/** Keyless/offline fallback: map a SiteSpec onto the template so even the
 *  fallback looks like the house design. */
export function fillFromSpec(spec: SiteSpec, email = 'hello@example.com'): TemplateFill {
  const items = [
    ...spec.copy.sections.map((s) => ({ title: s.h, description: s.p })),
    { title: 'Easy to reach', description: 'One tap to call, email or find us — on any device.' },
    { title: 'Clear pricing', description: 'Know what it costs before you commit. No surprises.' },
    { title: 'Made for you', description: 'Everything here is shaped around how you actually work.' },
  ].slice(0, 6);
  return {
    brand: {
      name: spec.brand.name,
      tagline: spec.brand.tagline,
      primary: spec.brand.palette[0],
      accent: spec.brand.palette[1],
      voice: spec.brand.voice,
    },
    hero: {
      kicker: spec.brand.tagline,
      title: spec.copy.hero,
      text: spec.copy.sub,
      highlight: '',
      cta1: spec.copy.cta,
      cta2: 'See what we do',
    },
    positioning: spec.positioning,
    offer: {
      name: spec.copy.sections[0]?.h ?? 'How we work',
      description: spec.copy.sections[0]?.p ?? spec.copy.sub,
      includes: [
        'A first conversation about what you need',
        'A clear plan before anything starts',
        'Honest pricing up front',
        'One person who knows your name',
      ],
      note: 'No obligation to start',
    },
    audience: [
      'You want this handled properly, without doing it yourself.',
      'You value clear communication and honest pricing.',
      'You\u2019d rather work with someone local who cares.',
    ],
    stats: [
      { number: '1:1', label: 'Personal service' },
      { number: '7/7', label: 'Here for you' },
      { number: '100%', label: 'Local & independent' },
      { number: '№1', label: 'Priority: you' },
    ],
    services: {
      label: 'What we do',
      titleLine1: 'Services built',
      titleLine2: 'around you',
      items,
    },
    about: {
      label: 'About',
      title: spec.positioning,
      p1: spec.copy.sub,
      p2: 'Get in touch and tell us what you need — we’ll take it from there.',
    },
    cta: {
      title: 'Ready when you are',
      text: spec.copy.sub,
      button: spec.copy.cta,
    },
    contact: {
      heading: 'Let’s talk',
      text: 'Send a message and we’ll get back to you within a day.',
      email,
    },
  };
}

// ---------------------------------------------------------------------------
// PREMIUM render — the paid build. Same fill, visibly richer page: fixed
// blurred nav, scroll-reveal motion, gallery, process timeline, packages and
// FAQ (all derived from the agent's fill — nothing fabricated). This is the
// quality gap that justifies the delivery payment.
// ---------------------------------------------------------------------------

export function renderPremiumTemplate(fill: TemplateFill): string {
  const f = fill;
  let html = renderTemplate(fill);

  const extraCss = `
  /* premium: fixed blurred nav */
  header { position: fixed; background: rgba(10,10,10,.55); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); border-bottom: 1px solid rgba(255,255,255,.08); }
  /* premium: scroll reveal */
  .rv { opacity: 0; transform: translateY(26px); transition: opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1); }
  .rv.in { opacity: 1; transform: none; }
  @media (prefers-reduced-motion: reduce) { .rv { opacity: 1; transform: none; transition: none; } }
  /* gallery */
  .gallery { padding: var(--section-pad); background: #fff; }
  .gallery-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-top: 48px; }
  .tile { border-radius: 16px; aspect-ratio: 4/3; position: relative; overflow: hidden; }
  .tile::after { content: ''; position: absolute; inset: 0; background: radial-gradient(120% 90% at 30% 10%, rgba(255,255,255,.28), transparent 55%); }
  .tile:nth-child(1) { background: linear-gradient(150deg, var(--accent), var(--brand-primary)); }
  .tile:nth-child(2) { background: linear-gradient(220deg, var(--brand-primary), #0a0a0a 130%); border-radius: 16px 80px 16px 16px; }
  .tile:nth-child(3) { background: linear-gradient(120deg, #EBE8DF, var(--accent)); }
  .tile:nth-child(4) { background: linear-gradient(40deg, var(--brand-primary) 10%, var(--accent)); border-radius: 80px 16px 16px 16px; }
  .tile:nth-child(5) { background: linear-gradient(190deg, #0a0a0a, var(--brand-primary) 140%); }
  .tile:nth-child(6) { background: linear-gradient(320deg, var(--accent), #EBE8DF); border-radius: 16px 16px 80px 16px; }
  .tile b { position: absolute; left: 18px; bottom: 14px; color: #fff; font-size: .95rem; letter-spacing: .02em; text-shadow: 0 1px 8px rgba(0,0,0,.35); z-index: 1; }
  /* process timeline */
  .process { padding: var(--section-pad); }
  .process-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 48px; counter-reset: step; }
  .step { border-top: 2px solid var(--brand-primary); padding-top: 22px; position: relative; }
  .step i { font-style: normal; font-weight: 700; font-size: .85rem; color: var(--brand-primary); letter-spacing: 2px; }
  .step h4 { margin: 10px 0; font-size: var(--fs-h4); }
  .step p { color: var(--text-secondary); font-size: .95rem; line-height: 1.55; }
  /* packages */
  .packages { padding: var(--section-pad); background: #fff; }
  .pack-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 48px; }
  .pack { border: 1px solid var(--panel-border); border-radius: 16px; padding: 30px 26px; background: var(--surface-base); transition: transform .3s ease, box-shadow .3s ease; }
  .pack:hover { transform: translateY(-4px); box-shadow: var(--shadow-float); }
  .pack.hi { border: 2px solid var(--brand-primary); background: #fff; }
  .pack .tagp { font-size: .8rem; text-transform: uppercase; letter-spacing: 1.6px; color: var(--brand-primary); font-weight: 700; }
  .pack h4 { margin: 10px 0 8px; }
  .pack p { color: var(--text-secondary); font-size: .95rem; line-height: 1.55; margin-bottom: 20px; }
  .pack .note { font-weight: 700; font-size: .95rem; color: var(--text-primary); }
  /* FAQ */
  .faqs { padding: 0 0 100px; }
  .faqs details { border: 1px solid var(--panel-border); border-radius: 14px; background: #fff; padding: 0 22px; margin-top: 10px; }
  .faqs summary { cursor: pointer; font-weight: 650; padding: 18px 0; list-style: none; display: flex; justify-content: space-between; gap: 14px; }
  .faqs summary::-webkit-details-marker { display: none; }
  .faqs summary::after { content: '+'; color: var(--brand-primary); font-size: 1.3rem; line-height: 1; }
  .faqs details[open] summary::after { content: '–'; }
  .faqs details p { padding: 0 0 18px; color: var(--text-secondary); line-height: 1.6; }
  @media (max-width: 820px) { .gallery-grid, .process-grid, .pack-grid { grid-template-columns: 1fr; } }
`;

  const items = f.services.items;
  const gallery = `
  <section class="gallery" id="work">
    <div class="container">
      <div class="section-label rv">In practice</div>
      <h2 class="section-title rv">${esc(f.services.titleLine1)} ${esc(f.services.titleLine2)}</h2>
      <div class="gallery-grid">
        ${items.slice(0, 6).map((it) => `<div class="tile rv"><b>${esc(it.title)}</b></div>`).join('\n        ')}
      </div>
    </div>
  </section>`;

  const process = `
  <section class="process" id="process">
    <div class="container">
      <div class="section-label rv">How it works</div>
      <h2 class="section-title rv">Simple from day one</h2>
      <div class="process-grid">
        ${items.slice(0, 3).map((it, i) => `<div class="step rv"><i>0${i + 1}</i><h4>${esc(it.title)}</h4><p>${esc(it.description)}</p></div>`).join('\n        ')}
      </div>
    </div>
  </section>`;

  const packages = `
  <section class="packages" id="packages">
    <div class="container">
      <div class="section-label rv">Ways to work together</div>
      <h2 class="section-title rv">Pick your pace</h2>
      <div class="pack-grid">
        <div class="pack rv"><div class="tagp">Starter</div><h4>${esc(items[0]?.title ?? 'Getting started')}</h4><p>${esc(items[0]?.description ?? '')}</p><div class="note">Pricing on request</div></div>
        <div class="pack hi rv"><div class="tagp">Most popular</div><h4>${esc(items[1]?.title ?? 'The full experience')}</h4><p>${esc(items[1]?.description ?? '')}</p><div class="note">Pricing on request</div></div>
        <div class="pack rv"><div class="tagp">Ongoing</div><h4>${esc(items[2]?.title ?? 'Stay with us')}</h4><p>${esc(items[2]?.description ?? '')}</p><div class="note">Pricing on request</div></div>
      </div>
    </div>
  </section>`;

  const faq = `
  <section class="faqs">
    <div class="container">
      <div class="section-label rv">Good to know</div>
      <h2 class="section-title rv">Questions, answered</h2>
      <details class="rv"><summary>What exactly do you offer?</summary><p>${esc(items[0]?.description ?? f.hero.text)}</p></details>
      <details class="rv"><summary>How do we get started?</summary><p>${esc(f.cta.text)}</p></details>
      <details class="rv"><summary>Who is this for?</summary><p>${esc(f.about.p1)}</p></details>
      <details class="rv"><summary>How do I reach you?</summary><p>${esc(f.contact.text)} Write to ${esc(f.contact.email)}.</p></details>
    </div>
  </section>`;

  const revealJs = `
  <script>
    (function () {
      var els = document.querySelectorAll('.rv');
      if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { threshold: 0.18 });
      els.forEach(function (e) { io.observe(e); });
    })();
  </script>`;

  const hasOwnProcess = html.includes('id="process"');
  const hasOwnFaq = html.includes('class="faqs"');
  html = html.replace('</style>', extraCss + '\n</style>');
  html = html.replace('  <section class="cta">', gallery + '\n' + (hasOwnProcess ? '' : process + '\n') + packages + '\n\n  <section class="cta">');
  if (!hasOwnFaq) html = html.replace('  <section class="contact"', faq + '\n\n  <section class="contact"');
  html = html.replace('</body>', revealJs + '\n</body>');
  return html;
}

