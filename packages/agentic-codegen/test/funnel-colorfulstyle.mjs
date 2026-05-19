/**
 * Playwright e2e of the REAL funnel for "ColorfulStyle": seed the wizard
 * draft → jump to step 7 → the progressive live pipeline runs (genuine
 * same-origin request, CSRF passes) → screenshot base-live and personalized.
 *
 *   NODE_PATH=<repo>/node_modules node packages/agentic-codegen/test/funnel-colorfulstyle.mjs
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
  return p;
};

const main = async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    const t = m.text();
    if (/error|fail|live|personaliz/i.test(t)) log(`page: ${t.slice(0, 140)}`);
  });
  const shots = [];
  try {
    log(`goto ${BASE}`);
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.evaluate(
      ([k, v]) => window.sessionStorage.setItem(k, v),
      [DRAFT_KEY, JSON.stringify({ data: DATA, step: 7 })]
    );
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });

    log('open wizard via hero CTA');
    const cta = page.getByRole('button', { name: /build my site/i }).first();
    await cta.waitFor({ state: 'visible', timeout: 20000 });
    await cta.click();

    // Step 7 mounts → either the build checklist or the live iframe.
    await page
      .getByText(/a rough taste|generating|building|personaliz|starting point/i)
      .first()
      .waitFor({ timeout: 30000 })
      .catch(() => {});
    shots.push(await shot(page, '01-step7-start'));

    // Base template goes live (iframe from the Daytona proxy).
    log('waiting for base live iframe (≤4 min)…');
    const frame = page.locator('iframe[src*="daytonaproxy"]').first();
    await frame.waitFor({ state: 'visible', timeout: 240000 });
    await page.waitForTimeout(3000);
    shots.push(await shot(page, '02-base-live'));

    // Personalized hot-swap: the chat flips to the "personalized site is live"
    // handoff (or the personalizing indicator disappears).
    log('waiting for personalization hot-swap (≤4 min)…');
    await page
      .getByText(/personalized site is live|tell me what to change/i)
      .first()
      .waitFor({ timeout: 240000 })
      .catch(() => log('personalization wait timed out — capturing current state'));
    await page.waitForTimeout(4000);
    shots.push(await shot(page, '03-personalized'));

    log(`DONE shots=${JSON.stringify(shots)}`);
  } catch (e) {
    log(`ERROR ${String(e?.message || e).slice(0, 300)}`);
    shots.push(await shot(page, '99-error'));
    process.exitCode = 1;
  } finally {
    await browser.close();
    console.log(JSON.stringify({ shots }));
  }
};

main();
