-- Concierge Phase 1 — the private bucket every tenant-owned file lives in.
--
-- `apps/flowstarter-main/src/lib/storage-paths.ts` has built object paths since
-- the foundation landed, but nothing has ever stored one: no bucket existed, so
-- a client who was asked for photos had no way to send them. This creates the
-- one bucket those paths were written for.
--
-- LAYOUT
-- Every object is `tenant/{workspaceId}/...` — assets/, generated/, previews/ —
-- which is what `assertTenantPath` enforces on the application side. That first
-- literal segment is not decoration: it makes the tenant id a fixed position in
-- the path, so a policy can read it without guessing.
--
-- WHO WRITES
-- Nobody but the service role. There is no insert/update/delete policy below,
-- and RLS is already enabled on storage.objects, so the absence of a policy is
-- the deny. Uploads go through POST /api/client/assets/[workspaceId], which
-- authorizes with `requireWorkspaceAccess` and validates magic bytes before a
-- byte reaches storage. A browser-issued upload would bypass both.
--
-- WHO READS
-- The app hands out short-lived signed URLs from the service role, so the read
-- policy is not what makes the feature work — it is the second lock. If a
-- signed URL scheme is ever swapped for direct client reads, or an anon key
-- leaks into a browser that also holds a member's JWT, this policy is what
-- still stops workspace A from listing workspace B's photographs.

-- ─── The bucket ────────────────────────────────────────────────────────────
-- Private (public = false): objects are only reachable through a signed URL
-- or an authorized read. The 10MB cap is the outer limit; the upload route
-- refuses at 8MB per file, matching `assertSafeUploadedImage`, so a client
-- gets a clear error from us rather than an opaque one from storage.
--
-- The mime list covers the three kinds of object the tenant path layout names:
-- client photographs (assets/), generated imagery (generated/), and packaged
-- preview builds (previews/, a .tar.gz plus its json manifest). SVG is absent
-- on purpose — it can carry script, and the upload route rejects it whatever
-- the declared type says.

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'tenant-assets',
  'tenant-assets',
  false,
  10485760, -- 10 MiB
  array[
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/avif',
    'application/gzip',
    'application/json'
  ]
)
on conflict (id) do nothing;

-- ─── Reading the tenant out of an object path ──────────────────────────────
-- `storage.foldername('tenant/{id}/assets/x.png')` returns
-- `{tenant, {id}, assets}`, so the workspace id is element 2 of a 1-based
-- array. Casting that element straight to uuid inside a policy would raise on
-- any object whose second segment is not a uuid, and Postgres does not
-- guarantee that a regex guard in the same `and` chain runs first. This
-- function does the guarding itself and returns null instead of raising;
-- `is_workspace_member(null)` is false, so a malformed path is simply unreadable.

create or replace function public.tenant_path_workspace_id(object_name text)
returns uuid
language sql
immutable
set search_path = public, pg_catalog
as $$
  select case
    when object_name ~ '^tenant/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/'
      then substring(object_name from 8 for 36)::uuid
    else null
  end
$$;

comment on function public.tenant_path_workspace_id(text) is
  'The workspace id embedded in a tenant/{id}/... storage object name, or null when the name is not in that shape.';

revoke all on function public.tenant_path_workspace_id(text) from public;
grant execute on function public.tenant_path_workspace_id(text)
  to authenticated, service_role;

-- ─── Read policy ───────────────────────────────────────────────────────────
-- A member may read objects under their own workspace's prefix, in this bucket
-- only. `public.is_workspace_member` is the same helper every table policy in
-- 20260829090100 uses, so storage and Postgres agree on what membership means.

drop policy if exists tenant_assets_select_members on storage.objects;
create policy tenant_assets_select_members
  on storage.objects for select to authenticated
  using (
    bucket_id = 'tenant-assets'
    and public.is_workspace_member(public.tenant_path_workspace_id(name))
  );

-- No insert/update/delete policy: writes are the service role's alone.
