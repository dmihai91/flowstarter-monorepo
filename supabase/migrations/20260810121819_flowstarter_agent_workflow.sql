-- Durable state and job ledger for the Flowstarter 20/80 agent workflow.
-- Browser roles intentionally receive no access to the artifact/job tables;
-- only the server-side service role and database owner operate them.

alter table public.workspaces
  add column if not exists project_state text not null default 'INTAKE'
    check (project_state in (
      'INTAKE', 'PREVIEW_READY', 'DEPOSIT_PAID',
      'AGENTS_WORKING', 'HUMAN_QA', 'LIVE_SUBSCRIPTION'
    )),
  add column if not exists final_value_minor bigint
    check (final_value_minor is null or final_value_minor > 0),
  add column if not exists billing_currency text not null default 'eur'
    check (billing_currency ~ '^[a-z]{3}$'),
  add column if not exists deposit_percent integer not null default 20
    check (deposit_percent = 20),
  add column if not exists balance_percent integer not null default 80
    check (balance_percent = 80),
  add column if not exists deposit_payment_intent_id text,
  add column if not exists balance_payment_intent_id text;

alter table public.discovery_leads
  add column if not exists instagram_url text,
  add column if not exists linkedin_url text,
  add column if not exists billing_cadence text not null default 'monthly';

alter table public.discovery_leads
  drop constraint if exists discovery_leads_billing_cadence_check;
alter table public.discovery_leads
  add constraint discovery_leads_billing_cadence_check
  check (billing_cadence in ('monthly', 'yearly'));

create unique index if not exists workspaces_deposit_payment_intent_unique
  on public.workspaces (deposit_payment_intent_id)
  where deposit_payment_intent_id is not null;

create unique index if not exists workspaces_balance_payment_intent_unique
  on public.workspaces (balance_payment_intent_id)
  where balance_payment_intent_id is not null;

create index if not exists workspaces_project_state_idx
  on public.workspaces (project_state);

create table if not exists public.flowstarter_project_artifacts (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  intake_payload jsonb not null default '{}'::jsonb,
  scrape_manifest jsonb not null default '{}'::jsonb,
  brand_config jsonb,
  template_slug text,
  template_version text,
  template_selection_reason text,
  preview_artifact_url text,
  preview_manifest jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (template_slug is null or template_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table if not exists public.flowstarter_agent_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  kind text not null check (kind in ('FULL_SITE_BUILD', 'INLINE_EDIT')),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'failed', 'canceled')),
  stripe_event_id text,
  stripe_payment_intent_id text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  payload jsonb not null default '{}'::jsonb,
  worktree_branch text,
  worktree_path text,
  pull_request_url text,
  error_code text,
  error_detail text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  updated_at timestamptz not null default now()
);

create unique index if not exists flowstarter_agent_jobs_one_full_build
  on public.flowstarter_agent_jobs (workspace_id, kind)
  where kind = 'FULL_SITE_BUILD';

create unique index if not exists flowstarter_agent_jobs_stripe_event_unique
  on public.flowstarter_agent_jobs (stripe_event_id)
  where stripe_event_id is not null;

create index if not exists flowstarter_agent_jobs_queue_idx
  on public.flowstarter_agent_jobs (status, created_at)
  where status in ('queued', 'running');

alter table public.flowstarter_project_artifacts enable row level security;
alter table public.flowstarter_agent_jobs enable row level security;

revoke all on table public.flowstarter_project_artifacts from anon, authenticated;
revoke all on table public.flowstarter_agent_jobs from anon, authenticated;
grant all on table public.flowstarter_project_artifacts to service_role;
grant all on table public.flowstarter_agent_jobs to service_role;

comment on table public.flowstarter_project_artifacts is
  'Server-only intake, brand, template-lineage, and approved-preview artifacts.';
comment on table public.flowstarter_agent_jobs is
  'Server-only idempotent job ledger for Pi build and inline-edit workers.';
