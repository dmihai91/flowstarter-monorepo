// Proves that a client's published edit triggers a SITE_REBUILD job the
// build worker executes: client edits a word target in the editor, applies
// it, publishes, we poll the job/events until it settles, then screenshot
// the operator's Pipeline tab showing the job's build conversation.
//
//   node e2e/support/rebuild-proof.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { loadEnv, requireServiceRoleKey } from './local-env.mjs';

const APP = process.env.APP_ORIGIN ?? 'http://localhost:3005';
const WS = process.env.WORKSPACE_ID ?? '1b2666b2-7c87-4573-a685-3a076de65ada';
const OUT = process.env.OUT ?? '/tmp/fs-rebuild-admin.png';
const INSTRUCTION = 'Make this warmer and mention we welcome new patients.';
const client = JSON.parse(readFileSync('/tmp/fs-client.json', 'utf8'));
const operator = JSON.parse(readFileSync('/tmp/fs-operator.json', 'utf8'));
const env = loadEnv();
const SUPABASE_KEY = requireServiceRoleKey(env);
const db = async (path) => (await fetch(`http://127.0.0.1:54321/rest/v1/${path}`, { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } })).json();
const log = (...a) => console.log(...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

// 1. Client signs in and opens the editor.
await signIn(cp, client, '/login');
await cp.goto(`${APP}/dashboard/projects/${WS}/editor`, { waitUntil: 'networkidle', timeout: 120000 });
await cp.getByTestId('editor-tab-text').click();
await cp.getByTestId('editor-target-select').waitFor({ timeout: 30000 });
const targetLabel = await cp.getByTestId('editor-current-text').textContent();
log('editing target, current text:', (targetLabel ?? '').slice(0, 120));
await cp.screenshot({ path: '/tmp/fs-rebuild-1-editor.png' });

// 2. Propose a change via the UI (model call, can take up to ~90s).
let proposalBody = null;
let usedManualFallback = false;
try {
  await cp.getByTestId('editor-instruction').fill(INSTRUCTION);
  const [editRes] = await Promise.all([
    cp.waitForResponse((r) => /\/edit$/.test(r.url()) && r.request().method() === 'POST', { timeout: 100000 }),
    cp.getByTestId('editor-propose').click(),
  ]);
  proposalBody = await editRes.json().catch(() => null);
  if (!editRes.ok() || !proposalBody?.replacementContent) {
    throw new Error(`edit route returned ${editRes.status()}: ${JSON.stringify(proposalBody).slice(0, 300)}`);
  }
  log('propose ->', editRes.status(), 'replacement:', proposalBody.replacementContent.slice(0, 160));
  await cp.getByTestId('editor-proposal').waitFor({ timeout: 15000 });
} catch (e) {
  log('UI propose failed, falling back to a manual apply:', String(e).slice(0, 300));
  usedManualFallback = true;
}

let applyBody = null;
if (!usedManualFallback) {
  const [applyRes] = await Promise.all([
    cp.waitForResponse((r) => /\/apply$/.test(r.url()) && r.request().method() === 'POST', { timeout: 30000 }),
    cp.getByTestId('editor-apply').click(),
  ]);
  applyBody = await applyRes.json().catch(() => null);
  log('apply ->', applyRes.status(), JSON.stringify(applyBody)?.slice(0, 200));
  if (!applyRes.ok()) throw new Error(`apply route failed: ${applyRes.status()}`);
} else {
  // Manual fallback: call /apply directly with a hand-written replacement for
  // the same target, using the browser's own authenticated session.
  const original = targetLabel ?? '';
  const targetId = await cp.getByTestId('editor-target-select').inputValue();
  const replacement = `${original.trim()} We welcome new patients.`.trim();
  applyBody = await cp.evaluate(async ({ ws, targetId, original, replacement }) => {
    const res = await fetch(`/api/client/site/${ws}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId, originalContent: original, replacementContent: replacement }),
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, body };
  }, { ws: WS, targetId, original, replacement });
  log('manual apply ->', applyBody.status, JSON.stringify(applyBody.body).slice(0, 200));
  if (!applyBody.ok) throw new Error(`manual apply failed: ${applyBody.status} ${JSON.stringify(applyBody.body)}`);
  applyBody = applyBody.body;
  await cp.reload({ waitUntil: 'networkidle' });
  await cp.getByTestId('editor-tab-text').click();
}
await cp.waitForTimeout(800);
await cp.screenshot({ path: '/tmp/fs-rebuild-2-applied.png' });

// 3. Publish: this is the call that enqueues SITE_REBUILD.
await cp.getByTestId('editor-tab-history').click();
const publishBtn = cp.getByTestId('editor-publish');
await publishBtn.waitFor({ timeout: 20000 });
const [publishRes] = await Promise.all([
  cp.waitForResponse((r) => /\/publish$/.test(r.url()) && r.request().method() === 'POST', { timeout: 30000 }),
  publishBtn.click(),
]);
const publishBody = await publishRes.json().catch(() => null);
log('PUBLISH ->', publishRes.status(), JSON.stringify(publishBody, null, 2));
await cp.getByTestId('editor-publish-note').waitFor({ timeout: 15000 }).catch(() => {});
await cp.waitForTimeout(500);
await cp.screenshot({ path: '/tmp/fs-rebuild-3-published.png' });

if (!publishRes.ok()) throw new Error(`publish failed: ${publishRes.status()} ${JSON.stringify(publishBody)}`);
const jobId = publishBody.rebuildJobId;
if (!jobId) throw new Error(`publish did not return a rebuildJobId: ${JSON.stringify(publishBody)}`);
log('SITE_REBUILD job id:', jobId, 'mode:', publishBody.deploy?.mode);

// 4. Poll the job and its events until it settles (up to 10 minutes).
const TERMINAL = new Set(['succeeded', 'failed', 'canceled']);
let job = null;
let events = [];
const deadline = Date.now() + 10 * 60 * 1000;
while (Date.now() < deadline) {
  [job] = await db(`flowstarter_agent_jobs?id=eq.${jobId}&select=*`);
  events = await db(`flowstarter_agent_job_events?job_id=eq.${jobId}&order=created_at.asc`);
  log(`[poll] status=${job?.status} attempt=${job?.attempt_count} events=${events.length}`);
  if (job && TERMINAL.has(job.status)) break;
  await sleep(10000);
}

log('--- final job row ---');
log(JSON.stringify(job, null, 2));
log('--- events ---');
for (const e of events) {
  log(`${e.created_at}  ${e.kind}  ${JSON.stringify(e.body ?? e.payload ?? {}).slice(0, 400)}`);
}

// 5. Worker log lines mentioning this job.
let workerLogLines = [];
try {
  const logText = readFileSync('/tmp/fs-worker.log', 'utf8');
  workerLogLines = logText.split('\n').filter((l) => l.includes(jobId));
  log('--- worker log lines for job ---');
  for (const l of workerLogLines) log(l);
} catch (e) {
  log('could not read worker log:', String(e).slice(0, 200));
}

writeFileSync('/tmp/fs-rebuild-result.json', JSON.stringify({
  jobId,
  finalStatus: job?.status ?? null,
  publishBody,
  events,
  workerLogLines,
  usedManualFallback,
}, null, 2));

// 6. Operator: sign in, open the Pipeline tab, screenshot the SITE_REBUILD
// job's build-conversation panel.
await signIn(op, operator, '/admin/login');
await op.goto(`${APP}/admin/dashboard/projects/${WS}`, { waitUntil: 'networkidle', timeout: 120000 });
await op.getByRole('tab', { name: 'Pipeline' }).click();
await op.waitForTimeout(1500);

// Find the <li> job row for our job kind (SITE_REBUILD) that is closest to
// this run: prefer the row whose "Build conversation" panel is present and
// scroll it into view. There may be several jobs; the most recent SITE_REBUILD
// row is what we want.
const rows = op.locator('li:has-text("SITE_REBUILD")');
const rowCount = await rows.count();
log('SITE_REBUILD job rows on pipeline tab:', rowCount);
const row = rows.first();
await row.waitFor({ timeout: 30000 });
await row.scrollIntoViewIfNeeded();
const convo = row.getByTestId('build-conversation');
await convo.waitFor({ timeout: 30000 });
await convo.scrollIntoViewIfNeeded();
await op.waitForTimeout(1000);
await op.screenshot({ path: OUT, fullPage: false });
log('admin screenshot saved to', OUT);

await browser.close();
