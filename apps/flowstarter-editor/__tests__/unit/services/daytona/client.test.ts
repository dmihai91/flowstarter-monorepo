/**
 * Daytona Client Unit Tests
 *
 * Tests for client initialization and cache management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the Daytona SDK
vi.mock('@daytonaio/sdk', () => ({
  Daytona: vi.fn().mockImplementation((config) => ({
    config,
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock logger
vi.mock('~/lib/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('getClient', () => {
    it('should throw error when API key is not configured', async () => {
      delete process.env.DAYTONA_API_KEY;

      const { getClient } = await import('~/lib/services/daytona/client');

      expect(() => getClient()).toThrow('Daytona API key not configured');
    });

    it('should create client with env API key', async () => {
      process.env.DAYTONA_API_KEY = 'test-api-key';
      process.env.DAYTONA_API_URL = 'https://test.daytona.io/api';

      const { getClient } = await import('~/lib/services/daytona/client');
      const { Daytona } = await import('@daytonaio/sdk');

      const client = getClient();

      expect(Daytona).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
        apiUrl: 'https://test.daytona.io/api',
      });
      expect(client).toBeDefined();
    });

    it('should use default API URL when not provided', async () => {
      process.env.DAYTONA_API_KEY = 'test-api-key';
      delete process.env.DAYTONA_API_URL;

      const { getClient } = await import('~/lib/services/daytona/client');
      const { Daytona } = await import('@daytonaio/sdk');

      getClient();

      expect(Daytona).toHaveBeenCalledWith(
        expect.objectContaining({
          apiUrl: 'https://app.daytona.io/api',
        })
      );
    });

    it('should override env with explicit config', async () => {
      process.env.DAYTONA_API_KEY = 'env-api-key';

      const { getClient } = await import('~/lib/services/daytona/client');
      const { Daytona } = await import('@daytonaio/sdk');

      getClient({ DAYTONA_API_KEY: 'explicit-key', DAYTONA_API_URL: 'https://custom.api' });

      expect(Daytona).toHaveBeenCalledWith({
        apiKey: 'explicit-key',
        apiUrl: 'https://custom.api',
      });
    });

    it('should reuse singleton client on subsequent calls', async () => {
      process.env.DAYTONA_API_KEY = 'test-api-key';

      const { getClient } = await import('~/lib/services/daytona/client');
      const { Daytona } = await import('@daytonaio/sdk');

      const client1 = getClient();
      const client2 = getClient();

      expect(client1).toBe(client2);
      expect(Daytona).toHaveBeenCalledTimes(1);
    });
  });

  describe('sandbox cache', () => {
    beforeEach(async () => {
      process.env.DAYTONA_API_KEY = 'test-key';
    });

    it('should set and get cached sandbox', async () => {
      const { getCachedSandbox, setCachedSandbox } = await import('~/lib/services/daytona/client');

      setCachedSandbox('project-1', { sandboxId: 'sb-123', previewUrl: 'https://preview.test' });

      const cached = getCachedSandbox('project-1');

      expect(cached).toEqual({
        sandboxId: 'sb-123',
        previewUrl: 'https://preview.test',
      });
    });

    it('should return undefined for non-existent project', async () => {
      const { getCachedSandbox } = await import('~/lib/services/daytona/client');

      const cached = getCachedSandbox('non-existent');

      expect(cached).toBeUndefined();
    });

    it('should delete cached sandbox', async () => {
      const { getCachedSandbox, setCachedSandbox, deleteCachedSandbox } = await import(
        '~/lib/services/daytona/client'
      );

      setCachedSandbox('project-1', { sandboxId: 'sb-123', previewUrl: null });
      deleteCachedSandbox('project-1');

      expect(getCachedSandbox('project-1')).toBeUndefined();
    });

    it('should clear all cached sandboxes', async () => {
      const { getCachedSandbox, setCachedSandbox, clearSandboxCache } = await import(
        '~/lib/services/daytona/client'
      );

      setCachedSandbox('project-1', { sandboxId: 'sb-1', previewUrl: null });
      setCachedSandbox('project-2', { sandboxId: 'sb-2', previewUrl: null });
      clearSandboxCache();

      expect(getCachedSandbox('project-1')).toBeUndefined();
      expect(getCachedSandbox('project-2')).toBeUndefined();
    });

    it('should get cached preview URL', async () => {
      const { getCachedPreviewUrl, setCachedSandbox } = await import('~/lib/services/daytona/client');

      setCachedSandbox('project-1', { sandboxId: 'sb-123', previewUrl: 'https://preview.test' });

      expect(getCachedPreviewUrl('project-1')).toBe('https://preview.test');
    });

    it('should return null for missing preview URL', async () => {
      const { getCachedPreviewUrl, setCachedSandbox } = await import('~/lib/services/daytona/client');

      setCachedSandbox('project-1', { sandboxId: 'sb-123', previewUrl: null });

      expect(getCachedPreviewUrl('project-1')).toBeNull();
    });

    it('should return null for non-existent project preview URL', async () => {
      const { getCachedPreviewUrl } = await import('~/lib/services/daytona/client');

      expect(getCachedPreviewUrl('non-existent')).toBeNull();
    });
  });
});

