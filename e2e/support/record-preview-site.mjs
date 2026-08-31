/**
 * Films the generated site full-frame, and rebuilds clip 03 around it.
 *
 * The wizard's right-hand pane is a cross-origin iframe, and headless Chromium
 * does not composite it into the captured video — the pane comes out white even
 * though the site is loading and a real visitor sees it. That is a limitation of
 * the recorder, not of the product, so the finished site is filmed by opening
 * the same preview URL the pane points at. Nothing else is substituted: the
 * conversation, the phases and the timings are the original take.
 *
 *   node e2e/support/record-preview-site.mjs <previewUrl>
 */
import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  VID, DESKTOP, ensureDirs, pause, slowScroll, clip, concat, writeManifest,
} from './showcase-lib.mjs';

ensureDirs();
const URL_ = process.argv[2];
if (!URL_) { console.error('usage: record-preview-site.mjs <previewUrl>'); process.exit(1); }

const browser = await chromium.launch({ args: ['--disable-features=site-per-process'] });
const desktop = await clip(browser, '03d-site-desktop', { size: DESKTOP }, async (page) => {
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await pause(page, 3500);
  await slowScroll(page, 9, 460, 380);
  await pause(page, 1500);
});
await browser.close();

// 03 = the skeleton and the NOW line, the conversation finishing, the site
// itself on a desktop, then the same site on a phone.
const parts = [
  join(VID, '03a-skeleton.webm'),
  join(VID, '03c-personalised.webm'),
  join(VID, '03d-site-desktop.webm'),
  join(VID, '03b-mobile.webm'),
].filter(existsSync);
concat(parts, join(VID, '03-generation.webm'));
console.log('rebuilt 03 from', parts.length, 'segments');

writeManifest({ iframeNotCaptured: true,
  clips: { '03d-site-desktop': { seconds: desktop.seconds, error: desktop.error } } });
