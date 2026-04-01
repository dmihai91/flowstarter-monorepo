import { describe, expect, it, vi } from 'vitest';
import { deleteProjectSecret, getProjectSecretDefinition, storeProjectSecret } from './projectSecrets.server';

function createSupabaseMock() {
  const eq = vi.fn();
  const single = vi.fn();
  const update = vi.fn(() => ({ eq }));
  const select = vi.fn(() => ({ eq: vi.fn(() => ({ single })) }));
  const from = vi.fn(() => ({ update, select }));
  const rpc = vi.fn();

  return { from, update, select, eq, single, rpc };
}

describe('projectSecrets.server', () => {
  it('maps supported provider/secret combinations to project columns', () => {
    expect(getProjectSecretDefinition('calendly', 'apiKey')).toMatchObject({
      column: 'calendly_api_key_id',
    });
    expect(getProjectSecretDefinition('analytics', 'refreshToken')).toMatchObject({
      column: 'ga_refresh_token_id',
    });
    expect(getProjectSecretDefinition('mailchimp', 'apiKey')).toBeNull();
  });

  it('stores a project secret and updates the project reference column', async () => {
    const supabase = createSupabaseMock();
    supabase.rpc.mockResolvedValue({ data: 'vault-uuid-123', error: null });
    supabase.single.mockResolvedValue({
      data: {
        id: 'project-123',
        calendly_api_key_id: null,
        data: JSON.stringify({}),
      },
      error: null,
    });
    supabase.eq.mockResolvedValue({ error: null });

    const result = await storeProjectSecret({
      supabase: supabase as never,
      projectId: 'project-123',
      provider: 'calendly',
      secretName: 'apiKey',
      secretValue: 'cal-secret',
    });

    expect(supabase.rpc).toHaveBeenCalledWith('store_project_secret', {
      p_project_id: 'project-123',
      p_name: 'calendly_api_key',
      p_value: 'cal-secret',
      p_description: 'Calendly Personal Access Token',
    });
    expect(supabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        calendly_api_key_id: 'vault-uuid-123',
        data: expect.any(String),
      }),
    );
    expect(result).toEqual({ secretId: 'vault-uuid-123', column: 'calendly_api_key_id' });
  });

  it('deletes an existing project secret and clears linked fields', async () => {
    const supabase = createSupabaseMock();
    supabase.single.mockResolvedValue({
      data: { ga_refresh_token_id: 'vault-uuid-456', ga_connected_at: '2026-03-30T00:00:00Z' },
      error: null,
    });
    supabase.rpc.mockResolvedValue({ data: null, error: null });
    supabase.eq.mockResolvedValue({ error: null });

    const result = await deleteProjectSecret({
      supabase: supabase as never,
      projectId: 'project-123',
      provider: 'analytics',
      secretName: 'refreshToken',
    });

    expect(supabase.rpc).toHaveBeenCalledWith('delete_project_secret', {
      p_secret_id: 'vault-uuid-456',
    });
    expect(supabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        ga_refresh_token_id: null,
        ga_connected_at: null,
        data: expect.any(String),
      }),
    );
    expect(result).toEqual({ deleted: true, column: 'ga_refresh_token_id' });
  });
});
