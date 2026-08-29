-- Concierge Phase 0 — foundational per-tenant data model.
--
-- Every table here is owned by exactly one workspace: `workspace_id` is the
-- tenant column (tenants are rows in public.workspaces), it is the first
-- column of every composite index, and it cascades on workspace deletion.
-- Row level security is enabled on all of them; the policies themselves land
-- in the companion migration 20260829090100_concierge_rls_policies.sql.
--
-- Grants are written explicitly because Supabase's default privileges hand
-- `all` on new public tables to anon + authenticated. Each table below starts
-- from a revoke and is re-granted only what a browser role legitimately needs.

-- ─── project_events ────────────────────────────────────────────────────────
-- Append-only audit trail for everything that happens to a project. Clients
-- may read their own workspace's history; nobody but the service role writes.

create table if not exists public.project_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  kind text not null,
  -- Clerk user id of the actor, or the literal 'system' for machine events.
  actor text not null default 'system',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists project_events_workspace_created_idx
  on public.project_events (workspace_id, created_at desc);

create index if not exists project_events_workspace_kind_idx
  on public.project_events (workspace_id, kind, created_at desc);

-- ─── intake_submissions ────────────────────────────────────────────────────
-- One row per completed intake form, with the routing verdict that sent the
-- lead down the standard or custom path. `outcome` stays null until the
-- project finishes and the rules can be calibrated against reality.

create table if not exists public.intake_submissions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  score numeric,
  routing_decision text not null
    check (routing_decision in ('standard', 'custom')),
  rules_fired text[] not null default '{}',
  decided_by text not null default 'rules'
    check (decided_by in ('rules', 'override')),
  overridden boolean not null default false,
  override_reason text,
  outcome text,
  created_at timestamptz not null default now()
);

create index if not exists intake_submissions_workspace_created_idx
  on public.intake_submissions (workspace_id, created_at desc);

-- ─── assets ────────────────────────────────────────────────────────────────
-- Every image or file the pipeline knows about, whatever its provenance:
-- client upload, generated placeholder, Open Graph scrape, Google Business
-- Profile, the old site, or social. project_id is nullable because today a
-- project *is* a workspace; it exists so projects can split off later.

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid,
  source text not null
    check (source in ('upload', 'generated', 'og', 'gbp', 'old_site', 'social')),
  kind text,
  storage_path text,
  sha256 text,
  mime text,
  width integer,
  height integer,
  aspect_ratio numeric,
  dominant_colors text[],
  sharpness_score numeric,
  has_transparency boolean,
  caption text,
  source_url text,
  usable_for text[] not null default '{}',
  is_placeholder boolean not null default false,
  ai_generated boolean not null default false,
  selected boolean not null default false,
  rights_confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Dedupe by content hash within a tenant. Partial so rows that have not been
-- hashed yet (in-flight ingests) do not collide with each other.
create unique index if not exists assets_workspace_sha256_unique
  on public.assets (workspace_id, sha256)
  where sha256 is not null;

create index if not exists assets_workspace_created_idx
  on public.assets (workspace_id, created_at desc);

create index if not exists assets_workspace_selected_idx
  on public.assets (workspace_id, selected)
  where selected = true;

-- ─── brand_signals ─────────────────────────────────────────────────────────
-- Derived brand evidence (palette, tone, keywords) with the sources it came
-- from. Kept as history rather than a single row per workspace: the newest
-- `derived_at` for a workspace is the current signal set.

create table if not exists public.brand_signals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  palette jsonb not null default '{}'::jsonb,
  tone_notes text,
  keywords text[] not null default '{}',
  derived_at timestamptz not null default now(),
  sources text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists brand_signals_workspace_derived_idx
  on public.brand_signals (workspace_id, derived_at desc);

-- ─── asset_rights_confirmations ────────────────────────────────────────────
-- The client's on-the-record statement that they hold the rights to a set of
-- assets. Evidence, so it is insert-only and never edited: ip/user_agent are
-- captured verbatim and `statement_version` pins the wording they agreed to.
-- `ip` is text, not inet, to match the house style in demo_generation_costs
-- and to survive proxy headers that are not parseable addresses.

create table if not exists public.asset_rights_confirmations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  asset_ids uuid[] not null default '{}',
  confirmed_by text not null,
  confirmed_at timestamptz not null default now(),
  ip text,
  user_agent text,
  statement_version text,
  created_at timestamptz not null default now()
);

create index if not exists asset_rights_confirmations_workspace_confirmed_idx
  on public.asset_rights_confirmations (workspace_id, confirmed_at desc);

-- ─── llm_usage ─────────────────────────────────────────────────────────────
-- One row per model call across the whole product. workspace_id is nullable
-- on purpose: anonymous funnel previews bill against no workspace yet.
--
-- This supersedes public.demo_generation_costs (funnel-only, demo_id keyed).
-- The old table is deliberately left in place — the budget guard still reads
-- it — so the two coexist until the funnel routes are migrated.

create table if not exists public.llm_usage (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  project_id uuid,
  action text not null,
  model text,
  tokens_in integer not null default 0,
  tokens_out integer not null default 0,
  cached_tokens integer not null default 0,
  cost_estimate numeric(12, 6) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists llm_usage_workspace_created_idx
  on public.llm_usage (workspace_id, created_at desc);

create index if not exists llm_usage_action_created_idx
  on public.llm_usage (action, created_at desc);

-- ─── project_messages ──────────────────────────────────────────────────────
-- The concierge conversation: outbound asks from the team or the agents, and
-- the client's inbound replies. `asks` is the structured list of things the
-- message requests so the UI can render and resolve them one by one.

create table if not exists public.project_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  direction text not null check (direction in ('outbound', 'inbound')),
  kind text not null
    check (kind in ('asset_request', 'clarification', 'reminder', 'client_reply')),
  body text,
  asks jsonb not null default '[]'::jsonb,
  status text not null default 'sent'
    check (status in ('sent', 'answered', 'expired')),
  sent_at timestamptz,
  answered_at timestamptz,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists project_messages_workspace_created_idx
  on public.project_messages (workspace_id, created_at desc);

create index if not exists project_messages_workspace_open_idx
  on public.project_messages (workspace_id, status, created_at desc)
  where status = 'sent';

-- ─── Generalise the existing job ledger ────────────────────────────────────
-- One queue, not two. flowstarter_agent_jobs gains caller-supplied
-- idempotency, a retry budget, and a scheduled-earliest-run time, and its
-- kind check widens to the concierge job kinds. Existing unique indexes
-- (one full build per workspace, one job per Stripe event) are untouched.

alter table public.flowstarter_agent_jobs
  add column if not exists idempotency_key text,
  add column if not exists max_attempts integer not null default 3,
  add column if not exists run_after timestamptz not null default now();

alter table public.flowstarter_agent_jobs
  drop constraint if exists flowstarter_agent_jobs_max_attempts_check;
alter table public.flowstarter_agent_jobs
  add constraint flowstarter_agent_jobs_max_attempts_check
  check (max_attempts > 0);

alter table public.flowstarter_agent_jobs
  drop constraint if exists flowstarter_agent_jobs_kind_check;
alter table public.flowstarter_agent_jobs
  add constraint flowstarter_agent_jobs_kind_check
  check (kind in (
    'FULL_SITE_BUILD', 'INLINE_EDIT',
    'ASSET_INGEST', 'PREVIEW_GENERATE', 'ASSET_REQUEST', 'REMINDER'
  ));

-- Idempotency is scoped to the tenant: two workspaces may legitimately mint
-- the same human-readable key (e.g. 'preview:1') without colliding.
create unique index if not exists flowstarter_agent_jobs_idempotency_key_unique
  on public.flowstarter_agent_jobs (workspace_id, idempotency_key)
  where idempotency_key is not null;

-- Claim query: the oldest due job in a runnable state.
create index if not exists flowstarter_agent_jobs_run_after_idx
  on public.flowstarter_agent_jobs (status, run_after)
  where status in ('queued', 'running');

-- ─── Row level security + grants ───────────────────────────────────────────

alter table public.project_events enable row level security;
alter table public.intake_submissions enable row level security;
alter table public.assets enable row level security;
alter table public.brand_signals enable row level security;
alter table public.asset_rights_confirmations enable row level security;
alter table public.llm_usage enable row level security;
alter table public.project_messages enable row level security;

revoke all on table public.project_events from anon, authenticated;
revoke all on table public.intake_submissions from anon, authenticated;
revoke all on table public.assets from anon, authenticated;
revoke all on table public.brand_signals from anon, authenticated;
revoke all on table public.asset_rights_confirmations from anon, authenticated;
revoke all on table public.llm_usage from anon, authenticated;
revoke all on table public.project_messages from anon, authenticated;

grant all on table public.project_events to service_role;
grant all on table public.intake_submissions to service_role;
grant all on table public.assets to service_role;
grant all on table public.brand_signals to service_role;
grant all on table public.asset_rights_confirmations to service_role;
grant all on table public.llm_usage to service_role;
grant all on table public.project_messages to service_role;

comment on table public.project_events is
  'Append-only per-workspace audit trail; members read, only the service role writes.';
comment on table public.intake_submissions is
  'Intake payload plus the routing verdict (standard/custom) and the rules that produced it.';
comment on table public.assets is
  'Every asset the pipeline knows about, deduped per workspace by sha256.';
comment on table public.brand_signals is
  'Derived brand evidence per workspace; newest derived_at wins.';
comment on table public.asset_rights_confirmations is
  'Insert-only evidence that a client confirmed rights over a set of assets.';
comment on table public.llm_usage is
  'Per-call model spend ledger. Nullable workspace_id covers anonymous funnel previews. Supersedes demo_generation_costs, which is left in place for the existing budget guard.';
comment on table public.project_messages is
  'Concierge conversation: outbound asks and inbound client replies.';
comment on column public.flowstarter_agent_jobs.idempotency_key is
  'Caller-supplied dedupe key, unique per workspace when not null.';
comment on column public.flowstarter_agent_jobs.run_after is
  'Earliest time a worker may claim this job; backoff and scheduling write here.';
