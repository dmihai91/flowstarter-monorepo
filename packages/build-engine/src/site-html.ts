// Renders a SiteSpec to a self-contained static HTML page. This is the mock
// engine's "site bundle" and the shared single-file fallback for exports.
import type { SiteSpec } from './types';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderSiteHtml(spec: SiteSpec): string {
  const [c1, c2, ink, paper] = spec.brand.palette;
  const sections = spec.copy.sections
    .map(
      (s) => `
      <div class="card">
        <h3>${esc(s.h)}</h3>
        <p>${esc(s.p)}</p>
      </div>`,
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(spec.brand.name)} — ${esc(spec.brand.tagline)}</title>
<style>
  :root { --c1: ${c1}; --c2: ${c2}; --ink: ${ink}; --paper: ${paper}; }
  * { box-sizing: border-box; margin: 0; }
  body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; background: var(--paper); color: var(--ink); -webkit-font-smoothing: antialiased; }
  .nav { display: flex; align-items: center; justify-content: space-between; padding: 18px 28px; max-width: 1080px; margin: 0 auto; }
  .nav .brand { font-size: 22px; font-weight: 700; letter-spacing: -.02em; }
  .nav .links { display: flex; gap: 20px; align-items: center; font-size: 14px; }
  .btn { background: var(--c1); color: #fff; padding: 11px 22px; border-radius: 99px; font-weight: 600; font-size: 14px; text-decoration: none; display: inline-block; }
  .hero { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 32px; align-items: center; padding: 48px 28px 56px; max-width: 1080px; margin: 0 auto; }
  .kicker { font-family: ui-monospace, monospace; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--c1); margin-bottom: 14px; }
  h1 { font-size: clamp(32px, 5vw, 46px); line-height: 1.12; letter-spacing: -.02em; margin-bottom: 16px; }
  .sub { font-size: 16px; opacity: .75; line-height: 1.6; margin-bottom: 24px; max-width: 480px; }
  .hero-art { aspect-ratio: 4/5; border-radius: 18px; background: linear-gradient(150deg, var(--c2), var(--c1)); }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; padding: 0 28px 64px; max-width: 1080px; margin: 0 auto; }
  .card { border: 1px solid color-mix(in srgb, var(--ink) 14%, transparent); border-radius: 14px; padding: 22px; background: color-mix(in srgb, var(--paper) 70%, #fff); }
  .card h3 { font-size: 18px; margin-bottom: 8px; }
  .card p { font-size: 14px; opacity: .72; line-height: 1.55; }
  footer { border-top: 1px solid color-mix(in srgb, var(--ink) 12%, transparent); padding: 26px 28px; text-align: center; font-size: 13px; opacity: .6; }
</style>
</head>
<body>
  <nav class="nav">
    <span class="brand">${esc(spec.brand.name)}</span>
    <div class="links"><span>About</span><a class="btn" href="#contact">${esc(spec.copy.cta)}</a></div>
  </nav>
  <header class="hero">
    <div>
      <div class="kicker">${esc(spec.brand.tagline)}</div>
      <h1>${esc(spec.copy.hero)}</h1>
      <p class="sub">${esc(spec.copy.sub)}</p>
      <a class="btn" href="#contact">${esc(spec.copy.cta)}</a>
    </div>
    <div class="hero-art"></div>
  </header>
  <section class="cards">${sections}
  </section>
  <footer id="contact">© ${esc(spec.brand.name)} — built with Flowstarter</footer>
</body>
</html>`;
}
