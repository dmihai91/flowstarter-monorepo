/**
 * DEFINITIVE proof of whether the live preview renders INSIDE the wizard
 * iframe on the main platform (not just standalone). Drives the real funnel,
 * then *pierces the iframe* and asserts its DOM actually contains the
 * personalized ColorfulStyle site — screenshotting the wizard with the site
 * rendered in-frame.
 *
 *   NODE_PATH=<repo>/node_modules node packages/agentic-codegen/test/funnel-iframe-proof.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.FS_BASE || 'http://localhost:3000';
const OUT = '/tmp/cs';
const DRAFT_KEY = 'fs-discovery-draft-v1';
const DATA = {
  fullName: 'Ana Pop',
  email: 'ana@example.com',
  businessName: 'ColorfulStyle',
  industry: 'Personal style & digital fashion guides',
  description:
    'An independent style creator selling downloadable guides that teach everyday people how to dress in bold, colourful outfits with confidence — capsule colour palettes, outfit formulas and simple shopping cheat-sheets.',
  targetAudience:
    'Women who live in neutrals and safe basics but secretly want to wear colour — style-curious, a little intimidated, want simple rules not fashion jargon.',
  goal: 'Sell products or services, Grow an email list',
  secondaryGoals: [],
  brandTone: 'Bold, Vibrant, Playful, saturated colour not corporate',
  pageCount: '5-7',
  timeline: 'flexible',
  commerceMode: 'digital',
  catalogSize: '1-5',
  customIntegrations: '',
  selectedTier: 'starter',
  subscription: 'pro',
};

const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);
const shot = async (page, name) => {
  const p = `${OUT}-${name}.png`;
  await page.screenshot({ path: p, fullPage: false }).catch(() => {});
  log(`shot ${p}`);
};

/** Poll the iframe's own DOM until it actually paints the site (or timeout). */
async function waitForFrameContent(page, label, timeoutMs) {
  const frame = page.frameLocator('iframe[src*="daytonaproxy"]').first();
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    // Keep it scrolled into view (defeats loading="lazy" deferral).
    await page
      .locator('iframe[src*="daytonaproxy"]')
      .first()
      .scrollIntoViewIfNeeded()
      .catch(() => {});
    const txt = await frame
      .locator('body')
      .first()
      .innerText({ timeout: 4000 })
      .catch(() => '');
    if (txt && txt.trim().length > 40) {
      log(`${label}: iframe DOM has ${txt.trim().length} chars of text`);
      return txt.trim();
    }
    await page.waitForTimeout(2500);
  }
  log(`${label}: iframe still EMPTY after ${Math.round(timeoutMs / 1000)}s`);
  return '';
}

const main = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const result = { iframeRendersInPlatform: false, evidence: {} };
  try {
    log(`goto ${BASE}`);
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.evaluate(
      ([k, v]) => window.sessionStorage.setItem(k, v),
      [DRAFT_KEY, JSON.stringify({ data: DATA, step: 7 })]
    );
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
    const cta = page.getByRole('button', { name: /build my site/i }).first();
    await cta.waitFor({ state: 'visible', timeout: 20000 });
    await cta.click();
    log('wizard opened — waiting for live iframe element');

    await page
      .locator('iframe[src*="daytonaproxy"]')
      .first()
      .waitFor({ state: 'attached', timeout: 240000 });
    log('iframe element present; capturing natural (un-scrolled) state');
    await page.waitForTimeout(2500);
    await shot(page, 'iframe-natural'); // what a user sees the instant it flips

    // BASE template must paint inside the frame.
    const baseTxt = await waitForFrameContent(page, 'BASE', 150000);
    result.evidence.baseChars = baseTxt.length;
    result.evidence.baseSample = baseTxt.slice(0, 220).replace(/\s+/g, ' ');
    await shot(page, 'iframe-rendered');

    // Personalized hot-swap (iframe key bumps → reloads with ?r=).
    await page
      .getByText(/personalized site is live|tell me what to change/i)
      .first()
      .waitFor({ timeout: 240000 })
      .catch(() => log('personalization handoff text wait timed out'));
    const persTxt = await waitForFrameContent(page, 'PERSONALIZED', 150000);
    result.evidence.personalizedChars = persTxt.length;
    result.evidence.personalizedSample = persTxt
      .slice(0, 260)
      .replace(/\s+/g, ' ');
    await shot(page, 'iframe-personalized');

    const hay = (baseTxt + ' ' + persTxt).toLowerCase();
    result.iframeRendersInPlatform =
      persTxt.length > 40 &&
      /colour|color|style|guide|wardrobe/.test(hay);
    log(`VERDICT iframeRendersInPlatform=${result.iframeRendersInPlatform}`);
  } catch (e) {
    log(`ERROR ${String(e?.message || e).slice(0, 300)}`);
    await shot(page, 'iframe-error');
    process.exitCode = 1;
  } finally {
    await browser.close();
    console.log(JSON.stringify(result, null, 2));
  }
};

main();
