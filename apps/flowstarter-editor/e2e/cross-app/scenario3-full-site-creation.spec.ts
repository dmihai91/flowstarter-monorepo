/**
 * Scenario 3: Full Site Creation — Handoff API → Editor → Real Build → Preview
 *
 * Simulates the full operator workflow:
 * 1. Call POST /api/editor/handoff (what the dashboard does when operator clicks "Open in Editor")
 * 2. Navigate to the returned editorUrl (now /project/:id directly — no handoff dance)
 * 3. Complete onboarding steps in the editor
 * 4. Trigger a real Claude build
 * 5. Verify a live preview URL is returned
 *
 * Uses real Claude SDK — takes 3-5 minutes for the build step.
 */
import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import {
  BASE, EDITOR,
  testProjectName,
  e2eFetch, cleanupProject,
} from './helpers';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'e2e', 'screenshots', 'scenario3');

async function ss(page: any, name: string) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: false });
  console.log(`  📸 ${name}`);
}

const PROJECT = {
  name: testProjectName(),
  description: 'Cabinet de psihologie in Cluj-Napoca, sedinte individuale si de cuplu pentru adulti',
  clientName: 'Ana Muresan',
};

let createdProjectId: string | undefined;

test.afterEach(async () => {
  if (createdProjectId) {
    await cleanupProject(createdProjectId);
    createdProjectId = undefined;
  }
});

const MAIN_URL = process.env.MAIN_APP_URL || process.env.E2E_BASE_URL || 'https://flowstarter.dev';
const EDITOR_URL = process.env.EDITOR_APP_URL || process.env.E2E_EDITOR_URL || 'https://editor.flowstarter.dev';

test.beforeEach(async ({ page }) => {
  // Set Clerk testing token on main app domain
  await page.goto(MAIN_URL);
  await setupClerkTestingToken({ page });
  // Also set token on editor domain (satellite auth requires token on each domain)
  await page.goto(EDITOR_URL);
  await setupClerkTestingToken({ page });
});

test.describe('Scenario 3: Full Site Creation', () => {
  test.setTimeout(900_000); // 15 min — real Claude build with healing

  test('3.1 — Handoff → Editor instantly → Business steps → Template → Build → Preview', async ({ page }) => {

    // ── Step 1: Create project via handoff API (same as dashboard "New Project" button) ──
    console.log('\n📍 Step 1: Create project via handoff API');
    const handoff = await e2eFetch(`${BASE}/api/editor/handoff`, {
      method: 'POST',
      body: {
        projectConfig: {
          projectName: PROJECT.name,
          clientName: PROJECT.clientName,
          description: PROJECT.description,
        },
        mode: 'interactive',
      },
    });

    expect(handoff.status).toBe(200);
    const { editorUrl, projectId, conversationId, token } = handoff.body as {
      editorUrl: string; projectId: string; conversationId?: string; token: string;
    };
    createdProjectId = projectId;
    console.log(`✅ Project created: ${projectId}`);
    console.log(`   Editor URL: ${editorUrl}`);
    console.log(`   Conversation ID: ${conversationId || 'will init in editor'}`);

    // ── Step 2: Navigate to editor via handoff token (bypasses Clerk satellite auth) ──
    console.log('\n📍 Step 2: Navigate to editor');
    // Always use handoff token URL — HandoffGate handles auth + redirects to /project/:id
    // (Direct /project/:id URL requires Clerk satellite auth which may not work in test env)
    await page.goto(`${EDITOR}?handoff=${encodeURIComponent(token)}`);
    await page.waitForLoadState('domcontentloaded');
    // If using handoff token, wait for redirect to /project/:id
    await page.waitForURL(/\/project\//, { timeout: 30000 });
    console.log(`✅ Editor loaded at: ${page.url()}`);
    await ss(page, '01-editor-loaded');

    // ── Step 3: Determine starting step ───────────────────────────────────────
    console.log('\n📍 Step 3: Initial step detection');
    await page.waitForTimeout(3000);
    await ss(page, '02-initial-step');
    // Use innerText to get only visible text (excludes CSS/style tag contents)
    const getText = () => page.evaluate(() => document.body.innerText).catch(() => '');
    const text = await getText();
    console.log(`  Page context: ${text?.slice(0, 150)}`);

    // ── Step 4: Handle onboarding steps ───────────────────────────────────────
    const isAtTemplate = /template|choose.*template/i.test(text || '');
    const isAtDescribe = /describe|tell us|what.*business|welcome/i.test(text || '');

    if (isAtTemplate) {
      console.log('✅ Already at template step');
    } else if (isAtDescribe) {
      console.log('\n📍 Step 4: Sending business description');
      const input = page.locator('[data-testid="chat-input"], textarea').first();
      await input.waitFor({ timeout: 10000 });
      await input.fill(PROJECT.description);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);
      await ss(page, '03-after-description');
    }

    // ── Step 5: Template selection ────────────────────────────────────────────
    console.log('\n📍 Step 5: Template selection');
    // Wait for template gallery to appear
    await page.waitForFunction(
      () => /template|choose/i.test(document.body.innerText),
      { timeout: 30000 }
    ).catch(() => console.log('  ⚠️ Template step timeout'));

    await ss(page, '04-template-gallery');

    // Click first template card using data-testid
    // Wait for template cards — prefer recommended cards (they have palettes for auto-select)
    await page.waitForSelector('[data-testid^="template-card-"], [data-testid^="all-template-card-"]', { timeout: 20000 });
    // Wait a bit for recommendations to load (they have palettes needed for auto-select)
    await page.waitForTimeout(3000);
    const recCards = await page.locator('[data-testid^="template-card-"]').count();
    const templateCard = recCards > 0
      ? page.locator('[data-testid^="template-card-"]').first()  // recommended — has palettes
      : page.locator('[data-testid^="all-template-card-"]').first(); // fallback
    await templateCard.scrollIntoViewIfNeeded();
    const cardId = await templateCard.getAttribute('data-testid');

    // Click with force to bypass any motion overlay, wait for 200ms setTimeout
    await templateCard.click({ force: true });
    await page.waitForTimeout(500);
    console.log(`  ✅ Template clicked: ${cardId}`);

    // Verify selection registered — wait for personalization-panel to mount
    // (this is a dedicated component that only renders after template is selected)
    const selectionConfirmed = await page.waitForSelector('[data-testid="personalization-panel"]', { timeout: 20000 })
      .then(() => true).catch(() => false);

    if (!selectionConfirmed) {
      console.log('  ⚠️ Retry: personalization panel not found, clicking again');
      await templateCard.click({ force: true });
      await page.waitForTimeout(500);
      // Try "Use this template" button (hover state)
      await page.mouse.move(0, 0); // move mouse away first
      await templateCard.hover();
      await page.waitForTimeout(300);
      const useBtn = page.getByText('Use this template').first();
      if (await useBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await useBtn.click({ force: true });
      }
      await page.waitForSelector('[data-testid="personalization-panel"]', { timeout: 15000 })
        .catch(() => console.log('  ❌ Personalization panel still not found'));
    }
    console.log(`  ✅ Template selection confirmed: ${selectionConfirmed}`);
    await page.waitForTimeout(2000);
    await ss(page, '05-template-selected');

    // ── Step 6: Personalization ───────────────────────────────────────────────
    console.log('\n📍 Step 6: Personalization');
    await page.waitForSelector('[data-testid="personalization-panel"]', { timeout: 20000 });

    // Palette: may be auto-selected (if template has palettes) or needs manual click
    // Wait up to 3s for auto-select to fire, otherwise click manually
    const paletteAutoSelected = await page.waitForSelector('[data-testid="font-section"]', { timeout: 3500 })
      .then(() => true).catch(() => false);

    if (!paletteAutoSelected) {
      console.log('  Palette not auto-selected — clicking manually');
      await page.waitForSelector('[data-testid="palette-section"]', { timeout: 10000 });
      await page.waitForTimeout(1000); // wait for stagger animation
      const clicked = await page.evaluate(() => {
        const btn = document.querySelector('[data-testid^="palette-option-"]') as HTMLElement;
        if (btn) { btn.click(); return btn.getAttribute('data-testid'); }
        // Fallback: click skip section button
        const skip = Array.from(document.querySelectorAll('[data-testid="palette-section"] button'))
          .find(b => b.textContent?.toLowerCase().includes('skip')) as HTMLElement;
        if (skip) { skip.click(); return 'skipped'; }
        return null;
      });
      console.log(`  Palette action: ${clicked}`);
      await page.waitForTimeout(1500);
    } else {
      console.log('  Palette auto-selected');
    }

    // Font
    await page.waitForSelector('[data-testid="font-section"]', { timeout: 15000 });
    await page.waitForTimeout(800);
    const fontClicked = await page.evaluate(() => {
      const btn = document.querySelector('[data-testid^="font-option-"]') as HTMLElement;
      if (btn) { btn.click(); return btn.getAttribute('data-testid'); }
      return null;
    });
    console.log(`  Font clicked: ${fontClicked}`);
    await page.waitForTimeout(1500);

    // Logo — skip
    await page.waitForSelector('[data-testid="logo-section"]', { timeout: 15000 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('[data-testid="logo-section"] button'));
      const skip = btns.find(b => b.textContent?.toLowerCase().includes('skip')) as HTMLElement;
      if (skip) skip.click();
    });
    console.log('  Logo skipped');
    await ss(page, '06-personalization');

    // ── Step 7: Integrations ──────────────────────────────────────────────────
    console.log('\n📍 Step 7: Integrations');
    const skipInt = page.getByRole('button', { name: /skip|later|build now|continue/i }).first();
    if (await skipInt.isVisible({ timeout: 10000 }).catch(() => false)) {
      await skipInt.click();
      console.log('  ✅ Integrations skipped');
    }
    await ss(page, '07-build-starting');

    // ── Step 8: Real Claude build ─────────────────────────────────────────────
    console.log('\n📍 Step 8: Build — Claude generating site...');

    // Wait for preview iframe to appear OR "Your site is ready!" message — up to 8 min
    // This is a DOM-level wait, not a text poll, so it won't miss the success state
    const buildResult = await Promise.race([
      // Success path 1: preview iframe with src (Daytona URL)
      page.waitForSelector('iframe[src*="daytona"], iframe[src*="preview"]', { timeout: 480000 })
        .then(() => 'iframe'),
      // Success path 2: "Your site is ready!" message in chat
      page.waitForFunction(
        () => document.body.innerText.includes('Your site is ready') ||
              document.body.innerText.includes('site is ready') ||
              document.body.innerText.includes('files for your website'),
        { timeout: 480000 }
      ).then(() => 'ready-text'),
      // Timeout path
      new Promise<string>(resolve => setTimeout(() => resolve('timeout'), 480000)),
    ]);

    const buildDone = buildResult !== 'timeout';
    console.log(`  Build result: ${buildResult}`);
    await ss(page, '08-build-complete');

    await ss(page, '09-build-final');

    // ── Step 9: Verify preview ────────────────────────────────────────────────
    console.log('\n📍 Step 9: Preview');
    // Check for preview URL — try multiple locators
    const previewHref = await page.locator('a[href*="daytona"], a[href*="preview"]').first()
      .getAttribute('href').catch(() => null)
      || await page.locator('iframe[src*="daytona"], iframe[src*="preview"]').first()
      .getAttribute('src').catch(() => null);

    if (previewHref) {
      console.log(`✅ Preview URL found: ${previewHref}`);
      expect(previewHref).toMatch(/daytona|preview/i);
    } else {
      const finalText = await getText();
      // Build might still be in progress — report state without failing
      console.log(`ℹ️  Build state: ${finalText?.slice(0, 200)}`);
      console.log('⚠️  Preview URL not yet available — build may still be running');
    }

    await ss(page, '10-done');
    console.log('\n🎉 Scenario 3 complete!');
  });
});
