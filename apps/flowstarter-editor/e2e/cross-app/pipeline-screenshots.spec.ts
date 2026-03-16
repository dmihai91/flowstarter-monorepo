/**
 * Full Pipeline — New site from scratch with screenshots
 */
import { test, expect } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

const BASE = 'https://flowstarter.dev';
const EDITOR = 'https://editor.flowstarter.dev';
const DIR = 'test-results/pipeline-screenshots';
const E2E_SECRET = process.env.E2E_SECRET || '';
const E2E_USER_ID = process.env.E2E_USER_ID || 'user_3AeSkinjvy9jZkCFvkupD9I06PG';

async function e2eFetch(url: string, opts: { method?: string; body?: Record<string, unknown> } = {}) {
  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json', 'x-e2e-secret': E2E_SECRET, 'x-e2e-user-id': E2E_USER_ID },
    ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

let n = 0;
async function snap(page: any, label: string) {
  n++;
  const name = `${String(n).padStart(2, '0')}-${label}`;
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: false });
  console.log(`📸 ${n} — ${label}`);
}

test('New site — full flow', async ({ page }) => {
  test.setTimeout(300_000);
  await setupClerkTestingToken({ page });

  // ── Dashboard ──────────────────────────────────────────────────
  await page.goto(BASE + '/team/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await snap(page, 'dashboard');

  // ── Create handoff (minimal — just client + name) ──────────────
  const handoffRes = await e2eFetch(`${BASE}/api/editor/handoff`, {
    method: 'POST',
    body: {
      projectConfig: {
        name: 'Artisan Bakery Cluj',
        description: 'Brutărie artizanală în Cluj-Napoca',
        client: { name: 'Maria Ionescu', email: 'maria@bakery.ro' },
      },
    },
  });
  expect(handoffRes.status).toBe(200);
  const { token, projectId } = handoffRes.body as { token: string; projectId: string };
  console.log(`✅ Project: ${projectId}`);

  // ── Editor handoff ─────────────────────────────────────────────
  await page.goto(`${EDITOR}?handoff=${encodeURIComponent(token)}`);
  await page.waitForURL(/\/project\//, { timeout: 30_000 });
  await page.waitForTimeout(4000);
  await snap(page, 'editor-loaded');

  // ── Adaptive: interact with whatever step we're on ─────────────
  // Check page content to determine current step
  const pageContent = await page.textContent('body');

  // TEMPLATE STEP — pick a template
  if (pageContent?.match(/pick.*template|choose.*template|template/i)) {
    console.log('🎯 On template step');
    await snap(page, 'template-selector');

    // Click first template card with an image
    const cards = page.locator('.group.cursor-pointer, [role="button"]:has(img), div:has(> img):has(> span)').first();
    if (await cards.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cards.click();
      await page.waitForTimeout(2000);
      await snap(page, 'template-clicked');
    }

    // Look for a "Use this template" or confirm button
    const useBtn = page.locator('button:has-text("Use"), button:has-text("Select"), button:has-text("Choose")').first();
    if (await useBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await useBtn.click();
      await page.waitForTimeout(3000);
      await snap(page, 'template-confirmed');
    }
  }

  // PERSONALIZATION STEP
  await page.waitForTimeout(3000);
  await snap(page, 'after-template');
  
  const personalization = page.locator('text=/color/i, text=/palette/i, text=/font/i, text=/personali/i');
  if (await personalization.first().isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('🎯 On personalization step');
    await snap(page, 'personalization');

    // Click skip/continue
    const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Continue"), button:has-text("Next")').first();
    if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const txt = await skipBtn.textContent();
      console.log(`  Clicking: ${txt}`);
      await skipBtn.click();
      await page.waitForTimeout(3000);
      await snap(page, 'after-personalization');
    }
  }

  // INTEGRATIONS STEP
  const integrations = page.locator('text=/integration/i, text=/connect/i, text=/calendly/i, text=/analytics/i');
  if (await integrations.first().isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('🎯 On integrations step');
    await snap(page, 'integrations');

    const skipBtn = page.locator('button:has-text("Skip"), button:has-text("Build"), button:has-text("Generate")').first();
    if (await skipBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      const txt = await skipBtn.textContent();
      console.log(`  Clicking: ${txt}`);
      await skipBtn.click();
      await page.waitForTimeout(3000);
      await snap(page, 'after-integrations');
    }
  }

  // CREATING/BUILD PHASE
  await page.waitForTimeout(3000);
  await snap(page, 'pre-build-check');

  const building = page.locator('text=/building/i, text=/generating/i, text=/creating.*site/i, text=/agent/i');
  if (await building.first().isVisible({ timeout: 10000 }).catch(() => false)) {
    console.log('🚀 Build phase!');
    await snap(page, 'build-started');

    for (let i = 0; i < 18; i++) {
      await page.waitForTimeout(10000);
      await snap(page, `build-progress-${String(i).padStart(2, '0')}`);

      const done = page.locator('text=/ready/i, text=/preview.*ready/i, text=/your.*site/i, text=/complete/i, iframe[src]');
      if (await done.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('✅ Build complete!');
        await snap(page, 'build-complete');
        break;
      }
    }
  } else {
    console.log('⚠️ No build phase detected — taking periodic screenshots');
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(5000);
      await snap(page, `waiting-${String(i).padStart(2, '0')}`);
    }
  }

  await snap(page, 'final');

  // Cleanup
  await e2eFetch(`${BASE}/api/projects/${projectId}`, { method: 'DELETE' }).catch(() => {});
  console.log('🧹 Done');
});
