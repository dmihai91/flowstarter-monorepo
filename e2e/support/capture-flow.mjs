/**
 * Captures the browser-observable surfaces of the concierge deposit flow.
 *
 * Read-only: it never signs in, never clicks a mutating control, and never
 * touches Supabase or Stripe. Authenticated surfaces are captured as the
 * redirect a signed-out operator actually gets.
 *
 *   node e2e/support/capture-flow.mjs [baseURL]
 */

import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const BASE = process.argv[2] ?? 'http://127.0.0.1:3000';
const OUT = 'e2e/screenshots/flow';

const SHOTS = [
  { name: '01-landing', path: '/', label: 'Marketing landing page' },
  { name: '02-pricing', path: '/pricing', label: 'Pricing / concierge offer' },
  { name: '03-login', path: '/login', label: 'Operator sign-in (Clerk)' },
  {
    name: '04-admin-redirect',
    path: '/admin/dashboard/projects',
    label: 'Admin projects — signed out, redirected to auth',
  },
];

const browser = await chromium.launch({ args: ['--disable-features=site-per-process'] });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
});

await mkdir(OUT, { recursive: true });

for (const shot of SHOTS) {
  const response = await page.goto(`${BASE}${shot.path}`, {
    waitUntil: 'domcontentloaded',
  });
  // Let fonts/animations settle so the capture is not mid-paint.
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/${shot.name}.png`, fullPage: false });
  console.log(
    `${shot.name.padEnd(20)} ${String(response?.status() ?? '???').padEnd(4)} ${page.url().replace(BASE, '')}  — ${shot.label}`,
  );
}

await browser.close();
console.log(`\nWrote ${SHOTS.length} screenshots to ${OUT}/`);
