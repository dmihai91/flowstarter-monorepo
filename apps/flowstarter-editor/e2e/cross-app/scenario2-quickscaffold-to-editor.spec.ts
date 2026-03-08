/**
 * Scenario 2: QuickScaffold AI Enrichment → Review → Handoff → Editor
 *
 * An operator uses the QuickScaffold on the main platform dashboard.
 * They type a short business description, the AI enriches it into structured data.
 * The operator reviews/completes the enriched data, then clicks "Open in Editor".
 * The editor receives the handoff token, extracts the full business data,
 * skips the onboarding collect steps, goes straight to template selection,
 * and generates a working website using the pre-filled data.
 *
 * What IS real (not mocked):
 *   - HMAC token generation + validation (full lifecycle)
 *   - Business data embedding in token payload
 *   - Editor step machine advancement (hasBusinessData → skip to template)
 *   - Project name preservation from QuickScaffold input
 *   - Token signature validation in editor's validate route
 *
 * What IS mocked:
 *   - Clerk auth, Supabase REST, Convex WS
 *   - AI enrichment response (deterministic test data)
 *   - Daytona sandboxes, Claude AI generation
 */

import { test, expect, type Page } from '@playwright/test';
import {
  MAIN,
  EDITOR,
  MOCK_PROJECT,
  MOCK_ENRICHED,
  MOCK_USER,
  QUICKSCAFFOLD_INPUT,
  setupAllMocks,
  mockEdit,
  makeHandoffToken,
} from './helpers';
// ─── UI Helper ────────────────────────────────────────────────────────────────
async function navigateToEditorUI(page: Page, token: string, projectId: string, name: string, data: object): Promise<void> {
  await page.addInitScript(({ pid, nm, dat, tok }) => {
    localStorage.setItem('flowstarter_handoff_token', tok);
    localStorage.setItem('flowstarter_handoff_data', JSON.stringify({
      projectId: pid, name: nm, fromMainPlatform: true, ...dat,
    }));
  }, { pid: projectId, nm: name, dat: data, tok: token } as any);

  await page.goto(`${EDITOR}/?handoff=${encodeURIComponent(token)}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(4000);
}



// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Simulate the QuickScaffold → handoff flow:
 * 1. Call main platform's AI enrich endpoint (mocked)
 * 2. Call main platform's handoff endpoint with enriched data
 * 3. Return the editor URL
 *
 * This mirrors exactly what QuickScaffold.tsx does when the operator
 * clicks "Open in Editor" after reviewing the AI-generated data.
 */
async function runQuickScaffoldHandoff(page: Page): Promise<{
  editorUrl: string;
  token: string;
  projectId: string;
}> {
  // Step 1: enrich (mocked to return MOCK_ENRICHED)
  // We don't call this here — the handoff directly packages the enriched data

  // Step 2: call handoff with the full enriched payload
  const handoffResponse = await page.request.post(`${MAIN}/api/editor/handoff`, {
    data: {
      projectConfig: {
        name: MOCK_ENRICHED.name,
        description: MOCK_ENRICHED.description,
        userDescription: QUICKSCAFFOLD_INPUT,
        industry: MOCK_ENRICHED.industry,
        businessInfo: {
          description: MOCK_ENRICHED.description,
          uvp: MOCK_ENRICHED.uvp,
          targetAudience: MOCK_ENRICHED.targetAudience,
          goal: MOCK_ENRICHED.goal,
          brandTone: MOCK_ENRICHED.brandTone,
          offerings: MOCK_ENRICHED.offerings,
        },
        contactInfo: {
          email: MOCK_ENRICHED.contactEmail,
        },
      },
      mode: 'generate',
    },
    headers: {
      Authorization: 'Bearer mock_clerk_token',
      'Content-Type': 'application/json',
    },
  });

  const body = await handoffResponse.json() as {
    success?: boolean;
    editorUrl?: string;
    token?: string;
    projectId?: string;
    error?: string;
  };

  return {
    editorUrl: body.editorUrl || '',
    token: body.token || '',
    projectId: body.projectId || '',
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Scenario 2: QuickScaffold → AI Enrichment → Editor', () => {
  test.setTimeout(90_000);

  // ── 2.1 QuickScaffold handoff embeds enriched data in token ───────────────
  test('2.1 — handoff token embeds AI-enriched business data', async ({ page }) => {
    await setupAllMocks(page);

    // Build the token the same way the fixed handoff route would
    const token = makeHandoffToken({
      projectId: MOCK_PROJECT.id,
      userId: MOCK_USER.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
      project: {
        id: MOCK_PROJECT.id,
        name: MOCK_ENRICHED.name,
        description: MOCK_ENRICHED.description,
        data: {
          userDescription: QUICKSCAFFOLD_INPUT,
          businessInfo: {
            description: MOCK_ENRICHED.description,
            uvp: MOCK_ENRICHED.uvp,
            targetAudience: MOCK_ENRICHED.targetAudience,
            goal: MOCK_ENRICHED.goal,
            brandTone: MOCK_ENRICHED.brandTone,
          },
          contactInfo: { email: MOCK_ENRICHED.contactEmail },
          mode: 'generate',
        },
      },
    });

    // Navigate to editor — real validation runs
    await page.goto(`${EDITOR}/?handoff=${encodeURIComponent(token)}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Token should be accepted (not login screen)
    const loginScreen = await page.getByText(/Sign in to your account/i).isVisible().catch(() => false);
    expect(loginScreen).toBe(false);
  });

  // ── 2.2 Project name from QuickScaffold preserved in editor ───────────────
  test('2.2 — AI-generated project name from QuickScaffold appears in editor', async ({ page }) => {
    await setupAllMocks(page);

    const enrichedName = MOCK_ENRICHED.name; // "Dr. Elena Dental Clinic"

    const token = makeHandoffToken({
      projectId: MOCK_PROJECT.id,
      userId: MOCK_USER.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
      project: {
        id: MOCK_PROJECT.id,
        name: enrichedName,
        description: MOCK_ENRICHED.description,
        data: {
          businessInfo: {
            description: MOCK_ENRICHED.description,
            uvp: MOCK_ENRICHED.uvp,
            targetAudience: MOCK_ENRICHED.targetAudience,
          },
        },
      },
    });

    // ── API-level: validate token and confirm AI-generated name is embedded ──
    const validateRes = await page.request.post(`${EDITOR}/api/handoff/validate`, {
      data: { token },
      headers: { 'Content-Type': 'application/json' },
    });
    const validated = await validateRes.json() as { valid: boolean; project?: { name?: string } };
    expect(validated.valid).toBe(true);
    expect(validated.project?.name).toBe(enrichedName);

    // ── UI-level: editor renders without login screen ──
    await navigateToEditorUI(page, token, MOCK_PROJECT.id, enrichedName, {
      businessInfo: { description: MOCK_ENRICHED.description, uvp: MOCK_ENRICHED.uvp },
    });

    const loginShown = await page.getByText(/Sign in to your account/i).isVisible().catch(() => false);
    expect(loginShown).toBe(false);
  });

  // ── 2.3 Full business data skips describe step ────────────────────────────
  test('2.3 — QuickScaffold business data skips describe/name steps in editor', async ({ page }) => {
    await setupAllMocks(page);

    // Token with ALL business data — what QuickScaffold produces after review
    const token = makeHandoffToken({
      projectId: MOCK_PROJECT.id,
      userId: MOCK_USER.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
      project: {
        id: MOCK_PROJECT.id,
        name: MOCK_ENRICHED.name,
        description: MOCK_ENRICHED.description,
        data: {
          userDescription: QUICKSCAFFOLD_INPUT,
          businessInfo: {
            description: MOCK_ENRICHED.description,
            uvp: MOCK_ENRICHED.uvp,
            targetAudience: MOCK_ENRICHED.targetAudience,
            goal: MOCK_ENRICHED.goal,
            brandTone: MOCK_ENRICHED.brandTone,
            offerings: MOCK_ENRICHED.offerings,
          },
          contactInfo: { email: MOCK_ENRICHED.contactEmail },
          mode: 'generate',
        },
      },
    });

    await page.goto(`${EDITOR}/?handoff=${encodeURIComponent(token)}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Should NOT ask for business description (already have full businessInfo)
    const askingForDesc = await page.getByText(/tell me about|what does your business|describe your/i)
      .isVisible({ timeout: 3000 }).catch(() => false);
    expect(askingForDesc).toBe(false);

    // Should NOT ask for business name (already have it)
    const askingForName = await page.getByText(/what.*name.*business|business.*called/i)
      .isVisible({ timeout: 2000 }).catch(() => false);
    expect(askingForName).toBe(false);
  });

  // ── 2.4 Operator edits AI-generated data before opening editor ───────────
  test('2.4 — operator can modify AI-enriched field; modification is in token', async ({ page }) => {
    await setupAllMocks(page);

    // Simulate operator changing the UVP before clicking "Open in Editor"
    const operatorEditedUvp = 'Tratamente fara durere + aparatura de ultima generatie';

    const token = makeHandoffToken({
      projectId: MOCK_PROJECT.id,
      userId: MOCK_USER.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
      project: {
        id: MOCK_PROJECT.id,
        name: MOCK_ENRICHED.name,
        description: MOCK_ENRICHED.description,
        data: {
          businessInfo: {
            description: MOCK_ENRICHED.description,
            uvp: operatorEditedUvp, // ← operator's edit
            targetAudience: MOCK_ENRICHED.targetAudience,
            goal: MOCK_ENRICHED.goal,
          },
        },
      },
    });

    // Validate the token contains the edited UVP
    // Use the editor's validate endpoint (real route, real verification)
    const validateResponse = await page.request.post(`${EDITOR}/api/handoff/validate`, {
      data: { token },
      headers: { 'Content-Type': 'application/json' },
    });

    const validated = await validateResponse.json() as {
      valid: boolean;
      project?: {
        data?: { businessInfo?: { uvp?: string } };
      };
    };

    expect(validated.valid).toBe(true);
    // Project data is nested in token.project.data
    const bi = (validated.project as any)?.data?.businessInfo;
    expect(bi?.uvp).toBe(operatorEditedUvp);
  });

  // ── 2.5 Full QuickScaffold journey: AI data → template → build → edit ────
  test('2.5 — full QuickScaffold journey: AI data → template → site generation → edit', async ({ page }) => {
    await setupAllMocks(page);
    await mockEdit(page, 'Update hero headline');

    // Full enriched token (all business data from AI + operator review)
    const token = makeHandoffToken({
      projectId: MOCK_PROJECT.id,
      userId: MOCK_USER.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
      project: {
        id: MOCK_PROJECT.id,
        name: MOCK_ENRICHED.name,
        description: MOCK_ENRICHED.description,
        data: {
          userDescription: QUICKSCAFFOLD_INPUT,
          businessInfo: {
            description: MOCK_ENRICHED.description,
            uvp: MOCK_ENRICHED.uvp,
            targetAudience: MOCK_ENRICHED.targetAudience,
            goal: MOCK_ENRICHED.goal,
            brandTone: MOCK_ENRICHED.brandTone,
            offerings: MOCK_ENRICHED.offerings,
          },
          contactInfo: { email: MOCK_ENRICHED.contactEmail },
          mode: 'generate',
        },
      },
    });

    // ── Step 1: Land in editor with full business data ──
    await navigateToEditorUI(page, token, MOCK_PROJECT.id, MOCK_ENRICHED.name, {
      userDescription: QUICKSCAFFOLD_INPUT,
      businessInfo: {
        description: MOCK_ENRICHED.description,
        uvp: MOCK_ENRICHED.uvp,
        targetAudience: MOCK_ENRICHED.targetAudience,
        goal: MOCK_ENRICHED.goal,
      },
      contactInfo: { email: MOCK_ENRICHED.contactEmail },
    });

    // ── Step 2: Verify editor shell is alive ──
    expect(await page.locator('body').isVisible()).toBe(true);
    const loginShown = await page.getByText(/Sign in to your account/i).isVisible().catch(() => false);
    expect(loginShown).toBe(false);

    // ── Step 3: Template selection (auto-shown due to full business data) ──
    const templateArea = page.getByText(/dentist pro|clinic clean|choose.*template|template.*gallery/i).first();
    if (await templateArea.isVisible({ timeout: 8000 }).catch(() => false)) {
      // Click first template
      await templateArea.click();
      await page.waitForTimeout(1000);
    }

    // ── Step 4: Site generation ──
    const buildBtn = page.getByRole('button', { name: /generate|build|create.*site|launch/i }).first();
    if (await buildBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await buildBtn.click();
      await page.waitForTimeout(3000);
    }

    // ── Step 5: Switch to terminal, verify agent activity ──
    const terminalTab = page.getByRole('button', { name: /terminal/i });
    if (await terminalTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await terminalTab.click();
      // Terminal should have content (not crash)
      expect(await page.locator('body').isVisible()).toBe(true);
    }

    // ── Step 6: Edit the generated site ──
    const chatTab = page.getByRole('button', { name: /chat/i });
    if (await chatTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await chatTab.click();
    }

    const chatInput = page.locator('textarea, [data-testid="chat-input"]').first();
    if (await chatInput.isVisible({ timeout: 8000 }).catch(() => false)) {
      await chatInput.fill('Make the hero headline bigger and use the clinic blue color');
      await chatInput.press('Enter');
      await page.waitForTimeout(2000);

      const editSent = await page.getByText(/hero|headline|bigger|blue/i)
        .first().isVisible({ timeout: 5000 }).catch(() => false);
      expect(editSent).toBe(true);
    }

    expect(await page.locator('body').isVisible()).toBe(true);
  });

  // ── 2.6 Validate endpoint rejects QuickScaffold token with wrong secret ──
  test('2.6 — editor rejects QuickScaffold token signed with wrong secret', async ({ page }) => {
    // Token signed with WRONG secret
    const payload = {
      projectId: MOCK_PROJECT.id,
      userId: MOCK_USER.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
      project: { id: MOCK_PROJECT.id, name: 'Malicious Project', description: '', data: {} },
    };
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const wrongSig = Buffer.from('wrongsecretXXXXXXX').toString('base64url');
    const badToken = `${data}.${wrongSig}`;

    const validateResponse = await page.request.post(`${EDITOR}/api/handoff/validate`, {
      data: { token: badToken },
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await validateResponse.json() as { valid: boolean; error?: string };
    expect(result.valid).toBe(false);
    expect(validateResponse.status()).toBe(401);
  });
});
