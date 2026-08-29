/**
 * `withTenant` is what stands between this worker's service-role Supabase
 * client (RLS bypassed) and a cross-tenant read/write. These tests drive it
 * against a hand-rolled recording mock of the Supabase query builder (same
 * style as flowstarter-main's `deposit-workflow.test.ts` /
 * `tenancy.test.ts`) so the assertion is on the exact calls made, not on a
 * real database.
 */
import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TenancyError, withTenant } from '../src/tenancy';

interface RecordedCall {
  table: string;
  mode: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  values?: unknown;
  options?: unknown;
  eqCalls: Array<[string, unknown]>;
}

function makeRecordingClient() {
  const calls: RecordedCall[] = [];

  const client = {
    from(table: string) {
      const call: RecordedCall = { table, mode: 'select', eqCalls: [] };
      calls.push(call);
      const builder = {
        select(_columns?: string) {
          call.mode = 'select';
          return builder;
        },
        insert(values: unknown) {
          call.mode = 'insert';
          call.values = values;
          return builder;
        },
        update(values: unknown) {
          call.mode = 'update';
          call.values = values;
          return builder;
        },
        delete() {
          call.mode = 'delete';
          return builder;
        },
        upsert(values: unknown, options?: unknown) {
          call.mode = 'upsert';
          call.values = values;
          call.options = options;
          return builder;
        },
        eq(column: string, value: unknown) {
          call.eqCalls.push([column, value]);
          return builder;
        },
        maybeSingle() {
          return Promise.resolve({ data: null, error: null });
        },
      };
      return builder;
    },
  };

  return { client: client as unknown as SupabaseClient, calls };
}

const WORKSPACE_ID = '0f4e1088-8d8f-4f18-83b1-406cc292b23c';
const OTHER_WORKSPACE_ID = 'a3b1c2d4-1111-4222-8333-444455556666';
const TABLE = 'flowstarter_agent_jobs';

describe('withTenant', () => {
  it('throws before any query if workspaceId is malformed', () => {
    const { client, calls } = makeRecordingClient();

    expect(() => withTenant(client, 'not-a-uuid')).toThrow(TenancyError);
    expect(calls).toHaveLength(0);
  });

  it('throws before any query if workspaceId is empty', () => {
    const { client, calls } = makeRecordingClient();

    expect(() => withTenant(client, '')).toThrow(TenancyError);
    expect(calls).toHaveLength(0);
  });

  describe('select', () => {
    it('always carries the workspace filter', () => {
      const { client, calls } = makeRecordingClient();

      withTenant(client, WORKSPACE_ID).from(TABLE).select('id, status');

      expect(calls).toHaveLength(1);
      expect(calls[0]?.mode).toBe('select');
      expect(calls[0]?.eqCalls).toContainEqual(['workspace_id', WORKSPACE_ID]);
    });
  });

  describe('update', () => {
    it('always carries the workspace filter', () => {
      const { client, calls } = makeRecordingClient();

      withTenant(client, WORKSPACE_ID).from(TABLE).update({ status: 'succeeded' });

      expect(calls[0]?.mode).toBe('update');
      expect(calls[0]?.eqCalls).toContainEqual(['workspace_id', WORKSPACE_ID]);
      expect(calls[0]?.values).toEqual({ status: 'succeeded' });
    });

    it('throws if the update payload carries a different workspace_id', () => {
      const { client, calls } = makeRecordingClient();

      expect(() =>
        withTenant(client, WORKSPACE_ID)
          .from(TABLE)
          .update({ status: 'succeeded', workspace_id: OTHER_WORKSPACE_ID }),
      ).toThrow(TenancyError);
      expect(calls).toHaveLength(0);
    });
  });

  describe('delete', () => {
    it('always carries the workspace filter', () => {
      const { client, calls } = makeRecordingClient();

      withTenant(client, WORKSPACE_ID).from(TABLE).delete();

      expect(calls[0]?.mode).toBe('delete');
      expect(calls[0]?.eqCalls).toContainEqual(['workspace_id', WORKSPACE_ID]);
    });
  });

  describe('insert', () => {
    it('injects workspace_id when the row omits it', () => {
      const { client, calls } = makeRecordingClient();

      withTenant(client, WORKSPACE_ID).from(TABLE).insert({ kind: 'FULL_SITE_BUILD' });

      expect(calls[0]?.mode).toBe('insert');
      expect(calls[0]?.values).toMatchObject({
        kind: 'FULL_SITE_BUILD',
        workspace_id: WORKSPACE_ID,
      });
    });

    it('injects workspace_id into every row of an array insert', () => {
      const { client, calls } = makeRecordingClient();

      withTenant(client, WORKSPACE_ID)
        .from(TABLE)
        .insert([{ kind: 'a' }, { kind: 'b' }]);

      expect(calls[0]?.values).toEqual([
        { kind: 'a', workspace_id: WORKSPACE_ID },
        { kind: 'b', workspace_id: WORKSPACE_ID },
      ]);
    });

    it('throws when a row carries a different workspace_id, before issuing the query', () => {
      const { client, calls } = makeRecordingClient();

      expect(() =>
        withTenant(client, WORKSPACE_ID)
          .from(TABLE)
          .insert({ kind: 'a', workspace_id: OTHER_WORKSPACE_ID }),
      ).toThrow(TenancyError);
      expect(calls).toHaveLength(0);
    });

    it('throws when any row in an array insert carries a different workspace_id', () => {
      const { client, calls } = makeRecordingClient();

      expect(() =>
        withTenant(client, WORKSPACE_ID)
          .from(TABLE)
          .insert([
            { kind: 'a', workspace_id: WORKSPACE_ID },
            { kind: 'b', workspace_id: OTHER_WORKSPACE_ID },
          ]),
      ).toThrow(TenancyError);
      expect(calls).toHaveLength(0);
    });
  });

  describe('upsert', () => {
    it('injects workspace_id and forwards options', () => {
      const { client, calls } = makeRecordingClient();

      withTenant(client, WORKSPACE_ID).from(TABLE).upsert({ kind: 'a' }, { onConflict: 'id' });

      expect(calls[0]?.mode).toBe('upsert');
      expect(calls[0]?.values).toMatchObject({ workspace_id: WORKSPACE_ID });
      expect(calls[0]?.options).toEqual({ onConflict: 'id' });
    });

    it('throws when a row carries a different workspace_id', () => {
      const { client, calls } = makeRecordingClient();

      expect(() =>
        withTenant(client, WORKSPACE_ID)
          .from(TABLE)
          .upsert({ kind: 'a', workspace_id: OTHER_WORKSPACE_ID }),
      ).toThrow(TenancyError);
      expect(calls).toHaveLength(0);
    });
  });
});
