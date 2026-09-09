/**
 * Preview teaser: trusted post-processing that blurs the lower sections of a
 * generated preview and overlays an unlock chip, so the free preview tastes
 * like the site without giving the whole build away.
 *
 * Runs as operator code after the coding agent has finished — the agent never
 * sees or controls it. Injection is idempotent and confined to layout files.
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export interface PreviewTeaserOptions {
  /** Crisp sections at the top of the home page. */
  keepHomeSections?: number;
  /** Crisp sections at the top of every other page. */
  keepSubpageSections?: number;
  /** Chip text shown over blurred sections. */
  label?: string;
  /**
   * Where the locked overlay sends the viewer to pay for the full build.
   * Must be https (http is allowed only on loopback for local development).
   * When omitted the overlay stays inert, exactly as before.
   */
  unlockUrl?: string;
  /** Call-to-action text on the unlock button. */
  unlockLabel?: string;
  /**
   * How much of the top of each locked section stays readable before the
   * veil fades in, as a fraction of the section's height (0 to 0.7). The
   * visitor sees every section's heading and opening lines, so the shape of
   * the whole site is on show and only the substance is held back.
   */
  revealTop?: number;
  /**
   * The veil never lifts entirely: at least this many sections stay locked
   * on every page that has more than one, however generous the keep counts
   * are. A short page still has something behind the deposit.
   */
  minLockedSections?: number;
}

/**
 * The overlay is injected into a site we hand to a client, so the destination
 * must be a real navigable origin — never `javascript:`, `data:` or a
 * same-document scheme that could execute in the preview.
 */
function assertSafeUnlockUrl(raw: string): string {
  if (raw.length > 512) throw new Error('Preview unlock URL is too long');
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Preview unlock URL must be absolute');
  }
  const loopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'https:' && !(loopback && url.protocol === 'http:')) {
    throw new Error(
      'Preview unlock URL must use HTTPS (HTTP is allowed only on loopback)',
    );
  }
  return url.toString();
}

const MARKER = 'flowstarter-preview-teaser';

function clamp(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
}

export async function injectPreviewTeaser(
  workspaceRoot: string,
  options: PreviewTeaserOptions = {},
): Promise<{ layoutsPatched: number }> {
  const keepHome = options.keepHomeSections ?? 3;
  const keepSub = options.keepSubpageSections ?? 1;
  const label = (
    options.label ?? 'Part of your full site, unlocked after the preview call'
  ).slice(0, 120);
  const unlockUrl = options.unlockUrl
    ? assertSafeUnlockUrl(options.unlockUrl)
    : '';
  const unlockLabel = (options.unlockLabel ?? 'Unlock the full site').slice(
    0,
    80,
  );
  const revealTop = clamp(options.revealTop ?? 0.35, 0, 0.7);
  const minLocked = Math.max(0, Math.floor(options.minLockedSections ?? 1));
  // The blur ramps in over the fifth of the section after the readable part.
  const revealStart = Math.round(revealTop * 100);
  const revealEnd = Math.min(100, revealStart + 20);

  const publicDir = resolve(workspaceRoot, 'public');
  await mkdir(publicDir, { recursive: true });
  await writeFile(
    join(publicDir, `${MARKER}.css`),
    TEASER_CSS.replace(/__REVEAL_START__/g, String(revealStart)).replace(
      /__REVEAL_END__/g,
      String(revealEnd),
    ),
    'utf8',
  );
  await writeFile(
    join(publicDir, `${MARKER}.js`),
    TEASER_JS.replace(/__KEEP_HOME__/g, String(keepHome))
      .replace(/__KEEP_SUB__/g, String(keepSub))
      .replace(/__MIN_LOCKED__/g, String(minLocked))
      .replace(/__LABEL__/g, JSON.stringify(label))
      .replace(/__UNLOCK_URL__/g, JSON.stringify(unlockUrl))
      .replace(/__UNLOCK_LABEL__/g, JSON.stringify(unlockLabel)),
    'utf8',
  );

  const snippet =
    `\n<!-- ${MARKER} -->` +
    `<link rel="stylesheet" href="/${MARKER}.css" />` +
    `<script defer src="/${MARKER}.js"></script>\n`;

  let layoutsPatched = 0;
  const layoutDir = resolve(workspaceRoot, 'src', 'layouts');
  let entries: string[] = [];
  try {
    entries = (await readdir(layoutDir)).filter((name) =>
      name.endsWith('.astro'),
    );
  } catch {
    return { layoutsPatched };
  }
  for (const name of entries) {
    const path = join(layoutDir, name);
    const source = await readFile(path, 'utf8');
    if (source.includes(MARKER)) {
      layoutsPatched++;
      continue;
    }
    if (!source.includes('</head>')) continue;
    await writeFile(
      path,
      source.replace('</head>', `${snippet}</head>`),
      'utf8',
    );
    layoutsPatched++;
  }
  return { layoutsPatched };
}

const TEASER_CSS = `
.fs-teaser-locked { position: relative; }
.fs-teaser-locked > .fs-teaser-veil {
  position: absolute; inset: 0; z-index: 40;
  display: block;
  backdrop-filter: blur(9px) saturate(0.85);
  -webkit-backdrop-filter: blur(9px) saturate(0.85);
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(20,20,26,0.18));
  text-decoration: none;
  /* The top of the section reads clean; the blur fades in below it. */
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, transparent __REVEAL_START__%, #000 __REVEAL_END__%);
  mask-image: linear-gradient(180deg, transparent 0%, transparent __REVEAL_START__%, #000 __REVEAL_END__%);
}
.fs-teaser-locked > .fs-teaser-veil .fs-teaser-gate {
  position: absolute; left: 0; right: 0; bottom: 0; top: __REVEAL_END__%;
  display: flex; flex-direction: column; gap: 14px;
  align-items: center; justify-content: center;
}
.fs-teaser-locked > .fs-teaser-veil .fs-teaser-chip {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 18px; border-radius: 999px;
  background: rgba(17,17,22,0.88); color: #f5f2ea;
  font: 600 13px/1.2 ui-sans-serif, system-ui, sans-serif;
  letter-spacing: 0.02em; box-shadow: 0 10px 30px -12px rgba(0,0,0,0.5);
  pointer-events: none; text-align: center; max-width: 82%;
}
.fs-teaser-locked > .fs-teaser-veil .fs-teaser-chip::before { content: '🔒'; }

/* Link state: the whole veil is clickable, with a real button as the affordance. */
a.fs-teaser-veil { cursor: pointer; }
a.fs-teaser-veil .fs-teaser-cta {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 13px 26px; border-radius: 999px;
  background: #f5f2ea; color: #111116;
  font: 700 14px/1.2 ui-sans-serif, system-ui, sans-serif;
  letter-spacing: 0.01em; pointer-events: none;
  box-shadow: 0 14px 34px -14px rgba(0,0,0,0.65);
  transition: transform 160ms ease, box-shadow 160ms ease;
}
a.fs-teaser-veil .fs-teaser-cta::after { content: '→'; }
a.fs-teaser-veil:hover .fs-teaser-cta,
a.fs-teaser-veil:focus-visible .fs-teaser-cta {
  transform: translateY(-1px);
  box-shadow: 0 18px 40px -14px rgba(0,0,0,0.75);
}
a.fs-teaser-veil:focus-visible {
  outline: 3px solid #f5f2ea; outline-offset: -6px;
}
@media (prefers-reduced-motion: reduce) {
  a.fs-teaser-veil .fs-teaser-cta { transition: none; }
}
`;

const TEASER_JS = `
(function () {
  var UNLOCK_URL = __UNLOCK_URL__;
  var UNLOCK_LABEL = __UNLOCK_LABEL__;
  function lock(section, label) {
    if (section.querySelector(':scope > .fs-teaser-veil')) return;
    section.classList.add('fs-teaser-locked');
    // An anchor when we have somewhere to send the viewer, so the overlay is
    // keyboard reachable and behaves like a link; an inert div otherwise.
    var veil = document.createElement(UNLOCK_URL ? 'a' : 'div');
    veil.className = 'fs-teaser-veil';
    // The chip and button sit in the blurred part, under the readable top.
    var gate = document.createElement('span');
    gate.className = 'fs-teaser-gate';
    veil.appendChild(gate);
    var chip = document.createElement('span');
    chip.className = 'fs-teaser-chip';
    chip.textContent = label;
    gate.appendChild(chip);
    if (UNLOCK_URL) {
      veil.href = UNLOCK_URL;
      // The preview is usually framed in the funnel; checkout must replace the
      // whole page rather than open inside the frame.
      veil.target = '_top';
      veil.rel = 'noopener';
      veil.setAttribute('aria-label', UNLOCK_LABEL + ': ' + label);
      var cta = document.createElement('span');
      cta.className = 'fs-teaser-cta';
      cta.textContent = UNLOCK_LABEL;
      gate.appendChild(cta);
    }
    section.appendChild(veil);
  }
  function run() {
    var keep = location.pathname === '/' ? __KEEP_HOME__ : __KEEP_SUB__;
    var label = __LABEL__;
    var scope = document.querySelector('main') || document.body;
    var sections = Array.prototype.slice.call(scope.querySelectorAll('section'));
    if (sections.length === 0) return;
    // Only top-level sections; nested ones inherit their parent's veil.
    sections = sections.filter(function (s) {
      return !sections.some(function (o) { return o !== s && o.contains(s); });
    });
    // However generous the keep count, a page with more than one section
    // always holds its last __MIN_LOCKED__ back (and never fewer than one
    // crisp section at the top).
    if (sections.length > 1) {
      keep = Math.max(1, Math.min(keep, sections.length - __MIN_LOCKED__));
    }
    sections.slice(keep).forEach(function (s) { lock(s, label); });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else { run(); }
})();
`;
