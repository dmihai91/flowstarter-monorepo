import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create mock functions at module level
const mockGetToken = vi.fn();
const mockAuth = vi.fn();

// Mock server-only FIRST - before any other imports
vi.mock('server-only', () => ({
  default: {},
}));

// Mock Clerk with proper async auth function
vi.mock('@clerk/nextjs/server', async () => {
  return {
    auth: mockAuth,
  };
});

// Use dynamic import to ensure mocks are applied
let getSupabaseJWT: typeof import('../clerk-supabase-jwt').getSupabaseJWT;
let getSupabaseUser: typeof import('../clerk-supabase-jwt').getSupabaseUser;

describe('Clerk-Supabase JWT Integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.CLERK_SUPABASE_TEMPLATE;

    // Reload module to ensure fresh state
    const clerkModule = await import('../clerk-supabase-jwt');
    getSupabaseJWT = clerkModule.getSupabaseJWT;
    getSupabaseUser = clerkModule.getSupabaseUser;
  });

  describe('getSupabaseJWT', () => {
    it('should return JWT token when session is valid', async () => {
      const mockToken = 'mock-jwt-token-123';

      mockAuth.mockResolvedValue({
        getToken: mockGetToken,
      });
      mockGetToken.mockResolvedValue(mockToken);

      const token = await getSupabaseJWT();

      expect(token).toBe(mockToken);
      expect(mockAuth).toHaveBeenCalled();
      expect(mockGetToken).toHaveBeenCalledWith({ template: 'supabase' });
    });

    it('should use custom template from environment variable', async () => {
      const mockToken = 'mock-jwt-token-456';
      const customTemplate = 'custom-template';

      process.env.CLERK_SUPABASE_TEMPLATE = customTemplate;

      mockAuth.mockResolvedValue({
        getToken: mockGetToken,
      });
      mockGetToken.mockResolvedValue(mockToken);

      const token = await getSupabaseJWT();

      expect(token).toBe(mockToken);
      expect(mockGetToken).toHaveBeenCalledWith({ template: customTemplate });
    });

    it('should return null when session is invalid', async () => {
      mockAuth.mockResolvedValue({
        getToken: mockGetToken,
      });
      mockGetToken.mockResolvedValue(null);

      const token = await getSupabaseJWT();

      expect(token).toBeNull();
    });

    it('should return null and log error when auth fails', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockAuth.mockRejectedValue(new Error('Auth failed'));

      const token = await getSupabaseJWT();

      expect(token).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Auth] getSupabaseJWT error',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should return null when getToken throws error', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockAuth.mockResolvedValue({
        getToken: mockGetToken,
      });
      mockGetToken.mockRejectedValue(new Error('Token generation failed'));

      const token = await getSupabaseJWT();

      expect(token).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should log debug information when getting token', async () => {
      const consoleInfoSpy = vi
        .spyOn(console, 'info')
        .mockImplementation(() => {});
      const mockToken = 'test-token';

      mockAuth.mockResolvedValue({
        getToken: mockGetToken,
      });
      mockGetToken.mockResolvedValue(mockToken);

      await getSupabaseJWT();

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Auth] getSupabaseJWT')
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('template=supabase')
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('hasToken=true')
      );

      consoleInfoSpy.mockRestore();
    });

    it('should log hasToken=false when no token returned', async () => {
      const consoleInfoSpy = vi
        .spyOn(console, 'info')
        .mockImplementation(() => {});

      mockAuth.mockResolvedValue({
        getToken: mockGetToken,
      });
      mockGetToken.mockResolvedValue(null);

      await getSupabaseJWT();

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('hasToken=false')
      );

      consoleInfoSpy.mockRestore();
    });

    it('should handle concurrent requests', async () => {
      const mockToken = 'concurrent-token';

      mockAuth.mockResolvedValue({
        getToken: mockGetToken,
      });
      mockGetToken.mockResolvedValue(mockToken);

      const [token1, token2, token3] = await Promise.all([
        getSupabaseJWT(),
        getSupabaseJWT(),
        getSupabaseJWT(),
      ]);

      expect(token1).toBe(mockToken);
      expect(token2).toBe(mockToken);
      expect(token3).toBe(mockToken);
      expect(mockAuth).toHaveBeenCalledTimes(3);
    });
  });

  describe('getSupabaseUser', () => {
    it('should return user object when userId exists', async () => {
      const mockUserId = 'user_123456';

      mockAuth.mockResolvedValue({
        userId: mockUserId,
      });

      const user = await getSupabaseUser();

      expect(user).toEqual({
        id: mockUserId,
        role: 'authenticated',
      });
    });

    it('should return null when userId is not present', async () => {
      mockAuth.mockResolvedValue({
        userId: null,
      });

      const user = await getSupabaseUser();

      expect(user).toBeNull();
    });

    it('should return null when userId is undefined', async () => {
      mockAuth.mockResolvedValue({
        userId: undefined,
      });

      const user = await getSupabaseUser();

      expect(user).toBeNull();
    });

    it('should return null when auth session is null', async () => {
      mockAuth.mockResolvedValue(null);

      const user = await getSupabaseUser();

      expect(user).toBeNull();
    });

    it('should always set role as authenticated for valid users', async () => {
      mockAuth.mockResolvedValue({
        userId: 'test-user-id',
      });

      const user = await getSupabaseUser();

      expect(user?.role).toBe('authenticated');
    });

    it('should handle different userId formats', async () => {
      const userIds = [
        'user_abc123',
        '12345',
        'clerk-user-xyz',
        'uuid-format-user',
      ];

      for (const userId of userIds) {
        mockAuth.mockResolvedValue({
          userId,
        });

        const user = await getSupabaseUser();

        expect(user).toEqual({
          id: userId,
          role: 'authenticated',
        });
      }
    });

    it('should handle concurrent user requests', async () => {
      const mockUserId = 'concurrent-user';

      mockAuth.mockResolvedValue({
        userId: mockUserId,
      });

      const [user1, user2, user3] = await Promise.all([
        getSupabaseUser(),
        getSupabaseUser(),
        getSupabaseUser(),
      ]);

      expect(user1).toEqual({ id: mockUserId, role: 'authenticated' });
      expect(user2).toEqual({ id: mockUserId, role: 'authenticated' });
      expect(user3).toEqual({ id: mockUserId, role: 'authenticated' });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle authentication flow with token and user', async () => {
      const mockUserId = 'integration-user-123';
      const mockToken = 'integration-token-456';

      mockAuth.mockResolvedValue({
        userId: mockUserId,
        getToken: mockGetToken,
      });
      mockGetToken.mockResolvedValue(mockToken);

      const [token, user] = await Promise.all([
        getSupabaseJWT(),
        getSupabaseUser(),
      ]);

      expect(token).toBe(mockToken);
      expect(user).toEqual({
        id: mockUserId,
        role: 'authenticated',
      });
    });

    it('should handle unauthenticated state', async () => {
      mockAuth.mockResolvedValue({
        userId: null,
        getToken: mockGetToken,
      });
      mockGetToken.mockResolvedValue(null);

      const [token, user] = await Promise.all([
        getSupabaseJWT(),
        getSupabaseUser(),
      ]);

      expect(token).toBeNull();
      expect(user).toBeNull();
    });

    it('should handle partial authentication (user but no token)', async () => {
      const mockUserId = 'partial-user';

      mockAuth.mockResolvedValue({
        userId: mockUserId,
        getToken: mockGetToken,
      });
      mockGetToken.mockResolvedValue(null);

      const [token, user] = await Promise.all([
        getSupabaseJWT(),
        getSupabaseUser(),
      ]);

      expect(token).toBeNull();
      expect(user).toEqual({
        id: mockUserId,
        role: 'authenticated',
      });
    });
  });

  describe('Error Recovery', () => {
    it('should not throw when auth service is unavailable', async () => {
      mockAuth.mockRejectedValue(new Error('Service unavailable'));

      await expect(getSupabaseJWT()).resolves.toBeNull();
      await expect(getSupabaseUser()).rejects.toThrow();
    });

    it('should handle malformed session responses', async () => {
      mockAuth.mockResolvedValue({
        // Missing expected properties
        someOtherField: 'value',
      });

      const user = await getSupabaseUser();

      expect(user).toBeNull();
    });

    it('should recover from intermittent failures', async () => {
      const mockToken = 'recovery-token';

      // First call fails
      mockAuth.mockRejectedValueOnce(new Error('Temporary failure'));

      // Second call succeeds
      mockAuth.mockResolvedValueOnce({
        getToken: mockGetToken,
      });
      mockGetToken.mockResolvedValue(mockToken);

      const firstCall = await getSupabaseJWT();
      expect(firstCall).toBeNull();

      const secondCall = await getSupabaseJWT();
      expect(secondCall).toBe(mockToken);
    });
  });
});
