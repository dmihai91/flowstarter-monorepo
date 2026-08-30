/**
 * Clip 06, re-shot — the client's own project page, working.
 *
 * The previous take of this clip filmed a 500. `dashboard/projects/[workspaceId]`
 * called `messagesFromPayload()` — a client module — from a server component,
 * and Next refused to render the page at all. That is fixed at HEAD, so this
 * take films what a client actually meets: the state stepper, the open asks,
 * the thread with the operator's clarification already in it, a reply going
 * out, a photograph going up, the rights confirmation, and the readiness the
 * server recomputes afterwards.
 *
 * Nothing here is staged. The workspace is the one the funnel run created and
 * paid for; the asks and the clarification are the rows the operator already
 * wrote; the readiness line at the end is the server's own answer, rendered
 * verbatim, including what is still missing.
 *
 * The one thing done off camera is granting this fresh client account access
 * to that workspace — a `workspace_memberships` row, the same row the claim
 * writes, inserted with the service role because the account that claimed it
 * was deleted at the end of the previous run.
 *
 *   node e2e/support/record-clip06-retake.mjs
 */
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import {
  APP, ensureDirs, pause, clip, writeManifest, signInAsClient, db,
} from './showcase-lib.mjs';
import { USERS_FILE } from './retake-users.mjs';

ensureDirs();
const U = JSON.parse(readFileSync(USERS_FILE, 'utf8'));
const WS = '4d543e0b-882b-4a53-9f51-444df9793db7';
const STATE = '/tmp/retake-client-state.json';
/**
 * A calm interior, 1200x800, from the template library's own photo set. It
 * satisfies the section-photo floor (800px) and shows no one's face, which is
 * the rule for anything that goes into a filmed clip.
 */
const PHOTO = 'apps/flowstarter-library/shared-images/services-2.jpg';

const notes = {};
const browser = await chromium.launch();

// ── Off camera: this account's session ──────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await signInAsClient(page, U.client);
  await ctx.storageState({ path: STATE });
  await ctx.close();
  console.log('client session ready');
}

const res = await clip(browser, '06-client-dashboard', { storageState: STATE },
  async (page) => {
    await page.goto(`${APP}/dashboard/projects/${WS}`, { waitUntil: 'domcontentloaded' });

    // The page renders at all — which is the thing the last take could not show.
    await page.getByRole('heading', { level: 1 })
      .waitFor({ state: 'visible', timeout: 40000 });
    await pause(page, 2500);

    const stages = page.locator('[data-testid="project-stage"]');
    notes.stages = await stages.allInnerTexts()
      .then((t) => t.map((s) => s.replace(/\n+/g, ' ').trim()));
    notes.currentStage = await page.locator('[data-testid="project-stage-title"]')
      .innerText().catch(() => '');
    console.log('  stage:', notes.currentStage);
    await pause(page, 3500);

    // The asks the operator raised, each with its own way to answer it.
    const asks = page.locator('[data-testid="open-ask"]');
    await asks.first().waitFor({ state: 'visible', timeout: 20000 });
    notes.openAsks = await asks.count();
    console.log('  open asks:', notes.openAsks);
    await asks.first().scrollIntoViewIfNeeded();
    await pause(page, 4000);
    await page.evaluate(() => window.scrollBy(0, 320));
    await pause(page, 3000);

    // The thread, including the clarification the operator sent.
    const messages = page.locator('[data-testid="project-message"]');
    await messages.last().scrollIntoViewIfNeeded();
    notes.messages = await messages.count();
    notes.lastFromUs = (await messages.last().innerText().catch(() => ''))
      .replace(/\n+/g, ' | ').slice(0, 200);
    console.log('  messages:', notes.messages, '·', notes.lastFromUs.slice(0, 80));
    await pause(page, 5000);

    // A reply, typed and sent, and read back out of the thread it lands in.
    const reply = page.locator(`#reply-${WS}`);
    await reply.scrollIntoViewIfNeeded();
    await reply.click();
    await reply.type(
      'Thanks — the logo is with our printer, I will send it Monday. ' +
      'Here is a photo of the therapy room in the meantime.',
      { delay: 22 }
    );
    await pause(page, 1500);
    const before = await messages.count();
    await page.getByRole('button', { name: 'Send reply' }).click();
    await page.waitForFunction(
      (n) => document.querySelectorAll('[data-testid="project-message"]').length > n,
      before, { timeout: 30000 }
    );
    notes.replyLanded = true;
    await messages.last().scrollIntoViewIfNeeded();
    await pause(page, 4000);

    // The photo answers a specific ask, so it is uploaded through that ask's
    // own control rather than a generic one.
    const sectionAsk = page.locator('[data-testid="open-ask"]')
      .filter({ hasText: 'Two more photos' }).first();
    await sectionAsk.scrollIntoViewIfNeeded();
    await pause(page, 2000);
    await sectionAsk.locator('input[type="file"]').setInputFiles(PHOTO);
    await sectionAsk.locator('[data-testid="asset-thumbnail"]').first()
      .waitFor({ state: 'visible', timeout: 40000 });
    notes.uploaded = PHOTO;
    await pause(page, 3000);

    // Nothing goes on the site until the client says they own the picture.
    await sectionAsk.locator('[data-testid="rights-checkbox"]').check();
    await pause(page, 2500);
    await sectionAsk.locator('[data-testid="confirm-rights"]').click();
    await sectionAsk.locator('[data-testid="asset-uploader-done"]')
      .waitFor({ state: 'visible', timeout: 40000 });
    await pause(page, 2000);

    // And the server's own answer to "am I done?", verbatim.
    const remaining = page.locator('[data-testid="open-asks-remaining"]');
    await remaining.waitFor({ state: 'visible', timeout: 30000 });
    await remaining.scrollIntoViewIfNeeded();
    notes.remaining = (await remaining.innerText()).replace(/\n+/g, ' | ');
    console.log('  still outstanding:', notes.remaining.slice(0, 200));
    await pause(page, 6000);
  });

await browser.close();

// What the server actually stored, read back rather than assumed.
notes.assetsStored = (await db(
  `assets?workspace_id=eq.${WS}&select=id,usable_for,width,height`
).catch(() => null))?.length ?? null;
notes.messagesStored = (await db(
  `project_messages?workspace_id=eq.${WS}&select=id,direction,kind`
).catch(() => null))?.length ?? null;

writeManifest({
  notes: { clientDashboard: notes },
  clips: { '06-client-dashboard': { seconds: res.seconds, error: res.error } },
});
console.log('clip 06 done', JSON.stringify(notes, null, 2));
