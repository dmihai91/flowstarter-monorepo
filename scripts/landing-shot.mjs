import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

await page.goto('http://localhost:3000/', {
  waitUntil: 'networkidle',
  timeout: 60000,
});

// Scroll top-to-bottom to trigger next/image lazy hydration before capture.
const totalHeight = await page.evaluate(() => document.body.scrollHeight);
const step = Math.ceil(totalHeight / 6);
for (let y = 0; y <= totalHeight; y += step) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(400);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1000);

await page.screenshot({ path: '/tmp/landing-final.png', fullPage: true });
console.log('saved');
await browser.close();
