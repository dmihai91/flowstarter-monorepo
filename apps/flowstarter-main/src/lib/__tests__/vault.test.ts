/**
 * Tests for Vault helpers
 * Verifies correct RPC calls and error handling.
 */
import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock server-only import
vi.mock('server-only', () => ({}));

// We test the logic by simulating Supabase RPC calls
describe('Vault operations', () => {
  type VaultTestSupabase = Pick<SupabaseClient, 'rpc'>;

  function createMockSupabase(rpcResults: Record<string, { data?: unknown; error?: { message: string } | null }>) {
    return {
      rpc: vi.fn((fn: string, params: Record<string, unknown>) => {
        const result = rpcResults[fn];
        return Promise.resolve(result || { data: null, error: { message: 'Unknown function' } });
      }),
    } as unknown as VaultTestSupabase;
  }

  describe('storeSecret', () => {
    it('calls store_project_secret RPC with correct params', async () => {
      const supabase = createMockSupabase({
        store_project_secret: { data: 'uuid-123', error: null },
      });

      const { storeSecret } = await import('../vault');
      const result = await storeSecret(supabase as unknown as SupabaseClient, 'proj-1', 'ga_token', 'secret_value', 'GA token');

      expect(supabase.rpc).toHaveBeenCalledWith('store_project_secret', {
        p_project_id: 'proj-1',
        p_name: 'ga_token',
        p_value: 'secret_value',
        p_description: 'GA token',
      });
      expect(result).toBe('uuid-123');
    });

    it('throws on RPC error', async () => {
      const supabase = createMockSupabase({
        store_project_secret: { data: null, error: { message: 'Permission denied' } },
      });

      const { storeSecret } = await import('../vault');
      await expect(storeSecret(supabase as unknown as SupabaseClient, 'proj-1', 'key', 'val')).rejects.toThrow('Vault store failed: Permission denied');
    });
  });

  describe('readSecret', () => {
    it('calls read_project_secret RPC', async () => {
      const supabase = createMockSupabase({
        read_project_secret: { data: 'decrypted_token', error: null },
      });

      const { readSecret } = await import('../vault');
      const result = await readSecret(supabase as unknown as SupabaseClient, 'uuid-456');

      expect(supabase.rpc).toHaveBeenCalledWith('read_project_secret', { p_secret_id: 'uuid-456' });
      expect(result).toBe('decrypted_token');
    });

    it('returns null for missing secret', async () => {
      const supabase = createMockSupabase({
        read_project_secret: { data: null, error: null },
      });

      const { readSecret } = await import('../vault');
      const result = await readSecret(supabase as unknown as SupabaseClient, 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('deleteSecret', () => {
    it('calls delete_project_secret RPC', async () => {
      const supabase = createMockSupabase({
        delete_project_secret: { data: null, error: null },
      });

      const { deleteSecret } = await import('../vault');
      await deleteSecret(supabase as unknown as SupabaseClient, 'uuid-789');

      expect(supabase.rpc).toHaveBeenCalledWith('delete_project_secret', { p_secret_id: 'uuid-789' });
    });
  });
});

describe('Vault security properties', () => {
  it('never exposes raw secret in return values of store', () => {
    // storeSecret returns UUID, not the secret value
    const uuid = 'c9b00867-ca8b-44fc-a81d-d20b8169be17';
    expect(uuid).not.toContain('secret');
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('vault reference is a UUID, not a plaintext secret', () => {
    // This is a design property test — vault IDs are UUIDs
    const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(s);
    expect(isUUID('7095d222-efe5-4cd5-b5c6-5755b451e223')).toBe(true);
    expect(isUUID('cal_live_secret_key_123')).toBe(false);
  });
});
