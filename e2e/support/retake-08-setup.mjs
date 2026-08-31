/**
 * Sets up clip 08 the way a client would get there, off camera.
 *
 * Clip 05 already films a claim and a deposit, so this does not re-film them;
 * it repeats them for a second workspace, through the same routes, so the
 * editor clip has something real to open:
 *
 *   1. The client claims the durable preview from their own browser session —
 *      `POST /api/flowstarter/projects/claim`, with the care plan named. The
 *      server maps the plan to a monthly fee; the browser never sends a price.
 *   2. The deposit and the balance are paid through the signed Stripe webhook
 *      (simulate-payment.mjs), because the subscription endpoint refuses to
 *      start a recurring clock on a workspace whose setup is unpaid.
 *
 * Nothing is written to the database by hand here. Every state change is a
 * route the product owns, and the workspace id it prints is read back out of
 * the response, not invented.
 *
 *   node e2e/support/retake-08-setup.mjs
 */
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { APP, signInAsClient, db } from './showcase-lib.mjs';
import { USERS_FILE } from './retake-users.mjs';

const U = JSON.parse(readFileSync(USERS_FILE, 'utf8'));
const PREVIEW = 'e5fe0568-7b28-4a3b-b9b6-fd7355d1eb2c';
const STATE = '/tmp/retake-client-state.json';
const WS_FILE = '/tmp/retake-workspace.txt';

const browser = await chromium.launch({ args: ['--disable-features=site-per-process'] });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  storageState: STATE,
});
const page = await ctx.newPage();
await page.goto(`${APP}/dashboard`, { waitUntil: 'domcontentloaded' });
// A stale storage state is worth failing on loudly rather than claiming as an
// anonymous caller and getting a 401 that looks like a product bug.
await page.waitForFunction(() => window.Clerk && window.Clerk.loaded, { timeout: 40000 })
  .catch(() => {});
const signedIn = await page.evaluate(() => Boolean(window.Clerk?.user)).catch(() => false);
if (!signedIn) await signInAsClient(page, U.client);

console.log('1. claiming the durable preview from the client session');
const claim = await page.evaluate(async ([previewId]) => {
  const res = await fetch('/api/flowstarter/projects/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      previewId,
      tier: 'pro',
      subscription: 'pro',
      billingCadence: 'monthly',
      businessName: 'Rowan & Vale Therapy',
      fullName: 'Nadia Marsh',
      email: 'hello@rowanvale.example',
      description:
        'A two-room therapy practice offering individual counselling, couples work ' +
        'and a small evening group, with a waiting list we would like to shorten.',
      industry: 'Counselling and psychotherapy',
      targetAudience: 'Adults in the city looking for weekly private therapy',
      goal: 'Enquiries from people ready to book a first session',
      brandTone: 'Calm, plain-spoken, unhurried',
      pageCount: '5-7',
      timeline: '4-weeks',
      commerceMode: 'few-services',
      catalogSize: '1-5',
    }),
  });
  return { status: res.status, body: await res.text() };
}, [PREVIEW]);
console.log(`   POST /claim -> ${claim.status}`);
if (claim.status !== 200 && claim.status !== 201) {
  console.error(claim.body.slice(0, 600));
  process.exit(1);
}
const claimed = JSON.parse(claim.body);
const WS = claimed.workspaceId;
console.log(`   workspace   ${WS}`);
console.log(`   quote       ${claimed.quoteMinor} minor · unlock ${claimed.unlockUrl}`);
if (claimed.membershipError) console.log(`   membership  ${claimed.membershipError}`);
writeFileSync(WS_FILE, WS);
await ctx.close();
await browser.close();

// What the plan mapped to, server-side.
const [row] = await db(
  `workspaces?id=eq.${WS}&select=name,monthly_fee,billing_interval,final_value_minor,client_email,deposit_status,final_status`
);
console.log(`   monthly_fee ${row.monthly_fee} · interval ${row.billing_interval}`);
console.log(`   client      ${row.client_email}`);

console.log('\n2. paying the setup invoices through the signed Stripe webhook');
for (const kind of ['deposit', 'final']) {
  execFileSync('node', ['e2e/support/simulate-payment.mjs', '--workspace', WS, '--kind', kind],
    { stdio: 'inherit' });
}

const [after] = await db(
  `workspaces?id=eq.${WS}&select=project_state,deposit_status,final_status,monthly_fee,subscription_status,stripe_subscription_id`
);
console.log(`\nready for the operator: ${JSON.stringify(after)}`);
console.log(`workspace id written to ${WS_FILE}`);
