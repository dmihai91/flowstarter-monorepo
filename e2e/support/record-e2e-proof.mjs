/**
 * One continuous take of the whole funnel against the local stack:
 * intake conversation → info agent → live preview generation → two free
 * changes → deposit through real Stripe test-mode Checkout → webhook
 * provisions the account and workspace → the paid full-site build → the
 * built site served locally.
 *
 * Nothing is stubbed on camera except Stripe's money (test mode) and the
 * client's inbox (the account is entered with a server-minted Clerk ticket,
 * the same session the emailed credentials would create). Chapter marks are
 * written to /tmp/fs-e2e-marks.json so the long waits can be time-lapsed.
 *
 *   APP_ORIGIN=http://localhost:3005 node e2e/support/record-e2e-proof.mjs
 */
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const BASE = process.env.APP_ORIGIN ?? 'http://localhost:3005';
const VIDEO_DIR = '/tmp/fs-e2e-video';
const MARKS_FILE = '/tmp/fs-e2e-marks.json';
const SUPABASE = 'http://127.0.0.1:54321';
// The local stack's well-known service key; the app's own is what the app uses.
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
// The Clerk keys live in the base .env; .env.local holds the rest.
const env = Object.fromEntries(
  ['apps/flowstarter-main/.env', 'apps/flowstarter-main/.env.local'].flatMap((file) =>
    readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => /^[A-Z]/.test(line))
      .map((line) => [line.split('=')[0], line.split('=').slice(1).join('=').trim().replace(/^"|"$/g, '')])
  )
);
const CLERK_SECRET_KEY = env.CLERK_SECRET_KEY;

const stamp = Date.now().toString(36);
const BRIEF = {
  fullName: 'Maria Ionescu',
  email: `maria.ionescu+clerk_test_${stamp}@example.com`,
  businessName: 'Ionescu Dental',
  description:
    'A boutique dental clinic in Cluj doing cosmetic work, mostly veneers and whitening. Calm, unhurried appointments for adults who avoided the dentist for years.',
  industry: 'Therapy & wellness',
  audience: 'Adults in Cluj who want a better smile and a calmer appointment.',
  goals: ['Take bookings or appointments', 'Build trust and credibility'],
  tones: ['Calm', 'Premium / elegant', 'Trustworthy'],
  timeline: 'Within 4 weeks',
  commerce: 'A few paid offers',
  integrations: 'A newsletter signup, and Google reviews on the home page.',
  agentAnswers: [
    'Most people come to me after years of avoiding the dentist. First visit is a 40-minute conversation with no treatment, then a plan they can say no to. I do veneers, whitening, bonding and check-ups.',
    'You can book online or call the front desk. We are on Strada Memorandumului in the centre of Cluj, open Monday to Friday and Saturday mornings.',
  ],
  // Content changes only: the preview's fast edit rewrites copy inside the
  // sections the template has, and refuses to invent or rename sections.
  // Each slot carries an alternate in case the model's reply is rejected.
  edits: [
    [
      'Make the hero headline mention Cluj and the calm first visit.',
      'Make the hero headline warmer and mention Cluj.',
    ],
    [
      "Change the main call-to-action button to say 'Book a calm first visit'.",
      'Mention in the intro paragraph that Saturday morning appointments are available.',
    ],
  ],
};

const browser = await chromium.launch({ args: ['--disable-features=site-per-process'] });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } },
});
const page = await context.newPage();
const startedAt = Date.now();
const marks = [];
const mark = (name) => {
  const at = Math.round((Date.now() - startedAt) / 1000);
  marks.push({ name, at });
  console.log(`[${at}s] ${name}`);
  writeFileSync(MARKS_FILE, JSON.stringify({ startedAt, marks }, null, 2));
};
const pause = (ms) => page.waitForTimeout(ms);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const composer = () => page.getByLabel('Your answer');
const say = async (text) => {
  await composer().click();
  await composer().pressSequentially(text, { delay: 28 });
  await pause(300);
  await composer().press('Enter');
};
const btn = (name) => page.getByRole('button', { name, exact: true }).first();
const tap = async (locator) => {
  await locator.hover();
  await pause(250);
  await locator.click();
};
const seen = async (text, timeout = 30000) => {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout });
  await pause(800);
};
const db = async (path) => {
  const response = await fetch(`${SUPABASE}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  return response.ok ? response.json() : [];
};

let failure = null;
let demoId = null;
let workspaceId = null;
let siteUrl = null;
try {
  // ── 1. Intake conversation ───────────────────────────────────────────────
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 120000 });
  await pause(1200);
  mark('landing');
  await tap(page.getByTestId('open-discovery').first());
  await seen('First things first');
  mark('intake');
  await say(BRIEF.fullName);
  await seen('Where should I send your preview');
  await say(BRIEF.email);
  await seen("what's the business called");
  await say(BRIEF.businessName);
  await seen('actually do');
  await say(BRIEF.description);
  await seen('Which of these is closest');
  await tap(btn(BRIEF.industry));
  await seen('Who are you trying to reach');
  await say(BRIEF.audience);
  await seen('Anything of yours I can look at');
  await tap(btn('Skip this one'));
  await seen('What should the site actually do for you');
  for (const goal of BRIEF.goals) await tap(btn(goal));
  await tap(btn("That's it"));
  await seen('come across');
  for (const tone of BRIEF.tones) await tap(btn(tone));
  await tap(btn("That's it"));
  await seen('Roughly how big a site');
  await pause(400);
  await page.keyboard.press('b');
  await seen('When would you like it live');
  await tap(btn(BRIEF.timeline));
  await seen('Will you be selling anything');
  await tap(btn(BRIEF.commerce));
  await seen('Cal.com');
  await tap(btn('Skip this one'));
  await seen('Anything else it has to plug into');
  await say(BRIEF.integrations);
  await seen("Here's the build package");
  await pause(1500);
  await tap(btn('Looks good, carry on'));
  await seen('One last decision: the monthly plan');
  await pause(800);
  await tap(page.getByRole('button', { name: /Pro\s*€/ }).first());
  await pause(500);
  await tap(btn('Looks good, carry on'));

  // ── 2. Info agent ────────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'Skip and show me the preview' }).waitFor({ timeout: 60000 });
  mark('info-agent');
  // The agent asks only about gaps the gate found, and fails open when the
  // model is unavailable, so "nothing to ask" is a legitimate outcome. Each
  // answer is typed only while the box is still there.
  for (const answer of BRIEF.agentAnswers) {
    const asked = await Promise.race([
      composer().waitFor({ state: 'visible', timeout: 90000 }).then(() => 'ask'),
      page.getByText(/Nothing to ask|Ready to build your preview/).first().waitFor({ timeout: 90000 }).then(() => 'done'),
    ]).catch(() => 'done');
    if (asked !== 'ask') break;
    await pause(1500);
    try {
      await composer().click();
      await composer().pressSequentially(answer, { delay: 28 });
      await pause(300);
      if (await composer().isVisible().catch(() => false)) await composer().press('Enter');
    } catch {
      break;
    }
    await pause(2500);
  }
  // Let a third question, if any, be answered by moving on: the preview is
  // what the visitor came for.
  await pause(6000);
  await tap(page.getByRole('button', { name: 'Continue' }).first());

  // ── 3. Generation ────────────────────────────────────────────────────────
  mark('generation-start');
  await page.getByText(/changes on me/).first().waitFor({ timeout: 22 * 60_000 });
  demoId = await page.evaluate(() => {
    const raw = sessionStorage.getItem('fs-discovery-demo-v1');
    try {
      return raw ? JSON.parse(raw).demoId ?? null : null;
    } catch {
      return null;
    }
  });
  mark('generation-ready');
  console.log('demoId', demoId);
  await pause(6000);

  // ── 4. Two free changes, then the deposit ask ────────────────────────────
  const editBox = page.getByLabel('Ask for a change');
  for (const [index, options] of BRIEF.edits.entries()) {
    const left = `${BRIEF.edits.length - index - 1}/${BRIEF.edits.length} changes left`;
    let landed = false;
    for (const edit of options) {
      await editBox.waitFor({ timeout: 60000 });
      await editBox.click();
      await editBox.pressSequentially(edit, { delay: 26 });
      await pause(400);
      const failuresBefore = await page.getByText(/That didn't work/).count();
      await tap(btn('Send'));
      mark(`edit-${index + 1}-sent`);
      // A rejected reply does not spend the change; the visitor just asks
      // again. The recorder does the same with the alternate prompt.
      const outcome = await Promise.race([
        page.getByText(left).waitFor({ timeout: 6 * 60_000 }).then(() => 'landed'),
        page
          .getByText(/That didn't work/)
          .nth(failuresBefore)
          .waitFor({ timeout: 6 * 60_000 })
          .then(() => 'failed'),
      ]).catch(() => 'timeout');
      if (outcome === 'landed') {
        landed = true;
        break;
      }
      mark(`edit-${index + 1}-rejected`);
      await pause(2500);
    }
    if (!landed) throw new Error(`change ${index + 1} never landed`);
    mark(`edit-${index + 1}-landed`);
    await pause(5000);
  }
  const reserve = page.getByRole('button', { name: /Reserve my full site/ }).last();
  await reserve.waitFor({ timeout: 120000 });
  await pause(2500);
  mark('deposit-ask');
  await tap(reserve);

  // ── 5. Stripe Checkout (test mode) ───────────────────────────────────────
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 60000 });
  mark('checkout');
  await pause(3000);
  const card = page.locator('#cardNumber');
  await card.waitFor({ timeout: 60000 });
  await card.pressSequentially('4242424242424242', { delay: 40 });
  await page.locator('#cardExpiry').pressSequentially('1234', { delay: 60 });
  await page.locator('#cardCvc').pressSequentially('123', { delay: 60 });
  const name = page.locator('#billingName');
  if (await name.isVisible().catch(() => false)) await name.pressSequentially(BRIEF.fullName, { delay: 40 });
  const country = page.locator('#billingCountry');
  if (await country.isVisible().catch(() => false)) await country.selectOption('RO').catch(() => {});
  const postal = page.locator('#billingPostalCode');
  if (await postal.isVisible().catch(() => false)) await postal.pressSequentially('400001', { delay: 40 });
  const link = page.locator('#enableStripePass');
  if (await link.isVisible().catch(() => false)) await link.uncheck().catch(() => {});
  await pause(1500);
  const submit = page.getByTestId('hosted-payment-submit-button').or(page.locator('.SubmitButton')).first();
  await tap(submit);
  mark('paid');
  await page.waitForURL(/\/welcome\//, { timeout: 120000 });
  // The live preview keeps its id in React state, not storage; the welcome
  // URL is where it becomes readable.
  demoId = page.url().match(/\/welcome\/([0-9a-f-]{36})/)?.[1] ?? demoId;
  mark('welcome');
  await pause(4000);

  // ── 6. Webhook lands: workspace, account, build job ──────────────────────
  for (let tries = 0; tries < 60 && !workspaceId; tries += 1) {
    const rows = await db(`workspaces?claimed_preview_id=eq.${demoId}&select=id,slug,project_state`);
    if (rows[0]) workspaceId = rows[0].id;
    else await sleep(3000);
  }
  if (!workspaceId) throw new Error('the webhook never provisioned a workspace');
  mark('workspace-provisioned');
  console.log('workspace', workspaceId);

  // The client's inbox is the one thing off camera: sign in with a Clerk
  // ticket for the account the webhook just created.
  // Clerk's list API lags a freshly created user by a few seconds.
  let users = [];
  for (let tries = 0; tries < 20 && users.length === 0; tries += 1) {
    users = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(BRIEF.email)}`,
      { headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` } }
    ).then((r) => r.json()).catch(() => []);
    if (!Array.isArray(users) || users.length === 0) {
      users = [];
      await sleep(3000);
    }
  }
  const userId = users[0]?.id;
  if (!userId) throw new Error('no Clerk user for the paying email');
  const ticket = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
    method: 'POST',
    headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, expires_in_seconds: 600 }),
  }).then((r) => r.json());
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.Clerk && window.Clerk.loaded, { timeout: 40000 });
  const signedIn = await page.evaluate(async (token) => {
    try {
      const si = await window.Clerk.client.signIn.create({ strategy: 'ticket', ticket: token });
      if (si.status !== 'complete') return { status: si.status };
      await window.Clerk.setActive({ session: si.createdSessionId });
      return { status: 'complete' };
    } catch (error) {
      return { error: String(error).slice(0, 200) };
    }
  }, ticket.token);
  if (signedIn.status !== 'complete') throw new Error(`sign-in: ${JSON.stringify(signedIn)}`);
  mark('signed-in');

  // ── 7. The build, watched from the client dashboard ──────────────────────
  await page.goto(`${BASE}/dashboard/projects/${workspaceId}`, { waitUntil: 'domcontentloaded' });
  await pause(4000);
  mark('dashboard');
  let job = null;
  for (let tries = 0; tries < 80; tries += 1) {
    const rows = await db(
      `flowstarter_agent_jobs?workspace_id=eq.${workspaceId}&order=created_at.desc&limit=1&select=status,payload,error_code,error_detail,attempt_count,max_attempts`
    );
    job = rows[0] ?? null;
    // A failed attempt with attempts left is still pending: the queue will
    // re-claim it. Only a success, or a failure with no attempts left, ends
    // the wait.
    const pending =
      !job ||
      job.status === 'queued' ||
      job.status === 'running' ||
      (job.status === 'failed' && (job.attempt_count ?? 0) < 3);
    if (!pending) break;
    await sleep(30000);
    await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await pause(2500);
  }
  console.log('job', JSON.stringify(job).slice(0, 300));
  if (!job || job.status !== 'succeeded') {
    throw new Error(`build job ${job?.status ?? 'missing'}: ${job?.error_code ?? ''} ${job?.error_detail ?? ''}`);
  }
  mark('build-succeeded');
  const ws = (await db(`workspaces?id=eq.${workspaceId}&select=deploy_status,project_state,slug`))[0];
  console.log('workspace after build', JSON.stringify(ws));
  await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  await pause(5000);

  // ── 8. The built site, served ────────────────────────────────────────────
  siteUrl = job.payload?.stagingUrl ?? null;
  if (!siteUrl) throw new Error('the job recorded no staging URL');
  await page.goto(siteUrl, { waitUntil: 'networkidle', timeout: 60000 });
  mark('site-live');
  await pause(2500);
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < Math.min(height, 7000); y += 420) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'smooth' }), y);
    await pause(550);
  }
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('nav a[href^="/"]'))
      .map((a) => a.getAttribute('href'))
      .filter((h) => h && h !== '/')
  );
  for (const href of links.slice(0, 2)) {
    await page.goto(new URL(href, siteUrl).toString(), { waitUntil: 'domcontentloaded' }).catch(() => {});
    await pause(2500);
    await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'smooth' }));
    await pause(1800);
  }
  await page.goto(siteUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await pause(3000);
  mark('end');
} catch (error) {
  failure = error;
  mark(`FAILED: ${String(error.message).split('\n')[0].slice(0, 200)}`);
  await page.screenshot({ path: '/tmp/fs-e2e-failure.png' }).catch(() => {});
}

const video = page.video();
await context.close();
const path = await video.path();
await browser.close();
writeFileSync(
  MARKS_FILE,
  JSON.stringify({ startedAt, marks, demoId, workspaceId, siteUrl, video: path, failed: failure ? String(failure.message) : null }, null, 2)
);
console.log(failure ? `FAILED: ${failure.message}` : 'OK');
console.log('video', path);
