/**
 * Cross-App E2E Helpers — Real APIs, No Mocks
 *
 * Auth: Dev-only E2E bypass via X-E2E-Secret header (requireAuth in api-auth.ts).
 *       Safe — guarded by secret + NODE_ENV !== 'production'. Never reaches prod.
 *
 * Everything else is real:
 *   ✅ Supabase (prod DB for now; separate dev instance added later)
 *   ✅ Convex dev (outstanding-otter-369)
 *   ✅ Claude AI — real site generation (credits used intentionally)
 *   ✅ Daytona — real sandbox provisioning
 *   ✅ /api/build, /api/agent-code, /api/ai/enrich-project — all real
 */

import { type Page } from '@playwright/test';
import { createHmac } from 'crypto';
import { config } from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../.env') });
config({ path: path.resolve(__dirname, '../../.env.local'), override: true });

export const BASE   = process.env.E2E_BASE_URL   || 'https://flowstarter.dev';
export const EDITOR = process.env.E2E_EDITOR_URL  || 'https://editor.flowstarter.dev';

export const HANDOFF_SECRET = process.env.HANDOFF_SECRET ||
  '9c5ff35ecdf4c9699e4749c408c1ee6bbad51552c8e66cb8e008f5c13ae48e9c';

const E2E_SECRET  = process.env.E2E_SECRET  || '';
const E2E_USER_ID = process.env.E2E_USER_ID || 'user_3AeSkinjvy9jZkCFvkupD9I06PG';

if (!E2E_SECRET) {
  console.warn('[helpers] E2E_SECRET not set — authenticated API calls will fail');
}

// ─── Test data ────────────────────────────────────────────────────────────────

const RUN_ID = Date.now().toString(36).slice(-6);
export { RUN_ID };

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

// ─── Direct API calls with E2E secret header ──────────────────────────────────
// No browser session required. The server's requireAuth() checks this header
// before falling back to Clerk session — only active in NODE_ENV !== 'production'.

export async function e2eFetch(
  url: string,
  options: { method?: string; body?: object; extraHeaders?: Record<string, string> } = {}
): Promise<{ status: number; body: unknown }> {
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-e2e-secret': E2E_SECRET,
      'x-e2e-user-id': E2E_USER_ID,
      ...options.extraHeaders,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let body: unknown;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}

// ─── Browser-based fetch (for tests that need real Clerk session in-browser) ──

export async function browserFetch(
  page: Page,
  url: string,
  options: { method?: string; body?: object } = {}
): Promise<{ status: number; body: unknown }> {
  return page.evaluate(
    async ({ url, method, body, secret, userId }: {
      url: string; method: string; body?: string;
      secret: string; userId: string;
    }) => {
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-e2e-secret': secret,
          'x-e2e-user-id': userId,
        },
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
      secret: E2E_SECRET,
      userId: E2E_USER_ID,
    }
  );
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

export async function cleanupProject(projectId: string) {
  if (!projectId) return;
  try {
    const result = await e2eFetch(`${BASE}/api/projects/${projectId}`, { method: 'DELETE' });
    console.log('[cleanup] Deleted project', projectId, '→ status:', result.status);
  } catch (e) {
    console.warn('[cleanup] Failed to delete project', projectId, e);
  }
}
