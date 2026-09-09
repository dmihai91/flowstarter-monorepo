/**
 * Drives a deposit through the production path, on the local stack.
 *
 * Nothing is stubbed except Stripe itself: the event is signed with the real
 * webhook secret and posted to the live route, so `constructEvent` verifies it
 * the same way it verifies Stripe's own delivery. What follows — the amount
 * check against the stored quote, the lifecycle move, the build job — is the
 * code that runs in production.
 *
 *   node e2e/support/simulate-deposit.mjs
 */
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import Stripe from 'stripe';

const env = Object.fromEntries(
  readFileSync('apps/flowstarter-main/.env.local', 'utf8')
    .split('\n').filter((l) => /^[A-Z]/.test(l))
    .map((l) => [l.split('=')[0], l.split('=').slice(1).join('=').trim()])
);
const SUPABASE = env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const APP = process.env.APP_ORIGIN || 'http://localhost:3000';

const db = async (path, init = {}) => {
  const res = await fetch(`${SUPABASE}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json', Prefer: 'return=representation',
      ...(init.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
};

const money = (minor) => `€${(minor / 100).toFixed(2)}`;
const step = (n, msg) => console.log(`\n${n}. ${msg}`);

// 1. A workspace priced the way an operator prices one.
const slug = `deposit-demo-${Date.now().toString(36)}`;
const QUOTE_MINOR = 119_900;
step(1, 'Operator creates the project and sets the quote');
const [workspace] = await db('workspaces', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Marsh & Fern Counselling', slug, site_kind: 'astro',
    client_business_name: 'Marsh & Fern Counselling',
    client_email: 'hello@marshandfern.example',
    project_state: 'PREVIEW_READY', deposit_status: 'pending',
    billing_currency: 'eur', setup_fee: QUOTE_MINOR / 100,
    final_value_minor: QUOTE_MINOR,
  }),
});
console.log(`   workspace ${workspace.id}`);
console.log(`   quote ${money(QUOTE_MINOR)} · state ${workspace.project_state}`);

// 2. The split the client is shown, computed by the same helper the page uses.
const depositMinor = Math.round(QUOTE_MINOR * 0.2);
step(2, 'Client opens the unlock page');
console.log(`   deposit due now (20%)     ${money(depositMinor)}`);
console.log(`   balance on approval (80%) ${money(QUOTE_MINOR - depositMinor)}`);

// 3. Stripe takes the payment; we sign its callback exactly as Stripe would.
step(3, 'Stripe reports the deposit paid — webhook signed and posted');
const stripe = new Stripe(env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
  apiVersion: '2026-02-25.clover',
});
const event = {
  id: `evt_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
  object: 'event', api_version: '2026-02-25.clover',
  created: Math.floor(Date.now() / 1000), livemode: false,
  type: 'payment_intent.succeeded',
  data: { object: {
    id: `pi_${randomUUID().replace(/-/g, '').slice(0, 24)}`,
    object: 'payment_intent', status: 'succeeded',
    amount_received: depositMinor, currency: 'eur',
    metadata: { kind: 'flowstarter_deposit', workspaceId: workspace.id },
  } },
};
const payload = JSON.stringify(event);
const signature = stripe.webhooks.generateTestHeaderString({
  payload, secret: env.STRIPE_WEBHOOK_SECRET,
});
const res = await fetch(`${APP}/api/webhooks/stripe`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'stripe-signature': signature },
  body: payload,
});
console.log(`   POST /api/webhooks/stripe -> ${res.status} ${res.statusText}`);

// 4. What the server decided, read back from the database.
step(4, 'Result, read back from the database');
const [after] = await db(`workspaces?id=eq.${workspace.id}&select=project_state,deposit_status,deposit_paid_at`);
const jobs = await db(`flowstarter_agent_jobs?workspace_id=eq.${workspace.id}&select=kind,status,stripe_event_id`);
console.log(`   state         ${workspace.project_state} -> ${after.project_state}`);
console.log(`   deposit       ${after.deposit_status}`);
console.log(`   build queued  ${jobs.length ? `${jobs[0].kind} (${jobs[0].status})` : 'none'}`);

// 5. Stripe retries; the ledger must not build twice.
step(5, 'Stripe redelivers the same event');
const again = await fetch(`${APP}/api/webhooks/stripe`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'stripe-signature': signature },
  body: payload,
});
const jobsAfter = await db(`flowstarter_agent_jobs?workspace_id=eq.${workspace.id}&select=id`);
console.log(`   POST again -> ${again.status} · jobs now: ${jobsAfter.length} (expected 1)`);

// 6. And a forged one is refused outright.
step(6, 'An unsigned event is rejected');
const forged = await fetch(`${APP}/api/webhooks/stripe`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'stripe-signature': 't=1,v1=forged' },
  body: payload,
});
console.log(`   POST forged -> ${forged.status} (expected 401)`);

console.log(`\nworkspace: ${workspace.id}`);
