/**
 * Clip 08, re-shot — the operator turns the care plan on, and the client's
 * editor runs.
 *
 * The previous take filmed a refusal: the editor loaded the client's real site
 * and would not run a single control, because the policy wants an active care
 * plan and the workspace had no monthly price on it — which also left the
 * operator's own "Activate subscription" button disabled. Both halves of that
 * are addressed at HEAD, and this take films the whole chain instead.
 *
 * It is filmed on two workspaces, and the reason is not cosmetic:
 *
 *   · `3ddbb135` is the one the client claimed minutes ago with the Pro care
 *     plan. Its Billing tab now reads €99/mo — the server maps the plan name
 *     to the fee; the browser never sends a price. That is the fix, on screen.
 *     Its activation is then attempted and refused, and the refusal is filmed
 *     verbatim: the deposit on that workspace never registered, because the
 *     durable `funnel_previews` row for the preview it claimed carries the
 *     site's files but no intake (`publishFunnelPreview` upserts the row
 *     without it), so `getClaimablePreview` returned nothing, the workspace
 *     stayed in INTAKE, and `payment_intent.succeeded` could not start a build
 *     from there. A workspace with no site is one the editor has nothing to
 *     open, and no amount of billing changes that.
 *
 *   · `4d543e0b` is the project the funnel run actually built and paid for in
 *     full — the same one the client is looking at in clip 06. It was claimed
 *     before the plan mapping existed, so its monthly fee is €0 and the
 *     operator sets it in the console's own Overview field. Then the
 *     subscription activates against test-mode Stripe, and the client's editor
 *     on that workspace is the one that runs.
 *
 * Nothing is written to the database by hand. The fee is typed into the
 * operator's own form, the subscription is created by Stripe, and the edit is
 * whatever the model actually returns.
 *
 *   node e2e/support/record-clip08-retake.mjs
 */
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  APP, VID, ensureDirs, pause, clip, concat, ffmpegOk, writeManifest, db,
} from './showcase-lib.mjs';

ensureDirs();
const CLAIMED = readFileSync('/tmp/retake-workspace.txt', 'utf8').trim();
const BUILT = '4d543e0b-882b-4a53-9f51-444df9793db7';
const OP_STATE = '/tmp/retake-operator-state.json';
const CLIENT_STATE = '/tmp/retake-client-state.json';
/** The Pro care plan's own price, which is what the claim already put on the
 *  newer workspace — typed here because this one predates that mapping. */
const PRO_MONTHLY = '99';

const notes = {};
const browser = await chromium.launch();
const parts = [];

// ── 08a — the operator ──────────────────────────────────────────────────────
const opSeg = await clip(browser, '08a-operator', { storageState: OP_STATE },
  async (page) => {
    // The workspace the client claimed with the Pro plan, minutes ago.
    await page.goto(`${APP}/admin/dashboard/projects/${CLAIMED}`,
      { waitUntil: 'domcontentloaded' });
    await page.locator('h1').first().waitFor({ state: 'visible', timeout: 40000 });
    await pause(page, 1500);
    await page.getByRole('tab', { name: 'Billing' }).click();
    await pause(page, 4500);
    notes.claimedMonthly = (await page.locator('body').innerText())
      .replace(/\n+/g, ' | ').match(/MONTHLY AMOUNT \| €[\d,]+\/mo/)?.[0] ?? null;
    console.log('  claimed workspace billing:', notes.claimedMonthly);

    // And what happens when it is activated: the endpoint's own words.
    await page.getByRole('button', { name: /Activate subscription/ }).click();
    const toast = page.locator('[data-sonner-toast], [role="status"]').first();
    await toast.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
    notes.claimedActivation = (await toast.innerText().catch(() => ''))
      .replace(/\n+/g, ' ').slice(0, 240);
    console.log('  activation refused:', notes.claimedActivation);
    await pause(page, 5500);

    // The project that was built and paid for in full. Its fee predates the
    // plan mapping, so the operator sets it where operators set prices.
    await page.goto(`${APP}/admin/dashboard/projects/${BUILT}`,
      { waitUntil: 'domcontentloaded' });
    await page.locator('h1').first().waitFor({ state: 'visible', timeout: 40000 });
    await pause(page, 2500);

    const fee = page.locator('#monthly-fee');
    await fee.waitFor({ state: 'visible', timeout: 20000 });
    await fee.scrollIntoViewIfNeeded();
    await fee.click();
    await fee.fill('');
    await fee.type(PRO_MONTHLY, { delay: 260 });
    await pause(page, 1500);
    await page.getByRole('button', { name: /^Save/ }).first().click();
    await pause(page, 4000);

    await page.getByRole('tab', { name: 'Billing' }).click();
    await pause(page, 3000);
    const activate = page.getByRole('button', { name: /Activate subscription/ });
    await activate.scrollIntoViewIfNeeded();
    notes.builtActivateEnabled = await activate.isEnabled();
    console.log('  activate enabled on the built project:', notes.builtActivateEnabled);
    await pause(page, 2000);
    await activate.click();

    // Stripe is the slow part; the pill and the subscription id are the proof.
    await page.waitForFunction(
      () => /SUBSCRIPTION ID\s*\n?\s*sub_/i.test(document.body.innerText),
      null, { timeout: 60000 }
    ).catch(() => {});
    await pause(page, 3500);
    notes.builtBilling = (await page.locator('body').innerText())
      .replace(/\n+/g, ' | ').slice(0, 900);
    await pause(page, 3000);
  });
parts.push(opSeg);

// The state Stripe and the app agreed on, read back rather than believed.
const [row] = await db(
  `workspaces?id=eq.${BUILT}&select=monthly_fee,billing_interval,subscription_status,stripe_subscription_id,subscription_trial_ends`
);
notes.subscription = row;
console.log('  subscription row:', JSON.stringify(row));

// ── 08b — the client's editor ───────────────────────────────────────────────
const edSeg = await clip(browser, '08b-editor', { storageState: CLIENT_STATE },
  async (page) => {
    await page.goto(`${APP}/dashboard/projects/${BUILT}/editor`,
      { waitUntil: 'domcontentloaded' });
    await page.locator('[data-testid="editor-target-select"]')
      .waitFor({ state: 'visible', timeout: 60000 });
    await page.locator('[data-testid="site-preview-frame"]')
      .waitFor({ state: 'visible', timeout: 40000 }).catch(() => {});
    await pause(page, 3500);

    // The policy notice is absent, and that is the point: it only renders when
    // the policy refuses. With the plan on, the client owns their own words.
    notes.policyNoticeVisible = await page
      .locator('[data-testid="editor-policy-notice"]').isVisible().catch(() => false);

    const select = page.locator('[data-testid="editor-target-select"]');
    const options = await select.locator('option').evaluateAll((os) =>
      os.map((o) => ({ value: o.value, label: (o.textContent || '').trim() }))
        .filter((o) => o.value));
    notes.targets = options.length;
    console.log('  editable targets:', options.length);

    // A sentence long enough to be worth rewriting and short enough to read.
    const pick = options.find((o) => o.label.length > 60 && o.label.length < 150)
      ?? options[0];
    await select.selectOption(pick.value);
    await pause(page, 2500);
    notes.targetKey = pick.label.slice(0, 80);
    notes.before = (await page.locator('[data-testid="editor-current-text"]')
      .innerText().catch(() => '')).slice(0, 200);
    console.log('  target:', notes.targetKey);

    const instruction = page.locator('[data-testid="editor-instruction"]');
    await instruction.click();
    await instruction.type('Warmer, and say the first phone call is free.', { delay: 26 });
    await pause(page, 1200);

    await page.locator('[data-testid="editor-propose"]').click();
    const proposal = page.locator('[data-testid="editor-proposal"]');
    await proposal.waitFor({ state: 'visible', timeout: 120000 }).catch(() => {});
    notes.proposal = (await proposal.innerText().catch(() => ''))
      .replace(/\n+/g, ' | ').slice(0, 300);
    notes.editorError = await page.locator('[data-testid="editor-error"]')
      .innerText().catch(() => null);
    console.log('  proposal:', notes.proposal.slice(0, 140));
    if (notes.editorError) console.log('  editor error:', notes.editorError);
    await pause(page, 6000);

    // Applied — a new version of the site, not an overwrite of the old one.
    await page.locator('[data-testid="editor-apply"]').click();
    await pause(page, 6000);

    await page.locator('[data-testid="editor-tab-history"]').click();
    await pause(page, 3000);
    const versions = page.locator('[data-testid="editor-version"]');
    notes.versions = await versions.count();
    console.log('  versions:', notes.versions);
    await pause(page, 2500);

    // And put back, which is the whole reason a version was written first.
    const revert = page.locator('[data-testid="editor-revert"]').first();
    if (await revert.isVisible().catch(() => false)) {
      await revert.click();
      await pause(page, 6000);
      notes.reverted = true;
      notes.versionsAfterRevert = await versions.count();
    } else {
      notes.reverted = false;
    }
    await pause(page, 3000);
  });
parts.push(edSeg);

await browser.close();

/**
 * The structural boundary, exercised rather than described. The editor offers
 * a client no structural control at all — the list holds text, the Pictures
 * tab holds slots — so this is checked where it is actually enforced: the same
 * route the editor posts to, with a stylesheet target, from the client's own
 * session. Whatever it answers is what the caption says.
 */
{
  const b = await chromium.launch();
  const ctx = await b.newContext({ storageState: CLIENT_STATE });
  const page = await ctx.newPage();
  await page.goto(`${APP}/dashboard/projects/${BUILT}/editor`, { waitUntil: 'domcontentloaded' });
  notes.structuralRefusal = await page.evaluate(async (ws) => {
    const res = await fetch(`/api/client/site/${ws}/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetId: 'src/styles/global.css#12',
        instruction: 'Make the buttons green.',
      }),
    });
    return { status: res.status, body: (await res.text()).slice(0, 300) };
  }, BUILT);
  console.log('  structural target ->', JSON.stringify(notes.structuralRefusal));
  await ctx.close();
  await b.close();
}

const seconds = parts.reduce((n, p) => n + p.seconds, 0);
if (ffmpegOk()) {
  concat(parts.map((p) => join(VID, `${p.name}.webm`)), join(VID, '08-editor.webm'));
  console.log(`joined 08-editor.webm (${seconds}s of footage)`);
} else {
  console.error('ffmpeg missing — segments left unjoined');
}

writeManifest({
  notes: { editor: notes },
  clips: { '08-editor': { seconds, error: parts.find((p) => p.error)?.error ?? null } },
});
console.log('clip 08 done', JSON.stringify(notes, null, 2));
