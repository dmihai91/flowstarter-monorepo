/**
 * Records clip 05: the operator deposit → build pipeline, live.
 * One continuous take: dashboard → project → billing → Send deposit
 * (real Stripe test invoice) → signed webhook "pays" it → PAID + build queued.
 */
import { chromium } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);

const WS = '0f4e1088-8d8f-4f18-83b1-406cc292b23c';
const BASE = 'http://127.0.0.1:3000';

const browser = await chromium.launch();
const ctx = await browser.newContext({
  storageState: 'e2e/.auth/operator.json',
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
  recordVideo: { dir: '/tmp/clip05', size: { width: 1440, height: 900 } },
});
const page = await ctx.newPage();
const pause = (ms) => page.waitForTimeout(ms);

// Scene 1 — signed-in operator dashboard
await page.goto(`${BASE}/admin/dashboard`, { waitUntil: 'domcontentloaded' });
await pause(2600);

// Scene 2 — projects list, open the workspace
await page.goto(`${BASE}/admin/dashboard/projects`, { waitUntil: 'domcontentloaded' });
await pause(2200);
await page.locator('tr', { hasText: 'Calm Path' }).first().click();
await page.waitForURL(/projects\//, { timeout: 15000 });
await pause(2200);

// Scene 3 — Billing tab: 20/80 pending
await page.getByRole('tab', { name: 'Billing' }).click();
await pause(2600);

// Scene 4 — send the deposit (real Stripe test-mode invoice)
await page.getByRole('button', { name: /Send deposit/ }).click();
await page.getByText('Hosted invoice').first().waitFor({ timeout: 45000 });
await pause(2800);

// Scene 5 — Stripe pays it: fire the signed webhook mid-recording
const inv = (await exec('docker', ['exec', 'supabase_db_flowstarter', 'psql', '-U', 'postgres', '-d', 'postgres', '-tAc',
  `select deposit_invoice_id from public.workspaces where id='${WS}';`])).stdout.trim();
console.log('invoice:', inv);
await exec('node', ['--input-type=module', '-e', `
import Stripe from 'stripe';
import {config} from 'dotenv';
config({path:'apps/flowstarter-main/.env.local',quiet:true});
config({path:'apps/flowstarter-main/.env',override:false,quiet:true});
const s=new Stripe('sk_test_x');
const payload=JSON.stringify({id:'evt_clip05_'+Math.random().toString(36).slice(2,8),object:'event',type:'invoice.payment_succeeded',
  data:{object:{id:'${inv}',object:'invoice',currency:'eur',amount_paid:15980,
  metadata:{invoiceType:'deposit',workspaceId:'${WS}'}}}});
const sig=s.webhooks.generateTestHeaderString({payload,secret:process.env.STRIPE_WEBHOOK_SECRET});
const r=await fetch('${BASE}/api/webhooks/stripe',{method:'POST',body:payload,headers:{'stripe-signature':sig,'content-type':'application/json'}});
console.log('webhook:',r.status);
`]);

// Scene 6 — reload: PAID, final invoice unlocked, build queued underneath
await page.reload({ waitUntil: 'domcontentloaded' });
await page.getByRole('tab', { name: 'Billing' }).click();
await page.getByText('PAID', { exact: false }).first().waitFor({ timeout: 15000 });
await pause(3600);

// Poster frame + close
await page.screenshot({ path: 'apps/flowstarter-main/public/workflow-clips/05-deposit.png' });
const video = page.video();
await ctx.close();
const path = await video.path();
console.log('video:', path);
await browser.close();
