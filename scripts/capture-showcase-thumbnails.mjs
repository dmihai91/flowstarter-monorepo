#!/usr/bin/env node
/**
 * Showcase thumbnail capture.
 *
 * - Captures dorin-portfolio (the canonical demo template) at 2880x1800
 *   from the Astro dev server on :4321.
 * - Captures the live client sites (ux-journey, lebadusul) fresh from
 *   the public web (single light capture).
 *
 * Output: writes PNGs into apps/flowstarter-main/public/showcase/.
 *
 * Usage:
 *   node scripts/capture-showcase-thumbnails.mjs                    # all
 *   node scripts/capture-showcase-thumbnails.mjs dorin-portfolio    # one
 *   node scripts/capture-showcase-thumbnails.mjs ux-journey lebadusul
 *
 * Prereqs:
 *   - For dorin-portfolio: pnpm --filter @flowstarter/template-dorin-portfolio dev
 *     (default port 4321)
 */

import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import os from 'node:os';
import { existsSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(REPO_ROOT, 'apps/flowstarter-main/public/showcase');

// Capture viewport: 1440x900 (16:10) at 2x DPR → 2880x1800 PNG. Matches the
// existing live captures and the proof-card aspect ratio cleanly.
const VIEWPORT = { width: 1440, height: 900 };
const DPR = 2;

// `DORIN_PORTFOLIO_URL` can override the default dev-server URL when the
// template's standard port (4321) is already in use and Astro fell back
// to another (e.g. 4325).
const TEMPLATE_TARGETS = [
  {
    slug: 'dorin-portfolio',
    url: process.env.DORIN_PORTFOLIO_URL || 'http://localhost:4321/',
  },
];

const LIVE_SITES = [
  { slug: 'ux-journey', url: 'https://ux-journey.com/' },
  { slug: 'lebadusul', url: 'https://lebadusularticoledepescuit.ro/' },
];

function resolveCachedChromium() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  const root =
    process.env.PLAYWRIGHT_BROWSERS_PATH ||
    path.join(os.homedir(), 'Library/Caches/ms-playwright');
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64';
  // Try the standard chromium build first; fall back to the trimmed
  // chrome-headless-shell build that newer Playwright versions prefer.
  const candidates = [];
  for (const ver of ['1217', '1208']) {
    candidates.push(
      path.join(
        root,
        `chromium-${ver}`,
        `chrome-mac-${arch}`,
        'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
      ),
      path.join(
        root,
        `chromium_headless_shell-${ver}`,
        `chrome-headless-shell-mac-${arch}`,
        'chrome-headless-shell',
      ),
    );
  }
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

async function captureUrl(browser, { slug, url, isLive }) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DPR,
  });
  const page = await context.newPage();

  await page.goto(url, {
    waitUntil: isLive ? 'load' : 'networkidle',
    timeout: 60000,
  });
  // Hero entrances on the dorin-portfolio template stagger up to
  // ~1700ms delay + 750ms duration on top of a 1000ms intro-overlay
  // exit. We can't simply use reducedMotion=reduce because the
  // template's reduced-motion fallback leaves the fixed intro overlay
  // at opacity:1 (it relies on the keyframe's `visibility: hidden`
  // exit to ever clear). Instead, wait long enough for the animation
  // pipeline to settle to its final paint.
  await page.waitForTimeout(isLive ? 2500 : 3200);

  if (isLive) {
    // Dismiss common cookie banners on live sites (Romanian + English).
    const bannerSelectors = [
      'button:text-matches("ACCEPTA TOATE", "i")',
      'button:text-matches("ACCEPTĂ TOATE", "i")',
      'button:text-matches("DOAR ESENTIALE", "i")',
      'button:text-matches("Accept all", "i")',
      'button:text-matches("^Accept$", "i")',
      '[id*="cookie"] button',
      '[class*="cookie"] button',
    ];
    for (const sel of bannerSelectors) {
      try {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 250 })) {
          await btn.click({ timeout: 1000 });
          await page.waitForTimeout(500);
        }
      } catch (_) {
        /* skip */
      }
    }
    await page.addStyleTag({
      content: `
        [id*="cookie" i],
        [class*="cookie" i],
        [id*="consent" i],
        [class*="consent" i],
        [class*="gdpr" i] {
          display: none !important;
          visibility: hidden !important;
        }
      `,
    });
    await page.waitForTimeout(500);
  }

  const out = path.join(OUT_DIR, `${slug}.png`);
  await page.screenshot({
    path: out,
    fullPage: false,
    clip: { x: 0, y: 0, ...VIEWPORT },
  });
  console.log(
    `  ✓ ${path.relative(REPO_ROOT, out)} (${VIEWPORT.width * DPR}x${
      VIEWPORT.height * DPR
    })`,
  );

  await context.close();
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  const filter = process.argv.slice(2);
  const want = (s) => filter.length === 0 || filter.includes(s);

  // Playwright's host-arch resolution can return x64 paths even on arm64
  // Macs depending on how the @playwright/test package was installed in
  // this monorepo. Prefer an explicit cached executable when one exists,
  // falling back to whatever Playwright wants to launch.
  const launchOpts = {};
  const explicit = resolveCachedChromium();
  if (explicit) {
    launchOpts.executablePath = explicit;
  }
  const browser = await chromium.launch(launchOpts);
  try {
    for (const t of TEMPLATE_TARGETS) {
      if (!want(t.slug)) continue;
      console.log(`▸ ${t.slug} (template @ ${t.url})`);
      await captureUrl(browser, { ...t, isLive: false });
    }
    for (const live of LIVE_SITES) {
      if (!want(live.slug)) continue;
      console.log(`▸ ${live.slug} (live: ${live.url})`);
      await captureUrl(browser, { ...live, isLive: true });
    }
  } finally {
    await browser.close();
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
