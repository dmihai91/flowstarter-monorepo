/**
 * Tenant isolation through the REAL /api/leads/list route handlers.
 *
 * verify-rls-local.mjs (apps/flowstarter-main/scripts) proves the database
 * itself refuses a direct query for tenant B's rows. This is the other half
 * the spec asks for: the API. This route queries with the service-role
 * client, which bypasses RLS entirely — so the *only* thing standing between
 * a member of workspace A and workspace B's leads is requireWorkspaceAccess
 * running before the query, not after it. These tests import the real GET
 * and PATCH handlers (not a reimplementation) and assert both the response
 * codes and that a denied cross-tenant request never reaches the `leads`
 * table at all.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
// Static imports: vi.mock is hoisted above them, and the app's tsconfig does
// not allow top-level await in tests.
import { GET, PATCH } from '../route';

vi.mock('server-only', () => ({}));

const WORKSPACE_A = '0f4e1088-8d8f-4f18-83b1-406cc292b23c';
const WORKSPACE_B = '7c2a91b4-3d5e-4a17-9f88-1b2c3d4e5f60';
const LEAD_A = '11111111-1111-4111-8111-111111111111';
const LEAD_B = '22222222-2222-4222-8222-222222222222';

// ── Clerk ────────────────────────────────────────────────────────────────
// Mirrors the mocking style in src/lib/__tests__/workspace-access.test.ts.

const authState: { userId: string | null; role: string | undefined } = {
  userId: 'user_a',
  role: undefined,
};

vi.mock('@clerk/nextjs/server', () => ({
  auth: async () => ({
    userId: authState.userId,
    sessionClaims: { metadata: { role: authState.role } },
    // requireAuth binds getToken off the session, so the mock needs one.
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

// ── Supabase (service role) ─────────────────────────────────────────────
// One mock client backs both requireWorkspaceAccess's membership lookup and
// the route's own leads queries — same module, same import, in production
// and here. A minimal chainable, thenable Postgrest-style builder: every
// query in this flow ends either in .maybeSingle() or in an implicit await
// of the builder itself. Every resolution is recorded in `calls` so a test
// can assert a denied request never issued a `leads` query at all.

type Call = {
  table: string;
  kind: 'select' | 'update';
  filters: Record<string, string>;
};

let calls: Call[] = [];
let memberships: Array<{ workspace_id: string; clerk_user_id: string }> = [];
let leads: Array<{ id: string; workspace_id: string; status: string }> = [];

function makeBuilder(table: string) {
  const filters: Record<string, string> = {};
  let kind: 'select' | 'update' = 'select';
  let updateValues: Record<string, unknown> | undefined;

  function resolveMany() {
    calls.push({ table, kind, filters: { ...filters } });
    if (table === 'leads' && kind === 'select') {
      const rows = leads.filter((l) => l.workspace_id === filters.workspace_id);
      return { data: rows, error: null };
    }
    if (table === 'leads' && kind === 'update') {
      const row = leads.find(
        (l) => l.id === filters.id && l.workspace_id === filters.workspace_id
      );
      if (row && updateValues) Object.assign(row, updateValues);
      return { data: null, error: null };
    }
    return { data: null, error: null };
  }

  function resolveSingle() {
    calls.push({ table, kind, filters: { ...filters } });
    if (table === 'workspace_memberships') {
      const found = memberships.find(
        (m) =>
          m.workspace_id === filters.workspace_id &&
          m.clerk_user_id === filters.clerk_user_id
      );
      return { data: found ?? null, error: null };
    }
    if (table === 'leads') {
      const row = leads.find((l) => l.id === filters.id);
      return {
        data: row ? { workspace_id: row.workspace_id } : null,
        error: null,
      };
    }
    return { data: null, error: null };
  }

  const builder = {
    select: () => builder,
    update: (vals: Record<string, unknown>) => {
      kind = 'update';
      updateValues = vals;
      return builder;
    },
    eq: (column: string, value: string) => {
      filters[column] = value;
      return builder;
    },
    neq: () => builder,
    order: () => builder,
    limit: () => builder,
    maybeSingle: async () => resolveSingle(),
    // The route awaits the builder directly (no terminal method) for both
    // the GET select and the PATCH update — make it thenable.
    then: (
      resolve: (value: unknown) => unknown,
      reject?: (reason: unknown) => unknown
    ) => Promise.resolve(resolveMany()).then(resolve, reject),
  };
  return builder;
}

vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => ({
    from: (table: string) => makeBuilder(table),
  }),
}));

function getRequest(workspaceId: string) {
  return new NextRequest(
    `http://localhost/api/leads/list?workspaceId=${workspaceId}`
  );
}

function patchRequest(body: unknown) {
  return new NextRequest('http://localhost/api/leads/list', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  calls = [];
  authState.userId = 'user_a';
  authState.role = undefined;
  memberships = [{ workspace_id: WORKSPACE_A, clerk_user_id: 'user_a' }];
  leads = [
    { id: LEAD_A, workspace_id: WORKSPACE_A, status: 'new' },
    { id: LEAD_B, workspace_id: WORKSPACE_B, status: 'new' },
  ];
});

describe('tenant isolation — GET/PATCH /api/leads/list', () => {
  it("lets a member of A read only A's leads", async () => {
    const res = await GET(getRequest(WORKSPACE_A));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.leads).toHaveLength(1);
    expect(body.leads[0].id).toBe(LEAD_A);
  });

  it("refuses a member of A reading B's leads, and never queries leads for B", async () => {
    const res = await GET(getRequest(WORKSPACE_B));
    expect(res.status).toBe(404);
    const leadsCalls = calls.filter((c) => c.table === 'leads');
    expect(leadsCalls).toHaveLength(0);
  });

  it('refuses a member of A patching a lead that belongs to B, and issues no update', async () => {
    const res = await PATCH(
      patchRequest({ leadId: LEAD_B, status: 'contacted' })
    );
    expect(res.status).toBe(404);
    const updateCalls = calls.filter(
      (c) => c.table === 'leads' && c.kind === 'update'
    );
    expect(updateCalls).toHaveLength(0);
    expect(leads.find((l) => l.id === LEAD_B)?.status).toBe('new');
  });

  it('lets an admin-role caller read across tenants', async () => {
    authState.role = 'admin';
    memberships = []; // proves it is the role, not a membership row
    const res = await GET(getRequest(WORKSPACE_B));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.leads).toHaveLength(1);
    expect(body.leads[0].id).toBe(LEAD_B);
  });
});
