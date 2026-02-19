/**
 * Bun Service Unit Tests
 *
 * Tests for bun runtime detection, installation, and dependency management.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

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
const createMockSandbox = (commandResults: Record<string, { exitCode: number; result: string }> = {}) => {
  const defaultResult = { exitCode: 0, result: '' };

  return {
    id: 'sb-test-123',
    process: {
      executeCommand: vi.fn().mockImplementation((command: string) => {
        // Match command patterns to return appropriate results
        for (const [pattern, result] of Object.entries(commandResults)) {
          if (command.includes(pattern)) {
            return Promise.resolve(result);
          }
        }
        return Promise.resolve(defaultResult);
      }),
    },
  };
};

describe('bunService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkBunAvailable', () => {
    it('should return true when bun is available', async () => {
      const sandbox = createMockSandbox({
        'bun --version': { exitCode: 0, result: '1.1.0' },
      });

      const { checkBunAvailable } = await import('~/lib/services/daytona/bunService');

      const result = await checkBunAvailable(sandbox as never, '/home/daytona');

      expect(result).toBe(true);
    });

    it('should return false when bun is not found', async () => {
      const sandbox = createMockSandbox({
        'bun --version': { exitCode: 0, result: 'bun not found' },
      });

      const { checkBunAvailable } = await import('~/lib/services/daytona/bunService');

      const result = await checkBunAvailable(sandbox as never, '/home/daytona');

      expect(result).toBe(false);
    });

    it('should return false when command fails', async () => {
      const sandbox = createMockSandbox({
        'bun --version': { exitCode: 1, result: '' },
      });

      const { checkBunAvailable } = await import('~/lib/services/daytona/bunService');

      const result = await checkBunAvailable(sandbox as never, '/home/daytona');

      expect(result).toBe(false);
    });
  });

  describe('installBun', () => {
    it('should install bun using curl method', async () => {
      const sandbox = createMockSandbox({
        'curl -fsSL': { exitCode: 0, result: 'Installation successful' },
        'bun --version': { exitCode: 0, result: '1.1.0' },
      });

      const { installBun } = await import('~/lib/services/daytona/bunService');

      const result = await installBun(sandbox as never, '/home/daytona');

      expect(result).toBe(true);
    });

    it('should try wget if curl fails', async () => {
      const executionOrder: string[] = [];
      const sandbox = {
        process: {
          executeCommand: vi.fn().mockImplementation((command: string) => {
            if (command.includes('curl')) {
              executionOrder.push('curl');
              return Promise.resolve({ exitCode: 1, result: 'curl failed' });
            }
            if (command.includes('wget')) {
              executionOrder.push('wget');
              return Promise.resolve({ exitCode: 0, result: '' });
            }
            if (command.includes('bun --version')) {
              return Promise.resolve({ exitCode: 0, result: '1.1.0' });
            }
            return Promise.resolve({ exitCode: 0, result: '' });
          }),
        },
      };

      const { installBun } = await import('~/lib/services/daytona/bunService');

      const result = await installBun(sandbox as never, '/home/daytona');

      expect(result).toBe(true);
      expect(executionOrder).toContain('curl');
      expect(executionOrder).toContain('wget');
    });

    it('should try direct-zip method as fallback', async () => {
      const sandbox = {
        process: {
          executeCommand: vi.fn().mockImplementation((command: string) => {
            if (command.includes('curl') && command.includes('bun.sh/install')) {
              return Promise.resolve({ exitCode: 1, result: 'failed' });
            }
            if (command.includes('wget')) {
              return Promise.resolve({ exitCode: 1, result: 'failed' });
            }
            if (command.includes('bun-linux-x64.zip')) {
              return Promise.resolve({ exitCode: 0, result: '' });
            }
            if (command.includes('bun --version')) {
              return Promise.resolve({ exitCode: 0, result: '1.1.0' });
            }
            return Promise.resolve({ exitCode: 0, result: '' });
          }),
        },
      };

      const { installBun } = await import('~/lib/services/daytona/bunService');

      const result = await installBun(sandbox as never, '/home/daytona');

      expect(result).toBe(true);
    });

    it('should return false when all installation methods fail', async () => {
      const sandbox = {
        process: {
          executeCommand: vi.fn().mockResolvedValue({ exitCode: 1, result: 'failed' }),
        },
      };

      const { installBun } = await import('~/lib/services/daytona/bunService');

      const result = await installBun(sandbox as never, '/home/daytona');

      expect(result).toBe(false);
    });

    it('should verify installation after successful install', async () => {
      const verifyCallCount = { count: 0 };
      const sandbox = {
        process: {
          executeCommand: vi.fn().mockImplementation((command: string) => {
            if (command.includes('curl -fsSL')) {
              return Promise.resolve({ exitCode: 0, result: '' });
            }
            if (command.includes('bun --version')) {
              verifyCallCount.count++;
              return Promise.resolve({ exitCode: 0, result: '1.1.0' });
            }
            return Promise.resolve({ exitCode: 0, result: '' });
          }),
        },
      };

      const { installBun } = await import('~/lib/services/daytona/bunService');

      await installBun(sandbox as never, '/home/daytona');

      // Should verify bun version after installation
      expect(verifyCallCount.count).toBeGreaterThan(0);
    });
  });

  describe('bunInstall', () => {
    it('should run bun install successfully', async () => {
      const sandbox = createMockSandbox({
        'bun install': { exitCode: 0, result: 'Installed 50 packages' },
      });

      const { bunInstall } = await import('~/lib/services/daytona/bunService');

      const result = await bunInstall(sandbox as never, '/home/daytona');

      expect(result).toBe(true);
      expect(sandbox.process.executeCommand).toHaveBeenCalledWith(
        expect.stringContaining('bun install'),
        '/home/daytona',
        undefined,
        180
      );
    });

    it('should return false when bun install fails', async () => {
      const sandbox = createMockSandbox({
        'bun install': { exitCode: 1, result: 'Error: Package not found' },
      });

      const { bunInstall } = await import('~/lib/services/daytona/bunService');

      const result = await bunInstall(sandbox as never, '/home/daytona');

      expect(result).toBe(false);
    });

    it('should set up bun path before running install', async () => {
      const sandbox = createMockSandbox({
        'bun install': { exitCode: 0, result: '' },
      });

      const { bunInstall } = await import('~/lib/services/daytona/bunService');

      await bunInstall(sandbox as never, '/home/daytona');

      const installCall = sandbox.process.executeCommand.mock.calls.find((call) =>
        call[0].includes('bun install')
      );
      expect(installCall?.[0]).toContain('BUN_INSTALL');
      expect(installCall?.[0]).toContain('PATH');
    });
  });

  describe('getBunPathSetup', () => {
    it('should return correct bun path setup command', async () => {
      const { getBunPathSetup } = await import('~/lib/services/daytona/bunService');

      const pathSetup = getBunPathSetup();

      expect(pathSetup).toContain('BUN_INSTALL');
      expect(pathSetup).toContain('$HOME/.bun');
      expect(pathSetup).toContain('PATH');
      expect(pathSetup.endsWith(' && ')).toBe(true);
    });
  });
});

