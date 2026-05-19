/**
 * WHY is the wizard iframe blank? Captures the hard signals: was a request
 * even made for the daytona URL, its HTTP status + response headers (X-Frame
 * / CSP), the frame's resolved URL + actual HTML, plus console + failed
 * requests. Drives the real funnel to live mode.
 */
import { chromium } from 'playwright';

const BASE = process.env.FS_BASE || 'http://localhost:3000';
const DRAFT_KEY = 'fs-discovery-draft-v1';
const DATA = {
  fullName: 'Ana Pop',
  email: 'ana@example.com',
  businessName: 'ColorfulStyle',
  industry: 'Personal style & digital fashion guides',
  description:
    'An independent style creator selling downloadable guides that teach everyday people how to dress in bold, colourful outfits with confidence — capsule colour palettes, outfit formulas and simple shopping cheat-sheets.',
  targetAudience: 'Women who want to wear colour but feel intimidated.',
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

const main = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const daytonaResponses = [];
  const daytonaFailures = [];
  const consoleErrs = [];

  page.on('response', async (r) => {
    if (/daytonaproxy/.test(r.url())) {
      const h = r.headers();
      daytonaResponses.push({
        url: r.url().slice(0, 90),
        status: r.status(),
        ct: h['content-type'],
        xfo: h['x-frame-options'] ?? null,
        csp: h['content-security-policy'] ?? null,
        cors: h['access-control-allow-origin'] ?? null,
      });
    }
  });
  page.on('requestfailed', (r) => {
    if (/daytonaproxy/.test(r.url()))
      daytonaFailures.push({
        url: r.url().slice(0, 90),
        failure: r.failure()?.errorText,
      });
  });
  page.on('console', (m) => {
    if (/error|fail|block|refuse|denied|sandbox|csp/i.test(m.text()))
      consoleErrs.push(m.text().slice(0, 180));
  });

  try {
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

    const ifr = page.locator('iframe[src*="daytonaproxy"]').first();
    await ifr.waitFor({ state: 'attached', timeout: 240000 });
    const src = await ifr.getAttribute('src');
    log(`iframe src = ${src}`);

    // Force the (lazy) iframe to load, then give it time to navigate.
    await ifr.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(25000);

    const frame = page
      .frames()
      .find((f) => /daytonaproxy/.test(f.url()));
    if (frame) {
      log(`frame.url() = ${frame.url()}`);
      const html = await frame.content().catch((e) => `<<content err: ${e.message}>>`);
      log(`frame HTML length = ${html.length}`);
      log(`frame HTML head = ${html.slice(0, 300).replace(/\s+/g, ' ')}`);
    } else {
      log('NO frame whose url() matches daytonaproxy (never navigated)');
      const frUrls = page.frames().map((f) => f.url().slice(0, 60));
      log(`frames present: ${JSON.stringify(frUrls)}`);
    }

    log(`daytona responses: ${JSON.stringify(daytonaResponses, null, 1)}`);
    log(`daytona requestfailed: ${JSON.stringify(daytonaFailures)}`);
    log(`console errors: ${JSON.stringify(consoleErrs.slice(0, 8))}`);
  } catch (e) {
    log(`ERROR ${String(e?.message || e).slice(0, 300)}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
};

main();
