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
    /** Short, punchy — set in huge uppercase display type (≤ 60 chars). */
    title: string;
    /** 1–2 sentences; `highlight` must appear verbatim inside it. */
    text: string;
    highlight: string;
    cta1: string;
    cta2: string;
  };
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
  const heroText = esc(f.hero.text).replace(
    esc(f.hero.highlight),
    `<span class="hl">${esc(f.hero.highlight)}</span>`,
  );
  const slug = f.brand.name.toLowerCase().replace(/[^a-z0-9]+/g, '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(f.brand.name)} · ${esc(f.brand.tagline)}</title>
<!--FILL${JSON.stringify(fill)}FILL-->
<style>
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  :root {
    --bg-dark: #0a0a0a;
    --surface-base: #F9F7F1;
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
    --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif;
  }
  body { font-family: var(--font); background: var(--surface-base); color: var(--text-primary); font-size: var(--fs-body); line-height: 1.5; -webkit-font-smoothing: antialiased; }
  .container { max-width: var(--container); margin: 0 auto; padding: 0 24px; }
  h1,h2,h3,h4 { line-height: 1.08; letter-spacing: -0.02em; font-weight: 650; }
  a { color: inherit; text-decoration: none; }
  .btn { display: inline-block; font-weight: 600; font-size: .95rem; padding: 14px 28px; border-radius: 12px; transition: transform .3s ease, box-shadow .3s ease; text-align: center; }
  .btn:hover { transform: translateY(-2px); }
  .btn-primary { background: var(--brand-primary); color: #fff; box-shadow: 0 10px 22px -10px var(--brand-primary); }
  .btn-outline-light { border: 1.5px solid rgba(255,255,255,.4); color: #fff; }
  .btn-on-dark { background: var(--accent); color: var(--bg-dark); box-shadow: 0 10px 22px -10px rgba(0,0,0,.5); }
  .btn-outline-light:hover { border-color: #fff; }
  .section-label { font-size: .85rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; color: var(--brand-primary); font-weight: 600; }
  .section-title { font-size: var(--fs-h2); text-transform: uppercase; }

  /* intro overlay — brand name blur-in, then the page reveals (dorin hero) */
  .intro { position: fixed; inset: 0; z-index: 200; background: var(--bg-dark); display: flex; align-items: center; justify-content: center; padding: 0 clamp(20px,5vw,80px); pointer-events: none; animation: intro-exit .6s cubic-bezier(.4,0,.2,1) forwards; animation-delay: 1.4s; }
  .intro span { font-weight: 650; text-transform: uppercase; letter-spacing: -0.03em; color: #fff; text-align: center; line-height: 1.05; font-size: clamp(2.6rem, 9vw, 7rem); opacity: 0; animation: intro-text .7s cubic-bezier(.22,1,.36,1) forwards; animation-delay: .08s; }
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

  /* hero — full-height dark (dorin) */
  .hero { background: var(--bg-dark); color: var(--text-on-dark); overflow: clip; }
  .hero-inner { display: grid; grid-template-columns: minmax(0,1fr) minmax(320px,44%); gap: 56px; align-items: center; min-height: max(680px, 92vh); padding-block: 120px 80px; }
  .hero-title { font-size: var(--fs-display); text-transform: uppercase; letter-spacing: -0.03em; margin-bottom: 24px; opacity: 0; animation: enter .75s cubic-bezier(.22,1,.36,1) forwards; animation-delay: 1.6s; }
  .hero-text { font-size: 1.25rem; line-height: 1.45; max-width: 480px; margin-bottom: 32px; color: rgba(255,255,255,.82); opacity: 0; animation: enter .75s cubic-bezier(.22,1,.36,1) forwards; animation-delay: 1.8s; }
  .hero-text .hl { color: var(--accent); }
  .hero-actions { display: flex; gap: 16px; flex-wrap: wrap; opacity: 0; animation: enter .75s cubic-bezier(.22,1,.36,1) forwards; animation-delay: 2s; }
  .hero-visual { position: relative; min-height: 440px; align-self: stretch; }
  .hero-visual .blob { position: absolute; inset: 8% 0 12% 6%; border-radius: 32px 120px 32px 32px; background: linear-gradient(160deg, var(--accent), var(--brand-primary) 75%); }
  .hero-visual .blob::after { content: ''; position: absolute; inset: 0; border-radius: inherit; background: radial-gradient(120% 90% at 28% 8%, rgba(255,255,255,.32), transparent 55%); }
  .hero-visual .ring { position: absolute; width: 120px; height: 120px; border-radius: 50%; border: 2px solid var(--accent); bottom: 4%; left: -8px; opacity: .8; }
  .hero-visual .dot { position: absolute; width: 52px; height: 52px; border-radius: 50%; background: var(--accent); top: 4%; right: 10%; }

  /* stats strip — accent background (dorin Stats) */
  .stats { background: var(--accent); padding: 72px 0; }
  .stats-inner { display: grid; grid-template-columns: repeat(4,1fr); gap: 48px; }
  .stat b { display: block; font-size: 2.4rem; font-weight: 700; letter-spacing: -0.02em; }
  .stat span { font-size: .8rem; text-transform: uppercase; letter-spacing: 1.6px; color: rgba(10,10,10,.6); font-weight: 600; }

  /* services — card grid (dorin ServiceCard) */
  .services { padding: var(--section-pad); }
  .services-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 56px; flex-wrap: wrap; }
  .services-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
  .card { background: var(--surface-panel); border: 1px solid var(--panel-border); border-radius: 16px; padding: 30px 26px; transition: transform .3s ease, box-shadow .3s ease; }
  .card:hover { transform: translateY(-4px); box-shadow: var(--shadow-float); }
  .card .icon { color: var(--brand-primary); margin-bottom: 18px; }
  .card h4 { font-size: var(--fs-h4); margin-bottom: 10px; }
  .card p { font-size: .95rem; color: var(--text-secondary); line-height: 1.55; }

  /* about — dark strip with the dorin circles */
  .about { background: var(--bg-dark); color: var(--text-on-dark); padding: var(--section-pad); }
  .about-inner { display: grid; grid-template-columns: 1.1fr .9fr; gap: 64px; align-items: center; }
  .about p { color: rgba(255,255,255,.78); margin-top: 18px; line-height: 1.6; }
  .about .section-title { color: #fff; }
  .circles { display: flex; align-items: center; justify-content: center; }
  .circles span { width: clamp(110px, 12vw, 170px); height: clamp(110px, 12vw, 170px); border-radius: 50%; margin-left: -28px; mix-blend-mode: screen; }
  .circles span:nth-child(1) { background: var(--accent); margin-left: 0; }
  .circles span:nth-child(2) { background: #EBE8DF; }
  .circles span:nth-child(3) { background: var(--brand-primary); }

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
    .about-inner { grid-template-columns: 1fr; gap: 40px; }
    .nav nav { display: none; }
    :root { --section-pad: 64px 0; }
  }
</style>
</head>
<body>
  <div class="intro" aria-hidden="true"><span>${esc(f.brand.name)}</span></div>

  <header>
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

  <section class="hero">
    <div class="container hero-inner">
      <div>
        <h1 class="hero-title">${esc(f.hero.title)}</h1>
        <p class="hero-text">${heroText}</p>
        <div class="hero-actions">
          <a class="btn btn-on-dark" href="#contact">${esc(f.hero.cta1)}</a>
          <a class="btn btn-outline-light" href="#services">${esc(f.hero.cta2)}</a>
        </div>
      </div>
      <div class="hero-visual" aria-hidden="true">
        <div class="blob"></div>
        <span class="ring"></span>
        <span class="dot"></span>
      </div>
    </div>
  </section>

  <section class="stats">
    <div class="container stats-inner">
      ${f.stats.slice(0, 4).map((s) => `<div class="stat"><b>${esc(s.number)}</b><span>${esc(s.label)}</span></div>`).join('\n      ')}
    </div>
  </section>

  <section class="services" id="services">
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
  </section>

  <section class="about" id="about">
    <div class="container about-inner">
      <div>
        <div class="section-label">${esc(f.about.label)}</div>
        <h2 class="section-title">${esc(f.about.title)}</h2>
        <p>${esc(f.about.p1)}</p>
        <p>${esc(f.about.p2)}</p>
      </div>
      <div class="circles" aria-hidden="true"><span></span><span></span><span></span></div>
    </div>
  </section>

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
    positioning: f.brand.tagline,
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
      title: spec.copy.hero,
      text: spec.copy.sub,
      highlight: '',
      cta1: spec.copy.cta,
      cta2: 'See what we do',
    },
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

  html = html.replace('</style>', extraCss + '\n</style>');
  html = html.replace('  <section class="cta">', gallery + '\n' + process + '\n' + packages + '\n\n  <section class="cta">');
  html = html.replace('  <section class="contact"', faq + '\n\n  <section class="contact"');
  html = html.replace('</body>', revealJs + '\n</body>');
  return html;
}

