-- Funnel previews, made durable.
--
-- Until now a generated preview lived in exactly one place: two process-local
-- Maps inside the Next.js server (`lib/discovery/live-jobs.ts` for progress,
-- `lib/flowstarter/claim.ts` for the manifest). That is fine for one worker and
-- a lie for anything else. A visitor who generated a preview on instance A and
-- signed in against instance B got a workspace with no artifacts behind it: an
-- owned project that can take a deposit and has nothing to build from. A
-- restart between "look at this" and "make it mine" did the same.
--
-- This table is the truth instead. The Map stays as an in-process cache, but
-- every claim that misses it reads a row from here, so the conversion survives
-- a restart, a redeploy, and a second instance.
--
-- It is also the ledger the preview HOSTING path needs. Previews are deployed
-- as real, temporary sites on the shared Hetzner host (same deploy-agent code
-- path a paying customer's site uses, deliberately, so the risky path is
-- exercised dozens of times a day before it matters). Something has to know
-- which hostname is live, whether it deployed, and when it must be torn down
-- again — a preview with no expiry is a site we host forever for someone who
-- never became a customer.
--
-- SERVER-ONLY. A funnel preview belongs to nobody yet: there is no workspace
-- and no membership at the moment it is written, so there is no tenant to scope
-- a policy to. RLS is on with zero policies (an absent policy is a deny) and
-- the grants below make that deny explicit rather than inherited.

create table if not exists public.funnel_previews (
  -- The wizard's demo id. Also the id in the unlock link inside the generated
  -- site, which is why it is not treated as a secret anywhere.
  preview_id uuid primary key,

  -- What was generated, as the pipeline produced it. `manifest` is the
  -- `TemplateScaffoldFile[]` the build worker rebuilds from; `brand_config` is
  -- what the honesty pass and the generator were given.
  template_slug text,
  template_version text,
  brand_config jsonb not null default '{}'::jsonb,
  manifest jsonb not null default '{}'::jsonb,

  -- `funnel/{preview_id}/site.tar.gz` in the private `tenant-assets` bucket.
  -- Not under `tenant/`, on purpose: there is no workspace to scope it to yet,
  -- and the bucket's read policy only ever grants `tenant/{workspaceId}/...`,
  -- so an object under `funnel/` is unreadable by any browser session by
  -- construction. On claim it is copied to the workspace's tenant path.
  artifact_path text,

  -- The temporary site on the previews host. Unguessable and never derived
  -- from the business name: a competitor who knows the business exists must
  -- not be able to guess the URL of a site that business has not published.
  hostname text unique,
  deploy_status text not null default 'pending'
    check (deploy_status in ('pending', 'live', 'failed', 'removed')),
  deployment_error text,

  -- Every preview has a TTL. Unclaimed ones are torn down by the reaper
  -- (`lib/hosting/preview-reaper.ts`); claiming extends it, because at that
  -- point the site belongs to somebody.
  expires_at timestamptz not null,

  -- Set once, when the preview becomes an owned project. `on delete set null`
  -- rather than cascade: if a workspace is deleted we still want the row (and
  -- therefore the reaper's ability to tear the site down) to survive.
  claimed_workspace_id uuid references public.workspaces(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.funnel_previews is
  'Durable record of one anonymous funnel preview: the manifest a claim rebuilds from, the temporary hosted site, and the TTL that tears it down. Server-only; a preview has no tenant until it is claimed.';
comment on column public.funnel_previews.artifact_path is
  'Object path in the private tenant-assets bucket, under funnel/{preview_id}/. Outside the tenant/ prefix the read policy grants, so it is service-role-only by construction.';
comment on column public.funnel_previews.hostname is
  'Hostname of the temporary preview site, e.g. p-<16 hex>.preview.flowstarter.net. Unguessable by design and never derived from the business name.';
comment on column public.funnel_previews.expires_at is
  'When the hosted preview is torn down. Short while anonymous, extended on claim.';
comment on column public.funnel_previews.claimed_workspace_id is
  'The workspace this preview became. Null while the preview is still anonymous; a claimed preview is never reaped.';

-- The reaper's query: unclaimed rows past their TTL that still have something
-- to tear down. Partial, because a claimed preview is never a candidate.
create index if not exists funnel_previews_expiry_idx
  on public.funnel_previews (expires_at)
  where claimed_workspace_id is null;

-- The claim's lookup when a workspace already exists for this preview.
create index if not exists funnel_previews_claimed_workspace_idx
  on public.funnel_previews (claimed_workspace_id)
  where claimed_workspace_id is not null;

create index if not exists funnel_previews_deploy_status_idx
  on public.funnel_previews (deploy_status);

-- `updated_at` is maintained by the database rather than by every caller, so a
-- code path that forgets it cannot make a row look staler than it is.
create or replace function public.funnel_previews_set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists funnel_previews_set_updated_at on public.funnel_previews;
create trigger funnel_previews_set_updated_at
  before update on public.funnel_previews
  for each row
  execute function public.funnel_previews_set_updated_at();

alter table public.funnel_previews enable row level security;

revoke all on table public.funnel_previews from anon, authenticated;
grant all on table public.funnel_previews to service_role;

-- ─── The teardown job kind ─────────────────────────────────────────────────
-- Reaping expired previews is a scheduled sweep across the fleet, not work on
-- behalf of one workspace, so it is the first job in the ledger that has no
-- tenant. `workspace_id` therefore loses its NOT NULL — but only for this one
-- kind: the check below re-imposes the old requirement on every other kind, so
-- a FULL_SITE_BUILD with no workspace is still rejected by the database rather
-- than by a code path somebody has to remember to write.

alter table public.flowstarter_agent_jobs
  drop constraint if exists flowstarter_agent_jobs_kind_check;
alter table public.flowstarter_agent_jobs
  add constraint flowstarter_agent_jobs_kind_check
  check (kind in (
    'FULL_SITE_BUILD', 'INLINE_EDIT',
    'ASSET_INGEST', 'PREVIEW_GENERATE', 'ASSET_REQUEST', 'REMINDER',
    'PREVIEW_REAP'
  ));

alter table public.flowstarter_agent_jobs
  alter column workspace_id drop not null;

alter table public.flowstarter_agent_jobs
  drop constraint if exists flowstarter_agent_jobs_workspace_required;
alter table public.flowstarter_agent_jobs
  add constraint flowstarter_agent_jobs_workspace_required
  check (workspace_id is not null or kind = 'PREVIEW_REAP');

comment on column public.flowstarter_agent_jobs.workspace_id is
  'The tenant this job belongs to. Null only for PREVIEW_REAP, a fleet-wide sweep with no tenant; the flowstarter_agent_jobs_workspace_required check enforces that.';
