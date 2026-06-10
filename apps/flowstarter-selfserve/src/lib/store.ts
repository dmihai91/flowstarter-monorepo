// Persistence layer. Supabase (service role) is the main DB; when Supabase env
// is absent (pure mock-mode dev) an in-memory store keeps the app fully
// testable end-to-end. Server-only.
import 'server-only';
import { randomUUID } from 'node:crypto';
import { createSupabaseServiceRoleClient } from '@flowstarter/supabase-utils';
import type { BuildEvent, BuildOutputs, BuildStatus, SiteSpec } from '@flowstarter/build-engine';

export interface ProjectRow {
  id: string;
  clerk_user_id: string;
  email: string;
  business_description: string;
  refinement_count: number;
  demo_spec: SiteSpec | null;
  demo_html: string | null;
  demo_status: 'none' | 'generating' | 'ready' | 'failed';
  outcome: 'launch' | 'code_only' | 'walked_away' | null;
  client_ip: string | null;
  created_at: string;
  updated_at: string;
}

export interface BuildRow {
  id: string;
  project_id: string;
  status: BuildStatus;
  attempt: number;
  progress: number;
  feed: BuildEvent[];
  outputs: BuildOutputs | null;
  error: string | null;
  admin_alerted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentKind = 'build_fee' | 'final_code' | 'final_subscription';

export interface PaymentRow {
  id: string;
  project_id: string;
  kind: PaymentKind;
  status: 'pending' | 'paid' | 'refunded';
  amount_cents: number;
  currency: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_subscription_id: string | null;
  waiver_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Store {
  createProject(p: {
    clerkUserId: string;
    email: string;
    businessDescription: string;
    clientIp?: string | null;
  }): Promise<ProjectRow>;
  getProject(id: string): Promise<ProjectRow | null>;
  updateProject(id: string, patch: Partial<ProjectRow>): Promise<ProjectRow | null>;
  listProjectsForUser(clerkUserId: string): Promise<ProjectRow[]>;

  createBuild(projectId: string): Promise<BuildRow>;
  getBuild(id: string): Promise<BuildRow | null>;
  updateBuild(id: string, patch: Partial<BuildRow>): Promise<BuildRow | null>;
  appendBuildFeed(id: string, event: BuildEvent): Promise<void>;
  latestBuildForProject(projectId: string): Promise<BuildRow | null>;
  listBuilds(limit?: number): Promise<Array<BuildRow & { project: ProjectRow | null }>>;
  listStuckBuilds(olderThanMs: number): Promise<BuildRow[]>;

  createPayment(p: {
    projectId: string;
    kind: PaymentKind;
    amountCents: number;
    currency: string;
    sessionId?: string;
    waiverAcceptedAt?: string | null;
  }): Promise<PaymentRow>;
  getPaymentBySession(sessionId: string): Promise<PaymentRow | null>;
  updatePayment(id: string, patch: Partial<PaymentRow>): Promise<PaymentRow | null>;
  listPaymentsForProject(projectId: string): Promise<PaymentRow[]>;

  /** Increment a daily rate-limit bucket; returns the new count. */
  bumpRateLimit(bucket: string): Promise<number>;
}

// ---------------------------------------------------------------------------
// In-memory fallback (mock-mode dev without Supabase). Survives HMR.
// ---------------------------------------------------------------------------

interface MemoryDb {
  projects: Map<string, ProjectRow>;
  builds: Map<string, BuildRow>;
  payments: Map<string, PaymentRow>;
  rateLimits: Map<string, number>;
}

function memoryDb(): MemoryDb {
  const g = globalThis as { __selfserveMemDb?: MemoryDb };
  g.__selfserveMemDb ??= {
    projects: new Map(),
    builds: new Map(),
    payments: new Map(),
    rateLimits: new Map(),
  };
  return g.__selfserveMemDb;
}

const now = () => new Date().toISOString();

class MemoryStore implements Store {
  private db = memoryDb();

  async createProject(p: {
    clerkUserId: string;
    email: string;
    businessDescription: string;
    clientIp?: string | null;
  }): Promise<ProjectRow> {
    const row: ProjectRow = {
      id: randomUUID(),
      clerk_user_id: p.clerkUserId,
      email: p.email,
      business_description: p.businessDescription,
      refinement_count: 0,
      demo_spec: null,
      demo_html: null,
      demo_status: 'none',
      outcome: null,
      client_ip: p.clientIp ?? null,
      created_at: now(),
      updated_at: now(),
    };
    this.db.projects.set(row.id, row);
    return row;
  }

  async getProject(id: string) {
    return this.db.projects.get(id) ?? null;
  }

  async updateProject(id: string, patch: Partial<ProjectRow>) {
    const row = this.db.projects.get(id);
    if (!row) return null;
    Object.assign(row, patch, { updated_at: now() });
    return row;
  }

  async listProjectsForUser(clerkUserId: string) {
    return [...this.db.projects.values()]
      .filter((p) => p.clerk_user_id === clerkUserId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async createBuild(projectId: string): Promise<BuildRow> {
    const row: BuildRow = {
      id: randomUUID(),
      project_id: projectId,
      status: 'queued',
      attempt: 0,
      progress: 0,
      feed: [],
      outputs: null,
      error: null,
      admin_alerted_at: null,
      started_at: null,
      completed_at: null,
      created_at: now(),
      updated_at: now(),
    };
    this.db.builds.set(row.id, row);
    return row;
  }

  async getBuild(id: string) {
    return this.db.builds.get(id) ?? null;
  }

  async updateBuild(id: string, patch: Partial<BuildRow>) {
    const row = this.db.builds.get(id);
    if (!row) return null;
    Object.assign(row, patch, { updated_at: now() });
    return row;
  }

  async appendBuildFeed(id: string, event: BuildEvent) {
    const row = this.db.builds.get(id);
    if (!row) return;
    row.feed = [...row.feed, event];
    row.updated_at = now();
  }

  async latestBuildForProject(projectId: string) {
    return (
      [...this.db.builds.values()]
        .filter((b) => b.project_id === projectId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
    );
  }

  async listBuilds(limit = 100) {
    return [...this.db.builds.values()]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit)
      .map((b) => ({ ...b, project: this.db.projects.get(b.project_id) ?? null }));
  }

  async listStuckBuilds(olderThanMs: number) {
    const cutoff = Date.now() - olderThanMs;
    return [...this.db.builds.values()].filter(
      (b) =>
        (b.status === 'running' || b.status === 'queued' || b.status === 'retrying') &&
        new Date(b.created_at).getTime() < cutoff,
    );
  }

  async createPayment(p: {
    projectId: string;
    kind: PaymentKind;
    amountCents: number;
    currency: string;
    sessionId?: string;
    waiverAcceptedAt?: string | null;
  }): Promise<PaymentRow> {
    const row: PaymentRow = {
      id: randomUUID(),
      project_id: p.projectId,
      kind: p.kind,
      status: 'pending',
      amount_cents: p.amountCents,
      currency: p.currency,
      stripe_checkout_session_id: p.sessionId ?? null,
      stripe_payment_intent_id: null,
      stripe_subscription_id: null,
      waiver_accepted_at: p.waiverAcceptedAt ?? null,
      created_at: now(),
      updated_at: now(),
    };
    this.db.payments.set(row.id, row);
    return row;
  }

  async getPaymentBySession(sessionId: string) {
    return (
      [...this.db.payments.values()].find((p) => p.stripe_checkout_session_id === sessionId) ?? null
    );
  }

  async updatePayment(id: string, patch: Partial<PaymentRow>) {
    const row = this.db.payments.get(id);
    if (!row) return null;
    Object.assign(row, patch, { updated_at: now() });
    return row;
  }

  async listPaymentsForProject(projectId: string) {
    return [...this.db.payments.values()]
      .filter((p) => p.project_id === projectId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  async bumpRateLimit(bucket: string) {
    const next = (this.db.rateLimits.get(bucket) ?? 0) + 1;
    this.db.rateLimits.set(bucket, next);
    return next;
  }
}

// ---------------------------------------------------------------------------
// Supabase store (service role; RLS denies anon access entirely).
// ---------------------------------------------------------------------------

type Supabase = ReturnType<typeof createSupabaseServiceRoleClient>;

class SupabaseStore implements Store {
  constructor(private sb: Supabase) {}

  private async one<T>(q: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T | null> {
    const { data, error } = await q;
    if (error) throw new Error(`[selfserve store] ${error.message}`);
    return (data as T) ?? null;
  }

  async createProject(p: {
    clerkUserId: string;
    email: string;
    businessDescription: string;
    clientIp?: string | null;
  }) {
    return (await this.one<ProjectRow>(
      this.sb
        .from('selfserve_projects')
        .insert({
          clerk_user_id: p.clerkUserId,
          email: p.email,
          business_description: p.businessDescription,
          client_ip: p.clientIp ?? null,
        })
        .select()
        .single(),
    ))!;
  }

  async getProject(id: string) {
    return this.one<ProjectRow>(
      this.sb.from('selfserve_projects').select().eq('id', id).maybeSingle(),
    );
  }

  async updateProject(id: string, patch: Partial<ProjectRow>) {
    return this.one<ProjectRow>(
      this.sb
        .from('selfserve_projects')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle(),
    );
  }

  async listProjectsForUser(clerkUserId: string) {
    return (
      (await this.one<ProjectRow[]>(
        this.sb
          .from('selfserve_projects')
          .select()
          .eq('clerk_user_id', clerkUserId)
          .order('created_at', { ascending: false }),
      )) ?? []
    );
  }

  async createBuild(projectId: string) {
    return (await this.one<BuildRow>(
      this.sb.from('selfserve_builds').insert({ project_id: projectId }).select().single(),
    ))!;
  }

  async getBuild(id: string) {
    return this.one<BuildRow>(this.sb.from('selfserve_builds').select().eq('id', id).maybeSingle());
  }

  async updateBuild(id: string, patch: Partial<BuildRow>) {
    return this.one<BuildRow>(
      this.sb
        .from('selfserve_builds')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle(),
    );
  }

  async appendBuildFeed(id: string, event: BuildEvent) {
    // Read-modify-write is fine here: a build's events are produced by a single
    // runner, so there is no concurrent writer for the same row.
    const build = await this.getBuild(id);
    if (!build) return;
    await this.updateBuild(id, { feed: [...build.feed, event] });
  }

  async latestBuildForProject(projectId: string) {
    return this.one<BuildRow>(
      this.sb
        .from('selfserve_builds')
        .select()
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    );
  }

  async listBuilds(limit = 100) {
    const rows =
      (await this.one<Array<BuildRow & { project: ProjectRow | null }>>(
        this.sb
          .from('selfserve_builds')
          .select('*, project:selfserve_projects(*)')
          .order('created_at', { ascending: false })
          .limit(limit),
      )) ?? [];
    return rows;
  }

  async listStuckBuilds(olderThanMs: number) {
    const cutoff = new Date(Date.now() - olderThanMs).toISOString();
    return (
      (await this.one<BuildRow[]>(
        this.sb
          .from('selfserve_builds')
          .select()
          .in('status', ['queued', 'running', 'retrying'])
          .lt('created_at', cutoff),
      )) ?? []
    );
  }

  async createPayment(p: {
    projectId: string;
    kind: PaymentKind;
    amountCents: number;
    currency: string;
    sessionId?: string;
    waiverAcceptedAt?: string | null;
  }) {
    return (await this.one<PaymentRow>(
      this.sb
        .from('selfserve_payments')
        .insert({
          project_id: p.projectId,
          kind: p.kind,
          amount_cents: p.amountCents,
          currency: p.currency,
          stripe_checkout_session_id: p.sessionId ?? null,
          waiver_accepted_at: p.waiverAcceptedAt ?? null,
        })
        .select()
        .single(),
    ))!;
  }

  async getPaymentBySession(sessionId: string) {
    return this.one<PaymentRow>(
      this.sb
        .from('selfserve_payments')
        .select()
        .eq('stripe_checkout_session_id', sessionId)
        .maybeSingle(),
    );
  }

  async updatePayment(id: string, patch: Partial<PaymentRow>) {
    return this.one<PaymentRow>(
      this.sb
        .from('selfserve_payments')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle(),
    );
  }

  async listPaymentsForProject(projectId: string) {
    return (
      (await this.one<PaymentRow[]>(
        this.sb
          .from('selfserve_payments')
          .select()
          .eq('project_id', projectId)
          .order('created_at', { ascending: true }),
      )) ?? []
    );
  }

  async bumpRateLimit(bucket: string) {
    // Atomic insert-or-increment via SQL function (see init_schema migration).
    const { data, error } = await this.sb.rpc('selfserve_bump_rate_limit', { p_bucket: bucket });
    if (error) throw new Error(`[selfserve store] rate limit bump: ${error.message}`);
    return data as number;
  }
}

let store: Store | undefined;

export function getStore(): Store {
  if (store) return store;
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (hasSupabase) {
    store = new SupabaseStore(createSupabaseServiceRoleClient());
  } else {
    console.warn(
      '[selfserve] Supabase env missing — using in-memory store (mock/dev only, data is not persisted)',
    );
    store = new MemoryStore();
  }
  return store;
}
