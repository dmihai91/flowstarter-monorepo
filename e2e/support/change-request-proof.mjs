// The change-request flow end to end, for real: the client files a bigger
// change from the editor, the operator quotes it, the client accepts and pays
// through Stripe Checkout (test mode), the signed webhook settles it, the
// operator marks it done. Screenshots at each step under /tmp/fs-cr-*.png.
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import Stripe from 'stripe';

const APP = process.env.APP_ORIGIN ?? 'http://localhost:3005';
const WS = process.env.WORKSPACE_ID ?? '1b2666b2-7c87-4573-a685-3a076de65ada';
const REQUEST = 'Add a page for group workshops with its own booking calendar, linked from the main menu.';
const client = JSON.parse(readFileSync('/tmp/fs-client.json', 'utf8'));
const operator = JSON.parse(readFileSync('/tmp/fs-operator.json', 'utf8'));
const env = Object.fromEntries(
  ['apps/flowstarter-main/.env', 'apps/flowstarter-main/.env.local'].flatMap((file) =>
    readFileSync(file, 'utf8').split('\n').filter((l) => /^[A-Z]/.test(l))
      .map((l) => [l.split('=')[0], l.split('=').slice(1).join('=').trim().replace(/^"|"$/g, '')])
  )
);
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const db = async (path) => (await fetch(`http://127.0.0.1:54321/rest/v1/${path}`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } })).json();
const log = (...a) => console.log(...a);

async function signIn(page, user, landing) {
  const res = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.CLERK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id, expires_in_seconds: 600 }),
  });
  const ticket = (await res.json()).token;
  await page.goto(`${APP}${landing}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.Clerk && window.Clerk.loaded, { timeout: 60000 });
  const out = await page.evaluate(async (t) => {
    const si = await window.Clerk.client.signIn.create({ strategy: 'ticket', ticket: t });
    if (si.status !== 'complete') return si.status;
    await window.Clerk.setActive({ session: si.createdSessionId });
    return 'complete';
  }, ticket);
  if (out !== 'complete') throw new Error(`sign-in ${landing}: ${out}`);
  await page.waitForTimeout(1500);
}

const browser = await chromium.launch();
const clientCtx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const opCtx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const cp = await clientCtx.newPage();
const op = await opCtx.newPage();

// 1. Client files the request from the editor.
await signIn(cp, client, '/login');
await cp.goto(`${APP}/dashboard/projects/${WS}/editor`, { waitUntil: 'networkidle', timeout: 120000 });
await cp.getByTestId('editor-tab-request').click();
await cp.getByTestId('escalation-request').fill(REQUEST);
await cp.getByTestId('escalation-submit').click();
await cp.getByTestId('escalation-sent').waitFor({ timeout: 30000 });
await cp.getByTestId('change-requests-list').waitFor({ timeout: 30000 });
await cp.waitForTimeout(800);
await cp.screenshot({ path: '/tmp/fs-cr-1-client-filed.png' });
const [filed] = await db(`flowstarter_change_requests?workspace_id=eq.${WS}&order=created_at.desc&limit=1`);
log('filed', filed.id, filed.status, filed.matched_rules);

// 2. Operator quotes it.
await signIn(op, operator, '/admin/login');
await op.goto(`${APP}/admin/dashboard/projects/${WS}`, { waitUntil: 'networkidle', timeout: 120000 });
await op.getByRole('tab', { name: 'Changes' }).click();
const card = op.getByTestId('change-request-card').first();
await card.waitFor({ timeout: 60000 });
log('suggested line:', (await card.locator('p').nth(1).textContent()).trim());
await card.getByLabel(/Quote \(/).fill('180');
await card.getByLabel('What the client will read').fill('A workshops page with its own Cal.com calendar and a menu link. Live within 5 working days of payment.');
await card.getByRole('button', { name: 'Send quote' }).click();
await op.getByText('Quote sent').waitFor({ timeout: 20000 });
await op.waitForTimeout(1200);
await op.screenshot({ path: '/tmp/fs-cr-2-operator-quoted.png' });

// 3. Client sees the quote and accepts: off to Stripe Checkout.
await cp.reload({ waitUntil: 'networkidle' });
await cp.getByTestId('editor-tab-request').click();
const item = cp.getByTestId('change-request-item').first();
await item.waitFor({ timeout: 30000 });
log('client sees:', (await item.textContent()).replace(/\s+/g, ' ').slice(0, 200));
await cp.screenshot({ path: '/tmp/fs-cr-3-client-quoted.png' });
await Promise.all([
  cp.waitForURL(/checkout\.stripe\.com/, { timeout: 60000 }),
  item.getByTestId('change-request-accept').click(),
]);
await cp.waitForLoadState('domcontentloaded');
await cp.waitForTimeout(4000);
await cp.screenshot({ path: '/tmp/fs-cr-4-stripe-checkout.png' });
const [accepted] = await db(`flowstarter_change_requests?id=eq.${filed.id}`);
log('after accept:', accepted.status, accepted.stripe_checkout_session_id);

// 4. Pay with the test card on Stripe's hosted page.
let paidOnStripe = false;
try {
  const email = cp.locator('#email');
  if (await email.isVisible().catch(() => false)) {
    if (!(await email.inputValue())) await email.fill(client.email);
  }
  const cardNumber = cp.locator('#cardNumber');
  await cardNumber.waitFor({ timeout: 30000 });
  await cardNumber.fill('4242424242424242');
  await cp.locator('#cardExpiry').fill('12/34');
  await cp.locator('#cardCvc').fill('123');
  const name = cp.locator('#billingName');
  if (await name.isVisible().catch(() => false)) await name.fill('Maria Ionescu');
  const country = cp.locator('#billingCountry');
  if (await country.isVisible().catch(() => false)) await country.selectOption('RO').catch(() => {});
  const postal = cp.locator('#billingPostalCode');
  if (await postal.isVisible().catch(() => false)) await postal.fill('400001');
  await cp.locator('button.SubmitButton, button[type="submit"]').first().click();
  await cp.waitForURL((u) => u.toString().startsWith(APP), { timeout: 90000 });
  paidOnStripe = true;
  await cp.waitForTimeout(2500);
  await cp.screenshot({ path: '/tmp/fs-cr-5-back-from-stripe.png' });
} catch (e) {
  log('stripe form automation failed:', String(e).slice(0, 200));
  await cp.screenshot({ path: '/tmp/fs-cr-5-stripe-failed.png' });
}

// 5. The webhook: Stripe's own session object, signed with our endpoint secret.
if (paidOnStripe) {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-02-25.clover' });
  const session = await stripe.checkout.sessions.retrieve(accepted.stripe_checkout_session_id);
  log('stripe says payment_status =', session.payment_status, 'amount_total =', session.amount_total);
  const event = {
    id: `evt_proof_${Date.now()}`,
    object: 'event',
    api_version: '2026-02-25.clover',
    created: Math.floor(Date.now() / 1000),
    type: 'checkout.session.completed',
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    data: { object: session },
  };
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: env.STRIPE_WEBHOOK_SECRET });
  const res = await fetch(`${APP}/api/webhooks/stripe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': signature },
    body: payload,
  });
  log('webhook ->', res.status, await res.text());
  const [paid] = await db(`flowstarter_change_requests?id=eq.${filed.id}`);
  log('after webhook:', paid.status, 'paid_at', paid.paid_at, 'pi', paid.stripe_payment_intent_id);
  await cp.goto(`${APP}/dashboard/projects/${WS}/editor`, { waitUntil: 'networkidle', timeout: 120000 });
  await cp.getByTestId('editor-tab-request').click();
  await cp.getByTestId('change-request-item').first().waitFor({ timeout: 30000 });
  await cp.waitForTimeout(800);
  await cp.screenshot({ path: '/tmp/fs-cr-6-client-paid.png' });

  // 6. Operator marks it done.
  await op.reload({ waitUntil: 'networkidle' });
  await op.getByRole('tab', { name: 'Changes' }).click();
  const paidCard = op.getByTestId('change-request-card').first();
  await paidCard.getByRole('button', { name: 'Mark done' }).click();
  await op.getByText('Marked done').waitFor({ timeout: 20000 });
  await op.waitForTimeout(1000);
  await op.screenshot({ path: '/tmp/fs-cr-7-operator-done.png' });
  const [done] = await db(`flowstarter_change_requests?id=eq.${filed.id}`);
  log('final:', done.status);
  const events = await db(`project_events?workspace_id=eq.${WS}&kind=like.change_request*&order=created_at.asc&select=kind,actor`);
  log('audit:', events.map((e) => `${e.kind} by ${e.actor.slice(0, 12)}`).join(' | '));
}
writeFileSync('/tmp/fs-cr-result.json', JSON.stringify({ id: filed.id, paidOnStripe }));
await browser.close();
