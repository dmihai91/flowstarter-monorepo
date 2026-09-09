// Drives the admin board's build conversation for one project: signs in as
// the operator, opens the Pipeline tab, optionally sends a note, and
// screenshots. Used for the proof of the "talk to the agents" channel.
//
//   WORKSPACE_ID=… NOTE="…" OUT=/tmp/x.png node e2e/support/admin-build-conversation.mjs
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const APP = process.env.APP_ORIGIN ?? 'http://localhost:3005';
const WORKSPACE_ID = process.env.WORKSPACE_ID;
const NOTE = process.env.NOTE ?? '';
const OUT = process.env.OUT ?? '/tmp/fs-admin-build.png';
const operator = JSON.parse(readFileSync('/tmp/fs-operator.json', 'utf8'));
const env = Object.fromEntries(
  ['apps/flowstarter-main/.env', 'apps/flowstarter-main/.env.local'].flatMap((file) =>
    readFileSync(file, 'utf8').split('\n').filter((l) => /^[A-Z]/.test(l))
      .map((l) => [l.split('=')[0], l.split('=').slice(1).join('=').trim().replace(/^"|"$/g, '')])
  )
);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const res = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
  method: 'POST',
  headers: { Authorization: `Bearer ${env.CLERK_SECRET_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_id: operator.id, expires_in_seconds: 600 }),
});
const ticket = (await res.json()).token;
await page.goto(`${APP}/admin/login`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.Clerk && window.Clerk.loaded, { timeout: 60000 });
const out = await page.evaluate(async (t) => {
  const si = await window.Clerk.client.signIn.create({ strategy: 'ticket', ticket: t });
  if (si.status !== 'complete') return si.status;
  await window.Clerk.setActive({ session: si.createdSessionId });
  return 'complete';
}, ticket);
if (out !== 'complete') throw new Error(`sign-in: ${out}`);
await page.waitForTimeout(1500);

await page.goto(`${APP}/admin/dashboard/projects/${WORKSPACE_ID}`, { waitUntil: 'networkidle', timeout: 90000 });
await page.getByRole('tab', { name: 'Pipeline' }).click();
const convo = page.getByTestId('build-conversation').first();
await convo.waitFor({ timeout: 60000 });
await page.waitForTimeout(2500);

if (NOTE) {
  const box = convo.getByLabel('Note to the build agents');
  await box.click();
  await box.pressSequentially(NOTE, { delay: 12 });
  await convo.getByRole('button', { name: 'Send to the agents' }).click();
  await page.getByText(/Saved\./).first().waitFor({ timeout: 20000 });
  await page.waitForTimeout(1500);
}
await convo.scrollIntoViewIfNeeded();
const lines = await convo.locator('[role="log"] li').allTextContents();
console.log(JSON.stringify({ lines: lines.map((l) => l.slice(0, 120)) }, null, 1));
await page.screenshot({ path: OUT, fullPage: false });
await browser.close();
