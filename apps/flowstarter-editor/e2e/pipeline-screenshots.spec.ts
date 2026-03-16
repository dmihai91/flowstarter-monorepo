/**
 * Full Pipeline Visual Test — Operator Flow
 * Captures screenshots at every step of the idea-to-draft flow.
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

test('Full operator pipeline — idea to draft with screenshots', async ({ page }) => {
  test.setTimeout(300_000);
  await setupClerkTestingToken({ page });

  // 1. Dashboard
  await page.goto(BASE + '/team/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${DIR}/01-dashboard.png`, fullPage: false });
  console.log('📸 01 — Dashboard');

  // 2. New Project modal
  const newBtn = page.getByRole('button', { name: /new project/i }).first();
  if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await newBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${DIR}/02-new-project-modal.png`, fullPage: false });
    console.log('📸 02 — New Project modal');
  }

  // 3. Create project via API with full business data
  const handoffRes = await e2eFetch(`${BASE}/api/editor/handoff`, {
    method: 'POST',
    body: {
      projectConfig: {
        name: 'Dental Estetic Cluj',
        description: 'Cabinet stomatologic estetic premium în Cluj-Napoca, specializat în albiri, fațete, implanturi.',
        businessInfo: {
          description: 'Cabinet stomatologic estetic premium în Cluj-Napoca',
          uvp: 'Tratamente fără durere cu programări în aceeași zi și materiale premium',
          targetAudience: 'Profesioniști din Cluj-Napoca, 28-55 ani',
          industry: 'Healthcare / Dental',
          goal: 'bookings',
          brandTone: 'professional',
          offerings: 'Albire dentară profesională 400€, Fațete ceramice 800€/dinte, Implanturi 1200€, Ortodonție invizibilă 3500€',
        },
        contactInfo: { email: 'contact@dentalestetic.ro', phone: '+40741000001', address: 'Str. Memo 10, Cluj-Napoca' },
        client: { name: 'Dr. Elena Popescu', email: 'elena@dentalclinic.ro' },
      },
    },
  });
  expect(handoffRes.status).toBe(200);
  const { token, projectId } = handoffRes.body as { token: string; projectId: string };
  console.log(`✅ Project: ${projectId}`);

  // 4. Editor handoff
  await page.goto(`${EDITOR}?handoff=${encodeURIComponent(token)}`);
  await page.waitForURL(/\/project\//, { timeout: 30_000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${DIR}/04-editor-after-handoff.png`, fullPage: false });
  console.log('📸 04 — Editor after handoff');

  // 5. Wait for step machine to settle
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${DIR}/05-step-settled.png`, fullPage: false });
  console.log('📸 05 — Step settled');

  // 6. Check for template selector (with businessInfo, should skip to template)
  const tmplText = page.locator('text=/template/i').first();
  if (await tmplText.isVisible({ timeout: 8000 }).catch(() => false)) {
    await page.screenshot({ path: `${DIR}/06-template-selector.png`, fullPage: false });
    console.log('📸 06 — Template selector');

    // Click first template card
    const cards = page.locator('[data-testid*="template"], [class*="template-card"], [role="button"]:has(img)');
    const count = await cards.count();
    console.log(`Found ${count} template-like elements`);
    if (count > 0) {
      await cards.first().click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${DIR}/07-template-clicked.png`, fullPage: false });
      console.log('📸 07 — Template clicked');
    }
  }

  // 7. Look for chat input — might need to send a message to proceed
  const chatInput = page.locator('textarea').first();
  if (await chatInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await page.screenshot({ path: `${DIR}/08-chat-input.png`, fullPage: false });
    console.log('📸 08 — Chat input visible');
  }

  // 8. Screenshot every 10s for up to 2 min to capture build progress
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(10000);
    await page.screenshot({ path: `${DIR}/09-progress-${String(i).padStart(2, '0')}.png`, fullPage: false });
    console.log(`📸 09.${i} — Progress check`);

    // Check for completion indicators
    const done = await page.locator('text=/ready/i, text=/preview.*ready/i, text=/your.*site.*is/i, iframe[src*="daytona"]').first().isVisible({ timeout: 1000 }).catch(() => false);
    if (done) {
      console.log('✅ Build complete!');
      break;
    }
  }

  // 10. Final state
  await page.screenshot({ path: `${DIR}/10-final.png`, fullPage: false });
  console.log('📸 10 — Final');

  // Cleanup
  await e2eFetch(`${BASE}/api/projects/${projectId}`, { method: 'DELETE' }).catch(() => {});
  console.log('🧹 Cleaned up');
});
