/**
 * The client project page.
 *
 * Every row on this page is read with the service role, which bypasses RLS.
 * `requireWorkspaceAccess` is therefore the whole of the isolation, and the
 * first case here is a non-member asking for someone else's project.
 */
import { render, screen } from '@testing-library/react';
import { NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectState } from '@flowstarter/agentic-codegen/src/flowstarter/types';
import ClientProjectPage from '../page';

vi.mock('server-only', () => ({}));

const MINE = '0f4e1088-8d8f-4f18-83b1-406cc292b23c';
const THEIRS = '7c2a91b4-3d5e-4a17-9f88-1b2c3d4e5f60';

const state: {
  authorizedFor: string[];
  workspace: Record<string, unknown> | null;
  hosts: Array<{ hostname: string; is_primary: boolean }>;
  messages: Array<Record<string, unknown>>;
  /** Status the access helper refuses with: 404 for a stranger, 401 signed out. */
  refusalStatus: number;
} = {
  authorizedFor: [MINE],
  workspace: null,
  hosts: [],
  messages: [],
  refusalStatus: 404,
};

class NotFoundSignal extends Error {}
class RedirectSignal extends Error {
  constructor(public readonly to: string) {
    super(`redirect:${to}`);
  }
}

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new NotFoundSignal('notFound');
  },
  redirect: (to: string) => {
    throw new RedirectSignal(to);
  },
}));

vi.mock('@/lib/api-auth', () => ({
  requireWorkspaceAccess: async (workspaceId: string) =>
    state.authorizedFor.includes(workspaceId)
      ? {
          authorized: true,
          userId: 'user_client',
          workspaceId,
          via: 'membership',
        }
      : {
          authorized: false,
          // Mirrors the real helper: 404, never 403, so the response does not
          // confirm the workspace exists.
          response: NextResponse.json(
            { error: 'Workspace not found' },
            { status: state.refusalStatus }
          ),
        },
}));

vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => ({
    from: (table: string) => {
      const rows =
        table === 'workspaces'
          ? state.workspace
            ? [state.workspace]
            : []
          : table === 'workspace_hosts'
          ? state.hosts
          : state.messages;
      const builder = {
        select: () => builder,
        eq: () => builder,
        order: () => builder,
        maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
        then: (resolve: (value: unknown) => unknown) =>
          resolve({ data: rows, error: null }),
      };
      return builder;
    },
  }),
}));

function workspaceRow(overrides: Record<string, unknown> = {}) {
  return {
    id: MINE,
    slug: 'acme',
    name: 'Acme',
    client_business_name: 'Acme Dental',
    project_state: ProjectState.PREVIEW_READY,
    deploy_status: 'pending',
    final_value_minor: 250_000,
    setup_fee: null,
    billing_currency: 'eur',
    deposit_status: 'pending',
    final_status: 'pending',
    final_invoice_url: null,
    ...overrides,
  };
}

async function renderPage(workspaceId: string) {
  const element = (await ClientProjectPage({
    params: Promise.resolve({ workspaceId }),
  })) as React.ReactElement;
  return render(element);
}

beforeEach(() => {
  state.authorizedFor = [MINE];
  state.workspace = workspaceRow();
  state.hosts = [];
  state.messages = [];
  state.refusalStatus = 404;
});

describe('client project page authorization', () => {
  it('404s a non-member asking for another tenant’s project', async () => {
    await expect(renderPage(THEIRS)).rejects.toBeInstanceOf(NotFoundSignal);
  });

  it('sends a signed-out caller to sign in rather than 404ing them', async () => {
    state.authorizedFor = [];
    state.refusalStatus = 401;

    await expect(renderPage(MINE)).rejects.toMatchObject({
      to: `/login?next=/dashboard/projects/${MINE}`,
    });
  });

  it('renders the project for a member', async () => {
    await renderPage(MINE);
    expect(screen.getByText('Acme Dental')).toBeInTheDocument();
  });
});

describe('project stepper', () => {
  it('highlights the stage the project is actually in', async () => {
    state.workspace = workspaceRow({
      project_state: ProjectState.AGENTS_WORKING,
    });
    await renderPage(MINE);

    const current = screen
      .getAllByTestId('project-stage')
      .filter((el) => el.dataset.status === 'current');
    expect(current).toHaveLength(1);
    expect(current[0].dataset.state).toBe(ProjectState.AGENTS_WORKING);
    expect(screen.getByTestId('project-stage-title')).toHaveTextContent(
      /building your site/i
    );
  });

  it('marks earlier stages done and later ones upcoming', async () => {
    state.workspace = workspaceRow({ project_state: ProjectState.HUMAN_QA });
    await renderPage(MINE);

    const stages = screen.getAllByTestId('project-stage');
    expect(stages).toHaveLength(6);
    expect(stages.map((el) => el.dataset.status)).toEqual([
      'done',
      'done',
      'done',
      'done',
      'current',
      'upcoming',
    ]);
  });

  it('never shows the raw enum name', async () => {
    state.workspace = workspaceRow({
      project_state: ProjectState.LIVE_SUBSCRIPTION,
    });
    await renderPage(MINE);
    expect(screen.queryByText(/LIVE_SUBSCRIPTION/)).not.toBeInTheDocument();
  });
});

describe('payment calls to action', () => {
  it('offers the deposit only in PREVIEW_READY', async () => {
    await renderPage(MINE);
    expect(screen.getByTestId('payment-cta-deposit')).toBeInTheDocument();
    // Links into the existing unlock flow rather than a second checkout.
    expect(
      screen.getByRole('link', { name: /Pay your .* deposit/i })
    ).toHaveAttribute('href', `/unlock/${MINE}`);
  });

  it('hides the deposit once it is paid', async () => {
    state.workspace = workspaceRow({ deposit_status: 'paid' });
    await renderPage(MINE);
    expect(screen.queryByTestId('payment-cta-deposit')).not.toBeInTheDocument();
  });

  it('hides the deposit in every other state', async () => {
    for (const projectState of [
      ProjectState.INTAKE,
      ProjectState.DEPOSIT_PAID,
      ProjectState.AGENTS_WORKING,
      ProjectState.LIVE_SUBSCRIPTION,
    ]) {
      state.workspace = workspaceRow({ project_state: projectState });
      const view = await renderPage(MINE);
      expect(
        screen.queryByTestId('payment-cta-deposit')
      ).not.toBeInTheDocument();
      view.unmount();
    }
  });

  it('asks for the balance at HUMAN_QA, which is where the balance gate sits', async () => {
    state.workspace = workspaceRow({
      project_state: ProjectState.HUMAN_QA,
      deposit_status: 'paid',
      final_status: 'sent',
    });
    await renderPage(MINE);

    expect(screen.getByTestId('payment-cta-balance')).toBeInTheDocument();
    expect(screen.queryByTestId('payment-cta-deposit')).not.toBeInTheDocument();
  });

  it('asks for nothing once the balance is paid', async () => {
    state.workspace = workspaceRow({
      project_state: ProjectState.HUMAN_QA,
      deposit_status: 'paid',
      final_status: 'paid',
    });
    await renderPage(MINE);
    expect(screen.queryByTestId('payment-cta-balance')).not.toBeInTheDocument();
  });
});

describe('open asks and the site link', () => {
  it('lifts open asset requests out of the thread', async () => {
    state.messages = [
      {
        id: 'm1',
        workspace_id: MINE,
        direction: 'outbound',
        kind: 'asset_request',
        body: 'We need a few things',
        asks: [{ id: 'a1', label: 'Your logo, as a PNG' }],
        status: 'sent',
        sent_at: '2026-08-01T10:00:00Z',
        answered_at: null,
        created_by: 'team',
        created_at: '2026-08-01T10:00:00Z',
      },
      {
        id: 'm2',
        workspace_id: MINE,
        direction: 'outbound',
        kind: 'asset_request',
        body: 'Already handled',
        asks: [{ id: 'a2', label: 'Opening hours' }],
        status: 'answered',
        sent_at: '2026-07-01T10:00:00Z',
        answered_at: '2026-07-02T10:00:00Z',
        created_by: 'team',
        created_at: '2026-07-01T10:00:00Z',
      },
    ];
    await renderPage(MINE);

    const asks = screen.getAllByTestId('open-ask');
    expect(asks).toHaveLength(1);
    expect(asks[0]).toHaveTextContent('Your logo, as a PNG');
  });

  it('offers no site link until something is deployed', async () => {
    await renderPage(MINE);
    expect(screen.queryByTestId('site-link')).not.toBeInTheDocument();
  });

  it('links the primary hostname once the site is live', async () => {
    state.workspace = workspaceRow({
      project_state: ProjectState.LIVE_SUBSCRIPTION,
      deploy_status: 'live',
    });
    state.hosts = [{ hostname: 'acmedental.ie', is_primary: true }];
    await renderPage(MINE);

    expect(screen.getByTestId('site-link')).toHaveAttribute(
      'href',
      'https://acmedental.ie'
    );
  });
});
