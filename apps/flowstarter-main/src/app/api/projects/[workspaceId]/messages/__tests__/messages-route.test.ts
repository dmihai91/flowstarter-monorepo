/**
 * Tenant isolation and direction forcing, through the REAL route handlers.
 *
 * These handlers query with the service-role client, which bypasses RLS
 * entirely — so `requireWorkspaceAccess` running *before* the query is the
 * only thing between a member of workspace A and workspace B's thread. That is
 * the exact bug /api/leads/list shipped with, so it is asserted here on both
 * the response code and on nothing having been written.
 *
 * The other half is direction: a client must not be able to send a message
 * from Flowstarter's own domain by putting `"direction":"outbound"` in a body.
 * Direction is derived from `requireWorkspaceAccess`'s `via`, and the field is
 * not in the schema at all.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
// Static imports: vi.mock is hoisted above them, and the app's tsconfig does
// not allow top-level await in tests.
import { GET, POST } from '../route';
import { POST as REQUEST_ASSETS } from '../request-assets/route';
import { createFakeSupabase } from '@/lib/flowstarter/__tests__/fake-supabase';

vi.mock('server-only', () => ({}));

const WORKSPACE_A = '0f4e1088-8d8f-4f18-83b1-406cc292b23c';
const WORKSPACE_B = '7c2a91b4-3d5e-4a17-9f88-1b2c3d4e5f60';

// ── Clerk ────────────────────────────────────────────────────────────────
// Mirrors src/lib/__tests__/workspace-access.test.ts.
const authState: { userId: string | null; role: string | undefined } = {
  userId: 'user_client_a',
  role: undefined,
};

vi.mock('@clerk/nextjs/server', () => ({
  auth: async () => ({
    userId: authState.userId,
    sessionClaims: { metadata: { role: authState.role } },
    getToken: async () => 'test-token',
  }),
  clerkClient: async () => ({
    users: {
      getUser: async () => ({
        publicMetadata: { role: authState.role },
        emailAddresses: [],
        primaryEmailAddressId: null,
      }),
    },
  }),
  currentUser: async () => null,
}));

// One mock client backs both the membership lookup and the route's own
// queries — same module, same import, in production and here.
const db = createFakeSupabase();
vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => db.client,
}));

const emails: Array<{ to: string | string[] }> = [];
vi.mock('@/lib/email', () => ({
  sendEmail: async (options: { to: string | string[] }) => {
    emails.push(options);
    return { success: true, id: 'email_1' };
  },
}));

function params(workspaceId: string) {
  return { params: Promise.resolve({ workspaceId }) };
}

function post(workspaceId: string, body: unknown): NextRequest {
  return new NextRequest(
    `http://localhost/api/projects/${workspaceId}/messages`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
}

function get(workspaceId: string): NextRequest {
  return new NextRequest(
    `http://localhost/api/projects/${workspaceId}/messages`
  );
}

beforeEach(() => {
  db.reset();
  emails.length = 0;
  authState.userId = 'user_client_a';
  authState.role = undefined;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  db.seed('workspaces', [
    {
      id: WORKSPACE_A,
      name: 'A',
      client_email: 'a@example.com',
      client_phone: null,
    },
    {
      id: WORKSPACE_B,
      name: 'B',
      client_email: 'b@example.com',
      client_phone: null,
    },
  ]);
  db.seed('workspace_memberships', [
    { workspace_id: WORKSPACE_A, clerk_user_id: 'user_client_a' },
  ]);
  db.seed('flowstarter_project_artifacts', [
    { workspace_id: WORKSPACE_A, client_reply_corpus: [], template_slug: null },
  ]);
});

describe('cross-tenant access', () => {
  it('refuses to read another tenant’s thread, without confirming it exists', async () => {
    db.seed('project_messages', [
      {
        id: 'm-b',
        workspace_id: WORKSPACE_B,
        direction: 'outbound',
        kind: 'clarification',
        body: 'secret',
        asks: [],
        status: 'sent',
        created_at: '2026-01-01T00:00:00.000Z',
      },
    ]);
    const response = await GET(get(WORKSPACE_B), params(WORKSPACE_B));
    expect(response.status).toBe(404);
    expect(JSON.stringify(await response.json())).not.toContain('secret');
  });

  it('refuses to post into another tenant’s thread, and writes nothing', async () => {
    const response = await POST(
      post(WORKSPACE_B, { body: 'let me in' }),
      params(WORKSPACE_B)
    );
    expect(response.status).toBe(404);
    expect(db.rows('project_messages')).toHaveLength(0);
  });

  it('lets a member read their own thread', async () => {
    await POST(
      post(WORKSPACE_A, { body: 'Photos attached.' }),
      params(WORKSPACE_A)
    );
    const response = await GET(get(WORKSPACE_A), params(WORKSPACE_A));
    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      messages: Array<{ body: string }>;
    };
    expect(payload.messages.map((message) => message.body)).toEqual([
      'Photos attached.',
    ]);
  });

  it('refuses a signed-out caller', async () => {
    authState.userId = null;
    const response = await GET(get(WORKSPACE_A), params(WORKSPACE_A));
    expect(response.status).toBe(401);
  });

  it('rejects a malformed workspace id before any query', async () => {
    const response = await GET(get('not-a-uuid'), params('not-a-uuid'));
    expect(response.status).toBe(400);
  });
});

describe('direction is decided by the server', () => {
  it('ignores a client’s forged direction and writes inbound', async () => {
    const response = await POST(
      post(WORKSPACE_A, {
        body: 'We opened in 2009.',
        direction: 'outbound',
        kind: 'clarification',
        created_by: 'user_operator',
        status: 'sent',
      }),
      params(WORKSPACE_A)
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ direction: 'inbound' });
    expect(db.rows('project_messages')[0]).toMatchObject({
      direction: 'inbound',
      kind: 'client_reply',
      created_by: 'user_client_a',
    });
    // A forged outbound would have emailed from our domain. Nothing was sent.
    expect(emails).toHaveLength(0);
  });

  it('files a client reply as citable evidence', async () => {
    const response = await POST(
      post(WORKSPACE_A, { body: 'We have been trading since 2009.' }),
      params(WORKSPACE_A)
    );
    const payload = (await response.json()) as { sourceId: string };
    expect(payload.sourceId).toMatch(/^client_reply:/);
    const artifacts = db.rows('flowstarter_project_artifacts')[0];
    expect(artifacts.client_reply_corpus).toHaveLength(1);
  });

  it('writes outbound for an operator, and emails the client', async () => {
    authState.userId = 'user_operator';
    authState.role = 'admin';
    const response = await POST(
      post(WORKSPACE_A, { body: 'Which of these two logos is current?' }),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ direction: 'outbound' });
    expect(db.rows('project_messages')[0]).toMatchObject({
      direction: 'outbound',
      kind: 'clarification',
    });
    expect(emails[0]?.to).toBe('a@example.com');
  });

  it('rejects an empty or oversized body', async () => {
    expect(
      (await POST(post(WORKSPACE_A, { body: '   ' }), params(WORKSPACE_A)))
        .status
    ).toBe(400);
    expect(
      (
        await POST(
          post(WORKSPACE_A, { body: 'x'.repeat(9_000) }),
          params(WORKSPACE_A)
        )
      ).status
    ).toBe(400);
    expect(db.rows('project_messages')).toHaveLength(0);
  });

  it('rejects a body that is not JSON', async () => {
    const request = new NextRequest(
      `http://localhost/api/projects/${WORKSPACE_A}/messages`,
      { method: 'POST', body: 'not json' }
    );
    expect((await POST(request, params(WORKSPACE_A))).status).toBe(400);
  });
});

describe('request-assets is operator-only', () => {
  function requestAssets(workspaceId: string) {
    return new NextRequest(
      `http://localhost/api/projects/${workspaceId}/messages/request-assets`,
      { method: 'POST' }
    );
  }

  it('refuses a client, even in their own workspace', async () => {
    const response = await REQUEST_ASSETS(
      requestAssets(WORKSPACE_A),
      params(WORKSPACE_A)
    );
    expect(response.status).toBe(403);
    expect(db.rows('project_messages')).toHaveLength(0);
  });

  it('refuses an operator-shaped request from a non-member with 404', async () => {
    const response = await REQUEST_ASSETS(
      requestAssets(WORKSPACE_B),
      params(WORKSPACE_B)
    );
    expect(response.status).toBe(404);
  });

  it('runs the gate and sends one asset request', async () => {
    authState.userId = 'user_operator';
    authState.role = 'team';
    const response = await REQUEST_ASSETS(
      requestAssets(WORKSPACE_A),
      params(WORKSPACE_A)
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as {
      ready: boolean;
      sent: boolean;
      missing: Array<{ code: string }>;
    };
    expect(payload.ready).toBe(false);
    expect(payload.sent).toBe(true);
    expect(payload.missing.map((item) => item.code)).toContain(
      'hero_image_missing'
    );
    expect(db.rows('project_messages')).toHaveLength(1);
    expect(db.rows('project_messages')[0]).toMatchObject({
      direction: 'outbound',
      kind: 'asset_request',
    });
  });
});
