/**
 * Tests for Google Analytics Vault integration
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all dependencies before import
vi.mock('server-only', () => ({}));

const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  not: vi.fn().mockReturnThis(),
};

vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => mockSupabase,
}));

const mockReadSecret = vi.fn();
vi.mock('@/lib/vault', () => ({
  readSecret: (...args: unknown[]) => mockReadSecret(...args),
}));

// Import after mocks
import { getProjectGACredentials } from '../google-analytics-vault';

describe('getProjectGACredentials', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
  });

  it('returns null when project has no GA config', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { ga_property_id: null, ga_refresh_token_id: null },
    });

    const result = await getProjectGACredentials('proj-1');
    expect(result).toBeNull();
  });

  it('returns null when vault read returns null', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { ga_property_id: '123456', ga_refresh_token_id: 'vault-uuid' },
    });
    mockReadSecret.mockResolvedValue(null);

    const result = await getProjectGACredentials('proj-1');
    expect(result).toBeNull();
  });

  it('exchanges refresh token for access token', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { ga_property_id: '123456', ga_refresh_token_id: 'vault-uuid' },
    });
    mockReadSecret.mockResolvedValue('real_refresh_token');

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ access_token: 'fresh_access_token' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await getProjectGACredentials('proj-1');

    expect(result).toEqual({ propertyId: '123456', accessToken: 'fresh_access_token' });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockReadSecret).toHaveBeenCalled();
  });

  it('returns null when token refresh fails', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { ga_property_id: '123', ga_refresh_token_id: 'vault-uuid' },
    });
    mockReadSecret.mockResolvedValue('expired_token');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));

    const result = await getProjectGACredentials('proj-1');
    expect(result).toBeNull();
  });

  it('never returns the raw refresh token in the result', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { ga_property_id: '999', ga_refresh_token_id: 'uuid' },
    });
    mockReadSecret.mockResolvedValue('super_secret_refresh_token');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ access_token: 'at_123' }),
    }));

    const result = await getProjectGACredentials('proj-1');
    expect(result).toBeDefined();
    expect(JSON.stringify(result)).not.toContain('super_secret_refresh_token');
  });
});
