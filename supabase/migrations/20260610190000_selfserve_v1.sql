-- Self-serve v1 funnel: projects, builds, payments, rate limits.
-- Accessed exclusively via the service role from the selfserve app's server
-- routes (Clerk owns identity); RLS is enabled with no policies = deny-all
-- for anon/authenticated keys.

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

-- Hard rate limits per email/IP for demo generation (daily windows).
create table if not exists public.selfserve_rate_limits (
  bucket text primary key, -- e.g. 'email:a@b.c:2026-06-10' or 'ip:1.2.3.4:2026-06-10'
  count int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.selfserve_projects enable row level security;
alter table public.selfserve_builds enable row level security;
alter table public.selfserve_payments enable row level security;
alter table public.selfserve_rate_limits enable row level security;
