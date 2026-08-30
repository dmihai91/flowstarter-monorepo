/**
 * The operator pipeline API.
 *
 * These endpoints let a human move money-bearing state and restart builds, so
 * the cases that matter are the ones where they must refuse: a signed-in
 * client who is not an operator, a state jump that would skip a deposit, and a
 * re-dispatch of a build that is already running — which must never produce a
 * second FULL_SITE_BUILD, because the unique index that makes the Stripe
 * deposit path idempotent depends on there being exactly one.
 *
 * Clerk and the service-role client are mocked; every handler runs for real.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { ProjectState } from '@flowstarter/agentic-codegen/src/flowstarter/types';

vi.mock('server-only', () => ({}));

// ─── Clerk ──────────────────────────────────────────────────────────────────
const authState: { userId: string | null; role: string | undefined } = {
  userId: 'user_operator',
  role: 'team',
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

// ─── An in-memory stand-in for the service-role client ──────────────────────
// Small enough to read, faithful enough to exercise the filters the handlers
// depend on — including the compare-and-set `.in('status', ...)` guards.
type Row = Record<string, unknown>;

const tables: Record<string, Row[]> = {
  workspaces: [],
  flowstarter_agent_jobs: [],
  project_events: [],
};

let idCounter = 0;

class FakeBuilder implements PromiseLike<{ data: Row[]; error: null }> {
  private op: 'select' | 'insert' | 'update' = 'select';
  private predicates: Array<(row: Row) => boolean> = [];
  private values: Row = {};
  private orderKey: string | null = null;
  private orderAsc = true;
  private limitN: number | null = null;

  constructor(private readonly table: string) {}

  select() {
    return this;
  }
  insert(values: Row) {
    this.op = 'insert';
    this.values = values;
    return this;
  }
  update(values: Row) {
    this.op = 'update';
    this.values = values;
    return this;
  }
  eq(column: string, value: unknown) {
    this.predicates.push((row) => row[column] === value);
    return this;
  }
  in(column: string, values: unknown[]) {
    this.predicates.push((row) => values.includes(row[column]));
    return this;
  }
  order(column: string, options?: { ascending?: boolean }) {
    this.orderKey = column;
    this.orderAsc = options?.ascending !== false;
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }

  private run(): Row[] {
    const rows = tables[this.table] ?? [];
    if (this.op === 'insert') {
      const inserted = { id: `generated-${++idCounter}`, ...this.values };
      rows.push(inserted);
      return [inserted];
    }
    let matched = rows.filter((row) => this.predicates.every((p) => p(row)));
    if (this.op === 'update') {
      for (const row of matched) Object.assign(row, this.values);
      return matched;
    }
    if (this.orderKey) {
      const key = this.orderKey;
      matched = [...matched].sort((a, b) =>
        this.orderAsc
          ? String(a[key]).localeCompare(String(b[key]))
          : String(b[key]).localeCompare(String(a[key]))
      );
    }
    return this.limitN === null ? matched : matched.slice(0, this.limitN);
  }

  async maybeSingle() {
    return { data: this.run()[0] ?? null, error: null };
  }
  async single() {
    const rows = this.run();
    return rows.length === 1
      ? { data: rows[0], error: null }
      : { data: null, error: { code: 'PGRST116', message: 'no rows' } };
  }
  then<T1, T2 = never>(
    onFulfilled?:
      | ((value: { data: Row[]; error: null }) => T1 | PromiseLike<T1>)
      | null,
    onRejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null
  ): PromiseLike<T1 | T2> {
    return Promise.resolve({ data: this.run(), error: null as null }).then(
      onFulfilled,
      onRejected
    );
  }
}

vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => ({
    from: (table: string) => new FakeBuilder(table),
  }),
}));

// Static imports: vi.mock is hoisted, and this tsconfig forbids top-level await.
import {
  cancelJobHandler,
  overrideStateHandler,
  pipelineBoardHandler,
  pipelineDetailHandler,
  redispatchBuildHandler,
} from '../api';

const WORKSPACE_ID = '0f4e1088-8d8f-4f18-83b1-406cc292b23c';
const OTHER_WORKSPACE_ID = '7c2a91b4-3d5e-4a17-9f88-1b2c3d4e5f60';
const JOB_ID = '2b6f1d4a-9c3e-4b21-8f77-5a1c2d3e4f61';

function ctx(id = WORKSPACE_ID) {
  return { params: Promise.resolve({ id }) };
}

function post(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest;
}

function seedWorkspace(overrides: Row = {}) {
  const row: Row = {
    id: WORKSPACE_ID,
    name: 'Acme site',
    slug: 'acme',
    client_business_name: 'Acme Ltd',
    client_name: null,
    client_email: 'owner@acme.test',
    project_state: ProjectState.DEPOSIT_PAID,
    deposit_status: 'paid',
    deposit_paid_at: '2026-08-30T10:00:00.000Z',
    final_value_minor: 199_900,
    setup_fee: null,
    billing_currency: 'eur',
    created_at: '2026-08-29T10:00:00.000Z',
    updated_at: '2026-08-30T10:00:00.000Z',
    ...overrides,
  };
  tables.workspaces.push(row);
  return row;
}

function seedJob(overrides: Row = {}) {
  const row: Row = {
    id: JOB_ID,
    workspace_id: WORKSPACE_ID,
    kind: 'FULL_SITE_BUILD',
    status: 'queued',
    attempt_count: 0,
    max_attempts: 3,
    run_after: '2026-08-30T10:00:00.000Z',
    created_at: '2026-08-30T10:00:00.000Z',
    started_at: null,
    finished_at: null,
    error_code: null,
    error_detail: null,
    ...overrides,
  };
  tables.flowstarter_agent_jobs.push(row);
  return row;
}

beforeEach(() => {
  authState.userId = 'user_operator';
  authState.role = 'team';
  tables.workspaces = [];
  tables.flowstarter_agent_jobs = [];
  tables.project_events = [];
  idCounter = 0;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  // Nothing in these tests should reach the network; a build worker that is
  // not configured is also the realistic local case.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(null, { status: 200 }))
  );
});

describe('operator-only access', () => {
  const calls: Array<[string, () => Promise<Response>]> = [
    ['GET board', () => pipelineBoardHandler()],
    ['GET detail', () => pipelineDetailHandler(post({}), ctx())],
    ['POST redispatch', () => redispatchBuildHandler(post({}), ctx())],
    [
      'POST state',
      () =>
        overrideStateHandler(
          post({ toState: ProjectState.AGENTS_WORKING, reason: 'because' }),
          ctx()
        ),
    ],
    [
      'POST cancel-job',
      () => cancelJobHandler(post({ jobId: JOB_ID, reason: 'because' }), ctx()),
    ],
  ];

  it.each(calls)(
    '%s refuses a signed-in client who is not an operator',
    async (_name, call) => {
      seedWorkspace();
      seedJob();
      authState.userId = 'user_plain_client';
      authState.role = undefined;

      const res = await call();
      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toMatchObject({ code: 'FORBIDDEN' });
    }
  );

  it.each(calls)('%s refuses an anonymous caller', async (_name, call) => {
    seedWorkspace();
    seedJob();
    authState.userId = null;
    authState.role = undefined;

    const res = await call();
    expect(res.status).toBe(401);
  });

  it('lets an admin through', async () => {
    seedWorkspace();
    authState.role = 'admin';
    const res = await pipelineBoardHandler();
    expect(res.status).toBe(200);
  });

  it('never writes an audit row for a refused caller', async () => {
    seedWorkspace();
    authState.role = undefined;
    await overrideStateHandler(
      post({ toState: ProjectState.AGENTS_WORKING, reason: 'sneaking in' }),
      ctx()
    );
    expect(tables.project_events).toHaveLength(0);
    expect(tables.workspaces[0].project_state).toBe(ProjectState.DEPOSIT_PAID);
  });
});

describe('the board', () => {
  it('groups workspaces by state', async () => {
    seedWorkspace({
      id: WORKSPACE_ID,
      project_state: ProjectState.DEPOSIT_PAID,
    });
    seedWorkspace({
      id: OTHER_WORKSPACE_ID,
      project_state: ProjectState.INTAKE,
      created_at: '2026-08-28T10:00:00.000Z',
    });

    const res = await pipelineBoardHandler();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.total).toBe(2);
    const byState = Object.fromEntries(
      body.columns.map(
        (c: { state: string; cards: Array<{ workspaceId: string }> }) => [
          c.state,
          c.cards.map((card) => card.workspaceId),
        ]
      )
    );
    expect(byState[ProjectState.DEPOSIT_PAID]).toEqual([WORKSPACE_ID]);
    expect(byState[ProjectState.INTAKE]).toEqual([OTHER_WORKSPACE_ID]);
    expect(byState[ProjectState.HUMAN_QA]).toEqual([]);
  });
});

describe('state overrides', () => {
  it('rejects an illegal transition server-side, and says what is allowed', async () => {
    seedWorkspace({ project_state: ProjectState.INTAKE });

    const res = await overrideStateHandler(
      post({
        toState: ProjectState.LIVE_SUBSCRIPTION,
        reason: 'client is in a hurry',
      }),
      ctx()
    );

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe('ILLEGAL_TRANSITION');
    expect(body.allowedTransitions).toEqual([ProjectState.PREVIEW_READY]);
    // The refusal must be total: no state change, no audit row.
    expect(tables.workspaces[0].project_state).toBe(ProjectState.INTAKE);
    expect(tables.project_events).toHaveLength(0);
  });

  it('rejects a state that is not in the enum at all', async () => {
    seedWorkspace();
    const res = await overrideStateHandler(
      post({ toState: 'DEFINITELY_LIVE', reason: 'nope' }),
      ctx()
    );
    expect(res.status).toBe(400);
    expect(tables.workspaces[0].project_state).toBe(ProjectState.DEPOSIT_PAID);
  });

  it('requires a reason', async () => {
    seedWorkspace();
    const res = await overrideStateHandler(
      post({ toState: ProjectState.AGENTS_WORKING }),
      ctx()
    );
    expect(res.status).toBe(400);
    expect(tables.project_events).toHaveLength(0);
  });

  it('applies a legal move and records who made it and why', async () => {
    seedWorkspace({ project_state: ProjectState.DEPOSIT_PAID });

    const res = await overrideStateHandler(
      post({
        toState: ProjectState.AGENTS_WORKING,
        reason: 'Build worker was restarted by hand',
      }),
      ctx()
    );

    expect(res.status).toBe(200);
    expect(tables.workspaces[0].project_state).toBe(
      ProjectState.AGENTS_WORKING
    );
    expect(tables.project_events).toHaveLength(1);
    expect(tables.project_events[0]).toMatchObject({
      workspace_id: WORKSPACE_ID,
      kind: 'state_overridden',
      actor: 'user_operator',
      payload: {
        from: ProjectState.DEPOSIT_PAID,
        to: ProjectState.AGENTS_WORKING,
        reason: 'Build worker was restarted by hand',
      },
    });
  });

  it('allows a one-step correction backwards', async () => {
    seedWorkspace({ project_state: ProjectState.HUMAN_QA });
    const res = await overrideStateHandler(
      post({
        toState: ProjectState.AGENTS_WORKING,
        reason: 'QA found a rebuild is needed',
      }),
      ctx()
    );
    expect(res.status).toBe(200);
    expect(tables.workspaces[0].project_state).toBe(
      ProjectState.AGENTS_WORKING
    );
  });

  it('404s for a workspace that does not exist', async () => {
    const res = await overrideStateHandler(
      post({ toState: ProjectState.AGENTS_WORKING, reason: 'ghost' }),
      ctx()
    );
    expect(res.status).toBe(404);
  });
});

describe('re-dispatching a build', () => {
  it('re-queues a job the worker never picked up, without creating a second one', async () => {
    seedWorkspace();
    seedJob({ status: 'queued' });

    const res = await redispatchBuildHandler(post({}), ctx());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      job: { id: JOB_ID, status: 'queued' },
      duplicate: false,
    });
    // The single FULL_SITE_BUILD row is reused, so the unique index on
    // (workspace_id, kind) still holds.
    expect(tables.flowstarter_agent_jobs).toHaveLength(1);
    expect(tables.flowstarter_agent_jobs[0].id).toBe(JOB_ID);
  });

  it('refuses to touch a build that is already running, and creates nothing', async () => {
    seedWorkspace();
    seedJob({ status: 'running', started_at: '2026-08-30T11:00:00.000Z' });

    const res = await redispatchBuildHandler(post({}), ctx());

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe('JOB_ALREADY_RUNNING');
    expect(body.duplicate).toBe(true);
    expect(tables.flowstarter_agent_jobs).toHaveLength(1);
    expect(tables.flowstarter_agent_jobs[0].status).toBe('running');
    expect(tables.project_events).toHaveLength(0);
  });

  it('refuses when the build already succeeded', async () => {
    seedWorkspace();
    seedJob({ status: 'succeeded', finished_at: '2026-08-30T11:00:00.000Z' });

    const res = await redispatchBuildHandler(post({}), ctx());
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      code: 'JOB_NOT_REDISPATCHABLE',
    });
    expect(tables.flowstarter_agent_jobs).toHaveLength(1);
  });

  it('grants a failed job one more attempt rather than resetting its history', async () => {
    seedWorkspace();
    seedJob({
      status: 'failed',
      attempt_count: 3,
      max_attempts: 3,
      error_code: 'worker_timeout',
      error_detail: 'timed out',
    });

    const res = await redispatchBuildHandler(
      post({ reason: 'worker was down' }),
      ctx()
    );

    expect(res.status).toBe(200);
    const job = tables.flowstarter_agent_jobs[0];
    expect(job.status).toBe('queued');
    expect(job.attempt_count).toBe(3);
    expect(job.max_attempts).toBe(4);
    expect(job.error_code).toBeNull();
    expect(tables.project_events[0]).toMatchObject({
      kind: 'build_redispatched',
      actor: 'user_operator',
      payload: { previousStatus: 'failed', jobId: JOB_ID },
    });
  });

  it('reports a queued-but-undispatched job instead of failing the request', async () => {
    seedWorkspace();
    seedJob({ status: 'queued' });
    // No worker configured — exactly the case deposit-workflow logs and moves
    // past. The row must still end up queued.
    vi.stubEnv('FLOWSTARTER_BUILD_WORKER_URL', '');
    vi.stubEnv('FLOWSTARTER_BUILD_WORKER_SECRET', '');

    const res = await redispatchBuildHandler(post({}), ctx());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dispatched).toBe(false);
    expect(body.dispatchError).toMatch(/not configured/);
    expect(tables.flowstarter_agent_jobs[0].status).toBe('queued');
  });

  it('hands the job id to the build worker when one is configured', async () => {
    seedWorkspace();
    seedJob({ status: 'queued' });
    vi.stubEnv('FLOWSTARTER_BUILD_WORKER_URL', 'http://localhost:4310');
    vi.stubEnv('FLOWSTARTER_BUILD_WORKER_SECRET', 'x'.repeat(40));

    const res = await redispatchBuildHandler(post({}), ctx());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ dispatched: true });
    const fetchMock = globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(String(url)).toBe('http://localhost:4310/jobs/full-site');
    expect(init.body).toBe(JSON.stringify({ jobId: JOB_ID }));
  });

  it('409s when there is no build job to re-dispatch', async () => {
    seedWorkspace();
    const res = await redispatchBuildHandler(post({}), ctx());
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ code: 'NO_BUILD_JOB' });
    expect(tables.flowstarter_agent_jobs).toHaveLength(0);
  });
});

describe('cancelling a stuck job', () => {
  it('records the reason on the job row and in the audit trail', async () => {
    seedWorkspace();
    seedJob({ status: 'running', started_at: '2026-08-30T09:00:00.000Z' });

    const res = await cancelJobHandler(
      post({ jobId: JOB_ID, reason: 'Worker died mid-build' }),
      ctx()
    );

    expect(res.status).toBe(200);
    const job = tables.flowstarter_agent_jobs[0];
    expect(job.status).toBe('canceled');
    expect(job.error_code).toBe('operator_canceled');
    expect(job.error_detail).toBe('Worker died mid-build');
    expect(job.finished_at).not.toBeNull();
    expect(tables.project_events[0]).toMatchObject({
      kind: 'job_canceled',
      actor: 'user_operator',
      payload: {
        jobId: JOB_ID,
        previousStatus: 'running',
        reason: 'Worker died mid-build',
      },
    });
  });

  it('requires a reason', async () => {
    seedWorkspace();
    seedJob({ status: 'running' });
    const res = await cancelJobHandler(post({ jobId: JOB_ID }), ctx());
    expect(res.status).toBe(400);
    expect(tables.flowstarter_agent_jobs[0].status).toBe('running');
  });

  it('refuses to cancel a job that already finished', async () => {
    seedWorkspace();
    seedJob({ status: 'succeeded' });
    const res = await cancelJobHandler(
      post({ jobId: JOB_ID, reason: 'too late' }),
      ctx()
    );
    expect(res.status).toBe(409);
    expect(tables.flowstarter_agent_jobs[0].status).toBe('succeeded');
  });

  it('will not cancel a job belonging to another workspace', async () => {
    seedWorkspace();
    seedWorkspace({ id: OTHER_WORKSPACE_ID });
    seedJob({ workspace_id: OTHER_WORKSPACE_ID, status: 'running' });

    const res = await cancelJobHandler(
      post({ jobId: JOB_ID, reason: 'wrong project' }),
      ctx(WORKSPACE_ID)
    );

    expect(res.status).toBe(404);
    expect(tables.flowstarter_agent_jobs[0].status).toBe('running');
  });
});

describe('the project timeline', () => {
  it('returns jobs, events and the moves allowed from here', async () => {
    seedWorkspace({ project_state: ProjectState.DEPOSIT_PAID });
    seedJob({ status: 'queued' });
    tables.project_events.push({
      id: 'evt-1',
      workspace_id: WORKSPACE_ID,
      kind: 'state_overridden',
      actor: 'user_operator',
      payload: {
        from: ProjectState.PREVIEW_READY,
        to: ProjectState.DEPOSIT_PAID,
      },
      created_at: '2026-08-30T10:00:00.000Z',
    });

    const res = await pipelineDetailHandler(post({}), ctx());
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.project.projectState).toBe(ProjectState.DEPOSIT_PAID);
    expect(body.project.quoteMinor).toBe(199_900);
    expect(body.allowedTransitions).toEqual([
      ProjectState.AGENTS_WORKING,
      ProjectState.PREVIEW_READY,
    ]);
    expect(body.jobs).toHaveLength(1);
    expect(body.jobs[0]).toMatchObject({
      id: JOB_ID,
      canRedispatch: true,
      canCancel: true,
    });
    expect(body.events).toHaveLength(1);
  });

  it('rejects a workspace id that is not a uuid before touching the database', async () => {
    const res = await pipelineDetailHandler(post({}), ctx('not-a-uuid'));
    expect(res.status).toBe(400);
  });
});

describe('the /admin and /team mirrors', () => {
  it('are the same handler, so they cannot drift apart', async () => {
    const [
      adminBoard,
      teamBoard,
      adminDetail,
      teamDetail,
      adminRedispatch,
      teamRedispatch,
      adminState,
      teamState,
      adminCancel,
      teamCancel,
    ] = await Promise.all([
      import('@/app/api/admin/projects/pipeline/route'),
      import('@/app/api/team/projects/pipeline/route'),
      import('@/app/api/admin/projects/[id]/pipeline/route'),
      import('@/app/api/team/projects/[id]/pipeline/route'),
      import('@/app/api/admin/projects/[id]/pipeline/redispatch/route'),
      import('@/app/api/team/projects/[id]/pipeline/redispatch/route'),
      import('@/app/api/admin/projects/[id]/pipeline/state/route'),
      import('@/app/api/team/projects/[id]/pipeline/state/route'),
      import('@/app/api/admin/projects/[id]/pipeline/cancel-job/route'),
      import('@/app/api/team/projects/[id]/pipeline/cancel-job/route'),
    ]);

    expect(adminBoard.GET).toBe(teamBoard.GET);
    expect(adminBoard.GET).toBe(pipelineBoardHandler);
    expect(adminDetail.GET).toBe(teamDetail.GET);
    expect(adminDetail.GET).toBe(pipelineDetailHandler);
    expect(adminRedispatch.POST).toBe(teamRedispatch.POST);
    expect(adminRedispatch.POST).toBe(redispatchBuildHandler);
    expect(adminState.POST).toBe(teamState.POST);
    expect(adminState.POST).toBe(overrideStateHandler);
    expect(adminCancel.POST).toBe(teamCancel.POST);
    expect(adminCancel.POST).toBe(cancelJobHandler);
  });
});
