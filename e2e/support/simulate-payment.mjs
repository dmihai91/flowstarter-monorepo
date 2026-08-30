/**
 * Drives a deposit or a balance payment through the production webhook path,
 * against ONE workspace you name explicitly.
 *
 * This is `simulate-deposit.mjs` split apart. That script created its own
 * throwaway workspace, which is useless for a filmed run: the visitor claims a
 * preview in the browser and the money has to land on THAT workspace, not on a
 * fixture. So the workspace id is now required and never invented, and the
 * script refuses to guess — the "never touch arbitrary workspaces" rule is the
 * whole reason it takes an argument instead of a query.
 *
 * Nothing is stubbed except Stripe itself: the event is signed with the real
 * webhook secret and posted to the live route, so `constructEvent` verifies it
 * exactly as it verifies Stripe's own delivery. Everything downstream — the
 * amount check against the stored quote, the lifecycle move, the build job —
 * is the code that runs in production.
 *
 *   node e2e/support/simulate-payment.mjs --workspace <uuid> --kind deposit
 *   node e2e/support/simulate-payment.mjs --workspace <uuid> --kind final
 */
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import Stripe from 'stripe';

// ── Arguments ───────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const arg = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const WORKSPACE = arg('workspace');
const KIND = arg('kind') ?? 'deposit';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

if (!WORKSPACE || !UUID.test(WORKSPACE)) {
  console.error('usage: simulate-payment.mjs --workspace <uuid> --kind deposit|final');
  console.error('a workspace uuid is required — this script will not pick one for you');
  process.exit(1);
}
if (KIND !== 'deposit' && KIND !== 'final') {
  console.error(`unknown --kind ${KIND} (expected deposit or final)`);
  process.exit(1);
}

// ── Environment ─────────────────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync('apps/flowstarter-main/.env.local', 'utf8')
    .split('\n').filter((l) => /^[A-Z]/.test(l))
    .map((l) => [l.split('=')[0], l.split('=').slice(1).join('=').trim()])
);
const SUPABASE = env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const APP = process.env.APP_ORIGIN || 'http://localhost:3000';

// Only ever the local stack. A hosted Supabase URL here would mean this script
// is about to move money-state on real customer data.
if (!/127\.0\.0\.1|localhost/.test(SUPABASE)) {
  console.error(`refusing to run against a non-local Supabase: ${SUPABASE}`);
  process.exit(1);
}

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

// Mirrors depositAmountMinor/balanceAmountMinor in
// packages/agentic-codegen/src/flowstarter/state-machine.ts. The server checks
// the deposit against its own copy; if these two ever disagree the webhook
// rejects the event, which is the correct outcome and visible in the output.
const depositMinorOf = (finalValueMinor) => Math.round(finalValueMinor * 0.2);
const balanceMinorOf = (finalValueMinor) => finalValueMinor - depositMinorOf(finalValueMinor);

const step = (n, msg) => console.log(`\n${n}. ${msg}`);
const id = (prefix) => `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 24)}`;

// ── 1. The quote the server already holds ───────────────────────────────────
step(1, `Reading the workspace the visitor claimed`);
const rows = await db(
  `workspaces?id=eq.${WORKSPACE}&select=id,name,project_state,deposit_status,final_status,final_value_minor,billing_currency`
);
const workspace = rows?.[0];
if (!workspace) {
  console.error(`workspace ${WORKSPACE} does not exist on the local stack`);
  process.exit(1);
}
const currency = (workspace.billing_currency || 'eur').toLowerCase();
const quoteMinor = workspace.final_value_minor;
if (!quoteMinor) {
  console.error('workspace has no final_value_minor — the operator has not priced it yet');
  process.exit(1);
}
const money = (minor) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: currency.toUpperCase() })
    .format(minor / 100);

console.log(`   workspace ${workspace.id}`);
console.log(`   ${workspace.name}`);
console.log(`   quote ${money(quoteMinor)} · state ${workspace.project_state}`);
console.log(`   deposit ${workspace.deposit_status ?? 'none'} · balance ${workspace.final_status ?? 'none'}`);

const stripe = new Stripe(env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
  apiVersion: '2026-02-25.clover',
});
const post = async (event) => {
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload, secret: env.STRIPE_WEBHOOK_SECRET,
  });
  const res = await fetch(`${APP}/api/webhooks/stripe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': signature },
    body: payload,
  });
  return { res, payload, signature };
};

// ── 2. Build and sign the event Stripe would send ───────────────────────────
let event;
if (KIND === 'deposit') {
  const amount = depositMinorOf(quoteMinor);
  step(2, `Stripe reports the deposit paid — ${money(amount)} (20% of the quote)`);
  console.log(`   balance left on approval  ${money(balanceMinorOf(quoteMinor))}`);
  event = {
    id: id('evt'), object: 'event', api_version: '2026-02-25.clover',
    created: Math.floor(Date.now() / 1000), livemode: false,
    type: 'payment_intent.succeeded',
    data: { object: {
      id: id('pi'), object: 'payment_intent', status: 'succeeded',
      amount_received: amount, currency,
      metadata: { kind: 'flowstarter_deposit', workspaceId: WORKSPACE },
    } },
  };
} else {
  // The balance goes through the invoice path the webhook already handles:
  // `invoice.payment_succeeded` with metadata.invoiceType === 'final'. That
  // branch sets final_status/final_paid_at and deliberately queues no build —
  // the build was already queued by the deposit.
  const amount = balanceMinorOf(quoteMinor);
  step(2, `Stripe reports the balance paid — ${money(amount)} (80% of the quote)`);
  event = {
    id: id('evt'), object: 'event', api_version: '2026-02-25.clover',
    created: Math.floor(Date.now() / 1000), livemode: false,
    type: 'invoice.payment_succeeded',
    data: { object: {
      id: id('in'), object: 'invoice', status: 'paid',
      amount_paid: amount, amount_due: amount, currency,
      metadata: { workspaceId: WORKSPACE, invoiceType: 'final' },
    } },
  };
}

step(3, 'Webhook signed with the real secret and posted to the live route');
const { res, payload, signature } = await post(event);
console.log(`   POST /api/webhooks/stripe -> ${res.status} ${res.statusText}`);
if (!res.ok) console.log(`   body: ${(await res.text()).slice(0, 300)}`);

// ── 4. What the server decided, read back from the database ─────────────────
step(4, 'Result, read back from the database');
const [after] = await db(
  `workspaces?id=eq.${WORKSPACE}&select=project_state,deposit_status,deposit_paid_at,final_status,final_paid_at`
);
const jobs = await db(
  `flowstarter_agent_jobs?workspace_id=eq.${WORKSPACE}&select=id,kind,status,stripe_event_id`
);
console.log(`   state         ${workspace.project_state} -> ${after.project_state}`);
console.log(`   deposit       ${after.deposit_status ?? 'none'}`);
console.log(`   balance       ${after.final_status ?? 'none'}`);
console.log(`   build queued  ${jobs.length ? jobs.map((j) => `${j.kind} (${j.status})`).join(', ') : 'none'}`);

// ── 5. Stripe retries. The ledger must not build twice. ─────────────────────
step(5, 'Stripe redelivers the identical event');
const again = await fetch(`${APP}/api/webhooks/stripe`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'stripe-signature': signature },
  body: payload,
});
const jobsAfter = await db(`flowstarter_agent_jobs?workspace_id=eq.${WORKSPACE}&select=id`);
console.log(`   POST again -> ${again.status} · jobs now: ${jobsAfter.length} (expected ${jobs.length})`);

// ── 6. And a forged one is refused outright. ────────────────────────────────
step(6, 'An unsigned event is rejected');
const forged = await fetch(`${APP}/api/webhooks/stripe`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'stripe-signature': 't=1,v1=forged' },
  body: payload,
});
console.log(`   POST forged -> ${forged.status} (expected 401)`);

console.log(`\nworkspace: ${WORKSPACE} · kind: ${KIND}`);
