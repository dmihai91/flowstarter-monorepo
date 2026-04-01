import { beforeEach, describe, expect, it, vi } from 'vitest';

const readUserSecretMock = vi.fn();
const readSecretMock = vi.fn();

vi.mock('@/lib/user-integration-vault', () => ({
  readUserSecret: readUserSecretMock,
}));

vi.mock('@/lib/vault', () => ({
  readSecret: readSecretMock,
}));

type SupabaseTableResult = {
  data?: unknown;
  error?: { message: string; code?: string } | null;
};

function createSupabaseMock(config: {
  projectsList?: SupabaseTableResult;
  projectSingle?: SupabaseTableResult;
  integrationSingle?: SupabaseTableResult;
  updateResult?: SupabaseTableResult;
}) {
  return {
    from(table: string) {
      if (table === 'projects') {
        return {
          select() {
            return {
              eq(field: string) {
                if (field === 'user_id') {
                  return {
                    order() {
                      return {
                        order() {
                          return Promise.resolve({
                            data: config.projectsList?.data ?? null,
                            error: config.projectsList?.error ?? null,
                          });
                        },
                      };
                    },
                  };
                }

                if (field === 'id') {
                  return {
                    single() {
                      return Promise.resolve({
                        data: config.projectSingle?.data ?? null,
                        error: config.projectSingle?.error ?? null,
                      });
                    },
                  };
                }

                return {
                  eq() {
                    return Promise.resolve({
                      data: config.updateResult?.data ?? null,
                      error: config.updateResult?.error ?? null,
                    });
                  },
                };
              },
            };
          },
          update() {
            return {
              eq() {
                return {
                  eq() {
                    return Promise.resolve({
                      data: config.updateResult?.data ?? null,
                      error: config.updateResult?.error ?? null,
                    });
                  },
                };
              },
            };
          },
        };
      }

      if (table === 'user_integrations') {
        return {
          select() {
            return {
              eq() {
                return {
                  eq() {
                    return {
                      single() {
                        return Promise.resolve({
                          data: config.integrationSingle?.data ?? null,
                          error: config.integrationSingle?.error ?? null,
                        });
                      },
                    };
                  },
                };
              },
            };
          },
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  };
}

describe('calendly-project-sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prefers the latest live project when syncing Calendly', async () => {
    const { findProjectForCalendlySync } = await import(
      '@/lib/calendly-project-sync'
    );
    const supabase = createSupabaseMock({
      projectsList: {
        data: [
          { id: 'draft-1', user_id: 'user-1', status: 'draft', is_draft: true },
          {
            id: 'active-1',
            user_id: 'user-1',
            status: 'active',
            is_draft: false,
          },
          {
            id: 'completed-1',
            user_id: 'user-1',
            status: 'completed',
            is_draft: false,
          },
        ],
      },
    });

    await expect(
      findProjectForCalendlySync(supabase as never, 'user-1')
    ).resolves.toBe('active-1');
  });

  it('syncs the selected booking url onto the chosen project', async () => {
    const { syncCalendlySelectionToProject } = await import(
      '@/lib/calendly-project-sync'
    );
    const supabase = createSupabaseMock({
      projectsList: {
        data: [
          {
            id: 'active-1',
            user_id: 'user-1',
            status: 'active',
            is_draft: false,
          },
        ],
      },
      projectSingle: {
        data: {
          id: 'active-1',
          user_id: 'user-1',
          data: JSON.stringify({}),
        },
      },
      updateResult: { data: null, error: null },
    });

    await expect(
      syncCalendlySelectionToProject({
        supabase: supabase as never,
        userId: 'user-1',
        eventUrl: 'https://calendly.com/acme/intro-call',
      })
    ).resolves.toBe('active-1');
  });

  it('reads the project vault secret first when present', async () => {
    readSecretMock.mockResolvedValueOnce('project-token');
    const { readCalendlyAccessTokenForProject } = await import(
      '@/lib/calendly-project-sync'
    );
    const supabase = createSupabaseMock({
      projectSingle: {
        data: {
          id: 'project-1',
          user_id: 'user-1',
          calendly_api_key_id: 'vault-project-secret',
        },
      },
    });

    await expect(
      readCalendlyAccessTokenForProject({
        supabase: supabase as never,
        projectId: 'project-1',
        userId: 'user-1',
      })
    ).resolves.toBe('project-token');
    expect(readSecretMock).toHaveBeenCalledWith(
      supabase,
      'vault-project-secret'
    );
  });

  it('falls back to the user OAuth token when the project has no API key', async () => {
    readUserSecretMock.mockResolvedValueOnce('user-oauth-token');
    const { readCalendlyAccessTokenForProject } = await import(
      '@/lib/calendly-project-sync'
    );
    const supabase = createSupabaseMock({
      projectSingle: {
        data: {
          id: 'project-1',
          user_id: 'user-1',
          calendly_api_key_id: null,
        },
      },
      integrationSingle: {
        data: {
          config: { access_token_secret_id: 'user-secret-1' },
        },
      },
    });

    await expect(
      readCalendlyAccessTokenForProject({
        supabase: supabase as never,
        projectId: 'project-1',
        userId: 'user-1',
      })
    ).resolves.toBe('user-oauth-token');
    expect(readUserSecretMock).toHaveBeenCalledWith(supabase, 'user-secret-1');
  });

  it('rejects access to projects owned by another user', async () => {
    const { readCalendlyAccessTokenForProject } = await import(
      '@/lib/calendly-project-sync'
    );
    const supabase = createSupabaseMock({
      projectSingle: {
        data: {
          id: 'project-1',
          user_id: 'other-user',
          calendly_api_key_id: null,
        },
      },
    });

    await expect(
      readCalendlyAccessTokenForProject({
        supabase: supabase as never,
        projectId: 'project-1',
        userId: 'user-1',
      })
    ).rejects.toThrow('Forbidden');
  });
});
