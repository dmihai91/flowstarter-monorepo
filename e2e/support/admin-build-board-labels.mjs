// Screenshot proof for the plain-word pass over the build board: the failed
// card's error label, the side panel's new Full log tab, and the timeline's
// plain event labels.
//
//   node e2e/support/admin-build-board-labels.mjs
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const APP = process.env.APP_ORIGIN ?? 'http://localhost:3005';
const WORKSPACE_ID =
  process.env.WORKSPACE_ID ?? '1b2666b2-7c87-4573-a685-3a076de65ada';
const OUT_ERROR = process.env.OUT_ERROR ?? '/tmp/fs-board-4.png';
const OUT_LOG = process.env.OUT_LOG ?? '/tmp/fs-board-5.png';
const OUT_TIMELINE = process.env.OUT_TIMELINE ?? '/tmp/fs-board-6.png';

const operator = JSON.parse(readFileSync('/tmp/fs-operator.json', 'utf8'));
const env = Object.fromEntries(
  ['apps/flowstarter-main/.env', 'apps/flowstarter-main/.env.local'].flatMap(
    (file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .filter((l) => /^[A-Z]/.test(l))
        .map((l) => [
          l.split('=')[0],
          l.split('=').slice(1).join('=').trim().replace(/^"|"$/g, ''),
        ])
  )
);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

const res = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${env.CLERK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ user_id: operator.id, expires_in_seconds: 600 }),
});
const ticket = (await res.json()).token;
await page.goto(`${APP}/admin/login`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.Clerk && window.Clerk.loaded, {
  timeout: 60000,
});
const signedIn = await page.evaluate(async (t) => {
  const si = await window.Clerk.client.signIn.create({
    strategy: 'ticket',
    ticket: t,
  });
  if (si.status !== 'complete') return si.status;
  await window.Clerk.setActive({ session: si.createdSessionId });
  return 'complete';
}, ticket);
if (signedIn !== 'complete') throw new Error(`sign-in: ${signedIn}`);
await page.waitForTimeout(1500);

await page.goto(`${APP}/admin/dashboard/projects/${WORKSPACE_ID}`, {
  waitUntil: 'networkidle',
  timeout: 90000,
});
await page.getByRole('tab', { name: 'Pipeline' }).click();
const board = page.getByTestId('build-board');
await board.waitFor({ timeout: 60000 });
await page.waitForTimeout(1500);

// ─── The board, with a plain-English error label on the failed card ───────
await board.evaluate((el) => el.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(500);
await page.screenshot({ path: OUT_ERROR, fullPage: false });

const cards = page.getByTestId('build-card');
const cardTexts = (await cards.allTextContents()).map((t) =>
  t.replace(/\s+/g, ' ').trim()
);
console.log(JSON.stringify({ cards: cardTexts }, null, 1));

// ─── The panel's Full log tab, for the finished Full site build card ──────
const buildCard = page.getByTestId('build-card').filter({
  hasText: 'Full site build',
});
await buildCard.first().click();
await page.getByTestId('build-conversation').waitFor({ timeout: 30000 });
await page.getByRole('tab', { name: 'Full log' }).click();
const log = page.getByTestId('build-log');
await log.waitFor({ timeout: 30000 });
await page.waitForTimeout(1500);
const logText = (await log.textContent())?.replace(/\s+/g, ' ').trim();
console.log(JSON.stringify({ logTabText: logText }, null, 1));
await page.screenshot({ path: OUT_LOG, fullPage: false });
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

// ─── The timeline, with plain event labels ─────────────────────────────────
// Scroll past the heading into the list itself: the interesting variety
// (Stripe, a system writer, a money summary) is further down than the first
// few client-edit rows.
await page
  .getByText('Timeline', { exact: true })
  .scrollIntoViewIfNeeded({ timeout: 30000 });
await page.mouse.wheel(0, 900);
await page.waitForTimeout(500);
await page.screenshot({ path: OUT_TIMELINE, fullPage: false });

await browser.close();
console.log(`wrote ${OUT_ERROR}, ${OUT_LOG}, ${OUT_TIMELINE}`);
