/**
 * `withTenant(client, workspaceId)` — a narrow query facade for service-role
 * Supabase access.
 *
 * Service-role clients authenticate with the service key and bypass RLS, so
 * there is no policy left to stop one workspace's query from reading or
 * writing another workspace's rows — the filter has to be applied in code,
 * on every query, without exception. `withTenant` makes that filter
 * structural instead of remembered: every read/update/delete issued through
 * it carries `.eq('workspace_id', workspaceId)`, and every insert/upsert has
 * `workspace_id` injected into each row it is given (and throws if a row
 * already names a *different* workspace_id).
 *
 * Scope: only tables that carry a `workspace_id` column. `TenantTableName`
 * is computed from the generated `Database` type, so the set of tables this
 * can query stays in sync with the schema automatically, and passing a
 * table without a `workspace_id` column (starting with `workspaces` itself,
 * which is the tenant, not tenant-owned data — it has its own `id`, not a
 * `workspace_id`) is a compile error.
 *
 * Row/column typing beyond the table name is deliberately loose: routing
 * every method through the real, per-table-generic Postgrest builder here
 * (chained onto a union of ~15 relation types) is expensive enough for
 * `tsc` to run out of memory on this project's `Database` type. The public
 * surface stays small — `from(table).select|insert|update|delete|upsert` —
 * and every call still goes through the real `@supabase/supabase-js`
 * client underneath, so a caller gets proper typing back the moment they
 * chain a further Postgrest builder method (e.g. `.maybeSingle<Row>()`).
 *
 * Usage:
 * ```ts
 * const { data, error } = await withTenant(client, workspaceId)
 *   .from('flowstarter_project_artifacts')
 *   .select('intake_payload, brand_config, preview_manifest')
 *   .maybeSingle<ProjectArtifactRow>();
 * ```
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

/**
 * Same canonical-UUID pattern used in
 * `src/lib/flowstarter/preview-artifacts.ts` — kept in sync deliberately
 * rather than imported, since that module isn't otherwise a dependency of
 * this one.
 */
const WORKSPACE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class TenancyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenancyError';
  }
}

type Tables = Database['public']['Tables'];

/** Every table that has a `workspace_id` column on its Row shape. */
export type TenantTableName = {
  [K in keyof Tables]: 'workspace_id' extends keyof Tables[K]['Row']
    ? K
    : never;
}[keyof Tables];

type Row = Record<string, unknown>;

interface UpsertOptions {
  onConflict?: string;
  ignoreDuplicates?: boolean;
  count?: 'exact' | 'planned' | 'estimated';
  defaultToNull?: boolean;
}

function assertWorkspaceId(workspaceId: string): void {
  if (
    typeof workspaceId !== 'string' ||
    !WORKSPACE_ID_PATTERN.test(workspaceId)
  ) {
    throw new TenancyError(
      `withTenant: "${String(workspaceId)}" is not a canonical workspace UUID`
    );
  }
}

/**
 * Injects `workspace_id` into a row bound for insert/upsert, or throws if
 * the row already names a *different* workspace_id. A caller writing a row
 * for one tenant should never be able to smuggle another tenant's id past
 * the facade — that is almost certainly a bug, not an intentional
 * cross-tenant write.
 */
function attachWorkspaceId(
  row: Row,
  workspaceId: string,
  op: 'insert' | 'upsert'
): Row {
  const existing = row?.workspace_id;
  if (existing != null && existing !== workspaceId) {
    throw new TenancyError(
      `withTenant: ${op} row carries workspace_id "${String(
        existing
      )}" which does not match the tenant scope "${workspaceId}"`
    );
  }
  return { ...row, workspace_id: workspaceId };
}

/** Throws if an update payload tries to move the row to another workspace. */
function assertUpdateStaysInWorkspace(values: Row, workspaceId: string): void {
  const existing = values?.workspace_id;
  if (existing != null && existing !== workspaceId) {
    throw new TenancyError(
      `withTenant: update row carries workspace_id "${String(
        existing
      )}" which does not match the tenant scope "${workspaceId}"`
    );
  }
}

/**
 * Scopes every query issued through the returned facade to one workspace.
 * Throws synchronously — before any query is built or sent — if
 * `workspaceId` is not a canonical UUID.
 */
export function withTenant(
  client: SupabaseClient<Database>,
  workspaceId: string
) {
  assertWorkspaceId(workspaceId);
  // Cast once, here, to the untyped client: see the module doc for why the
  // per-table Postgrest generics aren't threaded through this facade.
  const raw = client as unknown as SupabaseClient;

  return {
    from(table: TenantTableName) {
      const name = table as string;
      return {
        /** Always filtered: `.eq('workspace_id', workspaceId)`. */
        select(columns?: string) {
          return raw
            .from(name)
            .select(columns as string)
            .eq('workspace_id', workspaceId);
        },

        /** Always filtered: `.eq('workspace_id', workspaceId)`. */
        update(values: Row) {
          assertUpdateStaysInWorkspace(values, workspaceId);
          return raw.from(name).update(values).eq('workspace_id', workspaceId);
        },

        /** Always filtered: `.eq('workspace_id', workspaceId)`. */
        delete() {
          return raw.from(name).delete().eq('workspace_id', workspaceId);
        },

        /** `workspace_id` is injected into every row (or the call throws). */
        insert(values: Row | Row[]) {
          // Validate before touching `raw.from(...)` at all, so a rejected
          // row never reaches the client -- not even to build a query.
          if (Array.isArray(values)) {
            const rows = values.map((row) =>
              attachWorkspaceId(row, workspaceId, 'insert')
            );
            return raw.from(name).insert(rows);
          }
          const row = attachWorkspaceId(values, workspaceId, 'insert');
          return raw.from(name).insert(row);
        },

        /** `workspace_id` is injected into every row (or the call throws). */
        upsert(values: Row | Row[], options?: UpsertOptions) {
          if (Array.isArray(values)) {
            const rows = values.map((row) =>
              attachWorkspaceId(row, workspaceId, 'upsert')
            );
            return raw.from(name).upsert(rows, options);
          }
          const row = attachWorkspaceId(values, workspaceId, 'upsert');
          return raw.from(name).upsert(row, options);
        },
      };
    },
  };
}
