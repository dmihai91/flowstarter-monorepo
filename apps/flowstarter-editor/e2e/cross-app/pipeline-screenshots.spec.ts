/**
 * Full Pipeline Visual Test — New site from scratch
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

async function screenshot(page: any, name: string, step: string) {
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: false });
  console.log(`📸 ${step}`);
}

test('New site from scratch — full interactive flow', async ({ page }) => {
  test.setTimeout(300_000);
  await setupClerkTestingToken({ page });

  // ── 1. Dashboard ───────────────────────────────────────────────
  await page.goto(BASE + '/team/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await screenshot(page, '01-dashboard', '01 — Dashboard');

  // ── 2. Create project with minimal data (no businessInfo) ──────
  // This forces the editor to go through ALL steps
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

  // ── 3. Handoff to editor ───────────────────────────────────────
  await page.goto(`${EDITOR}?handoff=${encodeURIComponent(token)}`);
  await page.waitForURL(/\/project\//, { timeout: 30_000 });
  await page.waitForTimeout(3000);
  await screenshot(page, '02-editor-loaded', '02 — Editor loaded');

  // ── 4. Find chat input and describe the business ───────────────
  const chatInput = page.locator('[data-testid="chat-input"], textarea').first();
  await chatInput.waitFor({ state: 'visible', timeout: 15_000 });
  await screenshot(page, '03-chat-ready', '03 — Chat ready');

  // Type business description
  await chatInput.fill('O brutărie artizanală premium în centrul Clujului. Facem pâine cu maia, croissante, prăjituri și cafea de specialitate. Totul din ingrediente locale, organice. Vrem un site care arată warm, artizanal, cu foto mari cu produsele noastre și posibilitate de comandă online.');
  await screenshot(page, '04-description-typed', '04 — Description typed');

  // Submit
  const sendBtn = page.locator('button[type="submit"], button:has(svg[class*="send"]), [data-testid="send-button"]').first();
  if (await sendBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sendBtn.click();
  } else {
    await chatInput.press('Enter');
  }
  
  // Wait for AI response
  await page.waitForTimeout(8000);
  await screenshot(page, '05-after-describe', '05 — After describe (AI processing)');

  // ── 5. Watch step transitions ──────────────────────────────────
  // Take screenshots every 5s for 30s to catch step transitions
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(5000);
    await screenshot(page, `06-transition-${String(i).padStart(2, '0')}`, `06.${i} — Step transition`);
    
    // Check if we're at naming step
    const nameInput = page.locator('input[placeholder*="name" i], [data-testid="project-name"]');
    if (await nameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('🎯 Name step detected');
      await screenshot(page, '07-name-step', '07 — Name step');
      // Accept the suggested name or type one
      const existingValue = await nameInput.inputValue().catch(() => '');
      if (!existingValue) {
        await nameInput.fill('Artisan Bakery');
      }
      // Try to proceed
      const nextBtn = page.locator('button:has-text("Continue"), button:has-text("Next"), button[type="submit"]').first();
      if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(3000);
      }
      break;
    }

    // Check for quick-profile
    const profileSelector = page.locator('text=/quick.*profile/i, text=/what.*type/i, [data-testid="quick-profile"]');
    if (await profileSelector.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('🎯 Quick profile step detected');
      await screenshot(page, '07-quick-profile', '07 — Quick profile');
      break;
    }

    // Check for template
    const templateText = page.locator('text=/choose.*template/i, text=/select.*template/i, [data-testid="template-gallery"]');
    if (await templateText.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('🎯 Template step detected');
      break;
    }
  }

  // ── 6. Keep progressing through steps ──────────────────────────
  // Take screenshots every 5s for another 60s
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(5000);
    await screenshot(page, `08-flow-${String(i).padStart(2, '0')}`, `08.${i} — Flow progress`);

    // If chat has input, check if there's a prompt we should respond to
    const textarea = page.locator('textarea:visible').first();
    if (await textarea.isVisible({ timeout: 500 }).catch(() => false)) {
      const placeholder = await textarea.getAttribute('placeholder').catch(() => '');
      console.log(`  Chat placeholder: "${placeholder}"`);
    }

    // Look for clickable template cards
    const templateCard = page.locator('[data-testid*="template-card"], .group.cursor-pointer:has(img), [class*="template"]:has(img)').first();
    if (await templateCard.isVisible({ timeout: 500 }).catch(() => false)) {
      console.log('🎯 Clicking template card');
      await templateCard.click();
      await page.waitForTimeout(3000);
      await screenshot(page, '09-template-selected', '09 — Template selected');
    }

    // Look for Skip/Continue/Build buttons
    const actionBtn = page.locator('button:has-text("Skip"), button:has-text("Build"), button:has-text("Generate"), button:has-text("Continue")').first();
    if (await actionBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      const text = await actionBtn.textContent();
      console.log(`🎯 Clicking: "${text}"`);
      await actionBtn.click();
      await page.waitForTimeout(3000);
      await screenshot(page, `10-after-${text?.toLowerCase().replace(/\s+/g, '-')}`, `10 — After "${text}"`);
    }

    // Check for build/creating phase
    const building = page.locator('text=/building/i, text=/generating.*site/i, text=/creating/i, [data-testid="agent-activity"]').first();
    if (await building.isVisible({ timeout: 500 }).catch(() => false)) {
      console.log('🚀 Build phase detected!');
      await screenshot(page, '11-build-started', '11 — Build started');
      
      // Wait for build with periodic screenshots
      for (let j = 0; j < 12; j++) {
        await page.waitForTimeout(10000);
        await screenshot(page, `12-build-${String(j).padStart(2, '0')}`, `12.${j} — Build progress`);
        
        const done = page.locator('text=/ready/i, text=/preview.*ready/i, text=/your.*site/i, iframe').first();
        if (await done.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log('✅ Build complete!');
          await screenshot(page, '13-build-complete', '13 — Build complete');
          break;
        }
      }
      break;
    }
  }

  // Final
  await page.waitForTimeout(2000);
  await screenshot(page, '99-final', '99 — Final state');

  // Cleanup
  await e2eFetch(`${BASE}/api/projects/${projectId}`, { method: 'DELETE' }).catch(() => {});
  console.log('🧹 Done');
});
