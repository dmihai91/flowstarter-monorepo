/**
 * Cross-App E2E Helpers
 *
 * Shared mocks and utilities for tests that span main platform + editor.
 *
 * Mock philosophy:
 *   ✅ Mock: Clerk auth, Supabase REST, Convex WS, Daytona cloud, Claude AI
 *   ❌ Do NOT mock: Handoff token generation/validation, routing logic,
 *                   step machine, business data flow, project name preservation
 *
 * The handoff token lifecycle is fully real:
 *   Main platform POST → HMAC-signed token (self-contained) → editor validates locally
 */

import { type Page, type Route } from '@playwright/test';
import { createHmac } from 'crypto';

// ─── Constants ────────────────────────────────────────────────────────────────

export const MAIN = 'http://localhost:3000';
export const EDITOR = 'http://localhost:5173';
export const HANDOFF_SECRET = process.env.HANDOFF_SECRET || '9c5ff35ecdf4c9699e4749c408c1ee6bbad51552c8e66cb8e008f5c13ae48e9c';

export const MOCK_USER = {
  id: 'user_team_e2e_01',
  email: 'team@flowstarter.dev',
  firstName: 'Darius',
  lastName: 'Test',
};

export const MOCK_PROJECT = {
  id: 'a1b2c3d4-0001-0002-0003-e2e000000001',
  name: 'Dr. Elena Dental',
  description: 'Premium dental clinic in Cluj focused on aesthetic dentistry',
  businessInfo: {
    description: 'Aesthetic dental clinic serving professionals aged 28-55',
    uvp: 'Pain-free treatments, same-day appointments, premium materials',
    targetAudience: 'Professionals in Cluj-Napoca aged 28-55',
    goal: 'bookings',
    brandTone: 'professional',
    industry: 'Healthcare',
  },
  contactInfo: {
    email: 'contact@drelena.ro',
    phone: '+40741000001',
    address: 'Str. Memo 10, Cluj-Napoca',
  },
};

export const QUICKSCAFFOLD_INPUT = 'Cabinet stomatologic estetic in Cluj-Napoca, Dr. Elena Popescu';

export const MOCK_ENRICHED = {
  name: 'Dr. Elena Dental Clinic',
  industry: 'Healthcare / Dental',
  description: MOCK_PROJECT.description,
  targetAudience: MOCK_PROJECT.businessInfo.targetAudience,
  uvp: MOCK_PROJECT.businessInfo.uvp,
  goal: 'bookings',
  brandTone: 'professional',
  offerings: 'Aesthetic dentistry, whitening, implants, orthodontics',
  contactEmail: 'contact@drelena.ro',
};

// ─── Token helpers ────────────────────────────────────────────────────────────

/** Build a valid HMAC handoff token (same algorithm as the fixed route). */
export function makeHandoffToken(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', HANDOFF_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

// ─── Clerk mock ───────────────────────────────────────────────────────────────

/**
 * Stubs Clerk on both main platform and editor.
 * Simulates an authenticated team operator — no real Clerk JWT needed.
 */
export async function mockClerkAuth(page: Page) {
  // Intercept Clerk FAPI calls
  await page.route('**/*.clerk.accounts.dev/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ response: { sessions: [] }, client: {} }),
    });
  });
  await page.route('**/clerk.flowstarter.dev/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ response: { sessions: [] }, client: {} }),
    });
  });
  await page.route('**/__clerk_db_jwt**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'mock_clerk_token' }),
    });
  });

  // Inject Clerk session into localStorage + sessionStorage before any page load
  await page.addInitScript(
    ({ userId, email }) => {
      // Simulate clerk isSignedIn by overriding useUser behavior via window hook
      (window as any).__e2e_clerk_user = { id: userId, email };
    },
    { userId: MOCK_USER.id, email: MOCK_USER.email }
  );
}

// ─── Supabase mock ────────────────────────────────────────────────────────────

/**
 * Mocks Supabase REST API calls for both apps.
 * Intercepts at the HTTP level — real Supabase URL → mock responses.
 * This lets the real API route handlers run (auth, validation, inserts)
 * while returning controlled test data.
 */
export async function mockSupabase(
  page: Page,
  opts: { projectExists?: boolean } = {}
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xxxxxxxxxxxxxxxxxxx.supabase.co';

  // Auth: mock Supabase auth endpoints (JWT verification used by requireAuthWithSupabase)
  await page.route(`${supabaseUrl}/auth/**`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock_access_token',
        user: { id: MOCK_USER.id, email: MOCK_USER.email },
      }),
    });
  });

  // REST: projects table
  await page.route(`${supabaseUrl}/rest/v1/projects**`, async (route: Route) => {
    const method = route.request().method();

    if (method === 'POST') {
      // INSERT → return new project
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: MOCK_PROJECT.id,
          name: MOCK_PROJECT.name,
          description: MOCK_PROJECT.description,
          data: JSON.stringify({
            businessInfo: MOCK_PROJECT.businessInfo,
            contactInfo: MOCK_PROJECT.contactInfo,
          }),
          user_id: MOCK_USER.id,
          status: 'draft',
          is_draft: true,
        }]),
      });
    } else if (method === 'PATCH') {
      // UPDATE (name sync etc)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: MOCK_PROJECT.id }]),
      });
    } else {
      // SELECT
      if (opts.projectExists) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: MOCK_PROJECT.id,
            name: MOCK_PROJECT.name,
            description: MOCK_PROJECT.description,
            data: JSON.stringify({
              businessInfo: MOCK_PROJECT.businessInfo,
              contactInfo: MOCK_PROJECT.contactInfo,
            }),
            user_id: MOCK_USER.id,
            status: 'draft',
            is_draft: true,
          }]),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    }
  });
}

// ─── Convex mock (HTTP API only) ──────────────────────────────────────────────

const MOCK_CONV_ID = 'conv_e2e_cross_app_01';

export async function mockConvex(page: Page) {
  await page.route('**/api/query**', async (route: Route) => {
    const body = await route.request().postDataJSON().catch(() => ({})) as any;
    const fn = JSON.stringify(body);

    if (fn.includes('getBySupabaseId') || fn.includes('projects')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null), // fresh project, not yet in Convex
      });
    } else if (fn.includes('conversations')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    }
  }).catch(() => {});

  await page.route('**/api/mutation**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ _id: MOCK_CONV_ID }),
    });
  }).catch(() => {});

  await page.route('**/api/action**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ _id: MOCK_CONV_ID }),
    });
  }).catch(() => {});
}

// ─── Daytona mock ─────────────────────────────────────────────────────────────

export async function mockDaytona(page: Page) {
  await page.route('**/api/daytona/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        sandboxId: 'sb-e2e-test-01',
        previewUrl: 'https://e2e-preview.daytona.io',
      }),
    });
  });
  await page.route('**/api/daytona/push-file', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

// ─── AI / Claude mock ─────────────────────────────────────────────────────────

function sseStream(events: object[]): string {
  return events.map(e => `data: ${JSON.stringify(e)}\n\n`).join('');
}

function agentSseStream(agentEvents: object[], finalEvent: object): string {
  const agent = agentEvents
    .map(e => `event: agent-event\ndata: ${JSON.stringify(e)}\n\n`)
    .join('');
  return agent + `data: ${JSON.stringify(finalEvent)}\n\n`;
}

export async function mockBuild(page: Page) {
  await page.route('**/api/build', async (route: Route) => {
    const body = agentSseStream(
      [
        { type: 'thinking', text: `Planning ${MOCK_PROJECT.businessInfo.industry} website...` },
        { type: 'file_write', path: 'src/index.html', lines: 210 },
        { type: 'file_write', path: 'src/styles.css', lines: 95 },
        { type: 'file_write', path: 'src/script.js', lines: 42 },
        { type: 'sandbox_status', message: 'Installing dependencies...' },
        { type: 'sandbox_output', line: 'bun install v1.2.1', stream: 'stdout' },
        { type: 'sandbox_exit', code: 0, cmd: 'bun install' },
        {
          type: 'done',
          duration_ms: 18_400,
          turns: 6,
          cost_usd: 0.31,
          input_tokens: 4_200,
          output_tokens: 1_800,
        },
      ],
      {
        type: 'complete',
        result: {
          success: true,
          files: [
            { path: 'src/index.html', content: `<html><body><h1>${MOCK_PROJECT.name}</h1></body></html>` },
            { path: 'src/styles.css', content: 'body{font-family:sans-serif}' },
          ],
          preview: { url: 'https://e2e-preview.daytona.io', sandboxId: 'sb-e2e-test-01' },
        },
      }
    );

    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      body,
    });
  });
}

export async function mockEdit(page: Page, changeDescription: string) {
  await page.route('**/api/agent-code', async (route: Route) => {
    const body = agentSseStream(
      [
        { type: 'thinking', text: `Applying change: ${changeDescription}` },
        { type: 'file_write', path: 'src/index.html', lines: 214 },
        { type: 'done', duration_ms: 3_800, turns: 2, cost_usd: 0.08, input_tokens: 900, output_tokens: 320 },
      ],
      { type: 'result', success: true }
    );

    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      body,
    });
  });
}

export async function mockOnboardingChat(page: Page) {
  await page.route('**/api/onboarding-chat', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: `Perfect. I have everything I need about ${MOCK_PROJECT.name}. Let me find the best template for you.`,
      }),
    });
  });
}

export async function mockTemplateAPIs(page: Page) {
  await page.route('**/api/recommend-templates', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        recommendations: [
          {
            template: { id: 'dentist-pro', name: 'Dentist Pro', category: 'healthcare', slug: 'dentist-pro' },
            matchScore: 0.97,
            reasoning: 'Perfect match for aesthetic dental clinics',
          },
          {
            template: { id: 'clinic-clean', name: 'Clinic Clean', category: 'healthcare', slug: 'clinic-clean' },
            matchScore: 0.83,
            reasoning: 'Clean medical aesthetic with booking integration',
          },
        ],
      }),
    });
  });

  await page.route('**/api/templates**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'dentist-pro', name: 'Dentist Pro', slug: 'dentist-pro', category: 'healthcare' },
        { id: 'clinic-clean', name: 'Clinic Clean', slug: 'clinic-clean', category: 'healthcare' },
      ]),
    });
  });
}

export async function mockEditorSync(page: Page) {
  await page.route('**/api/editor/sync', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });
}

export async function mockAIEnrich(page: Page) {
  await page.route('**/api/ai/enrich-project', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, enriched: MOCK_ENRICHED }),
    });
  });
}

// ─── Setup all mocks ──────────────────────────────────────────────────────────

export async function setupAllMocks(
  page: Page,
  opts: { projectExists?: boolean } = {}
) {
  await mockClerkAuth(page);
  await mockSupabase(page, opts);
  await mockConvex(page);
  await mockDaytona(page);
  await mockBuild(page);
  await mockOnboardingChat(page);
  await mockTemplateAPIs(page);
  await mockEditorSync(page);
  await mockAIEnrich(page);
}
