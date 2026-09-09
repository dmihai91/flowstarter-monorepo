-- The build conversation.
--
-- A FULL_SITE_BUILD used to be a single `running` chip for the whole of its
-- ten-minute life: the worker wrote to the ledger when it claimed the job and
-- again when it finished, and nothing in between. This table is the channel
-- between the worker and the operator board while a build is in flight.
--
--   phase  the worker's progress, one row per step ("Checking the build")
--   log    detail the worker chose to surface (a failed build's output)
--   reply  what the build agent said at the end of a pass
--   note   what an operator said to the agents; folded into the next pass
--
-- Service-role only, like the ledger itself: the operator API writes notes on
-- behalf of an authenticated team member, and the worker writes the rest.

create table if not exists public.flowstarter_agent_job_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.flowstarter_agent_jobs(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  kind text not null check (kind in ('phase', 'log', 'note', 'reply')),
  -- Clerk user id of the operator for notes, the literal 'system' otherwise.
  actor text not null default 'system',
  body text not null check (char_length(body) between 1 and 4000),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists flowstarter_agent_job_events_job_created_idx
  on public.flowstarter_agent_job_events (job_id, created_at);

create index if not exists flowstarter_agent_job_events_notes_idx
  on public.flowstarter_agent_job_events (job_id, created_at)
  where kind = 'note';

alter table public.flowstarter_agent_job_events enable row level security;
revoke all on table public.flowstarter_agent_job_events from anon, authenticated;
grant all on table public.flowstarter_agent_job_events to service_role;

comment on table public.flowstarter_agent_job_events is
  'Progress, agent replies and operator notes for one flowstarter_agent_jobs row. Notes are read by the build worker at pass boundaries.';
