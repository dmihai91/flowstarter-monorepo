-- ============================================================
-- Flowstarter schema — from-scratch baseline (self-serve v1).
-- Replaces all concierge-era migrations (profiles/workspaces/
-- discovery_leads/billing) per the self-serve pivot: this file
-- is the single source of truth for a fresh database.
--
-- Identity lives in Clerk; recurring billing lives in Clerk
-- Billing; one-time payments in Stripe. These tables are
-- accessed exclusively with the service role from the selfserve
-- app's server routes — RLS is enabled with no policies, which
-- denies anon/authenticated keys entirely.
--
-- NOTE: intentionally contains no DROPs of legacy tables. On an
-- existing branch, reset the branch (or drop legacy tables
-- explicitly) to converge; a fresh branch replays just this file.
-- ============================================================

-- ---------- projects: one funnel run per business description ----------
create table if not exists public.selfserve_projects (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  email text not null,
  business_description text not null,
  refinement_count int not null default 0,
  demo_spec jsonb,
  demo_status text not null default 'none'
    check (demo_status in ('none', 'generating', 'ready', 'failed')),
  outcome text
    check (outcome in ('launch', 'code_only', 'walked_away')),
  client_ip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists selfserve_projects_user_idx on public.selfserve_projects (clerk_user_id);
create index if not exists selfserve_projects_email_idx on public.selfserve_projects (email);

-- ---------- builds: agent build runs (feed = the live theater) ----------
create table if not exists public.selfserve_builds (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.selfserve_projects (id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'retrying', 'failed', 'terminal_failed', 'completed')),
  attempt int not null default 0,
  progress int not null default 0,
  feed jsonb not null default '[]'::jsonb,
  outputs jsonb,
  error text,
  admin_alerted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists selfserve_builds_project_idx on public.selfserve_builds (project_id);
create index if not exists selfserve_builds_status_idx on public.selfserve_builds (status);

-- ---------- payments: Stripe one-time fees (€50 build, €149 delivery) ----------
-- The €39/mo hosting subscription is a Clerk Billing plan and is NOT mirrored
-- here; entitlement checks go through Clerk's has({ plan }).
create table if not exists public.selfserve_payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.selfserve_projects (id) on delete cascade,
  kind text not null
    check (kind in ('build_fee', 'final_code', 'final_subscription')),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'refunded')),
  amount_cents int not null,
  currency text not null default 'eur',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  -- EU 14-day withdrawal-right waiver consent (stage 1 checkout requirement)
  waiver_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists selfserve_payments_project_idx on public.selfserve_payments (project_id);
create unique index if not exists selfserve_payments_session_idx
  on public.selfserve_payments (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

-- ---------- rate limits: hard demo caps per email/IP, daily buckets ----------
create table if not exists public.selfserve_rate_limits (
  bucket text primary key, -- e.g. 'email:a@b.c:2026-06-10' or 'ip:1.2.3.4:2026-06-10'
  count int not null default 0,
  updated_at timestamptz not null default now()
);

-- Atomic bump (insert-or-increment) so concurrent demo requests can't slip
-- past the cap via read-then-write races.
create or replace function public.selfserve_bump_rate_limit(p_bucket text)
returns int
language sql
security definer
set search_path = public
as $$
  insert into public.selfserve_rate_limits as rl (bucket, count, updated_at)
  values (p_bucket, 1, now())
  on conflict (bucket)
  do update set count = rl.count + 1, updated_at = now()
  returning count;
$$;

revoke all on function public.selfserve_bump_rate_limit(text) from public, anon, authenticated;

-- ---------- lock everything down: service role only ----------
alter table public.selfserve_projects enable row level security;
alter table public.selfserve_builds enable row level security;
alter table public.selfserve_payments enable row level security;
alter table public.selfserve_rate_limits enable row level security;
