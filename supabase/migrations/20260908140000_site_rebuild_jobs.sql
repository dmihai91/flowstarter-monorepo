-- SITE_REBUILD: the job that makes a client's published edit actually go live.
--
-- The site editor writes an edited *source* manifest into
-- `flowstarter_project_artifacts.preview_manifest`, and the publish route
-- stamped a version and then stopped, because `deploySite` wants a BUILT
-- artifact and no build of the edited manifest existed. Pushing source to the
-- deploy agent would publish source; pushing the previous build would publish
-- the site without the change and call it success. So the missing piece was
-- never a deploy call, it was a build.
--
-- This kind is that build. It runs the same worker as FULL_SITE_BUILD, from
-- the same manifest column, minus the agents: materialize, validate, commit,
-- publish. It is deliberately a separate kind rather than a re-run of
-- FULL_SITE_BUILD, because the two differ in every way that matters to an
-- operator reading the board: no agent spend, no project_state move, and it is
-- valid long after the deposit build finished.

alter table public.flowstarter_agent_jobs
  drop constraint if exists flowstarter_agent_jobs_kind_check;
alter table public.flowstarter_agent_jobs
  add constraint flowstarter_agent_jobs_kind_check
  check (kind in (
    'FULL_SITE_BUILD', 'INLINE_EDIT',
    'ASSET_INGEST', 'PREVIEW_GENERATE', 'ASSET_REQUEST', 'REMINDER',
    'PREVIEW_REAP', 'SITE_REBUILD'
  ));

-- Re-declared verbatim so the two checks stay readable side by side: only a
-- fleet-wide sweep may have no tenant, and a rebuild is always somebody's.
alter table public.flowstarter_agent_jobs
  drop constraint if exists flowstarter_agent_jobs_workspace_required;
alter table public.flowstarter_agent_jobs
  add constraint flowstarter_agent_jobs_workspace_required
  check (workspace_id is not null or kind = 'PREVIEW_REAP');

-- A client may publish many times over the life of a site, so unlike
-- FULL_SITE_BUILD (one row per workspace, forever) the history of rebuilds is
-- kept. What must not happen is two rebuilds of the same workspace in flight
-- at once: they would race for the same worktree and the loser would deploy
-- stale files over the winner. So the uniqueness is on the *live* rows only,
-- and the publish route reads a 23505 here as "one is already queued".
create unique index if not exists flowstarter_agent_jobs_one_live_rebuild
  on public.flowstarter_agent_jobs (workspace_id)
  where kind = 'SITE_REBUILD' and status in ('queued', 'running');
