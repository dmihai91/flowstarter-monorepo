import { describe, expect, it, vi } from 'vitest';
import {
  DeployError,
  DryRunDeployAgentClient,
  HttpDeployAgentClient,
  previewDomainForSlug,
} from '../deploy';

describe('DryRunDeployAgentClient', () => {
  it('records push calls without network', async () => {
    const client = new DryRunDeployAgentClient();
    const result = await client.push({
      deployAgentUrl: 'https://10.0.0.1:8443',
      sharedSecret: 'shh',
      siteSlug: 'acme',
      artifact: { kind: 'url', url: 'https://artifacts/abc.tar.gz' },
      primaryDomain: 'acme.com',
      additionalDomains: [],
    });
    expect(result.ok).toBe(true);
    expect(result.sha256).toBe('dryrun');
    expect(client.calls).toHaveLength(1);
    expect(client.calls[0].method).toBe('push');
  });

  it('records remove calls', async () => {
    const client = new DryRunDeployAgentClient();
    await client.remove({
      deployAgentUrl: 'https://10.0.0.1:8443',
      sharedSecret: 's',
      siteSlug: 'acme',
    });
    expect(client.calls[0].method).toBe('remove');
  });
});

describe('HttpDeployAgentClient', () => {
  it('POSTs JSON to /sites/{slug}/deploy with bearer auth (url artifact)', async () => {
    const fetchSpy = vi.fn(
      async (_url: string | URL | Request, _init?: RequestInit) => {
        return new Response(
          JSON.stringify({ sha256: 'abc', sizeBytes: 1234 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    );
    const client = new HttpDeployAgentClient(
      fetchSpy as unknown as typeof globalThis.fetch
    );
    const result = await client.push({
      deployAgentUrl: 'https://10.0.0.1:8443',
      sharedSecret: 'super-shh',
      siteSlug: 'acme',
      artifact: {
        kind: 'url',
        url: 'https://artifacts/abc.tar.gz',
        sha256: 'def',
      },
      primaryDomain: 'acme.com',
      additionalDomains: ['www.acme.com'],
    });
    expect(result.sha256).toBe('abc');
    expect(result.sizeBytes).toBe(1234);

    const call = fetchSpy.mock.calls[0]!;
    const [url, init] = call;
    expect(String(url)).toBe('https://10.0.0.1:8443/sites/acme/deploy');
    expect(init?.method).toBe('POST');
    const headers = init?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer super-shh');
    expect(headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(init?.body as string);
    expect(body).toMatchObject({
      artifact_url: 'https://artifacts/abc.tar.gz',
      artifact_sha256: 'def',
      primary_domain: 'acme.com',
      additional_domains: ['www.acme.com'],
    });
  });

  it('throws DeployError on non-2xx', async () => {
    const fetchSpy = vi.fn(
      async (_url: string | URL | Request, _init?: RequestInit) => {
        return new Response(JSON.stringify({ error: 'bad' }), { status: 500 });
      }
    );
    const client = new HttpDeployAgentClient(
      fetchSpy as unknown as typeof globalThis.fetch
    );
    await expect(
      client.push({
        deployAgentUrl: 'https://10.0.0.1:8443',
        sharedSecret: 's',
        siteSlug: 'acme',
        artifact: { kind: 'url', url: 'https://x' },
        primaryDomain: null,
        additionalDomains: [],
      })
    ).rejects.toBeInstanceOf(DeployError);
  });

  it('strips trailing slash from deployAgentUrl', async () => {
    const fetchSpy = vi.fn(
      async (_url: string | URL | Request, _init?: RequestInit) => {
        return new Response('{}', { status: 200 });
      }
    );
    const client = new HttpDeployAgentClient(
      fetchSpy as unknown as typeof globalThis.fetch
    );
    await client.push({
      deployAgentUrl: 'https://10.0.0.1:8443/',
      sharedSecret: 's',
      siteSlug: 'acme',
      artifact: { kind: 'url', url: 'https://x' },
      primaryDomain: null,
      additionalDomains: [],
    });
    expect(String(fetchSpy.mock.calls[0]?.[0])).toBe(
      'https://10.0.0.1:8443/sites/acme/deploy'
    );
  });
});

describe('previewDomainForSlug', () => {
  it('returns a host without protocol prefix', () => {
    const out = previewDomainForSlug('acme');
    expect(out).not.toMatch(/^https?:\/\//);
    expect(out.startsWith('acme.preview.')).toBe(true);
  });
});

describe('an unallocated workspace is allocated by rule at deploy time', () => {
  it('picks the least-loaded active server with room and records it', async () => {
    const { createFakeHostingSupabase } = await import(
      './fake-hosting-supabase'
    );
    const { allocateHostingServer } = await import('../deploy');
    const db = createFakeHostingSupabase();
    db.seed('hosting_servers', [
      { id: 'srv-full', status: 'active', site_capacity: 2, sites_count: 2 },
      { id: 'srv-busy', status: 'active', site_capacity: 50, sites_count: 7 },
      { id: 'srv-quiet', status: 'active', site_capacity: 50, sites_count: 1 },
      {
        id: 'srv-down',
        status: 'provisioning',
        site_capacity: 50,
        sites_count: 0,
      },
    ]);
    db.seed('workspaces', [
      {
        id: 'ws-1',
        slug: 'Ionescu Dental!',
        hosting_server_id: null,
        deploy_status: 'pending',
      },
    ]);
    const picked = await allocateHostingServer(db.client as never, {
      id: 'ws-1',
      slug: 'Ionescu Dental!',
    });
    expect(picked).toBe('srv-quiet');
    const workspace = db.rows('workspaces')[0]!;
    expect(workspace.hosting_server_id).toBe('srv-quiet');
    expect(workspace.site_directory).toBe('/var/www/sites/ionescudental/');
  });

  it('still refuses when no active server has capacity', async () => {
    const { createFakeHostingSupabase } = await import(
      './fake-hosting-supabase'
    );
    const { allocateHostingServer, DeployError } = await import('../deploy');
    const db = createFakeHostingSupabase();
    db.seed('hosting_servers', [
      { id: 'srv-full', status: 'active', site_capacity: 1, sites_count: 1 },
    ]);
    db.seed('workspaces', [
      { id: 'ws-1', slug: 'acme', hosting_server_id: null },
    ]);
    await expect(
      allocateHostingServer(db.client as never, { id: 'ws-1', slug: 'acme' })
    ).rejects.toBeInstanceOf(DeployError);
  });
});
