import { beforeEach, describe, expect, it, vi } from 'vitest';

const getAuthMock = vi.fn();
const storeProjectSecretMock = vi.fn();
const deleteProjectSecretMock = vi.fn();
const createProjectSecretsClientMock = vi.fn();
const getProjectSecretDefinitionMock = vi.fn();

vi.mock('@clerk/remix/ssr.server', () => ({
  getAuth: getAuthMock,
}));

vi.mock('~/lib/integrations/projectSecrets.server', () => ({
  createProjectSecretsClient: createProjectSecretsClientMock,
  storeProjectSecret: storeProjectSecretMock,
  deleteProjectSecret: deleteProjectSecretMock,
  getProjectSecretDefinition: getProjectSecretDefinitionMock,
}));

describe('api.integrations.store-secret action', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getProjectSecretDefinitionMock.mockReturnValue({
      column: 'calendly_api_key_id',
    });
    createProjectSecretsClientMock.mockReturnValue({ kind: 'supabase' });
  });

  it('rejects unauthenticated requests', async () => {
    getAuthMock.mockResolvedValue({
      userId: null,
      sessionClaims: null,
    });

    const { action } = await import('../../app/routes/api.integrations.store-secret');
    const response = await action({
      request: new Request('https://editor.test/api/integrations/store-secret', {
        method: 'POST',
        body: JSON.stringify({
          projectId: 'project_123',
          provider: 'calendly',
          secretName: 'apiKey',
          secretValue: 'secret',
        }),
      }),
      params: {},
      context: {},
    } as never);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('rejects authenticated non-team users', async () => {
    getAuthMock.mockResolvedValue({
      userId: 'user_123',
      sessionClaims: {
        email: 'client@example.com',
        public_metadata: { role: 'client' },
      },
    });

    const { action } = await import('../../app/routes/api.integrations.store-secret');
    const response = await action({
      request: new Request('https://editor.test/api/integrations/store-secret', {
        method: 'POST',
        body: JSON.stringify({
          projectId: 'project_123',
          provider: 'calendly',
          secretName: 'apiKey',
          secretValue: 'secret',
        }),
      }),
      params: {},
      context: {},
    } as never);

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' });
  });

  it('stores a supported project secret in vault and returns the secret reference id', async () => {
    getAuthMock.mockResolvedValue({
      userId: 'user_123',
      sessionClaims: {
        email: 'operator@flowstarter.app',
      },
    });
    storeProjectSecretMock.mockResolvedValue({
      secretId: 'vault-uuid-123',
      column: 'calendly_api_key_id',
    });

    const { action } = await import('../../app/routes/api.integrations.store-secret');
    const response = await action({
      request: new Request('https://editor.test/api/integrations/store-secret', {
        method: 'POST',
        body: JSON.stringify({
          projectId: 'project_123',
          provider: 'calendly',
          secretName: 'apiKey',
          secretValue: 'cal-secret',
        }),
      }),
      params: {},
      context: {},
    } as never);

    expect(response.status).toBe(200);
    expect(storeProjectSecretMock).toHaveBeenCalledWith({
      supabase: { kind: 'supabase' },
      projectId: 'project_123',
      provider: 'calendly',
      secretName: 'apiKey',
      secretValue: 'cal-secret',
    });
    await expect(response.json()).resolves.toEqual({
      success: true,
      action: 'store',
      provider: 'calendly',
      secretName: 'apiKey',
      projectId: 'project_123',
      secretId: 'vault-uuid-123',
    });
  });

  it('deletes a supported project secret and clears the project reference', async () => {
    getAuthMock.mockResolvedValue({
      userId: 'user_123',
      sessionClaims: {
        email: 'operator@flowstarter.app',
      },
    });
    deleteProjectSecretMock.mockResolvedValue({
      deleted: true,
      column: 'ga_refresh_token_id',
    });
    getProjectSecretDefinitionMock.mockReturnValue({
      column: 'ga_refresh_token_id',
    });

    const { action } = await import('../../app/routes/api.integrations.store-secret');
    const response = await action({
      request: new Request('https://editor.test/api/integrations/store-secret', {
        method: 'POST',
        body: JSON.stringify({
          projectId: 'project_123',
          provider: 'analytics',
          secretName: 'refreshToken',
          action: 'delete',
        }),
      }),
      params: {},
      context: {},
    } as never);

    expect(response.status).toBe(200);
    expect(deleteProjectSecretMock).toHaveBeenCalledWith({
      supabase: { kind: 'supabase' },
      projectId: 'project_123',
      provider: 'analytics',
      secretName: 'refreshToken',
    });
    await expect(response.json()).resolves.toEqual({
      success: true,
      action: 'delete',
      provider: 'analytics',
      secretName: 'refreshToken',
      projectId: 'project_123',
      deleted: true,
    });
  });

  it('rejects unsupported integration secrets', async () => {
    getAuthMock.mockResolvedValue({
      userId: 'user_123',
      sessionClaims: {
        email: 'operator@flowstarter.app',
      },
    });
    getProjectSecretDefinitionMock.mockReturnValue(null);

    const { action } = await import('../../app/routes/api.integrations.store-secret');
    const response = await action({
      request: new Request('https://editor.test/api/integrations/store-secret', {
        method: 'POST',
        body: JSON.stringify({
          projectId: 'project_123',
          provider: 'mailchimp',
          secretName: 'apiKey',
          secretValue: 'secret',
        }),
      }),
      params: {},
      context: {},
    } as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Unsupported integration secret',
    });
  });
});
