-- Concierge Phase 0 — real, policy-based tenant isolation.
--
-- HOW A CLERK IDENTITY REACHES POSTGRES
-- apps/flowstarter-main/src/lib/clerk-supabase-jwt.ts asks Clerk for the
-- default session token (Supabase third-party auth), falling back to the
-- legacy JWT template named by CLERK_SUPABASE_TEMPLATE. Both carry the Clerk
-- user id in the standard `sub` claim, and both set `role: authenticated`,
-- which is how PostgREST picks the database role. The token is attached as a
-- bearer header in src/supabase-clients/server.ts.
--
-- Every policy below therefore reads the Clerk user id through exactly one
-- function, public.current_clerk_user_id(). If a future token ever carries the
-- id somewhere else, that function is the single place to change.

-- ─── Identity helpers ──────────────────────────────────────────────────────

create or replace function public.current_clerk_user_id()
returns text
language sql
stable
set search_path = public, pg_catalog
as $$
  select nullif(
    coalesce(
      auth.jwt() ->> 'sub',
      current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
    ),
    ''
  )
$$;

comment on function public.current_clerk_user_id() is
  'The Clerk user id for the current request, read from the JWT `sub` claim. Single source of truth for every RLS policy.';

-- Security definer so a member check does not itself need a policy on
-- workspace_memberships; it can only ever answer about the caller.
create or replace function public.is_workspace_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.workspace_memberships m
    where m.workspace_id = ws
      and m.clerk_user_id = public.current_clerk_user_id()
  )
$$;

comment on function public.is_workspace_member(uuid) is
  'True when the current Clerk user has a workspace_memberships row for this workspace.';

revoke all on function public.current_clerk_user_id() from public;
revoke all on function public.is_workspace_member(uuid) from public;
grant execute on function public.current_clerk_user_id() to authenticated, service_role;
grant execute on function public.is_workspace_member(uuid) to authenticated, service_role;

-- ─── workspaces / workspace_memberships ────────────────────────────────────
-- Both already had RLS on with zero policies, so a client could never see
-- their own tenant. Read-only access, nothing more.

drop policy if exists workspaces_select_members on public.workspaces;
create policy workspaces_select_members
  on public.workspaces for select to authenticated
  using (public.is_workspace_member(id));

drop policy if exists workspace_memberships_select_self on public.workspace_memberships;
create policy workspace_memberships_select_self
  on public.workspace_memberships for select to authenticated
  using (clerk_user_id = public.current_clerk_user_id());

-- ─── Read-only tenant tables ───────────────────────────────────────────────
-- Members read their own workspace's rows. Writes stay with the service role,
-- which bypasses RLS: the absence of an insert/update/delete policy is the
-- deny.

drop policy if exists project_events_select_members on public.project_events;
create policy project_events_select_members
  on public.project_events for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists intake_submissions_select_members on public.intake_submissions;
create policy intake_submissions_select_members
  on public.intake_submissions for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists brand_signals_select_members on public.brand_signals;
create policy brand_signals_select_members
  on public.brand_signals for select to authenticated
  using (public.is_workspace_member(workspace_id));

grant select on table public.project_events to authenticated;
grant select on table public.intake_submissions to authenticated;
grant select on table public.brand_signals to authenticated;

-- ─── assets ────────────────────────────────────────────────────────────────
-- A client picks assets and confirms rights, and that is the whole of what
-- they may change. RLS cannot restrict columns, so the column list is pinned
-- by a column-level grant: `selected` and `rights_confirmed_at` only.

drop policy if exists assets_select_members on public.assets;
create policy assets_select_members
  on public.assets for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists assets_update_members on public.assets;
create policy assets_update_members
  on public.assets for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

grant select on table public.assets to authenticated;
grant update (selected, rights_confirmed_at) on table public.assets to authenticated;

-- ─── asset_rights_confirmations ────────────────────────────────────────────
-- Insert-only evidence. A client may file a confirmation for their own
-- workspace under their own name, and may read what they filed. No update or
-- delete policy exists, so the record cannot be rewritten afterwards.

drop policy if exists asset_rights_confirmations_select_members on public.asset_rights_confirmations;
create policy asset_rights_confirmations_select_members
  on public.asset_rights_confirmations for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists asset_rights_confirmations_insert_members on public.asset_rights_confirmations;
create policy asset_rights_confirmations_insert_members
  on public.asset_rights_confirmations for insert to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and confirmed_by = public.current_clerk_user_id()
  );

grant select, insert on table public.asset_rights_confirmations to authenticated;

-- ─── project_messages ──────────────────────────────────────────────────────
-- Clients read the thread and may only add inbound messages authored by
-- themselves. Outbound asks and status transitions belong to the server.

drop policy if exists project_messages_select_members on public.project_messages;
create policy project_messages_select_members
  on public.project_messages for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists project_messages_insert_inbound on public.project_messages;
create policy project_messages_insert_inbound
  on public.project_messages for insert to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and direction = 'inbound'
    and created_by = public.current_clerk_user_id()
  );

grant select, insert on table public.project_messages to authenticated;

-- ─── Server-only tables ────────────────────────────────────────────────────
-- No policies, no browser grants. llm_usage joins flowstarter_agent_jobs and
-- flowstarter_project_artifacts in the server-only set; spend data is not a
-- client's business.

revoke all on table public.llm_usage from anon, authenticated;
revoke all on table public.flowstarter_agent_jobs from anon, authenticated;
revoke all on table public.flowstarter_project_artifacts from anon, authenticated;
grant all on table public.llm_usage to service_role;
grant all on table public.flowstarter_agent_jobs to service_role;
grant all on table public.flowstarter_project_artifacts to service_role;
