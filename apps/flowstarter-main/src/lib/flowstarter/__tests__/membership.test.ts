/**
 * Client membership is the gate every RLS policy checks: no row here and a
 * customer cannot see their own workspace. It has to be safe to call twice,
 * and it must never quietly demote an existing admin.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureClientMembership } from '../membership';

interface UpsertCall {
  values: Record<string, unknown>;
  options: Record<string, unknown>;
}

const script: { result?: { data: unknown; error: unknown } } = {};
const captured: { table?: string; upsert?: UpsertCall; selected?: string } = {};

function builderFor(table: string) {
  captured.table = table;
  const builder = {
    upsert(values: Record<string, unknown>, options: Record<string, unknown>) {
      captured.upsert = { values, options };
      return builder;
    },
    select(columns: string) {
      captured.selected = columns;
      return Promise.resolve(script.result ?? { data: [], error: null });
    },
  };
  return builder;
}

vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => ({ from: builderFor }),
}));

const WORKSPACE_ID = '0f4e1088-8d8f-4f18-83b1-406cc292b23c';
const CLERK_USER_ID = 'user_2abcDEF';

beforeEach(() => {
  delete script.result;
  delete captured.table;
  delete captured.upsert;
  delete captured.selected;
});

describe('ensureClientMembership', () => {
  it('inserts the client membership row', async () => {
    script.result = {
      data: [
        {
          workspace_id: WORKSPACE_ID,
          clerk_user_id: CLERK_USER_ID,
          role: 'client',
        },
      ],
      error: null,
    };

    const result = await ensureClientMembership({
      workspaceId: WORKSPACE_ID,
      clerkUserId: CLERK_USER_ID,
    });

    expect(result).toEqual({
      workspaceId: WORKSPACE_ID,
      clerkUserId: CLERK_USER_ID,
      created: true,
    });
    expect(captured.table).toBe('workspace_memberships');
    expect(captured.upsert?.values).toEqual({
      workspace_id: WORKSPACE_ID,
      clerk_user_id: CLERK_USER_ID,
      role: 'client',
    });
  });

  it('is idempotent: a second call reports no new row', async () => {
    // ON CONFLICT DO NOTHING returns no representation for the skipped row.
    script.result = { data: [], error: null };

    const result = await ensureClientMembership({
      workspaceId: WORKSPACE_ID,
      clerkUserId: CLERK_USER_ID,
    });

    expect(result.created).toBe(false);
  });

  it('leaves an existing role alone instead of overwriting it', async () => {
    await ensureClientMembership({
      workspaceId: WORKSPACE_ID,
      clerkUserId: CLERK_USER_ID,
    });

    // The conflict target is the primary key, and duplicates are ignored —
    // an admin who is re-run through this helper stays an admin.
    expect(captured.upsert?.options).toEqual({
      onConflict: 'workspace_id,clerk_user_id',
      ignoreDuplicates: true,
    });
  });

  it('rejects a workspace id that is not a uuid', async () => {
    await expect(
      ensureClientMembership({
        workspaceId: 'not-a-uuid',
        clerkUserId: CLERK_USER_ID,
      })
    ).rejects.toThrow('valid workspaceId');
    expect(captured.upsert).toBeUndefined();
  });

  it('rejects a blank clerk user id', async () => {
    await expect(
      ensureClientMembership({
        workspaceId: WORKSPACE_ID,
        clerkUserId: '   ',
      })
    ).rejects.toThrow('clerkUserId');
    expect(captured.upsert).toBeUndefined();
  });

  it('surfaces a database error rather than reporting success', async () => {
    script.result = {
      data: null,
      error: new Error('membership insert failed'),
    };

    await expect(
      ensureClientMembership({
        workspaceId: WORKSPACE_ID,
        clerkUserId: CLERK_USER_ID,
      })
    ).rejects.toThrow('membership insert failed');
  });
});
