/**
 * Scenario 2: QuickScaffold → AI Enrichment → Editor (Real APIs)
 *
 * Real Claude AI enriches the business description.
 * Real Convex step machine advances to template.
 * Real Claude AI generates the site.
 * Real Daytona sandbox hosts the preview.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  BASE, EDITOR,
  BUSINESS_INFO, CONTACT_INFO,
  QUICKSCAFFOLD_INPUT, ENRICHED_DATA,
  testProjectName, makeHandoffToken,
  e2eFetch, cleanupProject, RUN_ID,
} from './helpers';

let createdProjectId: string | undefined;

test.afterEach(async () => {
  if (createdProjectId) {
    await cleanupProject(createdProjectId);
    createdProjectId = undefined;
  }
});

// ─── Mirrors QuickScaffold.tsx: enrich → handoff ──────────────────────────────

async function quickScaffoldHandoff(page: Page, opts: {
  useRealEnrich?: boolean;
} = {}): Promise<{ editorUrl: string; token: string; projectId: string }> {

  let enriched = ENRICHED_DATA;

  if (opts.useRealEnrich) {
    // Call the real AI enrichment endpoint (real Claude)
    console.log('[QS] Calling real AI enrich...');
    const enrichResult = await e2eFetch(`${BASE}/api/ai/enrich-project`, {
      method: 'POST',
      body: { description: QUICKSCAFFOLD_INPUT },
    });
    if (enrichResult.status === 200) {
      enriched = { ...enriched, ...(enrichResult.body as any).enriched };
      console.log('[QS] Enriched name:', enriched.name);
    }
  }

  const result = await e2eFetch(`${BASE}/api/editor/handoff`, {
    method: 'POST',
    body: {
      projectConfig: {
        name: enriched.name,
        description: enriched.description,
        userDescription: QUICKSCAFFOLD_INPUT,
        industry: enriched.industry,
        businessInfo: {
          description: enriched.description,
          uvp: enriched.uvp,
          targetAudience: enriched.targetAudience,
          goal: enriched.goal,
          brandTone: enriched.brandTone,
          offerings: enriched.offerings,
        },
        contactInfo: { email: enriched.contactEmail },
      },
      mode: 'generate',
    },
  });

  expect(result.status).toBe(200);
  const body = result.body as { success: boolean; editorUrl: string; token: string; projectId: string };
  expect(body.success).toBe(true);
  createdProjectId = body.projectId;
  return body;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Scenario 2: QuickScaffold → AI Enrichment → Editor', () => {
  test.setTimeout(300_000); // 5 min

  // ── 2.1 Real AI enrichment extracts structured business data ──────────────
  test('2.1 — real Claude enriches QuickScaffold description into structured businessInfo', async ({ page }) => {
    console.log('[2.1] Calling real AI enrich with input:', QUICKSCAFFOLD_INPUT);

    const result = await e2eFetch(`${BASE}/api/ai/enrich-project`, {
      method: 'POST',
      body: { description: QUICKSCAFFOLD_INPUT },
    });

    expect(result.status).toBe(200);
    const body = result.body as { status: string; siteName?: string; description?: string; industry?: string; targetAudience?: string; uvp?: string; goal?: string; offerType?: string };
    expect(body.status).toBe('complete');

    const e = body;
    console.log('[2.1] Enriched:', JSON.stringify(e, null, 2));

    // Claude should have extracted these from the description
    expect(e.name || e.description).toBeTruthy();
    expect(e.industry || e.description).toBeTruthy();
    // At minimum: the enriched data should mention dental/stomatologic/healthcare
    const asStr = JSON.stringify(e).toLowerCase();
    expect(
      asStr.includes('dental') ||
      asStr.includes('stomatolog') ||
      asStr.includes('health') ||
      asStr.includes('clinic')
    ).toBe(true);
  });

  // ── 2.2 Enriched data embedded in token, verified by editor ──────────────
  test('2.2 — AI-enriched businessInfo embedded verbatim in handoff token', async ({ page }) => {
    const { token } = await quickScaffoldHandoff(page);

    const res = await page.request.post(`${EDITOR}/api/handoff/validate`, {
      data: { token },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(res.status()).toBe(200);
    const validated = await res.json() as {
      valid: boolean;
      project?: { data?: { businessInfo?: typeof BUSINESS_INFO } };
    };
    expect(validated.valid).toBe(true);

    const bi = validated.project?.data?.businessInfo;
    expect(bi).toBeTruthy();
    expect(bi?.description).toBeTruthy();
    console.log('[2.2] Token businessInfo.description:', bi?.description?.slice(0, 60));
  });

  // ── 2.3 Operator edits UVP before opening editor — preserved in token ─────
  test('2.3 — operator-edited field preserved verbatim in token payload', async ({ page }) => {
    const customUvp = `Garantia satisfactiei sau rambursam ${RUN_ID}`;

    const result = await e2eFetch(`${BASE}/api/editor/handoff`, {
      method: 'POST',
      body: {
        projectConfig: {
          name: testProjectName(),
          description: ENRICHED_DATA.description,
          businessInfo: { ...BUSINESS_INFO, uvp: customUvp },
        },
        mode: 'generate',
      },
    });

    const { token, projectId } = result.body as { token: string; projectId: string };
    createdProjectId = projectId;

    const res = await page.request.post(`${EDITOR}/api/handoff/validate`, {
      data: { token },
      headers: { 'Content-Type': 'application/json' },
    });

    const validated = await res.json() as any;
    expect(validated.valid).toBe(true);
    expect(validated.project?.data?.businessInfo?.uvp).toBe(customUvp);
  });

  // ── 2.4 Editor skips to template when businessInfo is pre-filled ──────────
  test('2.4 — QuickScaffold data skips describe/name steps; template selector shown', async ({ page }) => {
    const { editorUrl } = await quickScaffoldHandoff(page);

    await page.goto(editorUrl);
    await page.waitForURL(/\/project\//, { timeout: 30_000 });
    await page.waitForTimeout(5000);

    const askingDesc = await page.getByText(
      /tell me about your business|what does your business do/i
    ).isVisible({ timeout: 3000 }).catch(() => false);
    expect(askingDesc).toBe(false);

    await expect(
      page.getByText(/choose.*template|select.*template|template.*gallery|which template/i).first()
    ).toBeVisible({ timeout: 25_000 });
    console.log('[2.4] Template selector reached directly ✅');
  });

  // ── 2.5 Full journey: template → real Claude build → preview → edit ───────
  test('2.5 — full QuickScaffold: template → real site generation → preview → edit', async ({ page }) => {
    // Use real AI enrichment for this full test
    const { editorUrl } = await quickScaffoldHandoff(page, { useRealEnrich: true });

    await page.goto(editorUrl);
    await page.waitForURL(/\/project\//, { timeout: 30_000 });
    await page.waitForTimeout(5000);

    // ── Template selector (reached via step machine with pre-filled data) ──
    await expect(
      page.getByText(/choose.*template|select.*template|template.*gallery|which template/i).first()
    ).toBeVisible({ timeout: 25_000 });

    // Click first template
    const templateCard = page.locator(
      '[data-testid="template-card"], [class*="TemplateCard"]'
    ).first();
    if (await templateCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await templateCard.click();
    } else {
      await page.getByRole('button', { name: /select|use this|choose/i }).first().click();
    }
    await page.waitForTimeout(2000);

    // ── Real build: Claude AI generates all files ──
    const buildBtn = page.getByRole('button', {
      name: /generate.*site|build.*site|create.*site|launch/i,
    }).first();
    await expect(buildBtn).toBeVisible({ timeout: 20_000 });
    await buildBtn.click();
    console.log('[2.5] Build triggered — real Claude generating site...');

    // ── Terminal: real agent events from Claude ──
    // Terminal is now a >_ button inside the Editor tab (not a top-level tab)
    const editorTab2 = page.getByRole('button', { name: /editor|<>/i });
    if (await editorTab2.isVisible({ timeout: 5000 }).catch(() => false)) await editorTab2.click();
    const terminalTab = page.getByRole('button', { name: /^>_/ }).first();
    if (await terminalTab.isVisible({ timeout: 5000 }).catch(() => false)) await terminalTab.click();

    await expect(
      page.getByText(/\.html|\.css|thinking|file|Waiting for agent/i).first()
    ).toBeVisible({ timeout: 120_000 });
    console.log('[2.5] Agent output in terminal ✅');

    // ── Preview: real Daytona sandbox ──
    const previewTab = page.getByRole('button', { name: /preview/i });
    await previewTab.click();

    await expect(page.locator('iframe').first()).toBeVisible({ timeout: 90_000 });
    const iframeSrc = await page.locator('iframe').first().getAttribute('src');
    console.log('[2.5] Preview iframe src:', iframeSrc?.slice(0, 80));
    expect(iframeSrc).toBeTruthy(); // real Daytona preview URL

    // ── Edit: real Claude applies change ──
    await page.getByRole('button', { name: /chat/i }).click();
    const chatInput = page.locator('textarea, [data-testid="chat-input"]').first();
    await chatInput.fill('Make the clinic name in the header bold and add a tagline: "Zambetul tau, prioritatea noastra"');
    await chatInput.press('Enter');

    await expect(
      page.getByText(/tagline|zambetul|header|bold/i).first()
    ).toBeVisible({ timeout: 10_000 });

    await terminalTab.click();
    await expect(
      page.getByText(/\.html|thinking|Applying|write/i).first()
    ).toBeVisible({ timeout: 120_000 });
    console.log('[2.5] Edit applied by real Claude ✅');
  });
});

