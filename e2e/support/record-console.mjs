/**
 * Records the worked-project half of the flow: clips 06 through 10.
 *
 * Two honest constraints shape this file.
 *
 * First, an operator's session and a client's session cannot be the same
 * browser context, so steps that cross the line (an operator posts, the client
 * sees it) are recorded as two real segments and joined. Neither side is
 * re-enacted in the other's session.
 *
 * Second, the admin UI has no operator-side message composer — only the client
 * dashboard renders a thread. The capability is real and server-side, so the
 * operator's clarification is sent from the operator's own authenticated page
 * through the same endpoint the UI would call. The showcase page says this
 * plainly rather than implying a screen that does not exist.
 *
 *   node e2e/support/record-console.mjs
 */
import { chromium } from '@playwright/test';
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  OUT, VID, RAW, APP, DESKTOP, MOBILE, ensureDirs, users, pause, slowScroll,
  clip, concat, writeManifest, signInAsOperator, signInAsClient, db,
} from './showcase-lib.mjs';

ensureDirs();
const U = users();
const WS = readFileSync('/tmp/showcase-workspace.txt', 'utf8').trim();
if (!WS) { console.error('no workspace id from the funnel run'); process.exit(1); }
const CLIENT_STATE = '/tmp/showcase-client-state.json';
const OP_STATE = '/tmp/showcase-operator-state.json';
// Two real image files from the repo, both comfortably over the 800px floor
// the section-photo gate enforces, and neither showing a person's face.
const PHOTOS = [
  'artifacts/darius-portfolio/images/boutique.png',
  'artifacts/darius-portfolio/images/budget-dark.png',
];

const browser = await chromium.launch();
const results = [];
const notes = {};

/** Runs a fetch from inside an authenticated page — the session is the real one. */
const apiFromPage = (page, path, body) =>
  page.evaluate(async ([p, b]) => {
    const res = await fetch(p, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(b),
    });
    return { status: res.status, body: await res.text() };
  }, [path, body]);

// ── Setup: the operator signs in once, off camera, and raises the asset ask ──
// The ask has to exist before the client dashboard can show it. It is a real
// operator action against the real endpoint, and it shows up again in clip 07's
// timeline, so nothing here is invisible to the viewer.
console.log('setup: operator session + asset request');
{
  const ctx = await browser.newContext({ viewport: DESKTOP });
  const page = await ctx.newPage();
  await signInAsOperator(page, U.operator);
  await ctx.storageState({ path: OP_STATE });
  const r = await apiFromPage(page, `/api/projects/${WS}/messages/request-assets`, {});
  notes.requestAssets = `${r.status} ${r.body.slice(0, 240)}`;
  console.log('  request-assets ->', notes.requestAssets);
  await ctx.close();
}

// ── 06 — the client dashboard ───────────────────────────────────────────────
// This page is currently a 500. `dashboard/projects/[workspaceId]/page.tsx`
// calls `messagesFromPayload()` — a function that lives in a client module —
// from a server component, and Next refuses. The asks, the thread and the
// upload all live behind it, so none of them can be filmed on this build.
// The clip is the failure, because that is what a client would meet today.
console.log('06-client-dashboard');
results.push(await clip(browser, '06-client-dashboard',
  { storageState: CLIENT_STATE }, async (page) => {
    await page.goto(`${APP}/dashboard`, { waitUntil: 'domcontentloaded' });
    await pause(page, 5000);
    notes.dashboardList = (await page.locator('body').innerText().catch(() => ''))
      .replace(/\n+/g, ' | ').slice(0, 200);

    await page.goto(`${APP}/dashboard/projects/${WS}`, { waitUntil: 'domcontentloaded' });
    await pause(page, 6000);
    const body = (await page.locator('body').innerText().catch(() => ''));
    notes.dashboardError = body.replace(/\n+/g, ' | ').slice(0, 220);
    notes.dashboardBroken = /Something went wrong/i.test(body);
    console.log('  client project page:', notes.dashboardBroken ? 'ERROR PAGE' : 'rendered');
    await slowScroll(page, 2, 240, 800);
    await pause(page, 4000);
  }));

// ── 07 — the operator console (two segments, joined) ────────────────────────
console.log('07-operator-console');
const opSeg = await clip(browser, '07a-operator', {}, async (page) => {
  // The operator's login page, then a real Clerk session for a different
  // account. The password form itself cannot be driven here (the instance
  // demands client-trust verification), so the session comes from a
  // server-minted sign-in token — the role still resolves from the email
  // domain, and the console below is what that role actually sees.
  await signInAsOperator(page, U.operator);
  await pause(page, 3000);

  await page.goto(`${APP}/admin/dashboard/pipeline`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Pipeline' })
    .waitFor({ state: 'visible', timeout: 40000 });
  await pause(page, 5000);
  notes.pipelineSubtitle = await page.locator('h1 + p, h1 ~ p').first()
    .innerText().catch(() => '');
  await slowScroll(page, 2, 260, 800);
  await pause(page, 4500);

  // Straight to the project this run created.
  await page.goto(`${APP}/admin/dashboard/projects/${WS}`, { waitUntil: 'domcontentloaded' });
  await pause(page, 4000);
  await page.getByRole('tab', { name: 'Pipeline' }).click();
  await pause(page, 4500);
  await slowScroll(page, 3, 320, 800);
  await pause(page, 4000);

  // Re-dispatch: the honest failure this console exists to surface.
  const redispatch = page.getByRole('button', { name: 'Re-dispatch' }).first();
  if (await redispatch.isVisible().catch(() => false)) {
    await redispatch.scrollIntoViewIfNeeded().catch(() => {});
    await pause(page, 2000);
    await redispatch.click();
    await pause(page, 8000);
    notes.redispatchToast = await page.locator('[data-sonner-toast]').first()
      .innerText().catch(() => '');
    console.log('  re-dispatch ->', notes.redispatchToast);
  } else {
    notes.redispatchToast = 'Re-dispatch was not offered for this job';
  }
  await pause(page, 4000);

  // The timeline: preview_claimed, the deposit, the asset request, the upload.
  await page.getByRole('heading', { name: 'Timeline' })
    .scrollIntoViewIfNeeded().catch(() => {});
  await pause(page, 6000);
  await slowScroll(page, 3, 300, 800);
  await pause(page, 3500);

  // The clarification. No composer exists in the admin UI, so this goes
  // through the endpoint that composer would call, from the operator's session.
  const r = await apiFromPage(page, `/api/projects/${WS}/messages`, {
    body: 'Quick one from our side: we will use the photo you sent as the main image, '
        + 'and hold the header until your logo arrives. Nothing else needed from you today.',
    kind: 'clarification',
  });
  notes.clarification = `${r.status} ${r.body.slice(0, 160)}`;
  console.log('  clarification ->', notes.clarification);
  await pause(page, 3000);
});

// The clarification cannot be shown arriving in the client's thread, because
// the page that renders the thread is the one that 500s. It is verified in the
// database instead, and the page says so rather than implying a screen.
const landed = await db(
  `project_messages?workspace_id=eq.${WS}&select=kind,direction,body&order=created_at.desc&limit=3`
).catch(() => null);
notes.clarificationLanded = Array.isArray(landed)
  ? landed.map((m) => `${m.kind}/${m.direction}`).join(', ')
  : 'could not read messages';
console.log('  messages now:', notes.clarificationLanded);

results.push({ name: '07-operator-console', seconds: opSeg.seconds, error: opSeg.error });
try {
  copyFileSync(join(VID, '07a-operator.webm'), join(VID, '07-operator-console.webm'));
} catch (err) {
  console.error('  could not place 07:', err.message.split('\n')[0]);
}

// ── 09 — the balance, then what a finished site looks like ──────────────────
console.log('09-balance-and-live');
const seg09 = [];

seg09.push(await clip(browser, '09a-operator-advance',
  { storageState: OP_STATE }, async (page) => {
    await page.goto(`${APP}/admin/dashboard/projects/${WS}`, { waitUntil: 'domcontentloaded' });
    await pause(page, 3500);
    await page.getByRole('tab', { name: 'Pipeline' }).click();
    await pause(page, 3000);

    // Only neighbouring states are offered, and the server enforces the same
    // rule — DEPOSIT_PAID cannot jump to HUMAN_QA, so this is two moves, each
    // with its own written reason. That constraint is the point, not an
    // obstacle to edit around.
    const move = async (label, reason) => {
      await page.getByRole('combobox').first().click();
      await pause(page, 1800);
      await page.getByRole('option', { name: label }).first().click();
      await pause(page, 1600);
      const box = page.locator('#state-override-reason');
      await box.click();
      await box.fill('');
      await box.type(reason, { delay: 14 });
      await pause(page, 1400);
      await page.getByRole('button', { name: 'Move project' }).click();
      await pause(page, 7000);
      const toast = await page.locator('[data-sonner-toast]').first()
        .innerText().catch(() => '');
      console.log(`  move ${label} ->`, toast);
      return toast;
    };

    notes.advanceToast = [
      await move(/Agents working/i,
        'Build worker is not reachable in this environment; starting the build by hand.'),
      await move(/Human QA/i,
        'Build finished and reviewed by hand; moving to final checks before the balance invoice.'),
    ].join(' | ');
    await pause(page, 3500);

    // The care plan, started from the Billing tab. This is the operator action
    // that unlocks the client's editor — the editor is gated on an active
    // subscription and says so, so without this the next clip would only ever
    // show a disabled panel.
    await page.getByRole('tab', { name: /billing/i }).first().click();
    await pause(page, 3500);
    await slowScroll(page, 2, 260, 700);        // both invoices, both paid
    await pause(page, 3500);
    const activate = page.getByRole('button', { name: 'Activate subscription' }).first();
    if (await activate.isVisible().catch(() => false)) {
      await activate.scrollIntoViewIfNeeded().catch(() => {});
      await pause(page, 2000);
      await activate.click();
      await pause(page, 7000);
      notes.subscriptionToast = await page.locator('[data-sonner-toast]').first()
        .innerText().catch(() => '');
      console.log('  activate subscription ->', notes.subscriptionToast);
    } else {
      notes.subscriptionToast = 'Activate subscription was not offered';
    }
    await pause(page, 3000);
  }));

// The balance, through the invoice path the webhook already handles.
try {
  const out = execFileSync('node',
    ['e2e/support/simulate-payment.mjs', '--workspace', WS, '--kind', 'final'],
    { encoding: 'utf8' });
  writeFileSync('/tmp/final-run.txt', out);
  console.log('  balance webhook posted');
} catch (err) {
  notes.finalPayment = `failed: ${String(err.message).split('\n')[0]}`;
  console.error('  balance payment failed:', notes.finalPayment);
}

// The client's own view of the money. Not the dashboard — that page 500s on
// this build — but the unlock page, which is where the client was sent to pay
// and which reads the same workspace row the webhook just wrote.
seg09.push(await clip(browser, '09b-client-balance',
  { storageState: CLIENT_STATE }, async (page) => {
    await page.goto(`${APP}/unlock/${WS}`, { waitUntil: 'domcontentloaded' });
    await pause(page, 5000);
    await slowScroll(page, 3, 300, 750);
    await pause(page, 5000);
  }));

// Two sites this pipeline produced earlier, served locally.
const servers = [
  spawn('node', ['e2e/support/serve-static.mjs', 'artifacts/fitness-ro', '8960'], { stdio: 'ignore' }),
  spawn('node', ['e2e/support/serve-static.mjs', 'artifacts/darius-portfolio', '8970'], { stdio: 'ignore' }),
];
await new Promise((r) => setTimeout(r, 1500));

seg09.push(await clip(browser, '09c-sites', {}, async (page) => {
  for (const url of ['http://127.0.0.1:8960/', 'http://127.0.0.1:8970/']) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await pause(page, 2600);
    await slowScroll(page, 10, 500, 330);
    await pause(page, 900);
  }
}));

seg09.push(await clip(browser, '09d-sites-mobile', { size: MOBILE }, async (page) => {
  await page.goto('http://127.0.0.1:8960/', { waitUntil: 'domcontentloaded' });
  await pause(page, 2400);
  await slowScroll(page, 8, 380, 400);
  await pause(page, 1500);
}));

for (const s of servers) s.kill();

try {
  concat(seg09.map((s) => join(VID, `${s.name}.webm`)), join(VID, '09-balance-and-live.webm'));
  results.push({ name: '09-balance-and-live',
    seconds: seg09.reduce((a, s) => a + s.seconds, 0),
    error: seg09.find((s) => s.error)?.error ?? null });
  console.log('  joined 09');
} catch (err) {
  console.error('  concat 09 failed:', err.message.split('\n')[0]);
}

// ── 08 — the client editor ──────────────────────────────────────────────────
console.log('08-editor');
results.push(await clip(browser, '08-editor', { storageState: CLIENT_STATE }, async (page) => {
  await page.goto(`${APP}/dashboard/projects/${WS}/editor`, { waitUntil: 'domcontentloaded' });
  await pause(page, 5000);

  const select = page.locator('[data-testid="editor-target-select"]');
  await select.waitFor({ state: 'visible', timeout: 40000 });
  await pause(page, 2500);

  // Pick the first real content target the server offered.
  const values = await select.locator('option').evaluateAll((os) =>
    os.map((o) => ({ value: o.value, label: o.textContent })).filter((o) => o.value));
  notes.editorTargets = values.length;
  if (!values.length) throw new Error('the editor offered no content targets');
  await select.selectOption(values[0].value);
  await pause(page, 3000);

  const instruction = page.locator('[data-testid="editor-instruction"]');
  await instruction.click();
  await instruction.type('Warmer, and mention that the first intro call is free.', { delay: 18 });
  await pause(page, 1500);
  await page.locator('[data-testid="editor-propose"]').click();

  // A real model call, shown as a diff before anything is saved.
  await page.locator('[data-testid="editor-proposal"]')
    .waitFor({ state: 'visible', timeout: 240000 });
  notes.editorProposal = (await page.locator('[data-testid="editor-proposal"]')
    .innerText().catch(() => '')).replace(/\n+/g, ' | ').slice(0, 240);
  console.log('  proposal:', notes.editorProposal.slice(0, 120));
  await pause(page, 9000);

  // Apply, by testid where it exists and by its own label where it does not.
  const apply = page.locator('[data-testid="editor-apply"]').first();
  const applyBtn = (await apply.count())
    ? apply
    : page.getByRole('button', { name: /^(apply|use this|save)/i }).first();
  await applyBtn.click({ timeout: 30000 });
  await pause(page, 10000);

  // And back again, from the history tab.
  await page.locator('[data-testid="editor-tab-history"]').click();
  await pause(page, 5000);
  const revert = page.locator('[data-testid="editor-revert"]').first();
  const revertBtn = (await revert.count())
    ? revert
    : page.getByRole('button', { name: /revert|undo|restore/i }).first();
  if (await revertBtn.isVisible().catch(() => false)) {
    await revertBtn.click({ timeout: 30000 }).catch(() => {});
    await pause(page, 10000);
  } else {
    notes.editorRevert = 'no revert control was offered';
  }
  await pause(page, 3000);

  // The policy mirror: a structural target is refused with a reason.
  await page.locator('[data-testid="editor-tab-text"]').click().catch(() => {});
  await pause(page, 2000);
  notes.editorPolicy = (await page.locator('[data-testid="editor-policy-notice"]')
    .innerText().catch(() => '')).replace(/\n+/g, ' | ').slice(0, 200);
  await pause(page, 4000);
}));

// ── 10 — preview hosting: the lever, not pulled ─────────────────────────────
console.log('10-previews-hosting');
// A terminal-styled panel rendered from the script's own captured output. The
// text is the run's stdout, not a mock-up written for the page.
const dryRun = existsSync('/tmp/provision-dryrun.txt')
  ? readFileSync('/tmp/provision-dryrun.txt', 'utf8') : '(dry run not captured)';
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
writeFileSync(join(RAW, 'terminal.html'), `<!doctype html><meta charset="utf-8">
<style>
 html,body{margin:0;background:#0b0f1a;color:#c7d0e8;
   font:13px/1.55 ui-monospace,Menlo,monospace;height:100%}
 .win{margin:18px;border:1px solid #1f2740;border-radius:10px;overflow:hidden;background:#0d1322}
 .bar{background:#151c30;padding:7px 12px;color:#94a0bd;font-size:12px;border-bottom:1px solid #1f2740}
 .dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:-1px}
 pre{margin:0;padding:14px 16px;white-space:pre-wrap}
 .cmd{color:#6ee7a8}
</style>
<div class="win"><div class="bar">
<span class="dot" style="background:#ff5f57"></span><span class="dot" style="background:#febc2e"></span>
<span class="dot" style="background:#28c840"></span> apps/flowstarter-main — provision-preview-host</div>
<pre><span class="cmd">$ npx tsx scripts/provision-preview-host.mjs</span>

${esc(dryRun)}</pre></div>`);

const seg10 = [];
const termServer = spawn('node', ['e2e/support/serve-static.mjs', RAW, '8980'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));

seg10.push(await clip(browser, '10a-provision', {}, async (page) => {
  await page.goto('http://127.0.0.1:8980/terminal.html', { waitUntil: 'domcontentloaded' });
  await pause(page, 4000);
  await slowScroll(page, 5, 200, 900);
  await pause(page, 4000);
}));
termServer.kill();

// The reap endpoint in GET form: what WOULD come down. Nothing is torn down.
seg10.push(await clip(browser, '10b-reap', { storageState: OP_STATE }, async (page) => {
  await page.goto(`${APP}/api/admin/hosting/previews/reap`, { waitUntil: 'domcontentloaded' });
  await pause(page, 6000);
  notes.reapBody = (await page.locator('body').innerText().catch(() => '')).slice(0, 300);
  console.log('  reap GET ->', notes.reapBody);
  await pause(page, 4000);
}));

try {
  concat(seg10.map((s) => join(VID, `${s.name}.webm`)), join(VID, '10-previews-hosting.webm'));
  results.push({ name: '10-previews-hosting',
    seconds: seg10.reduce((a, s) => a + s.seconds, 0),
    error: seg10.find((s) => s.error)?.error ?? null });
  console.log('  joined 10');
} catch (err) {
  console.error('  concat 10 failed:', err.message.split('\n')[0]);
}

await browser.close();

const after = await db(`workspaces?id=eq.${WS}&select=project_state,deposit_status,final_status`);
notes.finalWorkspace = after?.[0] ?? null;

writeManifest({
  notes,
  clips: Object.fromEntries(results.map((r) => [r.name, { seconds: r.seconds, error: r.error }])),
});
console.log('console done', JSON.stringify(notes, null, 2));
