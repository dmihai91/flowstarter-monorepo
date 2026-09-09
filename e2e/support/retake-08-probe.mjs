/**
 * A dry run of everything clip 08 depends on, with the one irreversible step
 * left out.
 *
 * Activating a subscription can only happen once per workspace — the second
 * call is a 409 — so it is never rehearsed here. What is checked is the part
 * that can be checked twice: that a freshly minted @flowstarter.dev account
 * resolves as an operator, that both project pages load for it, and what each
 * workspace's Billing tab currently says.
 *
 *   node e2e/support/retake-08-probe.mjs
 */
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { APP, pause, signInAsOperator } from './showcase-lib.mjs';
import { USERS_FILE } from './retake-users.mjs';

const U = JSON.parse(readFileSync(USERS_FILE, 'utf8'));
const CLAIMED = readFileSync('/tmp/retake-workspace.txt', 'utf8').trim();
const BUILT = '4d543e0b-882b-4a53-9f51-444df9793db7';
const OP_STATE = '/tmp/retake-operator-state.json';

const browser = await chromium.launch({ args: ['--disable-features=site-per-process'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

await signInAsOperator(page, U.operator);
await ctx.storageState({ path: OP_STATE });
console.log('operator session ready');

for (const [label, ws] of [['just claimed', CLAIMED], ['built site', BUILT]]) {
  await page.goto(`${APP}/admin/dashboard/projects/${ws}`, { waitUntil: 'domcontentloaded' });
  await pause(page, 3500);
  const heading = await page.locator('h1').first().innerText().catch(() => '(no h1)');
  await page.getByRole('tab', { name: 'Billing' }).click().catch(() => {});
  await pause(page, 2500);
  const billing = (await page.locator('body').innerText().catch(() => ''))
    .replace(/\n+/g, ' | ');
  const activate = page.getByRole('button', { name: /Activate subscription/ });
  console.log(`\n${label} ${ws}`);
  console.log(`  h1: ${heading}`);
  console.log(`  activate button enabled: ${await activate.isEnabled().catch(() => 'absent')}`);
  console.log(`  monthly: ${(/€[\d,]+\/mo/.exec(billing) ?? ['—'])[0]}`);
  console.log(`  billing text: ${billing.slice(billing.indexOf('Subscription'), billing.indexOf('Subscription') + 320)}`);
}

await ctx.close();
await browser.close();
