/**
 * Sandbox Service Unit Tests
 *
 * Tests for sandbox creation, discovery, and lifecycle management.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SandboxState } from '@daytonaio/sdk';

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
  state: SandboxState.STARTED,
  labels: { project: 'test-project', source: 'flowstarter' },
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(undefined),
  refreshData: vi.fn().mockResolvedValue(undefined),
  getWorkDir: vi.fn().mockResolvedValue('/home/daytona'),
  process: {
    executeCommand: vi.fn().mockResolvedValue({ exitCode: 0, result: '' }),
  },
  fs: {
    uploadFile: vi.fn().mockResolvedValue(undefined),
  },
  getPreviewLink: vi.fn().mockResolvedValue({ url: 'https://preview.test' }),
  ...overrides,
});

type MockSandbox = ReturnType<typeof createMockSandbox>;

// Create mock client factory
const createMockClient = (sandboxes: MockSandbox[] = []) => ({
  list: vi.fn().mockResolvedValue({ items: sandboxes }),
  get: vi.fn().mockImplementation((id: string) => {
    const sandbox = sandboxes.find((s) => s.id === id);
    return Promise.resolve(sandbox || createMockSandbox({ id }));
  }),
  create: vi.fn().mockResolvedValue(createMockSandbox()),
  delete: vi.fn().mockResolvedValue(undefined),
});

describe('sandboxService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findReusableSandbox', () => {
    it('should find and return started sandbox first', async () => {
      const startedSandbox = createMockSandbox({
        id: 'sb-started',
        state: SandboxState.STARTED,
        labels: { project: 'test-project' },
      });
      const stoppedSandbox = createMockSandbox({
        id: 'sb-stopped',
        state: SandboxState.STOPPED,
        labels: { project: 'test-project' },
      });

      const mockClient = createMockClient([startedSandbox, stoppedSandbox]);

      const { findReusableSandbox } = await import('~/lib/services/daytona/sandboxService');

      const result = await findReusableSandbox(mockClient as never, 'test-project');

      expect(result).not.toBeNull();
      expect(result?.sandbox.id).toBe('sb-started');
      expect(result?.needsStart).toBe(false);
    });

    it('should find stopped sandbox when no started sandbox exists', async () => {
      const stoppedSandbox = createMockSandbox({
        id: 'sb-stopped',
        state: SandboxState.STOPPED,
        labels: { project: 'test-project' },
      });

      const mockClient = createMockClient([stoppedSandbox]);

      const { findReusableSandbox } = await import('~/lib/services/daytona/sandboxService');

      const result = await findReusableSandbox(mockClient as never, 'test-project');

      expect(result).not.toBeNull();
      expect(result?.sandbox.id).toBe('sb-stopped');
      expect(result?.needsStart).toBe(true);
    });

    it('should find archived sandbox when no started/stopped sandbox exists', async () => {
      const archivedSandbox = createMockSandbox({
        id: 'sb-archived',
        state: SandboxState.ARCHIVED,
        labels: { project: 'test-project' },
      });

      const mockClient = createMockClient([archivedSandbox]);

      const { findReusableSandbox } = await import('~/lib/services/daytona/sandboxService');

      const result = await findReusableSandbox(mockClient as never, 'test-project');

      expect(result).not.toBeNull();
      expect(result?.sandbox.id).toBe('sb-archived');
      expect(result?.needsStart).toBe(true);
    });

    it('should find available sandbox without project label', async () => {
      const availableSandbox = createMockSandbox({
        id: 'sb-available',
        state: SandboxState.STARTED,
        labels: { source: 'flowstarter' }, // No project label
      });

      const mockClient = createMockClient([availableSandbox]);

      const { findReusableSandbox } = await import('~/lib/services/daytona/sandboxService');

      const result = await findReusableSandbox(mockClient as never, 'different-project');

      expect(result).not.toBeNull();
      expect(result?.sandbox.id).toBe('sb-available');
      expect(result?.needsStart).toBe(false);
    });

    it('should return null when no reusable sandbox found', async () => {
      const mockClient = createMockClient([]);

      const { findReusableSandbox } = await import('~/lib/services/daytona/sandboxService');

      const result = await findReusableSandbox(mockClient as never, 'test-project');

      expect(result).toBeNull();
    });

    it('should filter sandboxes by project ID', async () => {
      const projectASandbox = createMockSandbox({
        id: 'sb-project-a',
        state: SandboxState.STARTED,
        labels: { project: 'project-a' },
      });
      const projectBSandbox = createMockSandbox({
        id: 'sb-project-b',
        state: SandboxState.STARTED,
        labels: { project: 'project-b' },
      });

      const mockClient = createMockClient([projectASandbox, projectBSandbox]);

      const { findReusableSandbox } = await import('~/lib/services/daytona/sandboxService');

      const result = await findReusableSandbox(mockClient as never, 'project-a');

      expect(result?.sandbox.id).toBe('sb-project-a');
    });

    it('should handle list errors gracefully', async () => {
      const mockClient = createMockClient([]);
      mockClient.list.mockRejectedValue(new Error('Network error'));

      const { findReusableSandbox } = await import('~/lib/services/daytona/sandboxService');

      const result = await findReusableSandbox(mockClient as never, 'test-project');

      expect(result).toBeNull();
    });
  });

  describe('createSandbox', () => {
    it('should create sandbox with correct config', async () => {
      const mockClient = createMockClient([]);
      mockClient.create.mockResolvedValue(
        createMockSandbox({ id: 'sb-new', labels: { project: 'test-project', source: 'flowstarter' } })
      );

      const { createSandbox } = await import('~/lib/services/daytona/sandboxService');

      const sandbox = await createSandbox(mockClient as never, 'test-project');

      expect(sandbox.id).toBe('sb-new');
      expect(mockClient.create).toHaveBeenCalledWith(
        expect.objectContaining({
          envVars: expect.objectContaining({
            PROJECT_ID: 'test-project',
            NODE_ENV: 'development',
          }),
          autoStopInterval: 30,
          public: true,
          labels: expect.objectContaining({
            project: 'test-project',
            source: 'flowstarter',
          }),
        }),
        expect.objectContaining({ timeout: 120 })
      );
    });

    it('should try multiple bun images before falling back', async () => {
      const mockClient = createMockClient([]);

      // First two images fail, third succeeds
      mockClient.create
        .mockRejectedValueOnce(new Error('Image not found'))
        .mockRejectedValueOnce(new Error('Image not found'))
        .mockResolvedValueOnce(createMockSandbox({ id: 'sb-bun' }));

      const { createSandbox } = await import('~/lib/services/daytona/sandboxService');

      const sandbox = await createSandbox(mockClient as never, 'test-project');

      expect(sandbox.id).toBe('sb-bun');
      expect(mockClient.create).toHaveBeenCalledTimes(3);
    });

    it('should fall back to javascript language when all bun images fail', async () => {
      const mockClient = createMockClient([]);

      // All bun images fail
      mockClient.create
        .mockRejectedValueOnce(new Error('Image not found'))
        .mockRejectedValueOnce(new Error('Image not found'))
        .mockRejectedValueOnce(new Error('Image not found'))
        .mockRejectedValueOnce(new Error('Image not found'))
        .mockRejectedValueOnce(new Error('Image not found'))
        .mockResolvedValueOnce(createMockSandbox({ id: 'sb-node' }));

      const { createSandbox } = await import('~/lib/services/daytona/sandboxService');

      const sandbox = await createSandbox(mockClient as never, 'test-project');

      expect(sandbox.id).toBe('sb-node');

      // Last call should use 'javascript' language
      const lastCall = mockClient.create.mock.calls[mockClient.create.mock.calls.length - 1];
      expect(lastCall[0]).toEqual(
        expect.objectContaining({
          language: 'javascript',
        })
      );
    });
  });

  describe('ensureSandboxRunning', () => {
    it('should return true for already started sandbox', async () => {
      const sandbox = createMockSandbox({ state: SandboxState.STARTED });
      const mockClient = createMockClient([]);

      const { ensureSandboxRunning } = await import('~/lib/services/daytona/sandboxService');

      const result = await ensureSandboxRunning(mockClient as never, sandbox as never);

      expect(result).toBe(true);
      expect(sandbox.start).not.toHaveBeenCalled();
    });

    it('should start stopped sandbox and return true', async () => {
      const sandbox = createMockSandbox({ state: SandboxState.STOPPED });
      const mockClient = createMockClient([]);

      const { ensureSandboxRunning } = await import('~/lib/services/daytona/sandboxService');

      const result = await ensureSandboxRunning(mockClient as never, sandbox as never);

      expect(result).toBe(true);
      expect(sandbox.start).toHaveBeenCalledWith(60);
    });

    it('should start archived sandbox and return true', async () => {
      const sandbox = createMockSandbox({ state: SandboxState.ARCHIVED });
      const mockClient = createMockClient([]);

      const { ensureSandboxRunning } = await import('~/lib/services/daytona/sandboxService');

      const result = await ensureSandboxRunning(mockClient as never, sandbox as never);

      expect(result).toBe(true);
      expect(sandbox.start).toHaveBeenCalledWith(60);
    });

    it('should return false for unexpected sandbox state', async () => {
      const sandbox = createMockSandbox({ state: 'UNKNOWN_STATE' });
      const mockClient = createMockClient([]);

      const { ensureSandboxRunning } = await import('~/lib/services/daytona/sandboxService');

      const result = await ensureSandboxRunning(mockClient as never, sandbox as never);

      expect(result).toBe(false);
    });

    it('should return false when start fails', async () => {
      const sandbox = createMockSandbox({ state: SandboxState.STOPPED });
      sandbox.start.mockRejectedValue(new Error('Start failed'));
      const mockClient = createMockClient([]);

      const { ensureSandboxRunning } = await import('~/lib/services/daytona/sandboxService');

      const result = await ensureSandboxRunning(mockClient as never, sandbox as never);

      expect(result).toBe(false);
    });
  });
});

