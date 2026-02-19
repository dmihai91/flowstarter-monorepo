/**
 * File Service Unit Tests
 *
 * Tests for file upload and synchronization to Daytona sandboxes.
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
const createMockSandbox = (overrides = {}) => ({
  id: 'sb-test-123',
  getWorkDir: vi.fn().mockResolvedValue('/home/daytona'),
  process: {
    executeCommand: vi.fn().mockResolvedValue({ exitCode: 0, result: '' }),
  },
  fs: {
    uploadFile: vi.fn().mockResolvedValue(undefined),
  },
  ...overrides,
});

describe('fileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadFiles', () => {
    it('should upload files with correct paths', async () => {
      const sandbox = createMockSandbox();

      const { uploadFiles } = await import('~/lib/services/daytona/fileService');

      await uploadFiles(sandbox as never, {
        'src/index.ts': 'console.log("hello")',
        'package.json': '{}',
      });

      expect(sandbox.fs.uploadFile).toHaveBeenCalledTimes(2);
      expect(sandbox.fs.uploadFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        '/home/daytona/src/index.ts'
      );
      expect(sandbox.fs.uploadFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        '/home/daytona/package.json'
      );
    });

    it('should normalize paths without leading slash', async () => {
      const sandbox = createMockSandbox();

      const { uploadFiles } = await import('~/lib/services/daytona/fileService');

      await uploadFiles(sandbox as never, {
        'src/app.ts': 'code',
      });

      expect(sandbox.fs.uploadFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        '/home/daytona/src/app.ts'
      );
    });

    it('should normalize paths with leading slash', async () => {
      const sandbox = createMockSandbox();

      const { uploadFiles } = await import('~/lib/services/daytona/fileService');

      await uploadFiles(sandbox as never, {
        '/src/app.ts': 'code',
      });

      expect(sandbox.fs.uploadFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        '/home/daytona/src/app.ts'
      );
    });

    it('should create directories before uploading files', async () => {
      const sandbox = createMockSandbox();

      const { uploadFiles } = await import('~/lib/services/daytona/fileService');

      await uploadFiles(sandbox as never, {
        'src/components/Button.tsx': 'export const Button = () => {}',
        'src/utils/helpers.ts': 'export const helper = () => {}',
      });

      // Should create directories first
      expect(sandbox.process.executeCommand).toHaveBeenCalledWith(
        expect.stringContaining('mkdir -p'),
        '/home/daytona'
      );
    });

    it('should handle empty files object', async () => {
      const sandbox = createMockSandbox();

      const { uploadFiles } = await import('~/lib/services/daytona/fileService');

      await uploadFiles(sandbox as never, {});

      expect(sandbox.fs.uploadFile).not.toHaveBeenCalled();
    });

    it('should use custom workdir when available', async () => {
      const sandbox = createMockSandbox({
        getWorkDir: vi.fn().mockResolvedValue('/custom/workdir'),
      });

      const { uploadFiles } = await import('~/lib/services/daytona/fileService');

      await uploadFiles(sandbox as never, {
        'index.ts': 'code',
      });

      expect(sandbox.fs.uploadFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        '/custom/workdir/index.ts'
      );
    });

    it('should fallback to default workdir when getWorkDir returns null', async () => {
      const sandbox = createMockSandbox({
        getWorkDir: vi.fn().mockResolvedValue(null),
      });

      const { uploadFiles } = await import('~/lib/services/daytona/fileService');

      await uploadFiles(sandbox as never, {
        'index.ts': 'code',
      });

      expect(sandbox.fs.uploadFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        '/home/daytona/index.ts'
      );
    });

    it('should handle upload failures gracefully', async () => {
      const sandbox = createMockSandbox();
      sandbox.fs.uploadFile
        .mockResolvedValueOnce(undefined) // First file succeeds
        .mockRejectedValueOnce(new Error('Upload failed')); // Second file fails

      const { uploadFiles } = await import('~/lib/services/daytona/fileService');

      // Should not throw, just log error
      await expect(
        uploadFiles(sandbox as never, {
          'file1.ts': 'content1',
          'file2.ts': 'content2',
        })
      ).resolves.not.toThrow();
    });

    it('should upload files in batches with concurrency limit', async () => {
      const sandbox = createMockSandbox();
      const files: Record<string, string> = {};

      // Create 12 files to test batching (concurrency limit is 5)
      for (let i = 0; i < 12; i++) {
        files[`file${i}.ts`] = `content ${i}`;
      }

      const { uploadFiles } = await import('~/lib/services/daytona/fileService');

      await uploadFiles(sandbox as never, files);

      // All files should be uploaded
      expect(sandbox.fs.uploadFile).toHaveBeenCalledTimes(12);
    });

    it('should convert file content to Buffer', async () => {
      const sandbox = createMockSandbox();

      const { uploadFiles } = await import('~/lib/services/daytona/fileService');

      await uploadFiles(sandbox as never, {
        'test.ts': 'const x = 1;',
      });

      const [buffer] = sandbox.fs.uploadFile.mock.calls[0];
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.toString('utf-8')).toBe('const x = 1;');
    });

    it('should handle nested directory structures', async () => {
      const sandbox = createMockSandbox();

      const { uploadFiles } = await import('~/lib/services/daytona/fileService');

      await uploadFiles(sandbox as never, {
        'src/components/ui/Button/index.tsx': 'button code',
        'src/components/ui/Button/styles.css': 'button styles',
        'src/lib/utils/format/date.ts': 'date utils',
      });

      // Check mkdir command contains all directories
      const mkdirCall = sandbox.process.executeCommand.mock.calls.find((call) =>
        call[0].includes('mkdir -p')
      );
      expect(mkdirCall).toBeDefined();
      expect(mkdirCall?.[0]).toContain('/home/daytona/src/components/ui/Button');
      expect(mkdirCall?.[0]).toContain('/home/daytona/src/lib/utils/format');
    });
  });
});

