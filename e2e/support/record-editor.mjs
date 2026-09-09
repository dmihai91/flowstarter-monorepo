/**
 * Clip 08 — the client editor, as it actually stands.
 *
 * The editor loads the client's real site and offers 247 editable targets read
 * out of it. What it will not do on this workspace is run: the policy requires
 * an active care plan, and this workspace has no monthly price on it, so the
 * operator's own "Activate subscription" button is disabled too.
 *
 * That is filmed rather than worked around. The screen is the policy mirror the
 * editor was built to be — it shows the client their site, tells them in the
 * policy's own words why the controls are paused, and never calls the model.
 * Forcing a subscription in the database to get a prettier clip would have been
 * a lie about what a client with this plan can do today.
 *
 *   node e2e/support/record-editor.mjs
 */
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import {
  APP, ensureDirs, pause, slowScroll, clip, writeManifest,
} from './showcase-lib.mjs';

ensureDirs();
const WS = readFileSync('/tmp/showcase-workspace.txt', 'utf8').trim();
const CLIENT_STATE = '/tmp/showcase-client-state.json';
const notes = {};

const browser = await chromium.launch({ args: ['--disable-features=site-per-process'] });
const res = await clip(browser, '08-editor', { storageState: CLIENT_STATE }, async (page) => {
  await page.goto(`${APP}/dashboard/projects/${WS}/editor`, { waitUntil: 'domcontentloaded' });
  await pause(page, 6000);

  // The client's own site, rendered in the editor.
  await page.locator('[data-testid="site-preview-frame"]')
    .waitFor({ state: 'visible', timeout: 40000 }).catch(() => {});
  await pause(page, 4000);

  const select = page.locator('[data-testid="editor-target-select"]');
  await select.waitFor({ state: 'visible', timeout: 40000 });
  const values = await select.locator('option').evaluateAll((os) =>
    os.map((o) => ({ value: o.value, label: (o.textContent || '').trim() }))
      .filter((o) => o.value));
  notes.editorTargets = values.length;
  console.log('  editable targets:', values.length);
  await pause(page, 3000);

  // A real content target, and the text the editor read out of the site.
  await select.selectOption(values[0].value);
  await pause(page, 3500);
  notes.currentText = (await page.locator('[data-testid="editor-current-text"]')
    .innerText().catch(() => '')).replace(/\n+/g, ' | ').slice(0, 160);
  console.log('  current text:', notes.currentText.slice(0, 90));
  await pause(page, 4000);

  // The instruction is typed, and the control stays refused — with a reason.
  const instruction = page.locator('[data-testid="editor-instruction"]');
  await instruction.click().catch(() => {});
  await instruction.type('Warmer, and mention that the first intro call is free.', { delay: 20 })
    .catch(() => {});
  await pause(page, 2500);

  const propose = page.locator('[data-testid="editor-propose"]').first();
  notes.proposeEnabled = await propose.isEnabled().catch(() => false);
  console.log('  propose enabled:', notes.proposeEnabled);

  notes.policyNotice = (await page.locator('[data-testid="editor-policy-notice"]')
    .innerText().catch(() => '')).replace(/\n+/g, ' | ').slice(0, 200);
  console.log('  policy:', notes.policyNotice);
  await page.locator('[data-testid="editor-policy-notice"]')
    .scrollIntoViewIfNeeded().catch(() => {});
  await pause(page, 6000);

  // The other panels the policy also covers.
  await page.locator('[data-testid="editor-tab-images"]').click().catch(() => {});
  await pause(page, 4000);
  await page.locator('[data-testid="editor-tab-history"]').click().catch(() => {});
  await pause(page, 4000);
  await page.locator('[data-testid="editor-tab-text"]').click().catch(() => {});
  await pause(page, 2500);
  await slowScroll(page, 2, 240, 700);
  await pause(page, 3500);
});

await browser.close();
writeManifest({ notes: { editor: notes },
  clips: { '08-editor': { seconds: res.seconds, error: res.error } } });
console.log('editor clip done', JSON.stringify(notes, null, 2));
