/**
 * The paid half of the proof, as its own take: the client signs in to the
 * account the deposit webhook created, watches the full-site build from the
 * dashboard, and opens the built site once it is served.
 *
 *   APP_ORIGIN=http://localhost:3005 WORKSPACE_ID=<uuid> CLIENT_EMAIL=<email> \
 *     node e2e/support/record-e2e-proof-part2.mjs
 */
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { loadEnv, requireServiceRoleKey } from './local-env.mjs';

const BASE = process.env.APP_ORIGIN ?? 'http://localhost:3005';
const WORKSPACE_ID = process.env.WORKSPACE_ID;
const CLIENT_EMAIL = process.env.CLIENT_EMAIL;
if (!WORKSPACE_ID || !CLIENT_EMAIL) throw new Error('WORKSPACE_ID and CLIENT_EMAIL are required');
const VIDEO_DIR = '/tmp/fs-e2e-video-2';
const MARKS_FILE = '/tmp/fs-e2e-marks-2.json';
const SUPABASE = 'http://127.0.0.1:54321';
const SUPABASE_KEY = requireServiceRoleKey();
// The Clerk keys live in the base .env; .env.local holds the rest.
const env = loadEnv();
const CLERK_SECRET_KEY = env.CLERK_SECRET_KEY;

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
const db = async (path) => {
  const response = await fetch(`${SUPABASE}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  return response.ok ? response.json() : [];
};

let failure = null;
let siteUrl = null;
try {
  // Clerk's list API lags a freshly created user by a few seconds.
  let users = [];
  for (let tries = 0; tries < 20 && users.length === 0; tries += 1) {
    users = await fetch(
      `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(CLIENT_EMAIL)}`,
      { headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` } }
    ).then((r) => r.json()).catch(() => []);
    if (!Array.isArray(users) || users.length === 0) {
      users = [];
      await sleep(3000);
    }
  }
  const userId = users[0]?.id;
  if (!userId) throw new Error(`no Clerk user for ${CLIENT_EMAIL}`);
  const ticket = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
    method: 'POST',
    headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, expires_in_seconds: 600 }),
  }).then((r) => r.json());
  await page.goto(`${BASE}/welcome/${process.env.DEMO_ID ?? '00000000-0000-4000-8000-000000000000'}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await pause(2500);
  mark('welcome');
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

  await page.goto(`${BASE}/dashboard/projects/${WORKSPACE_ID}`, { waitUntil: 'domcontentloaded' });
  await pause(4000);
  mark('dashboard');
  let job = null;
  for (let tries = 0; tries < 90; tries += 1) {
    const rows = await db(
      `flowstarter_agent_jobs?workspace_id=eq.${WORKSPACE_ID}&order=created_at.desc&limit=1&select=status,payload,error_code,error_detail,attempt_count,max_attempts`
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
  console.log('job', JSON.stringify(job).slice(0, 400));
  if (!job || job.status !== 'succeeded') {
    throw new Error(`build job ${job?.status ?? 'missing'}: ${job?.error_code ?? ''} ${job?.error_detail ?? ''}`);
  }
  mark('build-succeeded');
  const ws = (await db(`workspaces?id=eq.${WORKSPACE_ID}&select=deploy_status,project_state,slug`))[0];
  console.log('workspace after build', JSON.stringify(ws));
  await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
  await pause(5000);

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
  await page.screenshot({ path: '/tmp/fs-e2e-failure-2.png' }).catch(() => {});
}
const video = page.video();
await context.close();
const path = await video.path();
await browser.close();
writeFileSync(MARKS_FILE, JSON.stringify({ startedAt, marks, siteUrl, video: path, failed: failure ? String(failure.message) : null }, null, 2));
console.log(failure ? `FAILED: ${failure.message}` : 'OK');
console.log('video', path);
