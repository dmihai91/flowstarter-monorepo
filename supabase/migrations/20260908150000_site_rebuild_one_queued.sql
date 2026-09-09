-- Narrow the SITE_REBUILD uniqueness from "one live job" to "one queued job".
--
-- flowstarter_agent_jobs_one_live_rebuild (20260908140000) refused a second
-- row while any SITE_REBUILD for a workspace was 'queued' or 'running'. But
-- the worker freezes the manifest it will build at claim time (job-store.ts
-- claim()): a 'running' job is already building whatever manifest existed
-- when it was claimed, and cannot pick up a later edit. A publish that lands
-- while a rebuild is running therefore has to start its own job rather than
-- join the running one, or the edit is silently lost. What still must not
-- happen is two rebuilds racing for the same worktree, so at most one
-- SITE_REBUILD may be 'queued' per workspace at a time; 'running' is no
-- longer part of the constraint, because a queued job is exactly what waits
-- behind a running one.

drop index if exists public.flowstarter_agent_jobs_one_live_rebuild;

create unique index if not exists flowstarter_agent_jobs_one_queued_rebuild
  on public.flowstarter_agent_jobs (workspace_id)
  where kind = 'SITE_REBUILD' and status = 'queued';
