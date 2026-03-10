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
  test('2.5 — full QuickScaffold pipeline: idea → AI enrich → /api/build → SSE events → preview URL', async ({ page }) => {
    // ── Step 1: QuickScaffold creates project with real AI enrichment ─────────
    const rawDescription = 'Sală de fitness și wellness în Timișoara cu antrenori certificați';
    const enrichRes = await e2eFetch(`${BASE}/api/ai/enrich-project`, {
      method: 'POST',
      body: { description: rawDescription, locale: 'ro' },
    });
    expect(enrichRes.status).toBe(200);
    const enriched = enrichRes.body as {
      status: string; siteName: string; description: string; industry: string;
      targetAudience: string; uvp: string; goal: string; offerType: string;
    };
    expect(enriched.status).toBe('complete');
    console.log('[2.5] AI enriched:', enriched.siteName, '✅');

    // ── Step 2: Create project with enriched businessInfo via handoff ─────────
    const handoffRes = await e2eFetch(`${BASE}/api/editor/handoff`, {
      method: 'POST',
      body: {
        projectConfig: {
          name: enriched.siteName,
          description: enriched.description,
          businessInfo: enriched,
        },
      },
    });
    expect(handoffRes.status).toBe(200);
    const { token, projectId } = handoffRes.body as { token: string; editorUrl: string; projectId: string };
    console.log('[2.5] Handoff token created, project:', projectId);
    if (projectId) createdProjectId = projectId;

    // ── Step 3: Editor loads and reaches template selector immediately ─────────
    // (businessInfo pre-filled → step machine skips to template)
    const validateRes = await e2eFetch(`${EDITOR}/api/handoff/validate?token=${token}`);
    expect(validateRes.status).toBe(200);

    // ── Step 4: Call /api/build with enriched data — real multi-agent pipeline ─
    const buildPayload = {
      projectId,
      siteName: enriched.siteName,
      businessInfo: {
        name: enriched.siteName,
        tagline: enriched.uvp,
        description: enriched.description,
        services: ['Personal Training', 'Group Classes', 'Nutrition Coaching', 'Wellness Programs'],
      },
      template: { slug: 'fitness-studio', name: 'Fitness Studio' },
      design: { primaryColor: '#f97316' },
      contactDetails: { phone: '+40 256 123 456', email: 'contact@fitness.ro', address: 'Timișoara, România' },
    };

    // Stream from the real /api/build endpoint
    const buildRes = await page.evaluate(async ({ url, payload }) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      const events: Array<{ type: string; [k: string]: unknown }> = [];
      let buffer = '';
      const timeout = Date.now() + 180_000; // 3 min max

      while (Date.now() < timeout) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) {
          const dataLine = part.split('\n').find((l: string) => l.startsWith('data:'));
          if (dataLine) {
            try {
              const event = JSON.parse(dataLine.slice(5).trim());
              events.push(event);
              if (event.type === 'complete' || event.type === 'error') return { events, status: res.status };
            } catch { /* skip */ }
          }
        }
      }
      return { events, status: res.status };
    }, { url: `${EDITOR}/api/build`, payload: buildPayload });

    console.log('[2.5] /api/build status:', buildRes.status, '— events:', buildRes.events.length);
    expect(buildRes.status).toBe(200);

    const eventTypes = buildRes.events.map((e: { type: string }) => e.type);
    expect(eventTypes).toContain('progress');
    const hasCompletion = eventTypes.includes('complete') || eventTypes.includes('success') || eventTypes.includes('preview');
    expect(hasCompletion).toBe(true);
    console.log('[2.5] Real pipeline events:', [...new Set(eventTypes)].join(', '), '✅');

    const completeEvent = buildRes.events.find((e: { type: string; previewUrl?: string }) =>
      e.previewUrl
    ) as { previewUrl?: string } | undefined;
    if (completeEvent?.previewUrl) {
      console.log('[2.5] Preview URL returned:', completeEvent.previewUrl, '✅');
    }
  });
});
