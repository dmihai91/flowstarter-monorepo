/**
 * `withTenant(client, workspaceId)` — a narrow query facade for this
 * worker's service-role Supabase client.
 *
 * This process authenticates to Supabase with the service role key and so
 * bypasses RLS entirely (see the module doc on `job-store.ts`) — there is no
 * policy left to stop one workspace's query from touching another
 * workspace's rows. That filter has to be applied in code, on every query.
 * `withTenant` makes it structural: every read/update/delete issued through
 * it carries `.eq('workspace_id', workspaceId)`, and every insert/upsert has
 * `workspace_id` injected into each row it is given (or throws if a row
 * already names a *different* workspace_id).
 *
 * This worker has no generated `Database` type (unlike the main app), so the
 * facade is typed loosely — `Record<string, unknown>` rows in, the
 * underlying `@supabase/supabase-js` builder out. The public surface is
 * intentionally small: `from(table).select|insert|update|delete|upsert`.
 *
 * `apps/build-worker/src/__tests__/worker-tenant-filter.test.ts` statically
 * checks every `.from(<tenant table>)` call site in this package's `src/`
 * either chains `.eq('workspace_id', ...)` or goes through `withTenant(`, so
 * a call site that forgets this facade (or forgets the filter) fails CI.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

/** Same canonical-UUID pattern used by `job-store.ts`'s `UUID` constant. */
const WORKSPACE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class TenancyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenancyError';
  }
}

type Row = Record<string, unknown>;

interface UpsertOptions {
  onConflict?: string;
  ignoreDuplicates?: boolean;
  count?: 'exact' | 'planned' | 'estimated';
  defaultToNull?: boolean;
}

function assertWorkspaceId(workspaceId: string): void {
  if (typeof workspaceId !== 'string' || !WORKSPACE_ID_PATTERN.test(workspaceId)) {
    throw new TenancyError(
      `withTenant: "${String(workspaceId)}" is not a canonical workspace UUID`,
    );
  }
}

/**
 * Injects `workspace_id` into a row bound for insert/upsert, or throws if
 * the row already names a *different* workspace_id.
 */
function attachWorkspaceId(row: Row, workspaceId: string, op: 'insert' | 'upsert'): Row {
  const existing = row?.workspace_id;
  if (existing != null && existing !== workspaceId) {
    throw new TenancyError(
      `withTenant: ${op} row carries workspace_id "${String(existing)}" which does not match the tenant scope "${workspaceId}"`,
    );
  }
  return { ...row, workspace_id: workspaceId };
}

/** Throws if an update payload tries to move the row to another workspace. */
function assertUpdateStaysInWorkspace(values: Row, workspaceId: string): void {
  const existing = values?.workspace_id;
  if (existing != null && existing !== workspaceId) {
    throw new TenancyError(
      `withTenant: update row carries workspace_id "${String(existing)}" which does not match the tenant scope "${workspaceId}"`,
    );
  }
}

/**
 * Scopes every query issued through the returned facade to one workspace.
 * Throws synchronously — before any query is built or sent — if
 * `workspaceId` is not a canonical UUID.
 */
export function withTenant(client: SupabaseClient, workspaceId: string) {
  assertWorkspaceId(workspaceId);

  return {
    from(table: string) {
      return {
        /** Always filtered: `.eq('workspace_id', workspaceId)`. */
        select(columns?: string) {
          return client
            .from(table)
            .select(columns as string)
            .eq('workspace_id', workspaceId);
        },

        /** Always filtered: `.eq('workspace_id', workspaceId)`. */
        update(values: Row) {
          assertUpdateStaysInWorkspace(values, workspaceId);
          return client.from(table).update(values).eq('workspace_id', workspaceId);
        },

        /** Always filtered: `.eq('workspace_id', workspaceId)`. */
        delete() {
          return client.from(table).delete().eq('workspace_id', workspaceId);
        },

        /** `workspace_id` is injected into every row (or the call throws). */
        insert(values: Row | Row[]) {
          // Validate before touching `client.from(...)` at all, so a
          // rejected row never reaches the client -- not even to build a
          // query.
          if (Array.isArray(values)) {
            const rows = values.map((row) => attachWorkspaceId(row, workspaceId, 'insert'));
            return client.from(table).insert(rows);
          }
          const row = attachWorkspaceId(values, workspaceId, 'insert');
          return client.from(table).insert(row);
        },

        /** `workspace_id` is injected into every row (or the call throws). */
        upsert(values: Row | Row[], options?: UpsertOptions) {
          if (Array.isArray(values)) {
            const rows = values.map((row) => attachWorkspaceId(row, workspaceId, 'upsert'));
            return client.from(table).upsert(rows, options);
          }
          const row = attachWorkspaceId(values, workspaceId, 'upsert');
          return client.from(table).upsert(row, options);
        },
      };
    },
  };
}
