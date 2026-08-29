/**
 * Authorization for one workspace's data.
 *
 * These cases exist because /api/leads/list had none: it took a workspace id
 * from the query string and queried as the service role, so any signed-in user
 * could read another client's leads by changing a parameter. Service-role
 * queries bypass RLS, so this check is the only thing in front of them.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
// Static import: vi.mock is hoisted above it, and the app's tsconfig does not
// allow top-level await.
import { requireWorkspaceAccess } from '../api-auth';

vi.mock('server-only', () => ({}));

const state: {
  userId: string | null;
  role: string | undefined;
  memberships: Array<{ workspace_id: string; clerk_user_id: string }>;
} = { userId: 'user_member', role: undefined, memberships: [] };

vi.mock('@clerk/nextjs/server', () => ({
  auth: async () => ({
    userId: state.userId,
    sessionClaims: { metadata: { role: state.role } },
    // requireAuth binds getToken off the session, so the mock needs one.
    getToken: async () => 'test-token',
  }),
  clerkClient: async () => ({
    users: {
      getUser: async () => ({
        publicMetadata: { role: state.role },
        emailAddresses: [],
        primaryEmailAddressId: null,
      }),
    },
  }),
  currentUser: async () => null,
}));

vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => ({
    from: () => {
      const filters: Record<string, string> = {};
      const builder = {
        select: () => builder,
        eq: (column: string, value: string) => {
          filters[column] = value;
          return builder;
        },
        maybeSingle: async () => ({
          data:
            state.memberships.find(
              (m) =>
                m.workspace_id === filters.workspace_id &&
                m.clerk_user_id === filters.clerk_user_id
            ) ?? null,
          error: null,
        }),
      };
      return builder;
    },
  }),
}));

const MINE = '0f4e1088-8d8f-4f18-83b1-406cc292b23c';
const THEIRS = '7c2a91b4-3d5e-4a17-9f88-1b2c3d4e5f60';

beforeEach(() => {
  state.userId = 'user_member';
  state.role = undefined;
  state.memberships = [{ workspace_id: MINE, clerk_user_id: 'user_member' }];
});

describe('requireWorkspaceAccess', () => {
  it('allows a member into their own workspace', async () => {
    const result = await requireWorkspaceAccess(MINE);
    expect(result).toMatchObject({ authorized: true, via: 'membership' });
  });

  it('refuses another tenant, and does not confirm the id exists', async () => {
    const result = await requireWorkspaceAccess(THEIRS);
    expect(result.authorized).toBe(false);
    if (result.authorized) throw new Error('unreachable');
    // 404 rather than 403: a 403 would tell a prober the workspace is real.
    expect(result.response.status).toBe(404);
  });

  it('refuses a signed-out caller', async () => {
    state.userId = null;
    const result = await requireWorkspaceAccess(MINE);
    expect(result.authorized).toBe(false);
    if (result.authorized) throw new Error('unreachable');
    expect(result.response.status).toBe(401);
  });

  it('lets an operator across tenants, which the dashboards rely on', async () => {
    state.role = 'admin';
    state.memberships = [];
    const result = await requireWorkspaceAccess(THEIRS);
    expect(result).toMatchObject({ authorized: true, via: 'team' });
  });

  it('rejects a malformed id before it reaches a query', async () => {
    const result = await requireWorkspaceAccess("' OR 1=1 --");
    expect(result.authorized).toBe(false);
    if (result.authorized) throw new Error('unreachable');
    expect(result.response.status).toBe(400);
  });
});
