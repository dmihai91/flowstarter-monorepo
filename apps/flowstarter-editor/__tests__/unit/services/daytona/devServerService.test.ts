/**
 * Dev Server Service Unit Tests
 *
 * Tests for dev server startup, health checks, and port detection.
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

// Mock bunService
vi.mock('~/lib/services/daytona/bunService', () => ({
  getBunPathSetup: () => 'export BUN_INSTALL="$HOME/.bun" && export PATH="$BUN_INSTALL/bin:$PATH" && ',
}));

// Create mock sandbox factory
const createMockSandbox = (overrides = {}) => ({
  id: 'sb-test-123',
  process: {
    executeCommand: vi.fn().mockResolvedValue({ exitCode: 0, result: '' }),
  },
  getPreviewLink: vi.fn().mockResolvedValue({ url: 'https://preview.test' }),
  ...overrides,
});

describe('devServerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('waitForDevServer', () => {
    it('should return true when server responds with 200', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ status: 200 });
      vi.stubGlobal('fetch', mockFetch);

      const { waitForDevServer } = await import('~/lib/services/daytona/devServerService');

      const resultPromise = waitForDevServer('https://preview.test', 5000);
      await vi.advanceTimersByTimeAsync(100);
      const result = await resultPromise;

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('https://preview.test', expect.any(Object));

      vi.unstubAllGlobals();
    });

    it('should return true for non-502/503/504 status codes', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ status: 404 });
      vi.stubGlobal('fetch', mockFetch);

      const { waitForDevServer } = await import('~/lib/services/daytona/devServerService');

      const resultPromise = waitForDevServer('https://preview.test', 5000);
      await vi.advanceTimersByTimeAsync(100);
      const result = await resultPromise;

      expect(result).toBe(true);

      vi.unstubAllGlobals();
    });

    it('should retry on 502 status', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.resolve({ status: 502 });
        }
        return Promise.resolve({ status: 200 });
      });
      vi.stubGlobal('fetch', mockFetch);

      const { waitForDevServer } = await import('~/lib/services/daytona/devServerService');

      const resultPromise = waitForDevServer('https://preview.test', 10000);

      // Advance through retries
      await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(500);

      const result = await resultPromise;

      expect(result).toBe(true);
      expect(callCount).toBeGreaterThanOrEqual(3);

      vi.unstubAllGlobals();
    });

    it('should retry on 503 status', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.resolve({ status: 503 });
        }
        return Promise.resolve({ status: 200 });
      });
      vi.stubGlobal('fetch', mockFetch);

      const { waitForDevServer } = await import('~/lib/services/daytona/devServerService');

      const resultPromise = waitForDevServer('https://preview.test', 10000);
      await vi.advanceTimersByTimeAsync(1000);
      const result = await resultPromise;

      expect(result).toBe(true);

      vi.unstubAllGlobals();
    });

    it('should retry on network errors', async () => {
      let callCount = 0;
      const mockFetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ status: 200 });
      });
      vi.stubGlobal('fetch', mockFetch);

      const { waitForDevServer } = await import('~/lib/services/daytona/devServerService');

      const resultPromise = waitForDevServer('https://preview.test', 10000);

      await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(500);
      await vi.advanceTimersByTimeAsync(500);

      const result = await resultPromise;

      expect(result).toBe(true);

      vi.unstubAllGlobals();
    });

    it('should return false on timeout', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ status: 502 });
      vi.stubGlobal('fetch', mockFetch);

      const { waitForDevServer } = await import('~/lib/services/daytona/devServerService');

      const resultPromise = waitForDevServer('https://preview.test', 1000);

      // Advance past timeout
      await vi.advanceTimersByTimeAsync(1500);

      const result = await resultPromise;

      expect(result).toBe(false);

      vi.unstubAllGlobals();
    });
  });

  describe('killExistingDevServers', () => {
    it('should execute pkill commands', async () => {
      vi.useRealTimers();
      const sandbox = createMockSandbox();

      const { killExistingDevServers } = await import('~/lib/services/daytona/devServerService');

      await killExistingDevServers(sandbox as never, '/home/daytona');

      expect(sandbox.process.executeCommand).toHaveBeenCalledWith(
        expect.stringContaining('pkill'),
        '/home/daytona',
        undefined,
        10
      );
    });

    it('should kill both bun and astro dev servers', async () => {
      vi.useRealTimers();
      const sandbox = createMockSandbox();

      const { killExistingDevServers } = await import('~/lib/services/daytona/devServerService');

      await killExistingDevServers(sandbox as never, '/home/daytona');

      const command = sandbox.process.executeCommand.mock.calls[0][0];
      expect(command).toContain('bun run dev');
      expect(command).toContain('astro dev');
    });
  });

  describe('startDevServerTest', () => {
    it('should start dev server with bun and return output', async () => {
      vi.useRealTimers();
      const sandbox = createMockSandbox();
      sandbox.process.executeCommand.mockResolvedValue({
        exitCode: 0,
        result: 'ready in 500ms\nlocalhost:4321',
      });

      const { startDevServerTest } = await import('~/lib/services/daytona/devServerService');

      const result = await startDevServerTest(sandbox as never, '/home/daytona');

      expect(result.output).toContain('ready in');
      expect(result.output).toContain('localhost:4321');
      expect(result.exitCode).toBe(0);
    });

    it('should include --host 0.0.0.0 flag', async () => {
      vi.useRealTimers();
      const sandbox = createMockSandbox();

      const { startDevServerTest } = await import('~/lib/services/daytona/devServerService');

      await startDevServerTest(sandbox as never, '/home/daytona');

      const command = sandbox.process.executeCommand.mock.calls[0][0];
      expect(command).toContain('--host 0.0.0.0');
    });

    it('should use timeout wrapper', async () => {
      vi.useRealTimers();
      const sandbox = createMockSandbox();

      const { startDevServerTest } = await import('~/lib/services/daytona/devServerService');

      await startDevServerTest(sandbox as never, '/home/daytona');

      const command = sandbox.process.executeCommand.mock.calls[0][0];
      expect(command).toContain('timeout 10');
    });
  });

  describe('startDevServerBackground', () => {
    it('should start dev server in background with nohup', async () => {
      vi.useRealTimers();
      const sandbox = createMockSandbox();

      const { startDevServerBackground } = await import('~/lib/services/daytona/devServerService');

      await startDevServerBackground(sandbox as never, '/home/daytona');

      const command = sandbox.process.executeCommand.mock.calls[0][0];
      expect(command).toContain('nohup');
      expect(command).toContain('> /tmp/dev.log 2>&1 &');
    });
  });

  describe('getPreviewUrl', () => {
    it('should return URL for detected port', async () => {
      vi.useRealTimers();
      const sandbox = createMockSandbox();
      sandbox.getPreviewLink.mockResolvedValue({ url: 'https://preview.test:4321' });

      const { getPreviewUrl } = await import('~/lib/services/daytona/devServerService');

      const result = await getPreviewUrl(sandbox as never, 4321);

      expect(result).toEqual({ url: 'https://preview.test:4321', port: 4321 });
      expect(sandbox.getPreviewLink).toHaveBeenCalledWith(4321);
    });

    it('should try multiple ports when detected port fails', async () => {
      vi.useRealTimers();
      const sandbox = createMockSandbox();
      // When detectedPort is 4321, portsToTry = [4321, 4321, 5173, 3000]
      // Reject first call (4321), reject second call (fallback 4321), succeed on 5173
      sandbox.getPreviewLink
        .mockRejectedValueOnce(new Error('Port not available'))
        .mockRejectedValueOnce(new Error('Port not available'))
        .mockResolvedValueOnce({ url: 'https://preview.test:5173' });

      const { getPreviewUrl } = await import('~/lib/services/daytona/devServerService');

      const result = await getPreviewUrl(sandbox as never, 4321);

      expect(result).toEqual({ url: 'https://preview.test:5173', port: 5173 });
    });

    it('should try default ports when no port detected', async () => {
      vi.useRealTimers();
      const sandbox = createMockSandbox();
      sandbox.getPreviewLink.mockResolvedValue({ url: 'https://preview.test:4321' });

      const { getPreviewUrl } = await import('~/lib/services/daytona/devServerService');

      const result = await getPreviewUrl(sandbox as never, null);

      expect(result?.port).toBe(4321);
    });

    it('should return null when all ports fail', async () => {
      vi.useRealTimers();
      const sandbox = createMockSandbox();
      sandbox.getPreviewLink.mockRejectedValue(new Error('No ports available'));

      const { getPreviewUrl } = await import('~/lib/services/daytona/devServerService');

      const result = await getPreviewUrl(sandbox as never, null);

      expect(result).toBeNull();
    });
  });

  describe('checkDevLogForPort', () => {
    it('should extract port from dev log', async () => {
      vi.useRealTimers();
      const sandbox = createMockSandbox();
      sandbox.process.executeCommand.mockResolvedValue({
        exitCode: 0,
        result: 'Server running at localhost:5173',
      });

      const { checkDevLogForPort } = await import('~/lib/services/daytona/devServerService');

      const port = await checkDevLogForPort(sandbox as never, '/home/daytona');

      expect(port).toBe(5173);
    });

    it('should return null when no port in log', async () => {
      vi.useRealTimers();
      const sandbox = createMockSandbox();
      sandbox.process.executeCommand.mockResolvedValue({
        exitCode: 0,
        result: 'No log yet',
      });

      const { checkDevLogForPort } = await import('~/lib/services/daytona/devServerService');

      const port = await checkDevLogForPort(sandbox as never, '/home/daytona');

      expect(port).toBeNull();
    });
  });
});

