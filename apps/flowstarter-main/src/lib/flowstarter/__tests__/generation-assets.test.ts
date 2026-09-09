import { beforeEach, describe, expect, it, vi } from 'vitest';

const from = vi.fn();
vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => ({ from }),
}));

import { loadUsableAssets } from '../generation-assets';

const WS = '0f4e1088-8d8f-4f18-83b1-406cc292b23c';

/** Records the filters a query chain applied, then resolves with `rows`. */
function builder(rows: unknown[]) {
  const calls: string[] = [];
  const chain: Record<string, unknown> = {
    select: () => chain,
    eq: (col: string, val: unknown) => {
      calls.push(`eq:${col}=${String(val)}`);
      return chain;
    },
    not: (col: string, op: string) => {
      calls.push(`not:${col} ${op}`);
      return chain;
    },
    then: (resolve: (v: unknown) => unknown) =>
      resolve({ data: rows, error: null }),
  };
  return { chain, calls };
}

describe('loadUsableAssets', () => {
  beforeEach(() => from.mockReset());

  it('asks the database for confirmed rights, and scopes to the workspace', async () => {
    const { chain, calls } = builder([]);
    from.mockReturnValue(chain);

    await loadUsableAssets(WS);

    expect(calls).toContain(`eq:workspace_id=${WS}`);
    expect(calls).toContain('not:rights_confirmed_at is');
  });

  it('drops an unconfirmed asset even if the database returns one', async () => {
    // Belt and braces: the filter is in the query, but a caller that widens
    // that query must not be able to leak an unconfirmed photo onto a site.
    const { chain } = builder([
      {
        id: 'a',
        storage_path: 'tenant/x/assets/a.png',
        rights_confirmed_at: '2026-08-30T00:00:00Z',
        usable_for: ['hero'],
      },
      {
        id: 'b',
        storage_path: 'tenant/x/assets/b.png',
        rights_confirmed_at: null,
      },
    ]);
    from.mockReturnValue(chain);

    const assets = await loadUsableAssets(WS);

    expect(assets.map((a) => a.id)).toEqual(['a']);
  });

  it('skips a row with no stored file rather than emitting a broken path', async () => {
    const { chain } = builder([
      {
        id: 'a',
        storage_path: null,
        rights_confirmed_at: '2026-08-30T00:00:00Z',
      },
    ]);
    from.mockReturnValue(chain);

    expect(await loadUsableAssets(WS)).toEqual([]);
  });
});
