/**
 * Cross-App E2E Helpers — Real APIs, No Mocks
 *
 * Everything is real:
 *   ✅ Clerk auth (session from global-setup)
 *   ✅ Supabase dev instance (project creation + cleanup)
 *   ✅ Convex dev instance (outstanding-otter-369)
 *   ✅ Claude AI — real site generation (credits burned intentionally)
 *   ✅ Daytona sandboxes — real provisioning
 *   ✅ /api/build SSE — real streaming agent output
 *   ✅ /api/agent-code SSE — real edit pipeline
 *
 * Nothing is mocked. Tests are true E2E.
 */

import { type Page } from '@playwright/test';
import { createHmac } from 'crypto';

export const BASE   = process.env.E2E_BASE_URL   || 'https://flowstarter.dev';
export const EDITOR = process.env.E2E_EDITOR_URL  || 'https://editor.flowstarter.dev';
export const HANDOFF_SECRET = process.env.HANDOFF_SECRET ||
  '9c5ff35ecdf4c9699e4749c408c1ee6bbad51552c8e66cb8e008f5c13ae48e9c';

// ─── Test data ────────────────────────────────────────────────────────────────
// Unique suffix per run prevents Supabase collisions across parallel runs.

const RUN_ID = Date.now().toString(36).slice(-6);

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

// ─── HMAC token helper ────────────────────────────────────────────────────────

export function makeHandoffToken(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig  = createHmac('sha256', HANDOFF_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

// ─── Authenticated fetch via browser context ──────────────────────────────────
// page.evaluate(fetch) uses the browser's real cookie jar — required for Clerk auth.

export async function authenticatedFetch(
  page: Page,
  url: string,
  options: { method?: string; body?: object } = {}
): Promise<{ status: number; body: unknown }> {
  // Ensure we're on the main platform domain so cookies are sent
  if (!page.url().startsWith(BASE)) {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  }

  return page.evaluate(
    async ({ url, method, body }: { url: string; method: string; body?: string }) => {
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      const text = await res.text();
      let parsed: unknown;
      try { parsed = JSON.parse(text); } catch { parsed = text; }
      return { status: res.status, body: parsed };
    },
    {
      url,
      method: options.method || 'GET',
      body: options.body ? JSON.stringify(options.body) : undefined,
    }
  );
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

export async function cleanupProject(page: Page, projectId: string) {
  if (!projectId) return;
  try {
    const result = await authenticatedFetch(page, `${BASE}/api/projects/${projectId}`, {
      method: 'DELETE',
    });
    console.log('[cleanup] Deleted project', projectId, 'status:', result.status);
  } catch (e) {
    console.warn('[cleanup] Failed to delete project', projectId, e);
  }
}
