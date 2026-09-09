// Screenshot proof for the operator build board: signs in as the operator,
// opens a project's Pipeline tab, shoots the kanban, opens one card's
// conversation panel and shoots that, then shoots the cross-project pipeline
// board.
//
//   WORKSPACE_ID=… node e2e/support/admin-build-board.mjs
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const APP = process.env.APP_ORIGIN ?? 'http://localhost:3005';
// A workspace with one finished full site build and one finished client edit.
const WORKSPACE_ID =
  process.env.WORKSPACE_ID ?? '1b2666b2-7c87-4573-a685-3a076de65ada';
const OUT_BOARD = process.env.OUT_BOARD ?? '/tmp/fs-board-1.png';
const OUT_PANEL = process.env.OUT_PANEL ?? '/tmp/fs-board-2.png';
const OUT_PIPELINE = process.env.OUT_PIPELINE ?? '/tmp/fs-board-3.png';

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

// ─── The build board ────────────────────────────────────────────────────────
await page.goto(`${APP}/admin/dashboard/projects/${WORKSPACE_ID}`, {
  waitUntil: 'networkidle',
  timeout: 90000,
});
await page.getByRole('tab', { name: 'Pipeline' }).click();
const board = page.getByTestId('build-board');
await board.waitFor({ timeout: 60000 });
await page.waitForTimeout(1500);

const cards = page.getByTestId('build-card');
const cardCount = await cards.count();
console.log(
  JSON.stringify(
    {
      cards: cardCount,
      text: (await cards.allTextContents()).map((t) =>
        t.replace(/\s+/g, ' ').slice(0, 160)
      ),
    },
    null,
    1
  )
);

// Centre the board rather than merely revealing its top edge: the columns
// are the proof, and half of them would otherwise sit below the fold.
await board.evaluate((el) => el.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(500);
await page.screenshot({ path: OUT_BOARD, fullPage: false });

// ─── The conversation panel ─────────────────────────────────────────────────
await cards.first().getByRole('button', { name: 'Talk to the agents' }).click();
const convo = page.getByTestId('build-conversation');
await convo.waitFor({ timeout: 30000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: OUT_PANEL, fullPage: false });
await page.keyboard.press('Escape');

// ─── The cross-project pipeline board ───────────────────────────────────────
// domcontentloaded, not networkidle: the board polls itself on a timer, so
// the network never goes quiet for long enough to be a signal.
await page.goto(`${APP}/admin/dashboard/pipeline`, {
  waitUntil: 'domcontentloaded',
  timeout: 90000,
});
// The route compiles on first hit in dev; wait for a real card, not the
// skeletons.
await page
  .locator('a[href^="/admin/dashboard/projects/"]')
  .first()
  .waitFor({ timeout: 90000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: OUT_PIPELINE, fullPage: false });

await browser.close();
console.log(`wrote ${OUT_BOARD}, ${OUT_PANEL}, ${OUT_PIPELINE}`);
