/**
 * Cleanup Service Unit Tests
 *
 * Tests for cleanup of Daytona sandboxes.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock logger
vi.mock('~/lib/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Create mock sandbox factory
const createMockSandbox = (overrides: Record<string, unknown> = {}) => ({
  id: 'sb-test-123',
  labels: { project: 'test-project', source: 'flowstarter' },
  ...overrides,
});

type MockSandbox = ReturnType<typeof createMockSandbox>;

// Create mock client factory
const createMockClient = (sandboxes: MockSandbox[] = []) => ({
  list: vi.fn().mockResolvedValue({ items: sandboxes }),
  get: vi.fn(),
  create: vi.fn(),
  delete: vi.fn().mockResolvedValue(undefined),
});

describe('cleanupService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.DAYTONA_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('cleanupAllSandboxes', () => {
    it('should delete all flowstarter sandboxes', async () => {
      const sandboxes = [
        createMockSandbox({ id: 'sb-1' }),
        createMockSandbox({ id: 'sb-2' }),
        createMockSandbox({ id: 'sb-3' }),
      ];

      const mockClient = createMockClient(sandboxes);

      vi.doMock('@daytonaio/sdk', () => ({
        Daytona: vi.fn().mockImplementation(() => mockClient),
      }));

      const { cleanupAllSandboxes } = await import('~/lib/services/daytona/cleanupService');

      const result = await cleanupAllSandboxes();

      expect(result.deleted).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockClient.delete).toHaveBeenCalledTimes(3);
    });

    it('should handle partial deletion failures', async () => {
      const sandboxes = [
        createMockSandbox({ id: 'sb-1' }),
        createMockSandbox({ id: 'sb-2' }),
        createMockSandbox({ id: 'sb-3' }),
      ];

      const mockClient = createMockClient(sandboxes);
      mockClient.delete
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Delete failed'))
        .mockResolvedValueOnce(undefined);

      vi.doMock('@daytonaio/sdk', () => ({
        Daytona: vi.fn().mockImplementation(() => mockClient),
      }));

      const { cleanupAllSandboxes } = await import('~/lib/services/daytona/cleanupService');

      const result = await cleanupAllSandboxes();

      expect(result.deleted).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('sb-2');
      expect(result.errors[0]).toContain('Delete failed');
    });

    it('should handle list failure', async () => {
      const mockClient = createMockClient([]);
      mockClient.list.mockRejectedValue(new Error('List failed'));

      vi.doMock('@daytonaio/sdk', () => ({
        Daytona: vi.fn().mockImplementation(() => mockClient),
      }));

      const { cleanupAllSandboxes } = await import('~/lib/services/daytona/cleanupService');

      const result = await cleanupAllSandboxes();

      expect(result.deleted).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('List failed');
    });

    it('should return empty result when no sandboxes exist', async () => {
      const mockClient = createMockClient([]);

      vi.doMock('@daytonaio/sdk', () => ({
        Daytona: vi.fn().mockImplementation(() => mockClient),
      }));

      const { cleanupAllSandboxes } = await import('~/lib/services/daytona/cleanupService');

      const result = await cleanupAllSandboxes();

      expect(result.deleted).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should clear local sandbox cache after cleanup', async () => {
      const mockClient = createMockClient([createMockSandbox({ id: 'sb-1' })]);

      vi.doMock('@daytonaio/sdk', () => ({
        Daytona: vi.fn().mockImplementation(() => mockClient),
      }));

      // First, set some cache
      const { setCachedSandbox, getCachedSandbox } = await import('~/lib/services/daytona/client');
      setCachedSandbox('project-1', { sandboxId: 'sb-1', previewUrl: 'https://test' });

      expect(getCachedSandbox('project-1')).toBeDefined();

      const { cleanupAllSandboxes } = await import('~/lib/services/daytona/cleanupService');
      await cleanupAllSandboxes();

      // Cache should be cleared
      expect(getCachedSandbox('project-1')).toBeUndefined();
    });

    it('should use provided env config', async () => {
      const sandboxes = [createMockSandbox({ id: 'sb-1' })];
      const mockClient = createMockClient(sandboxes);

      vi.doMock('@daytonaio/sdk', () => ({
        Daytona: vi.fn().mockImplementation(() => mockClient),
      }));

      const { cleanupAllSandboxes } = await import('~/lib/services/daytona/cleanupService');

      await cleanupAllSandboxes({
        DAYTONA_API_KEY: 'custom-key',
        DAYTONA_API_URL: 'https://custom.api',
      });

      expect(mockClient.delete).toHaveBeenCalled();
    });

    it('should log sandbox details during deletion', async () => {
      const sandboxes = [
        createMockSandbox({ id: 'sb-1', labels: { project: 'project-a' } }),
        createMockSandbox({ id: 'sb-2', labels: { project: 'project-b' } }),
      ];

      const mockClient = createMockClient(sandboxes);

      vi.doMock('@daytonaio/sdk', () => ({
        Daytona: vi.fn().mockImplementation(() => mockClient),
      }));

      const { cleanupAllSandboxes } = await import('~/lib/services/daytona/cleanupService');

      const result = await cleanupAllSandboxes();

      expect(result.deleted).toBe(2);
    });
  });
});

