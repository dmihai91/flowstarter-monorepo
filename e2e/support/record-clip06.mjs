/** Clip 06: the Instagram-derived portfolio, scrolled through for real. */
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--disable-features=site-per-process'] });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: '/tmp/clip06', size: { width: 1440, height: 900 } },
});
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:8901/', { waitUntil: 'networkidle' }).catch(()=>{});
await page.waitForTimeout(2500);
// Slow scroll through the homepage, then a beat on Work and About.
const height = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < Math.min(height, 6200); y += 450) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'smooth' }), y);
  await page.waitForTimeout(650);
}
await page.goto('http://127.0.0.1:8901/about', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2200);
await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'smooth' }));
await page.waitForTimeout(1800);
await page.goto('http://127.0.0.1:8901/', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1800);
await page.screenshot({ path: 'apps/flowstarter-main/public/workflow-clips/06-portfolio.png' });
const video = page.video();
await ctx.close();
console.log('video:', await video.path());
await browser.close();
