/**
 * Attaching a custom domain to a workspace's site — the shared handler both
 * `/api/admin/.../site/domains` and `/api/team/.../site/domains` re-export.
 *
 * The case this suite exists to pin down: a client's domain almost never
 * lives in a zone we manage, so the "not automated" path is the common one,
 * not the edge case — and it must hand back a record an operator can paste
 * into a support reply, not just an error string.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('server-only', () => ({}));

vi.mock('@/lib/api-auth', () => ({
  requireTeamAuth: async () => ({
    authorized: true as const,
    userId: 'user_team_1',
    role: 'team' as const,
  }),
}));

// ─── Cloudflare mock ────────────────────────────────────────────────────────
const cloudflare = {
  findZoneByName: vi.fn(),
  upsertRecord: vi.fn(),
  deleteRecord: vi.fn(),
};

class MockCloudflareApiError extends Error {
  constructor(
    public status: number,
    public errors: Array<{ code: number; message: string }>
  ) {
    super('Cloudflare API error');
    this.name = 'CloudflareApiError';
  }
}

vi.mock('../cloudflare', () => ({
  CloudflareClient: class {
    findZoneByName = cloudflare.findZoneByName;
    upsertRecord = cloudflare.upsertRecord;
    deleteRecord = cloudflare.deleteRecord;
  },
  CloudflareApiError: MockCloudflareApiError,
}));

// ─── Supabase mock: a script per table, keyed the way the handler reads it ──
interface Script {
  workspace?: { data: unknown; error: unknown };
  hostingServer?: { data: unknown; error: unknown };
  existingHosts?: { data: unknown; error: unknown };
  updatedHosts?: { data: unknown; error: unknown };
}
const script: Script = {};
const captured: {
  hostInsert?: Record<string, unknown>;
  workspaceUpdate?: Record<string, unknown>;
  hostDelete: boolean;
} = { hostDelete: false };

function builderFor(table: string) {
  const builder = {
    select() {
      return builder;
    },
    insert(values: Record<string, unknown>) {
      if (table === 'workspace_hosts') captured.hostInsert = values;
      return builder;
    },
    update(values: Record<string, unknown>) {
      if (table === 'workspaces') captured.workspaceUpdate = values;
      return builder;
    },
    delete() {
      if (table === 'workspace_hosts') captured.hostDelete = true;
      return builder;
    },
    eq() {
      return builder;
    },
    maybeSingle() {
      if (table === 'workspaces') {
        return Promise.resolve(
          script.workspace ?? {
            data: {
              id: 'ws_1',
              slug: 'acme',
              hosting_server_id: 'srv_1',
              cloudflare_zone_id: null,
              cloudflare_record_ids: {},
            },
            error: null,
          }
        );
      }
      if (table === 'hosting_servers') {
        return Promise.resolve(
          script.hostingServer ?? { data: { ipv4: '203.0.113.5' }, error: null }
        );
      }
      return Promise.resolve({ data: null, error: null });
    },
    then(resolve: (v: { data: unknown; error: unknown }) => void) {
      // workspace_hosts .select().eq() resolves as a thenable when awaited
      // directly (no .maybeSingle()) — that is how "existing hosts" is read.
      if (table === 'workspace_hosts') {
        resolve(script.existingHosts ?? { data: [], error: null });
      } else {
        resolve({ data: null, error: null });
      }
    },
  };
  return builder;
}

vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => ({ from: builderFor }),
}));

function makeReq(body: unknown): NextRequest {
  return {
    json: async () => body,
    url: 'https://example.com/api/team/projects/ws_1/site/domains?domain=acme.example.com',
    headers: new Headers(),
  } as unknown as NextRequest;
}

const ctx = { params: Promise.resolve({ id: 'ws_1' }) };

beforeEach(() => {
  delete script.workspace;
  delete script.hostingServer;
  delete script.existingHosts;
  captured.hostInsert = undefined;
  captured.workspaceUpdate = undefined;
  captured.hostDelete = false;
  cloudflare.findZoneByName.mockReset();
  cloudflare.upsertRecord.mockReset();
  cloudflare.deleteRecord.mockReset();
  delete process.env.CLOUDFLARE_API_TOKEN;
});

describe('addWorkspaceDomainHandler', () => {
  it('attaches the domain and hands back a manual A record when Cloudflare is not configured', async () => {
    const { addWorkspaceDomainHandler } = await import('../site-domains-api');

    const res = await addWorkspaceDomainHandler(
      makeReq({ domain: 'acme.example.com' }),
      ctx
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.dns.automated).toBe(false);
    expect(body.dns.manualRecord).toMatchObject({
      type: 'A',
      name: 'acme.example.com',
      value: '203.0.113.5',
    });
    expect(body.dns.error).toMatch(/not configured/);
    expect(captured.hostInsert).toMatchObject({
      workspace_id: 'ws_1',
      hostname: 'acme.example.com',
    });
  });

  it('automates the DNS record when Cloudflare manages the zone', async () => {
    process.env.CLOUDFLARE_API_TOKEN = 'cf-token';
    cloudflare.findZoneByName.mockImplementation(async (name: string) =>
      name === 'example.com' ? { id: 'zone1', name: 'example.com' } : null
    );
    cloudflare.upsertRecord.mockResolvedValue({ id: 'rec1' });

    const { addWorkspaceDomainHandler } = await import('../site-domains-api');
    const res = await addWorkspaceDomainHandler(
      makeReq({ domain: 'acme.example.com' }),
      ctx
    );
    const body = await res.json();

    expect(body.dns.automated).toBe(true);
    expect(body.dns.manualRecord).toBeNull();
    expect(body.dns.recordId).toBe('rec1');
    expect(cloudflare.upsertRecord).toHaveBeenCalledWith(
      expect.objectContaining({ zoneId: 'zone1', content: '203.0.113.5' })
    );
    // The zone id is remembered on the workspace for later teardown.
    expect(captured.workspaceUpdate).toMatchObject({
      cloudflare_zone_id: 'zone1',
    });
  });

  it('still hands back a manual record when Cloudflare is configured but does not manage this zone', async () => {
    process.env.CLOUDFLARE_API_TOKEN = 'cf-token';
    cloudflare.findZoneByName.mockResolvedValue(null);

    const { addWorkspaceDomainHandler } = await import('../site-domains-api');
    const res = await addWorkspaceDomainHandler(
      makeReq({ domain: 'acme.example.com' }),
      ctx
    );
    const body = await res.json();

    expect(body.dns.automated).toBe(false);
    expect(body.dns.manualRecord?.value).toBe('203.0.113.5');
    expect(body.dns.error).toMatch(/not.*manage/);
  });

  it('has no manual record to offer when the server has no ipv4 yet', async () => {
    process.env.CLOUDFLARE_API_TOKEN = 'cf-token';
    script.hostingServer = { data: { ipv4: null }, error: null };

    const { addWorkspaceDomainHandler } = await import('../site-domains-api');
    const res = await addWorkspaceDomainHandler(
      makeReq({ domain: 'acme.example.com' }),
      ctx
    );
    const body = await res.json();

    expect(body.dns.manualRecord).toBeNull();
    expect(body.dns.error).toMatch(/no ipv4/i);
  });

  it('refuses when the workspace has no allocated server', async () => {
    script.workspace = {
      data: {
        id: 'ws_1',
        slug: 'acme',
        hosting_server_id: null,
        cloudflare_zone_id: null,
        cloudflare_record_ids: {},
      },
      error: null,
    };

    const { addWorkspaceDomainHandler } = await import('../site-domains-api');
    const res = await addWorkspaceDomainHandler(
      makeReq({ domain: 'acme.example.com' }),
      ctx
    );
    expect(res.status).toBe(404);
    expect(captured.hostInsert).toBeUndefined();
  });

  it('refuses a domain already attached to the workspace', async () => {
    script.existingHosts = {
      data: [{ hostname: 'acme.example.com', is_primary: true }],
      error: null,
    };

    const { addWorkspaceDomainHandler } = await import('../site-domains-api');
    const res = await addWorkspaceDomainHandler(
      makeReq({ domain: 'acme.example.com' }),
      ctx
    );
    expect(res.status).toBe(409);
  });

  it('rejects a malformed domain before touching the database', async () => {
    const { addWorkspaceDomainHandler } = await import('../site-domains-api');
    const res = await addWorkspaceDomainHandler(
      makeReq({ domain: 'not a domain' }),
      ctx
    );
    expect(res.status).toBe(400);
    expect(captured.hostInsert).toBeUndefined();
  });
});

describe('removeWorkspaceDomainHandler', () => {
  it('detaches the domain', async () => {
    const { removeWorkspaceDomainHandler } = await import(
      '../site-domains-api'
    );
    const res = await removeWorkspaceDomainHandler(makeReq({}), ctx);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.domain).toBe('acme.example.com');
    expect(captured.hostDelete).toBe(true);
  });
});
