/**
 * Records the visitor half of the flow: clips 01 through 05.
 *
 * Clips 03, 04 and 05 are ONE continuous take, cut into chapters afterwards.
 * That is not a stylistic choice — the generated preview lives in React state
 * on the wizard page, and opening a second tab would start a second three to
 * six minute generation rather than resume the one already on screen. So the
 * page stays alive across generation, the prompt edit and the claim, and the
 * boundaries are timestamps recorded as the run happens.
 *
 * Clips 01 and 02 are separate takes. The wizard autosaves its draft to
 * sessionStorage and restores it on mount, so resuming mid-wizard is the app's
 * own behaviour, not a harness trick.
 *
 *   node e2e/support/record-funnel.mjs
 */
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  OUT, VID, RAW, APP, DESKTOP, MOBILE, ensureDirs, users, pause, slowScroll,
  clip, cut, concat, ffmpegOk, writeManifest, signInAsClient, db,
} from './showcase-lib.mjs';

ensureDirs();
const U = users();

// ── The brief ───────────────────────────────────────────────────────────────
// Marsh & Fern from e2e/support/briefs.mjs. The description typed into the
// wizard is deliberately the short version a real person types — under the
// gate's 200-character floor — so the info step has genuine gaps to show
// rather than a pre-satisfied checklist. The long answers below are what the
// visitor says when the agent asks.
const BRIEF = {
  fullName: 'Ellen Marsh',
  email: 'hello@marshandfern.example',
  businessName: 'Marsh & Fern Counselling',
  short: 'I am a counsellor in Bristol. I see adults one to one, in person and online.',
  industry: 'Therapy & wellness',
  audience: 'Adults working through anxiety, burnout and life transitions',
  goal: 'Take bookings or appointments',
  tone: 'Calm',
  answers: [
    'I work with adults one to one, in person in Bristol and online. Most people come to me after months of holding it together. Sessions are 50 minutes, weekly to start, and my approach is trauma-informed and paced by the client.',
    'I offer individual therapy, a free 20-minute intro call, and online sessions. You can reach me on hello@marshandfern.example or book the intro call from the site.',
  ],
};

const DRAFT_KEY = 'fs-discovery-draft-v1';
const DEMO_KEY = 'fs-discovery-demo-v1';

// Without site-per-process disabled, Chromium hosts the cross-origin preview
// iframe (the local astro dev server on its own port) in a separate renderer
// process, and Playwright's screencast records that frame as blank white.
const browser = await chromium.launch({ args: ['--disable-features=site-per-process'] });
const results = [];
const marks = {};
const mark = (t0, label) => { marks[label] = Math.round((Date.now() - t0) / 1000); };

/**
 * ChoiceGrid tiles expose no accessible name that `getByRole` can resolve
 * (verified against the running page: name-based lookups return zero matches),
 * so they are addressed by the sub-label text they actually render.
 */
const choice = (d, text) => d.locator('button').filter({ hasText: text }).first();

/** Fills wizard steps 1 to 6 and leaves the dialog on the info step. */
async function fillWizard(page, d) {
  // 1 — about
  await d.getByPlaceholder('Maria Ionescu').fill(BRIEF.fullName);
  await pause(page, 500);
  await d.getByPlaceholder('maria@example.com').fill(BRIEF.email);
  await pause(page, 400);
  await d.getByPlaceholder('Smile Dental Clinic').fill(BRIEF.businessName);
  await pause(page, 900);
  await d.getByRole('button', { name: 'Continue' }).click();

  // 2 — what the business does
  await pause(page, 700);
  await d.getByPlaceholder(/^e\.g\. Boutique dental clinic/).fill(BRIEF.short);
  await pause(page, 600);
  await d.getByLabel('Industry').selectOption(BRIEF.industry).catch(() => {});
  await pause(page, 500);
  await d.getByPlaceholder('Who your ideal customers are, in plain words')
    .fill(BRIEF.audience).catch(() => {});
  await pause(page, 900);
  await d.getByRole('button', { name: 'Continue' }).click();

  // 3 — goals and tone
  await pause(page, 700);
  await d.getByRole('button', { name: BRIEF.goal, exact: true }).click().catch(() => {});
  await pause(page, 500);
  await d.getByRole('button', { name: BRIEF.tone, exact: true }).click().catch(() => {});
  await pause(page, 500);
  await choice(d, 'Standard service site').click().catch(() => {});
  await pause(page, 400);
  await choice(d, 'Within 4 weeks').click().catch(() => {});
  await pause(page, 900);
  await d.getByRole('button', { name: 'Continue' }).click();

  // 4 — commerce
  await pause(page, 700);
  await choice(d, 'Brand presence + lead capture only').click();
  await pause(page, 1100);
  await d.getByRole('button', { name: 'Continue' }).click();

  // 5 — the recommendation. Rules first, then the server refines it.
  await pause(page, 700);
  await d.getByRole('heading', { level: 3, name: 'Your recommended plan' })
    .waitFor({ state: 'visible', timeout: 30000 });
  await pause(page, 5200);          // long enough to read the reasons
  await d.getByRole('button', { name: 'Continue' }).click();

  // 6 — care plan
  await pause(page, 900);
  await choice(d, 'Guided editor access').click().catch(() => {});
  await pause(page, 1400);
  await d.getByRole('button', { name: 'Continue' }).click();
  await pause(page, 1200);
}

// ── 01 — landing to the recommendation ──────────────────────────────────────
console.log('01-intake');
let draft = null;
results.push(await clip(browser, '01-intake', {}, async (page) => {
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await pause(page, 2600);
  await slowScroll(page, 4, 420, 420);
  await page.evaluate(() => window.scrollTo(0, 0));
  await pause(page, 1200);

  await page.getByTestId('open-discovery').first().click();
  const d = page.getByRole('dialog');
  await d.waitFor({ state: 'visible', timeout: 20000 });
  await pause(page, 1600);

  await fillWizard(page, d);
  // Sitting on the info step is where clip 02 picks up.
  await pause(page, 1500);
  draft = await page.evaluate((k) => sessionStorage.getItem(k), DRAFT_KEY);
}));

if (!draft) {
  console.error('no wizard draft was saved — cannot resume for later clips');
  process.exit(1);
}
writeFileSync('/tmp/showcase-draft.json', draft);

/** Reopens the wizard at the saved step, using the app's own resume path. */
const resume = async (page, step) => {
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.evaluate(([k, v, s]) => {
    const parsed = JSON.parse(v);
    sessionStorage.setItem(k, JSON.stringify({ data: parsed.data, step: s }));
  }, [DRAFT_KEY, draft, step]);
  await page.goto(`${APP}/?book=1`, { waitUntil: 'domcontentloaded' });
  const d = page.getByRole('dialog');
  await d.waitFor({ state: 'visible', timeout: 20000 });
  return d;
};

// ── 02 — the info agent ─────────────────────────────────────────────────────
console.log('02-info-agent');
results.push(await clip(browser, '02-info-agent', {}, async (page) => {
  const d = await resume(page, 7);
  await pause(page, 2200);

  // The gate's list, in plain language.
  const missing = d.locator('section[aria-label="What is still missing"]');
  await missing.waitFor({ state: 'visible', timeout: 20000 });
  await pause(page, 4200);

  // Always-visible escape hatch, shown before the conversation starts.
  const skip = d.getByRole('button', { name: 'Skip and show me the preview' });
  await skip.scrollIntoViewIfNeeded().catch(() => {});
  await pause(page, 2200);

  const box = d.getByPlaceholder('Answer in your own words…');
  await box.waitFor({ state: 'visible', timeout: 25000 });
  await pause(page, 1200);

  for (const answer of BRIEF.answers) {
    await box.scrollIntoViewIfNeeded().catch(() => {});
    await box.click();
    await box.type(answer, { delay: 12 });
    await pause(page, 900);
    await d.getByRole('button', { name: 'Send' }).first().click();
    // The follow-up question is a live model call; give it room to land.
    await pause(page, 20000);
  }

  await skip.scrollIntoViewIfNeeded().catch(() => {});
  await pause(page, 3000);
}));

// ── 03/04/05 — one take: generation, a prompt edit, the claim, the deposit ──
// The preview step is a conversation with two panes: the talk on the left, the
// site on the right, and a sticky NOW line naming the phase and how long it has
// been running. The site pane moves through three real states — an empty
// skeleton, the base template, then the personalised site hot-swapped in — and
// clip 03 is cut to show all three without the minutes in between.
const MAX_ATTEMPTS = 2;
let workspaceId = null;
let previewUrl = null;
let claimOk = false;
let personalised = false;
let previewId = null;
let claimPayload = null;
let marksFinal = null;
let attemptUsed = 0;
let journey = null;

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  console.log(`03/04/05 — attempt ${attempt}/${MAX_ATTEMPTS} (generation takes ~5 minutes)`);
  const t0 = Date.now();
  for (const k of Object.keys(marks)) delete marks[k];
  let fellBack = false;
  workspaceId = null;
  previewUrl = null;

  journey = await clip(browser, `journey-${attempt}`,
    { size: DESKTOP, saveState: '/tmp/showcase-client-state.json' },
    async (page) => {
      // The fallback endpoint is the server saying the live build gave up.
      page.on('request', (req) => {
        if (req.method() === 'POST' && new URL(req.url()).pathname === '/api/discovery/preview') {
          fellBack = true;
        }
      });
      // The id the claim needs, taken from the server's own response.
      page.on('response', async (res) => {
        if (new URL(res.url()).pathname === '/api/discovery/preview/live') {
          const j = await res.json().catch(() => null);
          if (j?.demoId) previewId = j.demoId;
        }
      });

      // Deliberately signed out. A signed-in visitor is redirected off the
      // landing page to /dashboard, so the funnel can only be filmed the way a
      // real visitor meets it: anonymous, all the way to the offer.
      const d = await resume(page, 8);
      await pause(page, 1200);

      // ---- 03a: the skeleton and the NOW line, both real --------------------
      mark(t0, 'genStart');
      await d.locator('[data-testid="concierge-panes"]')
        .waitFor({ state: 'visible', timeout: 60000 });
      await d.locator('[data-testid="concierge-now"]')
        .waitFor({ state: 'visible', timeout: 60000 });
      console.log('    concierge panes up, NOW line live');
      // The deposit is stated here, before any of the build is watched.
      await pause(page, 30000);
      mark(t0, 'skeletonEnd');

      // ---- 03b: the base template arrives in the site pane ------------------
      const frame = d.locator('iframe[title="Live site preview"]');
      const claimCta = d.getByRole('button', { name: /Reserve my full site/i }).first();
      const now = d.locator('[data-testid="concierge-now"]');
      // The step says "The build stopped" when the pipeline gives up. Reading
      // it turns a dead attempt into a 7-minute loss rather than a 12-minute
      // one, and it is the same sentence the visitor is shown.
      const stopped = async () =>
        /The build stopped/i.test(await now.innerText().catch(() => ''));
      const deadline = Date.now() + 12 * 60 * 1000;
      for (;;) {
        if (await frame.isVisible().catch(() => false)) break;
        if (fellBack) throw new Error('generation fell back to the JSON preview');
        if (await stopped()) throw new Error('the build stopped before publishing a preview');
        if (Date.now() > deadline) throw new Error('no preview inside 12 minutes');
        await pause(page, 2000);
      }
      mark(t0, 'baseReady');
      console.log('    base template in the site pane');
      previewUrl = await frame.getAttribute('src').catch(() => null);
      await pause(page, 11000);
      mark(t0, 'baseEnd');

      // ---- 03c: personalization hot-swapped in, and the offer restated ------
      for (;;) {
        if (await claimCta.isVisible().catch(() => false)) break;
        if (fellBack) throw new Error('generation fell back to the JSON preview');
        if (await stopped()) throw new Error('the build stopped during personalization');
        if (Date.now() > deadline) throw new Error('personalization did not finish in 12 minutes');
        await pause(page, 2000);
      }
      personalised = true;
      mark(t0, 'personalisedReady');
      console.log('    personalised site ready, offer on screen');
      await pause(page, 9000);
      await page.mouse.move(950, 420);
      await slowScroll(page, 3, 280, 700);
      await pause(page, 6000);
      mark(t0, 'genEnd');

      // ---- 04: one plain-English prompt, and the change landing ------------
      mark(t0, 'editStart');
      const promptBox = d.getByPlaceholder('e.g. make the hero warmer and add a pricing section');
      await promptBox.scrollIntoViewIfNeeded().catch(() => {});
      await promptBox.waitFor({ state: 'visible', timeout: 30000 });
      await pause(page, 2000);
      await promptBox.click();
      await promptBox.type(
        'Make the headline warmer and say clearly that the first intro call is free.',
        { delay: 16 }
      );
      await pause(page, 1400);
      await d.getByRole('button', { name: 'Send' }).first().click();
      console.log('    edit prompt sent');
      await pause(page, 95000);        // a real model call against the source
      await slowScroll(page, 2, 260, 800);
      await pause(page, 6000);
      mark(t0, 'editEnd');

      // ---- 05a: the offer, and what a signed-out click actually does -------
      mark(t0, 'claimStart');
      // The edit appends to the conversation, so the offer bubble that matters
      // is the newest one — `.first()` matched a superseded bubble.
      const offer = d.getByRole('button', { name: /Reserve my full site/i }).last();
      await offer.waitFor({ state: 'visible', timeout: 120000 });
      await offer.scrollIntoViewIfNeeded().catch(() => {});
      await pause(page, 6000);         // the offer, and the quiet way out

      // Everything needed to make the same request the button makes. The
      // wizard's own draft is the source, so the payload is the visitor's
      // answers rather than anything invented here.
      claimPayload = await page.evaluate(([k, id]) => {
        const raw = sessionStorage.getItem(k);
        const data = raw ? JSON.parse(raw).data : {};
        return {
          previewId: id,
          ...(data.selectedTier ? { tier: data.selectedTier } : {}),
          businessName: data.businessName,
          fullName: data.fullName,
          email: data.email,
          description: data.description,
          industry: data.industry,
          targetAudience: data.targetAudience,
          goal: data.goal,
          brandTone: data.brandTone,
          ...(data.pageCount ? { pageCount: data.pageCount } : {}),
          ...(data.timeline ? { timeline: data.timeline } : {}),
          ...(data.commerceMode ? { commerceMode: data.commerceMode } : {}),
          catalogSize: data.catalogSize,
          customIntegrations: data.customIntegrations,
        };
      }, [DRAFT_KEY, previewId]);

      // Signed out, the button opens Clerk's modal rather than navigating —
      // the app is deliberate about that, because a redirect here would throw
      // away the preview. The modal is filmed; it cannot be completed on this
      // machine, and the page says why.
      await offer.click({ timeout: 30000 });
      await page.locator('input[name="identifier"], .cl-modalContent, .cl-signIn-root')
        .first().waitFor({ state: 'visible', timeout: 45000 })
        .catch(() => console.log('    (clerk modal did not render)'));
      console.log('    claim clicked; Clerk modal on screen');
      await pause(page, 8000);
      mark(t0, 'end');
    });

  attemptUsed = attempt;
  if (personalised && previewId && marks.end) {
    marksFinal = { ...marks };
    console.log(`  attempt ${attempt} succeeded`);
    break;
  }
  console.log(`  attempt ${attempt} failed (${journey.error ?? 'incomplete'})`);
  if (attempt === MAX_ATTEMPTS) console.log('  keeping the last (failed) take');
}

writeFileSync('/tmp/showcase-marks.json', JSON.stringify(marksFinal ?? marks, null, 2));
console.log('marks', marksFinal ?? marks);

// ── The claim itself, and the unlock page ───────────────────────────────────
// The button's own POST could not be filmed: completing Clerk's modal needs a
// client-trust check a headless browser cannot pass. So the session is created
// from a server-minted Clerk sign-in token and the SAME request the button
// makes is sent with the SAME previewId and the visitor's own answers. The
// claim, the workspace and the money that follows are all real; one click is
// not on camera, and the showcase page says so.
if (claimPayload && previewId) {
  const ctx = await browser.newContext({ viewport: DESKTOP });
  const p0 = await ctx.newPage();
  await signInAsClient(p0, U.client);
  const out = await p0.evaluate(async (body) => {
    const res = await fetch('/api/flowstarter/projects/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: res.status, text: (await res.text()).slice(0, 400) };
  }, claimPayload);
  console.log('  claim POST ->', out.status, out.text.slice(0, 160));
  try {
    const parsed = JSON.parse(out.text);
    workspaceId = parsed.workspaceId ?? parsed.projectId ?? parsed.id ?? null;
  } catch { /* reported below */ }
  claimOk = Boolean(workspaceId);
  await ctx.storageState({ path: '/tmp/showcase-client-state.json' });
  await ctx.close();
  console.log('  claimed -> workspace', workspaceId);
  // Written here, not after the attempt loop: until the claim returns there is
  // no workspace to name, and an empty file is what stopped the next script.
  writeFileSync('/tmp/showcase-workspace.txt', workspaceId ?? '');
}

if (workspaceId) {
  results.push(await clip(browser, '05b-unlock',
    { storageState: '/tmp/showcase-client-state.json' }, async (page) => {
      await page.goto(`${APP}/unlock/${workspaceId}`, { waitUntil: 'domcontentloaded' });
      await pause(page, 5000);
      await slowScroll(page, 3, 300, 750);      // the quote and the 20/80 split
      await pause(page, 5000);

      // The deposit, through the signed webhook.
      const out = execFileSync('node',
        ['e2e/support/simulate-payment.mjs', '--workspace', workspaceId, '--kind', 'deposit'],
        { encoding: 'utf8' });
      writeFileSync('/tmp/deposit-run.txt', out);
      console.log('  deposit webhook posted');

      await page.reload({ waitUntil: 'domcontentloaded' });
      await pause(page, 6000);
      await slowScroll(page, 2, 260, 750);
      await pause(page, 5000);
    }));
}

// ── The mobile pass of the generated site ───────────────────────────────────
if (previewUrl) {
  console.log('03b-mobile');
  results.push(await clip(browser, '03b-mobile', { size: MOBILE }, async (page) => {
    await page.goto(previewUrl, { waitUntil: 'domcontentloaded' });
    await pause(page, 3500);
    await slowScroll(page, 9, 380, 420);
    await pause(page, 2000);
  }));
}

await browser.close();

// ── Cut the continuous take into chapters ───────────────────────────────────
// Nothing is sped up and no frame is fabricated — this is the same unbroken
// take with the dead minutes between phases removed.
const src = join(VID, `journey-${attemptUsed}.webm`);
const M = marksFinal ?? marks;
if (ffmpegOk() && M.end) {
  cut(src, join(VID, '03a-skeleton.webm'), 0, M.skeletonEnd);
  cut(src, join(VID, '03b-base.webm'), M.baseReady, M.baseEnd);
  cut(src, join(VID, '03c-personalised.webm'), M.personalisedReady, M.genEnd);
  cut(src, join(VID, '04-prompt-edit.webm'), M.editStart, M.editEnd);
  // 05 = the offer and the signed-out click on camera, then the unlock page
  // and the deposit landing on it.
  cut(src, join(VID, '05a-offer.webm'), M.claimStart, M.end);
  const five = [join(VID, '05a-offer.webm')];
  if (existsSync(join(VID, '05b-unlock.webm'))) five.push(join(VID, '05b-unlock.webm'));
  concat(five, join(VID, '05-claim-and-deposit.webm'));

  // Clip 03: the skeleton and the NOW line, the base template landing, the
  // personalised site, then the same site on a phone.
  const parts = [
    join(VID, '03a-skeleton.webm'),
    join(VID, '03b-base.webm'),
    join(VID, '03c-personalised.webm'),
  ];
  const mob = join(VID, '03b-mobile.webm');
  if (existsSync(mob)) parts.push(mob);
  concat(parts, join(VID, '03-generation.webm'));
  console.log('cut and joined 03, 04, 05 from the continuous take');
} else {
  console.warn('run incomplete — keeping the single take as 03');
  try { cut(src, join(VID, '03-generation.webm'), 0, null); } catch { /* keep raw */ }
}

writeManifest({
  workspaceId,
  previewUrl,
  claimOk,
  personalised,
  marks: M,
  generation: claimOk
    ? `succeeded on attempt ${attemptUsed} of ${MAX_ATTEMPTS}`
    : `no attempt succeeded in ${MAX_ATTEMPTS} tries`,
  clips: Object.fromEntries(results.map((r) => [r.name, { seconds: r.seconds, error: r.error }])),
});
console.log('funnel done. workspace =', workspaceId);
