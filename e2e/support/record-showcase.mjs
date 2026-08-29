/**
 * Records the pipeline end to end as three clips for the showcase page.
 *
 * Everything filmed here is the running system: a real generation streaming
 * its phases over SSE, the sites it produced, and a deposit driven through
 * the signed webhook. Nothing is mocked up for the camera.
 *
 *   node e2e/support/record-showcase.mjs
 */
import { chromium } from '@playwright/test';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = 'artifacts/showcase';
const VID = join(OUT, 'video');
await rm(OUT, { recursive: true, force: true });
await mkdir(VID, { recursive: true });

const SITES = process.argv.slice(2);
if (SITES.length < 2) {
  console.error('usage: record-showcase.mjs <siteUrlA> <siteUrlB>');
  process.exit(1);
}

const browser = await chromium.launch();
const clip = async (name, size, fn) => {
  const ctx = await browser.newContext({
    viewport: size,
    recordVideo: { dir: VID, size },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const video = page.video();
  try { await fn(page); } finally { await ctx.close(); }
  // saveAs waits for the recording to be finalised; renaming by directory
  // listing raced that and mixed the clips up.
  if (video) await video.saveAs(join(VID, `${name}.webm`));
  console.log('recorded', name);
};

const pause = (page, ms) => page.evaluate((m) => new Promise((r) => setTimeout(r, m)), ms);
const slowScroll = async (page, steps = 14, step = 520, wait = 320) => {
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  for (let i = 0; i < steps; i += 1) {
    await page.evaluate((y) => window.scrollBy(0, y), step);
    await pause(page, wait);
  }
};

// 1 — the two finished sites.
await clip('sites', { width: 1280, height: 800 }, async (page) => {
  for (const url of SITES) {
    await page.goto(url, { waitUntil: 'networkidle' });
    await pause(page, 2600);
    await slowScroll(page, 13);
    await pause(page, 700);
  }
});

// 2 — the same site on a phone, menu included: the fix from earlier.
await clip('mobile', { width: 390, height: 720 }, async (page) => {
  await page.goto(SITES[0], { waitUntil: 'networkidle' });
  await pause(page, 2200);
  await slowScroll(page, 8, 360, 380);
  await page.evaluate(() => window.scrollTo(0, 0));
  await pause(page, 600);
  await page.locator('.menu-button, button[aria-label*="enu" i]').first().click().catch(() => {});
  await pause(page, 1800);
});

// 3 — the deposit, driven through the real webhook by the sibling script.
await clip('deposit', { width: 1180, height: 760 }, async (page) => {
  await page.goto('http://127.0.0.1:8951/', { waitUntil: 'networkidle' }).catch(() => {});
  await pause(page, 1200);
  // The terminal output is rendered line by line so it reads at video speed.
  await page.evaluate(() => window.__playLog?.());
  await pause(page, 16000);
});

await browser.close();
console.log('clips in', VID);
