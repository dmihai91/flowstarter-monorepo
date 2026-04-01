import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireAuthMock = vi.fn();
const createSupabaseServiceRoleClientMock = vi.fn();
const storeSecretMock = vi.fn();
const deleteSecretMock = vi.fn();

vi.mock('@/lib/api-auth', () => ({
  requireAuth: requireAuthMock,
}));

vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: createSupabaseServiceRoleClientMock,
}));

vi.mock('@/lib/vault', () => ({
  storeSecret: storeSecretMock,
  deleteSecret: deleteSecretMock,
}));

describe('/api/projects/[id]/integrations route', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests', async () => {
    requireAuthMock.mockResolvedValue({
      authenticated: false,
      response: new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401 }
      ),
    });

    const { GET } = await import('../route');
    const response = await GET(
      new Request(
        'http://localhost/api/projects/project-1/integrations'
      ) as never,
      { params: Promise.resolve({ id: 'project-1' }) }
    );

    expect(response.status).toBe(401);
  });

  it('returns 403 when the project belongs to another user', async () => {
    requireAuthMock.mockResolvedValue({
      authenticated: true,
      userId: 'user-1',
      getToken: vi.fn(),
    });

    createSupabaseServiceRoleClientMock.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'project-1',
                user_id: 'other-user',
                calendly_url: null,
                calendly_api_key_id: null,
                ga_property_id: null,
                ga_refresh_token_id: null,
                ga_connected_at: null,
                published_url: null,
                custom_domain: null,
                domain_status: null,
              },
              error: null,
            }),
          }),
        }),
      }),
    });

    const { GET } = await import('../route');
    const response = await GET(
      new Request(
        'http://localhost/api/projects/project-1/integrations'
      ) as never,
      { params: Promise.resolve({ id: 'project-1' }) }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('stores calendly settings for the authenticated owner', async () => {
    requireAuthMock.mockResolvedValue({
      authenticated: true,
      userId: 'user-1',
      getToken: vi.fn(),
    });

    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({
      eq: updateEq,
    });

    createSupabaseServiceRoleClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'projects') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'project-1',
                    user_id: 'user-1',
                    calendly_api_key_id: null,
                    ga_refresh_token_id: null,
                  },
                  error: null,
                }),
              }),
            }),
            update,
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    });

    storeSecretMock.mockResolvedValue('vault-secret-1');

    const { POST } = await import('../route');
    const response = await POST(
      new Request('http://localhost/api/projects/project-1/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integration: 'calendly',
          calendlyUrl: 'https://calendly.com/acme/intro-call',
          calendlyApiKey: 'cal-key',
        }),
      }) as never,
      { params: Promise.resolve({ id: 'project-1' }) }
    );

    expect(response.status).toBe(200);
    expect(storeSecretMock).toHaveBeenCalledWith(
      expect.any(Object),
      'project-1',
      'calendly_api_key',
      'cal-key',
      'Calendly Personal Access Token'
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        calendly_api_key_id: 'vault-secret-1',
      })
    );
    expect(update.mock.calls[0]?.[0]).toMatchObject({
      data: expect.any(String),
    });
    expect(JSON.parse(update.mock.calls[0]?.[0].data as string)).toMatchObject({
      projectIntegrations: {
        calendly: {
          url: 'https://calendly.com/acme/intro-call',
          apiKeySecretId: 'vault-secret-1',
        },
      },
    });
    expect(updateEq).toHaveBeenCalledWith('id', 'project-1');
  });
});
