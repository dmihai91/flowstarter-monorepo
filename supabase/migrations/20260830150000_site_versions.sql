-- Client site editor — a versioned history of the site's file manifest.
--
-- `flowstarter_project_artifacts.preview_manifest` holds exactly one manifest
-- per workspace: the files the build worker builds and the deploy path ships.
-- That single row is the site, so an editor that writes into it and nothing
-- else destroys the previous wording on every save. A client who rewrites a
-- headline and then wants it back has nowhere to get it from.
--
-- So every change made through the editor appends a full snapshot here first,
-- and the artifact row is updated to match. History is append-only: reverting
-- to version 3 writes version 7 whose manifest equals version 3's, rather than
-- deleting 4-6. Nothing a client did is ever removed from the record, and the
-- version a client is looking at is a number they can name.
--
-- `manifest` is deliberately excluded from the `authenticated` grant. A member
-- may list their own history — when, by whom, what changed, what is published
-- — but the site's source only ever leaves the server through the editor
-- routes, which serve it file by file with a checked path.

create table if not exists public.site_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  -- 1-based, dense per workspace. Allocated server-side under the unique
  -- constraint below, so two concurrent applies cannot both become version N.
  version integer not null check (version > 0),
  manifest jsonb not null,
  -- One human line: "Rewrote the hero heading", "Reverted to version 3".
  summary text,
  -- Clerk user id of the actor, or 'system' for a bootstrapped baseline.
  created_by text not null default 'system',
  created_at timestamptz not null default now(),
  -- Set when this version is the one marked for deployment.
  published_at timestamptz,
  constraint site_versions_workspace_version_key unique (workspace_id, version)
);

create index if not exists site_versions_workspace_version_idx
  on public.site_versions (workspace_id, version desc);

comment on table public.site_versions is
  'Append-only snapshots of a workspace''s site file manifest, one row per editor change. The newest row is what flowstarter_project_artifacts.preview_manifest mirrors.';
comment on column public.site_versions.manifest is
  'Full {files:[{path,content,encoding?}]} snapshot. Never granted to authenticated; served only through /api/client/site/[workspaceId]/preview.';

alter table public.site_versions enable row level security;

drop policy if exists site_versions_select_members on public.site_versions;
create policy site_versions_select_members
  on public.site_versions for select to authenticated
  using (public.is_workspace_member(workspace_id));

-- Writes stay with the service role, which bypasses RLS: the absence of an
-- insert/update/delete policy is the deny, and the column grant below is what
-- keeps `manifest` out of a member's reach even on the read they do have.
revoke all on table public.site_versions from anon, authenticated;
grant select (id, workspace_id, version, summary, created_by, created_at, published_at)
  on table public.site_versions to authenticated;
grant all on table public.site_versions to service_role;
