/**
 * EXPERIMENTAL — do not wire into production runs yet.
 *
 * Rendered preview auditor — the browser half of the pipeline's
 * `renderedAudit` hook. Detection is real (it found the dark-mode ghost
 * sections and the footer --text-nav token flaw that led to two template
 * fixes), but readings are still state-dependent both ways: scroll-linked
 * reveal transitions can be read mid-flight (false positives that persist
 * after settling for reasons not yet root-caused) and the settle-recheck
 * can mask genuine static defects. Needs a proper eval set of known-good/
 * known-broken builds before the pipeline may trust its verdicts. Renders the published preview in light and dark,
 * desktop and phone, and reports the two defect classes that file-level
 * validation is blind to:
 *
 *   1. Ghost text: visible text whose color ≈ its effective background
 *      (the dark-mode ds-section--light bug).
 *   2. Dead space: vertical gaps taller than 70% of the viewport between
 *      consecutive rendered blocks near the top of the page (the stretched
 *      mobile hero).
 *
 * Returns a feedback string for the repair pass, or undefined when clean.
 */

import { chromium, devices } from '@playwright/test';

const CONTRAST_FLOOR = 1.6;
const GAP_VIEWPORT_RATIO = 0.7;

export async function auditRenderedPreview(previewUrl) {
  const browser = await chromium.launch();
  const issues = [];
  try {
    const matrix = [
      { label: 'desktop-light', ctx: { viewport: { width: 1440, height: 900 }, colorScheme: 'light' } },
      { label: 'desktop-dark', ctx: { viewport: { width: 1440, height: 900 }, colorScheme: 'dark' } },
      { label: 'phone-light', ctx: { ...devices['Pixel 7'], colorScheme: 'light' } },
      { label: 'phone-dark', ctx: { ...devices['Pixel 7'], colorScheme: 'dark' } },
    ];
    for (const { label, ctx } of matrix) {
      const context = await browser.newContext({ ...ctx, reducedMotion: 'reduce' });
      const page = await context.newPage();
      try {
        await page.goto(previewUrl, { waitUntil: 'networkidle', timeout: 30_000 }).catch(() => {});
        await page.waitForTimeout(1500);
        const found = await page.evaluate(auditInPage, {
          contrastFloor: CONTRAST_FLOOR,
          gapRatio: GAP_VIEWPORT_RATIO,
        });
        for (const issue of found) issues.push(`[${label}] ${issue}`);
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  if (issues.length === 0) return undefined;
  const unique = [...new Set(issues)].slice(0, 8);
  return unique.join(' | ');
}

/** Runs inside the page. Serializable, no closures. */
async function auditInPage({ contrastFloor, gapRatio }) {
  const issues = [];
  const lum = (rgb) => {
    const m = rgb.match(/\d+(\.\d+)?/g);
    if (!m) return null;
    const [r, g, b] = m.slice(0, 3).map((v) => {
      const c = Number(v) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const effectiveBg = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      // A gradient/image surface makes the effective color unknowable from
      // computed styles; skip rather than compare against the wrong ancestor.
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      const bg = cs.backgroundColor;
      if (bg && !bg.includes('rgba(0, 0, 0, 0)') && bg !== 'transparent') return bg;
    }
    return getComputedStyle(document.body).backgroundColor || 'rgb(255,255,255)';
  };

  // (Run the dead-space audit first: the text pass below scrolls the page.)
  auditGaps();

  // 1. Ghost text on visible headings and paragraphs (skip teaser-veiled areas)
  const texts = [...document.querySelectorAll('h1,h2,h3,p,a,li')].filter((el) => {
    if (el.closest('.fs-teaser-locked')) return false;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 40 && r.height > 12 && cs.visibility !== 'hidden' &&
      Number(cs.opacity) > 0.5 && (el.textContent || '').trim().length > 8;
  });
  // Templates ship scroll-behavior:smooth — a synchronous rect read after
  // scrollTo lands mid-animation and everything looks off-screen.
  document.documentElement.style.scrollBehavior = 'auto';
  document.body.style.scrollBehavior = 'auto';
  const flagged = new Set();
  for (const el of texts.slice(0, 400)) {
    // Occlusion check: closed menus/drawers keep stowed duplicates whose
    // computed colors are meaningless. Only judge elements that win the
    // hit-test at their own center once scrolled into view.
    const r0 = el.getBoundingClientRect();
    window.scrollTo({ top: Math.max(0, r0.top + window.scrollY - window.innerHeight / 3), behavior: 'instant' });
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + Math.min(r.height / 2, 40);
    if (cx < 0 || cy < 0 || cx > window.innerWidth || cy > window.innerHeight) continue;
    const hit = document.elementFromPoint(cx, cy);
    if (!hit || !(hit === el || el.contains(hit) || hit.contains(el))) continue;
    let bgColor = effectiveBg(el);
    if (bgColor === null) continue;
    let fg = lum(getComputedStyle(el).color);
    let bg = lum(bgColor);
    if (fg === null || bg === null) continue;
    let contrast = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
    if (contrast < contrastFloor) {
      // Reveal animations swap colors as sections enter the viewport; a read
      // taken mid-transition reports the pre-reveal state. Settle and recheck
      // before flagging so only persistent invisibility counts.
      await new Promise((resolve) => setTimeout(resolve, 450));
      bgColor = effectiveBg(el);
      if (bgColor === null) continue;
      fg = lum(getComputedStyle(el).color);
      bg = lum(bgColor);
      if (fg === null || bg === null) continue;
      contrast = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
    }
    if (contrast < contrastFloor) {
      const key = (el.textContent || '').trim().slice(0, 50);
      if (!flagged.has(key)) {
        flagged.add(key);
        const host = el.closest('section,footer,header,nav,div[class]');
        issues.push(`near-invisible text (contrast ${contrast.toFixed(2)}, ${getComputedStyle(el).color} on ${bgColor}) in <${host?.tagName?.toLowerCase() ?? '?'} class="${String(host?.className ?? '').slice(0, 60)}"> at scrollY=${Math.round(window.scrollY)}: "${key}"`);
      }
      if (flagged.size >= 3) break;
    }
  }

  return issues;

  // 2. Dead vertical space between consecutive blocks near the top
  function auditGaps() {
  const vh = window.innerHeight;
  const blocks = [...document.querySelectorAll('main section, main > div, header, body > section')]
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.height > 8 && r.width > 100)
    .sort((a, b) => a.top - b.top)
    .slice(0, 12);
  for (let i = 1; i < blocks.length; i++) {
    const gap = blocks[i].top - blocks[i - 1].bottom;
    if (gap > vh * gapRatio && blocks[i - 1].bottom < vh * 4) {
      issues.push(`dead vertical space of ${Math.round(gap)}px (~${Math.round((gap / vh) * 100)}% of viewport) after the block ending at y=${Math.round(blocks[i - 1].bottom)} — tighten hero/section copy so the layout closes up`);
      break;
    }
  }
  }
}
