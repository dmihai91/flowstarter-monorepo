/**
 * Where a signed-in user lands.
 *
 * The page these cover used to send *every* authenticated user to
 * `/admin/dashboard`, so a paying client signing in got the operator console —
 * every tenant's projects, and the billing controls. The first case here is
 * that bug, written down.
 */
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
// Static imports: vi.mock is hoisted above them, and the app's test tsconfig
// does not allow top-level await.
import DashboardIndexPage from '../page';
import ClientProjectsPage from '../projects/page';

vi.mock('server-only', () => ({}));

const state: {
  userId: string | null;
  role: string | undefined;
  memberships: Array<{ workspace_id: string }>;
  workspaces: Array<Record<string, unknown>>;
} = { userId: 'user_client', role: undefined, memberships: [], workspaces: [] };

/** Thrown by the mocked `redirect` so a test can assert the destination. */
class RedirectSignal extends Error {
  constructor(public readonly to: string) {
    super(`redirect:${to}`);
  }
}

vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new RedirectSignal(to);
  },
  notFound: () => {
    throw new Error('notFound');
  },
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: async () => ({ userId: state.userId }),
}));

vi.mock('@/lib/api-auth', () => ({
  resolveUserRole: async () => state.role,
}));

vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => ({
    from: (table: string) => {
      const rows =
        table === 'workspace_memberships'
          ? state.memberships
          : state.workspaces;
      const builder = {
        select: () => builder,
        eq: () => builder,
        in: () => builder,
        then: (resolve: (value: unknown) => unknown) =>
          resolve({ data: rows, error: null }),
      };
      return builder;
    },
  }),
}));

const MINE = '0f4e1088-8d8f-4f18-83b1-406cc292b23c';
const ALSO_MINE = '7c2a91b4-3d5e-4a17-9f88-1b2c3d4e5f60';

/** Runs a server page and reports the redirect it performed, if any. */
async function redirectOf(
  page: () => Promise<unknown>
): Promise<string | null> {
  try {
    await page();
    return null;
  } catch (error) {
    if (error instanceof RedirectSignal) return error.to;
    throw error;
  }
}

beforeEach(() => {
  state.userId = 'user_client';
  state.role = undefined;
  state.memberships = [];
  state.workspaces = [];
});

describe('/dashboard role-aware routing', () => {
  it('does not drop a client into the operator console', async () => {
    state.memberships = [{ workspace_id: MINE }];
    state.workspaces = [
      {
        id: MINE,
        name: 'Acme',
        client_business_name: null,
        project_state: 'INTAKE',
        updated_at: null,
      },
    ];

    const to = await redirectOf(() => DashboardIndexPage());

    expect(to).not.toBe('/admin/dashboard');
    expect(to).toBe(`/dashboard/projects/${MINE}`);
  });

  it('keeps operators on the console', async () => {
    state.role = 'admin';
    expect(await redirectOf(() => DashboardIndexPage())).toBe(
      '/admin/dashboard'
    );

    state.role = 'team';
    expect(await redirectOf(() => DashboardIndexPage())).toBe(
      '/admin/dashboard'
    );
  });

  it('sends a client with several projects to the list', async () => {
    state.memberships = [{ workspace_id: MINE }, { workspace_id: ALSO_MINE }];
    state.workspaces = [
      {
        id: MINE,
        name: 'Acme',
        client_business_name: null,
        project_state: 'INTAKE',
        updated_at: null,
      },
      {
        id: ALSO_MINE,
        name: 'Beta',
        client_business_name: null,
        project_state: 'INTAKE',
        updated_at: null,
      },
    ];

    expect(await redirectOf(() => DashboardIndexPage())).toBe(
      '/dashboard/projects'
    );
  });

  it('explains itself to a signed-in user with no project, rather than redirecting', async () => {
    const element = (await DashboardIndexPage()) as React.ReactElement;
    render(element);

    expect(screen.getByText(/Nothing here yet/i)).toBeInTheDocument();
    expect(screen.getByText(/as soon as it/i)).toBeInTheDocument();
  });

  it('sends a signed-out caller to sign in, not to the console', async () => {
    state.userId = null;
    expect(await redirectOf(() => DashboardIndexPage())).toBe(
      '/login?next=/dashboard'
    );
  });
});

describe('/dashboard/projects', () => {
  it('skips the list when there is only one project', async () => {
    state.memberships = [{ workspace_id: MINE }];
    state.workspaces = [
      {
        id: MINE,
        name: 'Acme',
        client_business_name: null,
        project_state: 'INTAKE',
        updated_at: null,
      },
    ];

    expect(await redirectOf(() => ClientProjectsPage())).toBe(
      `/dashboard/projects/${MINE}`
    );
  });

  it('lists every project a client is a member of', async () => {
    state.memberships = [{ workspace_id: MINE }, { workspace_id: ALSO_MINE }];
    state.workspaces = [
      {
        id: MINE,
        name: 'Acme',
        client_business_name: 'Acme Dental',
        project_state: 'AGENTS_WORKING',
        updated_at: null,
      },
      {
        id: ALSO_MINE,
        name: 'Beta',
        client_business_name: null,
        project_state: 'PREVIEW_READY',
        updated_at: null,
      },
    ];

    const element = (await ClientProjectsPage()) as React.ReactElement;
    render(element);

    expect(screen.getByText('Acme Dental')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    // Plain language, never the enum.
    expect(screen.queryByText(/AGENTS_WORKING/)).not.toBeInTheDocument();
    expect(screen.getByText(/building your site/i)).toBeInTheDocument();
  });

  it('does not show an operator someone else’s client list', async () => {
    state.role = 'team';
    expect(await redirectOf(() => ClientProjectsPage())).toBe(
      '/admin/dashboard'
    );
  });
});
