/**
 * Scenario 2: QuickScaffold AI Enrichment → Review → Editor (Real Domain)
 *
 * Tests the QuickScaffold path: operator types a short description,
 * AI enriches it into structured business data (mocked — expensive),
 * operator reviews/edits, clicks "Open in Editor".
 * Editor receives full businessInfo → skips straight to template selection
 * → operator picks template → (mocked) site generation → editing.
 */

import { test, expect, type Page } from '@playwright/test';
import {
  BASE,
  EDITOR,
  BUSINESS_INFO,
  CONTACT_INFO,
  QUICKSCAFFOLD_INPUT,
  ENRICHED_DATA,
  testProjectName,
  makeHandoffToken,
  mockExpensiveServices,
  mockAgentEditSSE,
  mockAIEnrich,
  cleanupProject,
} from './helpers';

// ─── Shared cleanup ───────────────────────────────────────────────────────────

let createdProjectId: string | undefined;

test.afterEach(async ({ page }) => {
  if (createdProjectId) {
    await cleanupProject(page, createdProjectId);
    createdProjectId = undefined;
  }
});

// ─── Helper: QuickScaffold → handoff (mirrors what the dashboard does) ────────

async function quickScaffoldHandoff(page: Page): Promise<{
  editorUrl: string; token: string; projectId: string;
}> {
  // The dashboard calls /api/ai/enrich-project first (we mock that),
  // then calls /api/editor/handoff with the enriched data.
  const res = await page.request.post(`${BASE}/api/editor/handoff`, {
    data: {
      projectConfig: {
        name: ENRICHED_DATA.name,
        description: ENRICHED_DATA.description,
        userDescription: QUICKSCAFFOLD_INPUT,
        industry: ENRICHED_DATA.industry,
        businessInfo: {
          description: ENRICHED_DATA.description,
          uvp: ENRICHED_DATA.uvp,
          targetAudience: ENRICHED_DATA.targetAudience,
          goal: ENRICHED_DATA.goal,
          brandTone: ENRICHED_DATA.brandTone,
          offerings: ENRICHED_DATA.offerings,
        },
        contactInfo: { email: ENRICHED_DATA.contactEmail },
      },
      mode: 'generate',
    },
    headers: { 'Content-Type': 'application/json' },
  });

  expect(res.status()).toBe(200);
  const body = await res.json() as {
    success: boolean; editorUrl: string; token: string; projectId: string;
  };
  expect(body.success).toBe(true);
  createdProjectId = body.projectId;
  return body;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Scenario 2: QuickScaffold → AI Enrichment → Editor', () => {
  test.setTimeout(120_000);

  // ── 2.1 Enriched data is embedded in the handoff token ───────────────────
  test('2.1 — QuickScaffold handoff embeds AI-enriched businessInfo in token', async ({ page }) => {
    const { token } = await quickScaffoldHandoff(page);

    const validateRes = await page.request.post(`${EDITOR}/api/handoff/validate`, {
      data: { token },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(validateRes.status()).toBe(200);
    const validated = await validateRes.json() as {
      valid: boolean;
      project?: { data?: { businessInfo?: typeof BUSINESS_INFO } };
    };

    expect(validated.valid).toBe(true);

    const bi = validated.project?.data?.businessInfo as typeof BUSINESS_INFO | undefined;
    expect(bi?.description).toBe(ENRICHED_DATA.description);
    expect(bi?.uvp).toBe(ENRICHED_DATA.uvp);
    expect(bi?.targetAudience).toBe(ENRICHED_DATA.targetAudience);
    expect(bi?.goal).toBe(ENRICHED_DATA.goal);
  });

  // ── 2.2 Operator edits AI field → modification preserved in token ─────────
  test('2.2 — operator-edited UVP is preserved verbatim in token payload', async ({ page }) => {
    const operatorUvp = 'Aparatura de ultima generatie + garantia satisfactiei';

    const res = await page.request.post(`${BASE}/api/editor/handoff`, {
      data: {
        projectConfig: {
          name: testProjectName(),
          description: ENRICHED_DATA.description,
          businessInfo: {
            ...BUSINESS_INFO,
            uvp: operatorUvp, // ← operator overrode the AI suggestion
          },
        },
        mode: 'generate',
      },
      headers: { 'Content-Type': 'application/json' },
    });

    const { token, projectId } = await res.json() as { token: string; projectId: string };
    createdProjectId = projectId;

    const validateRes = await page.request.post(`${EDITOR}/api/handoff/validate`, {
      data: { token },
      headers: { 'Content-Type': 'application/json' },
    });

    const validated = await validateRes.json() as {
      valid: boolean;
      project?: { data?: { businessInfo?: { uvp?: string } } };
    };

    expect(validated.valid).toBe(true);
    expect(validated.project?.data?.businessInfo?.uvp).toBe(operatorUvp);
  });

  // ── 2.3 Editor skips to template when businessInfo is pre-filled ──────────
  test('2.3 — QuickScaffold editor skips describe/name steps, shows template selector', async ({ page }) => {
    const { editorUrl } = await quickScaffoldHandoff(page);

    await mockExpensiveServices(page, ENRICHED_DATA.name);
    await page.goto(editorUrl);
    await page.waitForURL(/\/project\//, { timeout: 20_000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // useWelcomeInit + step advance

    // Must NOT be asking for business description (already provided)
    const askingForDesc = await page.getByText(
      /tell me about your business|what does your business do/i
    ).isVisible({ timeout: 3000 }).catch(() => false);
    expect(askingForDesc).toBe(false);

    // Template selector must appear
    await expect(
      page.getByText(/choose.*template|select.*template|template.*gallery|which template/i).first()
    ).toBeVisible({ timeout: 20_000 });
  });

  // ── 2.4 Full QuickScaffold journey: template → build → edit ──────────────
  test('2.4 — full QuickScaffold flow: template selected → site built → edited', async ({ page }) => {
    const { editorUrl } = await quickScaffoldHandoff(page);

    await mockExpensiveServices(page, ENRICHED_DATA.name);
    await mockAgentEditSSE(page, 'Make hero headline bold');

    // ── Navigate ──
    await page.goto(editorUrl);
    await page.waitForURL(/\/project\//, { timeout: 20_000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // ── Step 1: Template selector must appear (businessInfo was pre-filled) ──
    await expect(
      page.getByText(/choose.*template|select.*template|template.*gallery|which template/i).first()
    ).toBeVisible({ timeout: 25_000 });

    // Click first template card
    const templateCard = page.locator('[data-testid="template-card"], [class*="TemplateCard"], [class*="template-card"]').first();
    if (await templateCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await templateCard.click();
      await page.waitForTimeout(1500);
    } else {
      // Fallback: click the first visible template option
      const templateOption = page.getByRole('button', { name: /select|use this|choose/i }).first();
      if (await templateOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await templateOption.click();
      }
    }

    // ── Step 2: Build trigger ──
    const buildBtn = page.getByRole('button', {
      name: /generate.*site|build.*site|create.*site|launch/i,
    }).first();
    await expect(buildBtn).toBeVisible({ timeout: 15_000 });
    await buildBtn.click();

    // ── Step 3: Terminal shows agent activity from mocked SSE ──
    const terminalTab = page.getByRole('button', { name: /terminal/i });
    await expect(terminalTab).toBeVisible({ timeout: 10_000 });
    await terminalTab.click();

    await expect(
      page.getByText(/index\.html|styles\.css|script\.js|Waiting for agent/i).first()
    ).toBeVisible({ timeout: 15_000 });

    // ── Step 4: Preview tab shows the generated site ──
    const previewTab = page.getByRole('button', { name: /preview/i }).first();
    await expect(previewTab).toBeVisible({ timeout: 5000 });
    await previewTab.click();

    // The preview area should show content (iframe or generated HTML)
    await expect(
      page.locator('iframe[src*="preview"], iframe[src*="daytona"], [data-testid="preview"]').first()
    ).toBeVisible({ timeout: 10_000 });

    // ── Step 5: Edit via chat ──
    const chatTab = page.getByRole('button', { name: /chat/i });
    await chatTab.click();

    const chatInput = page.locator('textarea, [data-testid="chat-input"]').first();
    await expect(chatInput).toBeVisible({ timeout: 8000 });

    await chatInput.fill('Make the hero headline bold and larger');
    await chatInput.press('Enter');

    // Edit request appears in chat history
    await expect(
      page.getByText(/hero.*headline|headline.*bold|bold.*larger/i).first()
    ).toBeVisible({ timeout: 8000 });

    // Agent edit SSE fires — terminal should update
    await terminalTab.click();
    await expect(
      page.getByText(/Applying|index\.html|thinking/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
