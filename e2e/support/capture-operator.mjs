/**
 * Captures the authenticated operator surfaces of the deposit flow.
 *
 * Reuses the Clerk session saved by the `setup` project. Strictly read-only:
 * it navigates and switches tabs, and never clicks a control that writes to
 * Supabase or Stripe.
 *
 *   node e2e/support/capture-operator.mjs [baseURL]
 */

import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const BASE = process.argv[2] ?? 'http://127.0.0.1:3000';
const OUT = 'e2e/screenshots/flow';
const STATE = 'e2e/.auth/operator.json';

const browser = await chromium.launch();
const context = await browser.newContext({
  storageState: STATE,
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
await mkdir(OUT, { recursive: true });

async function shot(name, label) {
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log(`${name.padEnd(24)} ${page.url().replace(BASE, '')}  — ${label}`);
}

await page.goto(`${BASE}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
await shot('05-admin-dashboard', 'Operator dashboard (signed in)');

await page.goto(`${BASE}/admin/dashboard/projects`, {
  waitUntil: 'domcontentloaded',
});
await shot('06-projects-list', 'Workspaces list');

// Find a workspace to inspect. Read-only — we only open it and switch tabs.
const href = await page
  .locator('a[href*="/admin/dashboard/projects/"]')
  .first()
  .getAttribute('href')
  .catch(() => null);

if (!href) {
  console.log('\nNo workspace rows found — skipping the Billing tab capture.');
} else {
  await page.goto(`${BASE}${href}`, { waitUntil: 'domcontentloaded' });
  await shot('07-project-detail', `Workspace detail ${href.split('/').pop()}`);

  const billing = page.getByRole('tab', { name: 'Billing' });
  if (await billing.isVisible().catch(() => false)) {
    await billing.click();
    await shot('08-billing-tab', 'Billing tab — deposit / final / subscription');

    const deposit = page.getByRole('button', { name: /(Send|Resend) deposit/ });
    if (await deposit.isVisible().catch(() => false)) {
      const enabled = await deposit.isEnabled();
      console.log(
        `\nDeposit button: visible, ${enabled ? 'ENABLED' : 'disabled'} (not clicked — read-only capture)`,
      );
    }
  } else {
    console.log('\nBilling tab not found on this workspace.');
  }
}

await browser.close();
