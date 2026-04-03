/**
 * Smoke tests for @flowstarter/supabase-utils
 * Verifies each factory returns a Supabase client with the expected shape.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @supabase/supabase-js before importing the module under test
const mockClient = { from: vi.fn(), auth: {}, storage: {} };
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockClient),
}));

import { createClient } from '@supabase/supabase-js';
import {
  createSupabaseClient,
  createSupabaseServerClient,
  createSupabaseServerClientWithAuth,
  createSupabaseServiceRoleClient,
} from './index';

const MOCK_URL = 'https://test.supabase.co';
const MOCK_ANON_KEY = 'anon-key-123';
const MOCK_SERVICE_KEY = 'service-role-key-456';

describe('@flowstarter/supabase-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = MOCK_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = MOCK_ANON_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = MOCK_SERVICE_KEY;
  });

  describe('createSupabaseClient', () => {
    it('returns a client object', () => {
      const client = createSupabaseClient();
      expect(client).toBe(mockClient);
    });

    it('calls createClient with env URL and anon key', () => {
      createSupabaseClient();
      expect(createClient).toHaveBeenCalledWith(
        MOCK_URL,
        MOCK_ANON_KEY,
        expect.objectContaining({ auth: { persistSession: false } })
      );
    });

    it('does not persist auth session', () => {
      createSupabaseClient();
      const [, , options] = (createClient as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(options.auth.persistSession).toBe(false);
    });
  });

  describe('createSupabaseServerClient', () => {
    it('is an alias for createSupabaseClient', () => {
      expect(createSupabaseServerClient).toBe(createSupabaseClient);
    });
  });

  describe('createSupabaseServerClientWithAuth', () => {
    it('returns a client object', () => {
      const client = createSupabaseServerClientWithAuth('my-jwt-token');
      expect(client).toBe(mockClient);
    });

    it('passes the JWT as an Authorization Bearer header', () => {
      createSupabaseServerClientWithAuth('my-jwt-token');
      const [, , options] = (createClient as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(options.global.headers.Authorization).toBe('Bearer my-jwt-token');
    });

    it('does not persist session', () => {
      createSupabaseServerClientWithAuth('my-jwt-token');
      const [, , options] = (createClient as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(options.auth.persistSession).toBe(false);
    });

    it('uses the anon key (not service role)', () => {
      createSupabaseServerClientWithAuth('my-jwt-token');
      const [, key] = (createClient as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(key).toBe(MOCK_ANON_KEY);
    });
  });

  describe('createSupabaseServiceRoleClient', () => {
    it('returns a client object', () => {
      const client = createSupabaseServiceRoleClient();
      expect(client).toBe(mockClient);
    });

    it('uses SUPABASE_SERVICE_ROLE_KEY', () => {
      createSupabaseServiceRoleClient();
      const [, key] = (createClient as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(key).toBe(MOCK_SERVICE_KEY);
    });

    it('does not persist session', () => {
      createSupabaseServiceRoleClient();
      const [, , options] = (createClient as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(options.auth.persistSession).toBe(false);
    });
  });
});
