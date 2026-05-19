/**
 * Screenshot the REAL live, personalized ColorfulStyle site that the funnel
 * produced (the Daytona-hosted preview URL), giving Astro's dev server time
 * to fully paint — the funnel's in-wizard iframe shots fire too early to
 * show the rendered page.
 *
 *   PREVIEW_URL=https://… node packages/agentic-codegen/test/shoot-live-site.mjs
 */
import { chromium } from 'playwright';

const URL = process.env.PREVIEW_URL;
const OUT = '/tmp/cs';
const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);

const main = async () => {
  if (!URL) throw new Error('PREVIEW_URL required');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const shots = [];
  try {
    log(`goto ${URL}`);
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    // Astro dev first paint + fonts/HMR settle.
    await page.waitForTimeout(6000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    const hero = `${OUT}-site-hero.png`;
    await page.screenshot({ path: hero, fullPage: false });
    shots.push(hero);
    log(`shot ${hero}`);

    const full = `${OUT}-site-full.png`;
    await page.screenshot({ path: full, fullPage: true });
    shots.push(full);
    log(`shot ${full}`);

    const title = await page.title().catch(() => '');
    const h1 = await page
      .locator('h1')
      .first()
      .innerText()
      .catch(() => '');
    log(`title="${title}"  h1="${h1.slice(0, 120)}"`);
  } catch (e) {
    log(`ERROR ${String(e?.message || e).slice(0, 300)}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
    console.log(JSON.stringify({ shots }));
  }
};

main();
