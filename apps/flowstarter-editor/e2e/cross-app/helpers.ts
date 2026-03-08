/**
 * Cross-App E2E Helpers — Real Domain
 *
 * Mock philosophy (against flowstarter.dev):
 *   ✅ Real: Clerk auth (session from global-setup), Supabase, Convex WS,
 *            handoff token generation + validation, step machine
 *   🚫 Mocked (browser-level SSE intercept): Daytona sandboxes, Claude AI
 *      These are mocked because they're expensive/non-deterministic.
 *      The API routes (/api/build, /api/agent-code) are Remix routes that
 *      the browser calls — page.route() intercepts them before they hit the server.
 */

import { type Page, type Route } from '@playwright/test';
import { createHmac } from 'crypto';

// ─── URLs ─────────────────────────────────────────────────────────────────────

export const BASE   = process.env.E2E_BASE_URL   || 'https://flowstarter.dev';
export const EDITOR = process.env.E2E_EDITOR_URL  || 'https://editor.flowstarter.dev';
export const HANDOFF_SECRET = process.env.HANDOFF_SECRET ||
  '9c5ff35ecdf4c9699e4749c408c1ee6bbad51552c8e66cb8e008f5c13ae48e9c';

// ─── Test data ────────────────────────────────────────────────────────────────
// Uses a unique suffix per test run to avoid Supabase collisions.

const RUN_ID = Date.now().toString(36).slice(-5);

export function testProjectName() {
  return `E2E Dental Clinic ${RUN_ID}`;
}

export const BUSINESS_INFO = {
  description: 'Aesthetic dental clinic in Cluj-Napoca serving professionals aged 28-55',
  uvp: 'Pain-free treatments with same-day appointments and premium materials',
  targetAudience: 'Professionals in Cluj-Napoca aged 28-55',
  goal: 'bookings',
  brandTone: 'professional',
  industry: 'Healthcare',
  offerings: 'Aesthetic dentistry, whitening, implants, orthodontics',
};

export const CONTACT_INFO = {
  email: 'contact@drelena-e2e.ro',
  phone: '+40741000001',
  address: 'Str. Memo 10, Cluj-Napoca',
};

export const QUICKSCAFFOLD_INPUT =
  `Cabinet stomatologic estetic in Cluj-Napoca, Dr. Elena Popescu ${RUN_ID}`;

export const ENRICHED_DATA = {
  name: testProjectName(),
  industry: 'Healthcare / Dental',
  description: BUSINESS_INFO.description,
  targetAudience: BUSINESS_INFO.targetAudience,
  uvp: BUSINESS_INFO.uvp,
  goal: BUSINESS_INFO.goal,
  brandTone: BUSINESS_INFO.brandTone,
  offerings: BUSINESS_INFO.offerings,
  contactEmail: CONTACT_INFO.email,
};

// ─── Token helper (same HMAC as production route) ─────────────────────────────

export function makeHandoffToken(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', HANDOFF_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

// ─── Created resource tracker (for cleanup) ───────────────────────────────────

export const createdResources: { projectId?: string; convexConvId?: string }[] = [];

// ─── Mock: Daytona + Claude AI (expensive server-side services) ───────────────
// The browser calls /api/build and /api/agent-code as SSE streams.
// page.route() intercepts these before they hit the Remix server handlers.

function agentSse(agentEvents: object[], finalEvent: object): string {
  return [
    ...agentEvents.map(e => `event: agent-event\ndata: ${JSON.stringify(e)}\n\n`),
    `data: ${JSON.stringify(finalEvent)}\n\n`,
  ].join('');
}

export async function mockBuildSSE(page: Page, projectName: string) {
  await page.route(`${EDITOR}/api/build`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      body: agentSse(
        [
          { type: 'thinking', text: `Planning ${projectName} website...` },
          { type: 'file_write', path: 'src/index.html', lines: 215 },
          { type: 'file_write', path: 'src/styles.css', lines: 98 },
          { type: 'file_write', path: 'src/script.js', lines: 44 },
          { type: 'sandbox_status', message: 'Installing dependencies...' },
          { type: 'sandbox_output', line: 'bun install v1.2.1', stream: 'stdout' },
          { type: 'sandbox_exit', code: 0, cmd: 'bun install' },
          { type: 'done', duration_ms: 19_200, turns: 6, cost_usd: 0.31, input_tokens: 4_400, output_tokens: 1_900 },
        ],
        {
          type: 'complete',
          result: {
            success: true,
            files: [
              { path: 'src/index.html', content: `<html><body><h1>${projectName}</h1><p>${BUSINESS_INFO.description}</p></body></html>` },
              { path: 'src/styles.css', content: 'body{font-family:sans-serif;color:#333}' },
            ],
            preview: { url: `${EDITOR}/preview/e2e-sandbox`, sandboxId: 'sb-e2e-mock' },
          },
        }
      ),
    });
  });
}

export async function mockAgentEditSSE(page: Page, changeDescription: string) {
  await page.route(`${EDITOR}/api/agent-code`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      body: agentSse(
        [
          { type: 'thinking', text: `Applying: ${changeDescription}` },
          { type: 'file_write', path: 'src/index.html', lines: 218 },
          { type: 'done', duration_ms: 4_100, turns: 2, cost_usd: 0.09, input_tokens: 950, output_tokens: 340 },
        ],
        { type: 'result', success: true }
      ),
    });
  });
}

export async function mockDaytonaPushFile(page: Page) {
  await page.route(`${EDITOR}/api/daytona/push-file`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

export async function mockAIEnrich(page: Page) {
  await page.route(`${BASE}/api/ai/enrich-project`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, enriched: ENRICHED_DATA }),
    });
  });
}

// ─── Setup expensive-service mocks ───────────────────────────────────────────

export async function mockExpensiveServices(page: Page, projectName = testProjectName()) {
  await mockBuildSSE(page, projectName);
  await mockDaytonaPushFile(page);
  await mockAIEnrich(page);
}

// ─── Cleanup helper ───────────────────────────────────────────────────────────
// Deletes test projects from Supabase via the main platform's API.
// Called in test.afterEach to keep the DB clean.

export async function cleanupProject(page: Page, projectId: string) {
  if (!projectId) return;
  try {
    await page.request.delete(`${BASE}/api/projects/${projectId}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('[cleanup] Deleted project', projectId);
  } catch (e) {
    console.warn('[cleanup] Failed to delete project', projectId, e);
  }
}
