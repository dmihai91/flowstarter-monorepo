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
 * Steps 1–6 are no longer six form screens: they are one scripted conversation
 * (`intake-script.ts` + `IntakeConversation.tsx`). So clip 01 is driven the way
 * a visitor drives it — typing into the composer and pressing Enter, tapping a
 * quick reply, tapping "Skip this one" — and each turn is synchronised against
 * the wizard's own cursor (the `answered` array in its autosaved draft) rather
 * than against a guess at how long React needs. Nothing here decides the order
 * of the questions; the script does, and this only answers them.
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
  // Multi-select turns: the visitor taps chips, then sends with "That's it".
  goals: ['Take bookings or appointments', 'Build trust and credibility'],
  tones: ['Calm', 'Warm'],
  pageCount: '5 – 7',
  timeline: 'Within 4 weeks',
  commerce: 'No products',
  // The monthly plan is picked by its own card inside the conversation.
  plan: 'Guided editor access',
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
//
// Kept, but it is NOT sufficient on its own: the 2026-08-31 run recorded the
// site pane as blank white with this flag in place, on a preview the server
// was serving fine (200) and which the page had finished loading — the
// skeleton overlay was gone. Whatever composites that frame, this flag does
// not reach it, so a clip that has to *show* the generated site still needs a
// full-frame pass over the preview URL (`03b-mobile` below does exactly that).
const browser = await chromium.launch({ args: ['--disable-features=site-per-process'] });
const results = [];
const marks = {};
const mark = (t0, label) => { marks[label] = Math.round((Date.now() - t0) / 1000); };

/**
 * Cards inside the conversation's two commercial panels expose no accessible
 * name that `getByRole` can resolve, so they are addressed by the sub-label
 * text they actually render.
 */
const choice = (d, text) => d.locator('button').filter({ hasText: text }).first();

// The conversation's controls, by the accessible names it actually renders.
// `exact` is not optional on Send: every answered turn carries an Edit button
// whose aria-label repeats the agent's question, and one of those questions is
// "Where should I send your preview?" — a substring match resolves to two.
const composer = (d) => d.getByLabel('Your answer');
const sendBtn = (d) => d.getByRole('button', { name: 'Send', exact: true });
const doneBtn = (d) => d.getByRole('button', { name: "That's it", exact: true });
const skipBtn = (d) => d.getByRole('button', { name: 'Skip this one', exact: true }).first();
const confirmBtn = (d) => d.getByRole('button', { name: 'Looks good — carry on', exact: true });

/**
 * Waits for the wizard to have filed a question away.
 *
 * The draft the wizard autosaves carries its own cursor — the ids the visitor
 * has dealt with, in order — so a turn is "done" when the app says it is,
 * not when a sleep expires. That keeps the pacing below purely cosmetic: the
 * pauses are there to be watchable, never to be load-bearing.
 */
async function answeredIds(page) {
  return page.evaluate((k) => {
    try {
      const raw = sessionStorage.getItem(k);
      return raw ? JSON.parse(raw).answered ?? [] : [];
    } catch { return []; }
  }, DRAFT_KEY);
}

async function settled(page, id, timeout = 30000) {
  const deadline = Date.now() + timeout;
  for (;;) {
    if ((await answeredIds(page)).includes(id)) return;
    if (Date.now() > deadline) throw new Error(`the conversation never accepted "${id}"`);
    await pause(page, 250);
  }
}

/** A typed turn: the visitor writes in the composer and presses Send. */
async function say(page, d, id, text) {
  const box = composer(d);
  await box.waitFor({ state: 'visible', timeout: 30000 });
  await box.click();
  await box.type(text, { delay: 18 });   // typing is part of the picture
  await pause(page, 800);
  await sendBtn(d).click();
  await settled(page, id);
  await pause(page, 700);
}

/** A quick reply: one tap sends it as a message. */
async function tap(page, d, id, label) {
  const chip = d.getByRole('button', { name: label, exact: true }).first();
  await chip.waitFor({ state: 'visible', timeout: 30000 });
  await pause(page, 600);              // a beat to read the options
  await chip.click();
  await settled(page, id);
  await pause(page, 700);
}

/** The optional questions really are optional, and the clip should show it. */
async function skip(page, d, id) {
  await skipBtn(d).waitFor({ state: 'visible', timeout: 30000 });
  await pause(page, 900);
  await skipBtn(d).click();
  await settled(page, id);
  await pause(page, 700);
}

/** Several chips at once, then "That's it" to send the lot. */
async function pick(page, d, id, labels) {
  for (const label of labels) {
    const chip = d.getByRole('button', { name: label, exact: true }).first();
    await chip.waitFor({ state: 'visible', timeout: 30000 });
    await chip.click();
    await pause(page, 550);
  }
  await pause(page, 500);
  await doneBtn(d).click();
  await settled(page, id);
  await pause(page, 700);
}

/**
 * Talks through steps 1–6 and leaves the dialog on the info step.
 *
 * The order is the script's, not this file's: if a question is added,
 * reordered or made conditional in `intake-script.ts`, the turn for it belongs
 * here in the same place the script puts it.
 */
async function talkThroughIntake(page, d) {
  await pause(page, 2200);             // the agent's opening line, read

  // 1 — who they are
  await say(page, d, 'fullName', BRIEF.fullName);
  await say(page, d, 'email', BRIEF.email);
  await say(page, d, 'businessName', BRIEF.businessName);

  // 2 — what the business does. Deliberately the short answer.
  await say(page, d, 'description', BRIEF.short);
  await tap(page, d, 'industry', BRIEF.industry);
  await say(page, d, 'targetAudience', BRIEF.audience);
  // Nothing to paste, and the way out of a question is on camera.
  await skip(page, d, 'links');

  // 3 — goals, tone, size, timing
  await pick(page, d, 'goal', BRIEF.goals);
  await pick(page, d, 'brandTone', BRIEF.tones);
  await tap(page, d, 'pageCount', BRIEF.pageCount);
  await tap(page, d, 'timeline', BRIEF.timeline);

  // 4 — commerce. "No products" means no catalog question is ever asked.
  await tap(page, d, 'commerceMode', BRIEF.commerce);
  // Skipped, and not for pacing: the brief has no unusual system to plug into,
  // and `recommendTier` treats *any* answer here as a custom-integration
  // request — one sentence in this box moves the brief off the €799 build and
  // onto "from €2,499". Ellen's booking need is already in her goals, so
  // answering it would be inventing scope the brief never had.
  await skip(page, d, 'customIntegrations');

  // 5 — the build package, as a panel inside the conversation. Rules pick it
  // first (RecommendationStep auto-selects); the visitor confirms or overrides.
  await d.getByRole('heading', { level: 3 }).first()
    .waitFor({ state: 'visible', timeout: 30000 });
  await pause(page, 5200);             // long enough to read the reasons
  await confirmBtn(d).waitFor({ state: 'visible', timeout: 30000 });
  await confirmBtn(d).click();
  await settled(page, 'selectedTier');
  await pause(page, 1000);

  // 6 — the monthly plan, the same way.
  await choice(d, BRIEF.plan).click();
  await pause(page, 1600);
  await confirmBtn(d).click();
  await settled(page, 'subscription');
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

  await talkThroughIntake(page, d);
  // Sitting on the info step is where clip 02 picks up.
  await pause(page, 1500);
  draft = await page.evaluate((k) => sessionStorage.getItem(k), DRAFT_KEY);
}));

if (!draft) {
  console.error('no wizard draft was saved — cannot resume for later clips');
  process.exit(1);
}
writeFileSync('/tmp/showcase-draft.json', draft);

/**
 * Reopens the wizard at the saved step, using the app's own resume path.
 *
 * The whole draft is written back, cursor included — the conversation's
 * `answered` list is what the transcript is drawn from, and dropping it would
 * restore a visitor who had apparently answered nothing. Only the step is
 * overridden, which is the one thing this is for.
 */
const resume = async (page, step) => {
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  await page.evaluate(([k, v, s]) => {
    const parsed = JSON.parse(v);
    sessionStorage.setItem(k, JSON.stringify({ ...parsed, step: s }));
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
    await d.getByRole('button', { name: 'Send', exact: true }).first().click();
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
// Generation is a real pipeline against a real model and succeeds well under
// half the time; four tries is roughly an hour of wall clock, which is the
// budget a filming session actually has.
const MAX_ATTEMPTS = 4;
let workspaceId = null;
let previewUrl = null;
let claimOk = false;
let personalised = false;
let editApplied = false;
let previewId = null;
// The last body the edit endpoint's poll returned. The UI shows the phase, not
// the reason, so this is what a failed edit gets reported with.
let lastEditPoll = null;
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
  personalised = false;
  editApplied = false;

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
        const path = new URL(res.url()).pathname;
        if (path === '/api/discovery/preview/live') {
          const j = await res.json().catch(() => null);
          if (j?.demoId) previewId = j.demoId;
        }
        // The edit's own status, kept for the report: the conversation shows a
        // phase, and the reason a phase stopped is only ever in this body.
        if (path === '/api/discovery/preview/live/edit') {
          const j = await res.json().catch(() => null);
          if (j) lastEditPoll = { status: res.status(), body: j };
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
      // The edit runs against the generated source and reports its phases into
      // the same conversation. So the clip waits for the app's own "done" line
      // rather than for a fixed number of seconds — a flat sleep either cut the
      // reveal off or sat on a finished screen for a minute.
      mark(t0, 'editStart');
      const promptBox = d.getByLabel('Ask for a change');
      await promptBox.scrollIntoViewIfNeeded().catch(() => {});
      await promptBox.waitFor({ state: 'visible', timeout: 30000 });
      await pause(page, 2000);
      await promptBox.click();
      await promptBox.type(
        'Make the headline warmer and say clearly that the first intro call is free.',
        { delay: 16 }
      );
      await pause(page, 1400);
      await d.getByRole('button', { name: 'Send', exact: true }).first().click();
      console.log('    edit prompt sent');

      // "Done — updating your live preview." is the line the step writes when
      // the edit has landed and it has bumped the iframe. Anything else in
      // that bubble is the edit having failed, and a failed edit is not a clip.
      const editDone = d.getByText('Done — updating your live preview.');
      const editDeadline = Date.now() + 6 * 60 * 1000;
      for (;;) {
        if (await editDone.isVisible().catch(() => false)) break;
        const log = await d.locator('[data-testid="concierge-conversation-pane"]')
          .innerText().catch(() => '');
        // Report the sentence that actually matched, not the tail of the pane:
        // the offer bubble sits at the bottom, so a tail slice named the wrong
        // thing and made a real failure look like a false positive.
        const bad = /[^.\n]*(?:didn't work|Something went wrong|couldn't start that edit|demo not ready)[^.\n]*/i.exec(log);
        if (bad) {
          throw new Error(`the prompt edit failed: ${bad[0].trim()}`);
        }
        if (Date.now() > editDeadline) throw new Error('the prompt edit did not finish in 6 minutes');
        await pause(page, 2500);
      }
      console.log('    edit applied; iframe refreshed');
      editApplied = true;
      await pause(page, 9000);         // the refreshed site, on screen
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
  if (personalised && editApplied && previewId && marks.end) {
    marksFinal = { ...marks };
    console.log(`  attempt ${attempt} succeeded`);
    break;
  }
  console.log(`  attempt ${attempt} failed (${journey.error ?? 'incomplete'})`);
  if (lastEditPoll) console.log('  last edit poll:', JSON.stringify(lastEditPoll).slice(0, 400));
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
  editApplied,
  marks: M,
  generation: claimOk
    ? `succeeded on attempt ${attemptUsed} of ${MAX_ATTEMPTS}`
    : `no attempt succeeded in ${MAX_ATTEMPTS} tries`,
  clips: Object.fromEntries(results.map((r) => [r.name, { seconds: r.seconds, error: r.error }])),
});
console.log('funnel done. workspace =', workspaceId);
