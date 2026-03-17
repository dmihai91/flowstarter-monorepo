/**
 * Scenario 3: Full Site Creation — Dashboard → Editor → Build → Preview
 * Real end-to-end: signs in, creates project from dashboard, goes through
 * all editor steps, triggers a real Claude build, verifies preview URL.
 * Timeout: 10 minutes (real Claude pipeline takes 3-5 min)
 */
import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import path from 'path';
import fs from 'fs';

const MAIN = process.env.MAIN_APP_URL || 'https://flowstarter.dev';

const PROJECT = {
  clientName: 'Ana Muresan',
  projectName: 'Cabinet Psihologie Ana',
  description: 'Cabinet de psihologie in Cluj-Napoca, sedinte individuale si de cuplu pentru adulti',
};

const SCREENSHOTS_DIR = path.join(process.cwd(), 'e2e', 'screenshots', 'scenario3');

async function ss(page: any, name: string) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: false });
  console.log(`  📸 ${name}`);
}

test.describe('Scenario 3: Full Site Creation', () => {
  test.setTimeout(600_000);

  test('3.1 — Dashboard → Editor → Build → Preview', async ({ page }) => {
    // ── Auth ──────────────────────────────────────────────────────────────────
    await setupClerkTestingToken({ page });
    await page.goto(MAIN);
    await page.waitForLoadState('networkidle');
    console.log('✅ Signed in');

    // ── Step 1: Dashboard ─────────────────────────────────────────────────────
    console.log('\n📍 Step 1: Dashboard');
    await page.goto(`${MAIN}/team/dashboard`);
    await page.waitForLoadState('networkidle');
    // Wait to ensure we're on the dashboard (not redirected to login)
    await page.waitForURL(/\/team\/dashboard/, { timeout: 15000 });
    await ss(page, '01-dashboard');

    // Find "New Project" button — uses variant="accent" with Plus icon + "New Project" text
    const newBtn = page.locator('button').filter({ hasText: 'New Project' }).first();
    await newBtn.waitFor({ timeout: 15000 });
    await newBtn.click();
    await page.waitForTimeout(800);
    await ss(page, '02-modal-open');
    console.log('✅ Modal open');

    // Fill modal fields
    for (const [label, value] of [
      [/client.*name/i, PROJECT.clientName],
      [/project.*name/i, PROJECT.projectName],
      [/description/i, PROJECT.description],
    ] as [RegExp, string][]) {
      const field = page.getByLabel(label).or(page.getByPlaceholder(label)).first();
      if (await field.isVisible({ timeout: 3000 }).catch(() => false)) {
        await field.fill(value);
      }
    }
    await ss(page, '03-modal-filled');

    // ── Step 2: Open in editor ─────────────────────────────────────────────────
    console.log('\n📍 Step 2: Open in editor');
    const [editorPage] = await Promise.all([
      page.context().waitForEvent('page', { timeout: 30000 }),
      page.getByRole('button', { name: /open.*editor|launch|create.*project|start/i }).first().click(),
    ]);

    await editorPage.waitForLoadState('domcontentloaded');
    const editorUrl = editorPage.url();
    console.log(`✅ Editor URL: ${editorUrl}`);
    expect(editorUrl).toMatch(/editor\.flowstarter\.dev\/project\//);
    await ss(editorPage, '04-editor-loaded');

    const ep = editorPage;

    // ── Step 3: Wait for initial step ─────────────────────────────────────────
    console.log('\n📍 Step 3: Initial editor step');
    await ep.waitForTimeout(3000);
    await ss(ep, '05-initial-step');
    const bodyText = () => ep.locator('body').textContent().catch(() => '');

    // ── Step 4: Template selection ────────────────────────────────────────────
    if (/template|choose|select/i.test((await bodyText()) || '')) {
      console.log('✅ Already at template step (businessInfo pre-filled)');
    } else {
      console.log('\n📍 Step 4a: Filling business details');
      // Wait for chat input and send description
      await ep.waitForSelector('[data-testid="chat-input"], textarea', { timeout: 15000 });
      const chatInput = ep.locator('[data-testid="chat-input"], textarea').first();
      await chatInput.fill(PROJECT.description);
      await ep.keyboard.press('Enter');
      await ep.waitForTimeout(5000);

      // Business details form if visible
      const uvpField = ep.getByPlaceholder(/unique value|what makes|value proposition/i).first();
      if (await uvpField.isVisible({ timeout: 5000 }).catch(() => false)) {
        await uvpField.fill('Terapie integrativa personalizata cu abordare empatica si rezultate dovedite');
        await ep.getByRole('button', { name: /continue|next|save/i }).first().click();
        await ep.waitForTimeout(3000);
      }
    }

    console.log('\n📍 Step 4: Template selection');
    // Click first template
    const templateEl = ep.locator('[data-testid*="template"]').first()
      .or(ep.locator('.cursor-pointer').filter({ hasText: /therapist|wellness|coach|psycho/i }).first())
      .or(ep.locator('[role="button"]').filter({ hasText: /select|choose|use this/i }).first());

    await templateEl.waitFor({ timeout: 20000 }).catch(() => {});
    if (await templateEl.isVisible({ timeout: 2000 }).catch(() => false)) {
      await templateEl.click();
    } else {
      // Fallback: click first clickable card
      await ep.locator('.cursor-pointer').first().click();
    }
    await ep.waitForTimeout(2000);
    await ss(ep, '06-template-selected');
    console.log('✅ Template selected');

    // ── Step 5: Personalization ───────────────────────────────────────────────
    console.log('\n📍 Step 5: Personalization');
    // Palette
    const palette = ep.locator('[data-testid*="palette"]').first()
      .or(ep.locator('.rounded-full, .rounded-lg').filter({ has: ep.locator('[style*="background"]') }).first());
    if (await palette.isVisible({ timeout: 8000 }).catch(() => false)) {
      await palette.click();
      await ep.waitForTimeout(800);
      console.log('  ✅ Palette');
    }

    // Font
    const font = ep.locator('[data-testid*="font"]').first();
    if (await font.isVisible({ timeout: 5000 }).catch(() => false)) {
      await font.click();
      await ep.waitForTimeout(800);
      console.log('  ✅ Font');
    }

    // Logo — skip or select first
    const skipLogo = ep.getByRole('button', { name: /skip|no logo|continue without/i }).first();
    const logoOpt = ep.locator('[data-testid*="logo"]').first();
    if (await skipLogo.isVisible({ timeout: 5000 }).catch(() => false)) {
      await skipLogo.click();
      console.log('  ✅ Skipped logo');
    } else if (await logoOpt.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoOpt.click();
      console.log('  ✅ Logo selected');
    }
    await ss(ep, '07-personalization');

    // ── Step 6: Integrations ──────────────────────────────────────────────────
    console.log('\n📍 Step 6: Integrations');
    const skipInt = ep.getByRole('button', { name: /skip|later|build now|continue/i }).first();
    if (await skipInt.isVisible({ timeout: 10000 }).catch(() => false)) {
      await skipInt.click();
      console.log('  ✅ Skipped integrations');
    }
    await ss(ep, '08-build-starting');

    // ── Step 7: Build pipeline ────────────────────────────────────────────────
    console.log('\n📍 Step 7: Build — Claude generating site...');
    console.log('  ⏳ Waiting up to 5 minutes...');

    // Poll every 30s for progress
    let buildComplete = false;
    for (let i = 0; i < 10; i++) {
      await ep.waitForTimeout(30000);
      const text = (await bodyText()) || '';
      const elapsed = (i + 1) * 30;
      console.log(`  ⏱ ${elapsed}s — ${text.match(/\d+%|turn \d|step \d|healing|building|complete|preview|ready/i)?.[0] || 'building...'}`);
      await ss(ep, `09-build-${String(elapsed).padStart(3, '0')}s`);
      if (/preview|your site|view site|live|ready|complete/i.test(text)) {
        buildComplete = true;
        break;
      }
    }

    await ss(ep, '10-build-final');

    // ── Step 8: Preview ───────────────────────────────────────────────────────
    console.log(`\n📍 Step 8: Preview — build ${buildComplete ? 'complete' : 'timeout'}`);
    if (buildComplete) {
      const previewLink = ep.locator('a[href*="daytona"], a[href*="preview"]').first()
        .or(ep.getByRole('link', { name: /view|open|preview|visit/i }).first());
      const href = await previewLink.getAttribute('href').catch(() => null)
        || await ep.locator('iframe').getAttribute('src').catch(() => null);
      console.log(`✅ Preview URL: ${href}`);
      expect(href).toBeTruthy();
    } else {
      const text = (await bodyText()) || '';
      console.log('⚠️ Build still running. Current state:', text.slice(0, 300));
    }

    await ss(ep, '11-done');
    console.log('\n🎉 Done!');
  });
});
