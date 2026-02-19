import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Use vi.hoisted to ensure mock functions are hoisted with vi.mock
const { mockVerifyToken, mockGetUser } = vi.hoisted(() => ({
  mockVerifyToken: vi.fn(),
  mockGetUser: vi.fn()
}));
// Mock the Clerk client before importing auth module
vi.mock('@clerk/backend', () => ({
  createClerkClient: vi.fn(() => ({
    verifyToken: mockVerifyToken,
    users: {
      getUser: mockGetUser
    }
  }))
}));

// Import after mocking
import { isAuthRequired, isClerkConfigured, verifyAuth, checkUserPermissions, getClerkClient } from './auth.js';

describe('auth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isAuthRequired', () => {
    it('should return true when DISABLE_AUTH is not set', () => {
      delete process.env.DISABLE_AUTH;
      expect(isAuthRequired()).toBe(true);
    });

    it('should return false when DISABLE_AUTH is true', () => {
      process.env.DISABLE_AUTH = 'true';
      expect(isAuthRequired()).toBe(false);
    });

    it('should return true when DISABLE_AUTH is false', () => {
      process.env.DISABLE_AUTH = 'false';
      expect(isAuthRequired()).toBe(true);
    });

    it('should return true when DISABLE_AUTH is any other value', () => {
      process.env.DISABLE_AUTH = 'yes';
      expect(isAuthRequired()).toBe(true);
    });
  });

  describe('isClerkConfigured', () => {
    beforeEach(() => {
      process.env.CLERK_SECRET_KEY = '';
      process.env.CLERK_PUBLISHABLE_KEY = '';
      process.env.DISABLE_AUTH = '';
    });

    it('should return false when CLERK_SECRET_KEY is not set', () => {
      delete process.env.CLERK_SECRET_KEY;
      expect(isClerkConfigured()).toBe(false);
    });

    it('should return false when CLERK_SECRET_KEY is empty string', () => {
      process.env.CLERK_SECRET_KEY = '';
      expect(isClerkConfigured()).toBe(false);
    });

    it('should return true when CLERK_SECRET_KEY is set', () => {
      process.env.CLERK_SECRET_KEY = 'sk_test_123';
      expect(isClerkConfigured()).toBe(true);
    });

    it('should return true when DISABLE_AUTH is true (bypasses check)', () => {
      process.env.DISABLE_AUTH = 'true';
      delete process.env.CLERK_SECRET_KEY;
      expect(isClerkConfigured()).toBe(true);
    });
  });

  describe('verifyAuth', () => {
    it('should be defined', async () => {
      expect(verifyAuth).toBeDefined();
      expect(typeof verifyAuth).toBe('function');
    });

    it('should return dev user when DISABLE_AUTH is true', async () => {
      process.env.DISABLE_AUTH = 'true';

      const result = await verifyAuth('any-token');

      expect(result.isAuthenticated).toBe(true);
      expect(result.userId).toBe('dev-user');
      expect(result.sessionId).toBe('dev-session');
      expect(result.user?.email).toBe('dev@local.test');
      expect(result.user?.firstName).toBe('Dev');
      expect(result.user?.lastName).toBe('User');
    });

    it('should return unauthenticated when no token provided', async () => {
      process.env.DISABLE_AUTH = 'false';

      const result = await verifyAuth(undefined);

      expect(result.isAuthenticated).toBe(false);
      expect(result.userId).toBeNull();
      expect(result.sessionId).toBeNull();
    });

    it('should return unauthenticated when empty token provided', async () => {
      process.env.DISABLE_AUTH = 'false';

      const result = await verifyAuth('');

      expect(result.isAuthenticated).toBe(false);
    });

    it('should verify valid token and return user data', async () => {
      process.env.DISABLE_AUTH = 'false';

      const mockToken = {
        sub: 'user_123',
        sid: 'session_456'
      };

      const mockUser = {
        id: 'user_123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: 'https://example.com/avatar.jpg'
      };

      mockVerifyToken.mockResolvedValue(mockToken);
      mockGetUser.mockResolvedValue(mockUser);

      const result = await verifyAuth('valid-token');

      expect(mockVerifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockGetUser).toHaveBeenCalledWith('user_123');
      expect(result.isAuthenticated).toBe(true);
      expect(result.userId).toBe('user_123');
      expect(result.sessionId).toBe('session_456');
      expect(result.user?.email).toBe('test@example.com');
      expect(result.user?.firstName).toBe('John');
      expect(result.user?.lastName).toBe('Doe');
    });

    it('should return unauthenticated when verifyToken returns null', async () => {
      process.env.DISABLE_AUTH = 'false';

      mockVerifyToken.mockResolvedValue(null);

      const result = await verifyAuth('invalid-token');

      expect(result.isAuthenticated).toBe(false);
      expect(result.userId).toBeNull();
    });

    it('should return unauthenticated when verifyToken returns token without sub', async () => {
      process.env.DISABLE_AUTH = 'false';

      mockVerifyToken.mockResolvedValue({ sid: 'session_123' });

      const result = await verifyAuth('token-without-sub');

      expect(result.isAuthenticated).toBe(false);
      expect(result.userId).toBeNull();
    });

    it('should return unauthenticated when verifyToken throws error', async () => {
      process.env.DISABLE_AUTH = 'false';

      mockVerifyToken.mockRejectedValue(new Error('Token expired'));

      const result = await verifyAuth('expired-token');

      expect(result.isAuthenticated).toBe(false);
      expect(result.userId).toBeNull();
      expect(result.sessionId).toBeNull();
    });

    it('should handle user with no email addresses', async () => {
      process.env.DISABLE_AUTH = 'false';

      mockVerifyToken.mockResolvedValue({ sub: 'user_123', sid: 'session_456' });
      mockGetUser.mockResolvedValue({
        id: 'user_123',
        emailAddresses: [],
        firstName: 'John',
        lastName: 'Doe'
      });

      const result = await verifyAuth('valid-token');

      expect(result.isAuthenticated).toBe(true);
      expect(result.user?.email).toBeUndefined();
    });

    it('should handle missing session ID in token', async () => {
      process.env.DISABLE_AUTH = 'false';

      mockVerifyToken.mockResolvedValue({ sub: 'user_123' }); // No sid
      mockGetUser.mockResolvedValue({
        id: 'user_123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'Jane',
        lastName: 'Smith'
      });

      const result = await verifyAuth('valid-token');

      expect(result.isAuthenticated).toBe(true);
      expect(result.sessionId).toBeNull();
    });
  });

  describe('checkUserPermissions', () => {
    it('should be defined', async () => {
      expect(checkUserPermissions).toBeDefined();
      expect(typeof checkUserPermissions).toBe('function');
    });

    it('should return error when userId is empty', async () => {
      const result = await checkUserPermissions('');

      expect(result.hasPermission).toBe(false);
      expect(result.error).toBe('User ID is required');
    });

    it('should return permission granted for valid user', async () => {
      mockGetUser.mockResolvedValue({
        id: 'user_123',
        publicMetadata: {}
      });

      const result = await checkUserPermissions('user_123');

      expect(mockGetUser).toHaveBeenCalledWith('user_123');
      expect(result.hasPermission).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return permission denied for banned user', async () => {
      mockGetUser.mockResolvedValue({
        id: 'user_123',
        publicMetadata: { banned: true }
      });

      const result = await checkUserPermissions('user_123');

      expect(result.hasPermission).toBe(false);
      expect(result.error).toBe('User account is suspended');
    });

    it('should return permission granted when banned is false', async () => {
      mockGetUser.mockResolvedValue({
        id: 'user_123',
        publicMetadata: { banned: false }
      });

      const result = await checkUserPermissions('user_123');

      expect(result.hasPermission).toBe(true);
    });

    it('should return permission granted when publicMetadata is empty', async () => {
      mockGetUser.mockResolvedValue({
        id: 'user_123',
        publicMetadata: {}
      });

      const result = await checkUserPermissions('user_123');

      expect(result.hasPermission).toBe(true);
    });

    it('should return permission granted when publicMetadata is undefined', async () => {
      mockGetUser.mockResolvedValue({
        id: 'user_123'
      });

      const result = await checkUserPermissions('user_123');

      expect(result.hasPermission).toBe(true);
    });

    it('should return error when getUser throws', async () => {
      mockGetUser.mockRejectedValue(new Error('User not found'));

      const result = await checkUserPermissions('nonexistent_user');

      expect(result.hasPermission).toBe(false);
      expect(result.error).toBe('Failed to verify user permissions');
    });

    it('should return error when getUser returns null', async () => {
      mockGetUser.mockResolvedValue(null);

      const result = await checkUserPermissions('user_123');

      expect(result.hasPermission).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('getClerkClient', () => {
    it('should return a Clerk client instance', () => {
      const client = getClerkClient();
      expect(client).toBeDefined();
      // Note: verifyToken is now a standalone export, not on the client
      expect(client.users).toBeDefined();
    });
  });
});
