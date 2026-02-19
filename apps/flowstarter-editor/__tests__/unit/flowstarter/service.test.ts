/**
 * Flowstarter Service Unit Tests
 *
 * Tests for the high-level integration service that combines:
 * - Gretly orchestrator
 * - Daytona sandbox builds
 * - Full pipeline execution
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import type { FlowstarterInput, FlowstarterOptions, FlowstarterResult } from '~/lib/flowstarter/service';

// Mock Gretly orchestrator
const mockGretlyRun = vi.fn();
const mockCreateGretly = vi.fn(() => ({
  run: mockGretlyRun,
  getPhase: vi.fn().mockReturnValue('idle'),
}));

vi.mock('~/lib/gretly/orchestrator', () => ({
  createGretly: (...args: Parameters<typeof mockCreateGretly>) => mockCreateGretly(...args),
  Gretly: class MockGretly {},
}));

// Mock gretlyEngine (which is what service.ts actually imports)
vi.mock('~/lib/gretly/gretlyEngine', () => ({
  createGretly: (...args: Parameters<typeof mockCreateGretly>) => mockCreateGretly(...args),
}));

// Mock Daytona service
const mockStartPreview = vi.fn();
const mockPrewarmSandbox = vi.fn();
const mockStartPreviewWithPrewarmedSandbox = vi.fn();

vi.mock('~/lib/services/daytonaService.server', () => ({
  startPreview: (...args: unknown[]) => mockStartPreview(...args),
  prewarmSandbox: (...args: unknown[]) => mockPrewarmSandbox(...args),
  startPreviewWithPrewarmedSandbox: (...args: unknown[]) => mockStartPreviewWithPrewarmedSandbox(...args),
}));

// Mock logger
vi.mock('~/utils/logger', () => ({
  createScopedLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock i18n
vi.mock('~/lib/i18n/editor-labels', () => ({
  EDITOR_LABEL_KEYS: {},
  t: (key: string) => key,
}));

describe('Flowstarter Service', () => {
  // Import service module once - mocks are already in place
  let generateSite: typeof import('~/lib/flowstarter/service').generateSite;
  let generateSiteQuick: typeof import('~/lib/flowstarter/service').generateSiteQuick;
  let prewarmEnvironment: typeof import('~/lib/flowstarter/service').prewarmEnvironment;

  const mockInput: FlowstarterInput = {
    projectId: 'test-project-123',
    siteName: 'Test Site',
    businessInfo: {
      name: 'Test Business',
      description: 'A test business for unit tests',
      tagline: 'Testing made easy',
      services: ['Testing', 'Quality Assurance'],
      targetAudience: 'Developers',
      businessGoals: ['Increase testing coverage'],
      brandTone: 'professional',
    },
    template: {
      slug: 'test-template',
      name: 'Test Template',
      files: {
        'src/pages/index.astro': '---\n---\n<html><body>Hello</body></html>',
      },
    },
    design: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1F2937',
      fontFamily: 'Inter',
    },
  };

  const mockGretlyResult = {
    success: true,
    files: {
      'src/pages/index.astro': '---\n---\n<html><body>Generated</body></html>',
    },
    previewUrl: 'https://preview.daytona.io/test-123',
    sandboxId: 'sandbox-abc',
    reviewScore: 8,
    reviewSummary: 'Site meets requirements',
    fixAttempts: 0,
    refineIterations: 0,
    phases: ['planning', 'generating', 'building', 'reviewing', 'publishing', 'complete'],
  };

  beforeAll(async () => {
    // Import service after mocks are set up
    const service = await import('~/lib/flowstarter/service');
    generateSite = service.generateSite;
    generateSiteQuick = service.generateSiteQuick;
    prewarmEnvironment = service.prewarmEnvironment;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockGretlyRun.mockResolvedValue(mockGretlyResult);
    // Reset mock implementations to default
    mockCreateGretly.mockImplementation(() => ({
      run: mockGretlyRun,
      getPhase: vi.fn().mockReturnValue('idle'),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSite', () => {
    it('should successfully generate a site', async () => {
      const result = await generateSite(mockInput);

      expect(result.success).toBe(true);
      expect(result.files).toBeDefined();
      expect(Object.keys(result.files).length).toBeGreaterThan(0);
      expect(result.previewUrl).toBe('https://preview.daytona.io/test-123');
    });

    it('should create Gretly with correct config', async () => {
      const options: FlowstarterOptions = {
        skipReview: true,
        maxFixAttempts: 5,
        maxRefineIterations: 3,
        approvalThreshold: 8,
      };

      await generateSite(mockInput, options);

      expect(mockCreateGretly).toHaveBeenCalledWith(
        expect.objectContaining({
          skipReview: true,
          maxFixAttempts: 5,
          maxRefineIterations: 3,
          approvalThreshold: 8,
        })
      );
    });

    it('should use default options when none provided', async () => {
      await generateSite(mockInput);

      expect(mockCreateGretly).toHaveBeenCalledWith(
        expect.objectContaining({
          skipReview: false,
          maxFixAttempts: 3,
          maxRefineIterations: 2,
          approvalThreshold: 7,
        })
      );
    });

    it('should call progress callback', async () => {
      const progressCallback = vi.fn();

      // Get the config passed to createGretly and trigger progress
      mockCreateGretly.mockImplementation(((config: { onProgress?: (phase: string, message: string, progress: number) => void }) => {
        // Simulate progress callbacks
        if (config.onProgress) {
          config.onProgress('planning', 'Starting planning...', 10);
          config.onProgress('generating', 'Generating code...', 50);
        }
        return { run: mockGretlyRun, getPhase: vi.fn().mockReturnValue('idle') };
      }) as typeof mockCreateGretly);

      await generateSite(mockInput, { onProgress: progressCallback });

      expect(progressCallback).toHaveBeenCalled();
    });

    it('should handle Gretly failures gracefully', async () => {
      mockGretlyRun.mockResolvedValue({
        success: false,
        files: {},
        error: 'Planning failed',
        fixAttempts: 0,
        refineIterations: 0,
        phases: ['planning', 'failed'],
      });

      const result = await generateSite(mockInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Planning failed');
      expect(result.phases).toContain('failed');
    });

    it('should handle exceptions gracefully', async () => {
      mockGretlyRun.mockRejectedValue(new Error('Network error'));

      const result = await generateSite(mockInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.phases).toContain('failed');
    });

    it('should pass project ID and template info to Gretly', async () => {
      await generateSite(mockInput);

      // The run function should be called with correct input
      expect(mockGretlyRun).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'test-project-123',
          template: expect.objectContaining({
            slug: 'test-template',
            name: 'Test Template',
          }),
        }),
        expect.any(Function), // buildFn
        expect.any(Function)  // publishFn
      );
    });

    it('should return review metrics when review is enabled', async () => {
      const result = await generateSite(mockInput, { skipReview: false });

      expect(result.reviewScore).toBe(8);
      expect(result.reviewSummary).toBe('Site meets requirements');
    });

    it('should track fix attempts and refine iterations', async () => {
      mockGretlyRun.mockResolvedValue({
        ...mockGretlyResult,
        fixAttempts: 2,
        refineIterations: 1,
      });

      const result = await generateSite(mockInput);

      expect(result.fixAttempts).toBe(2);
      expect(result.refineIterations).toBe(1);
    });
  });

  describe('generateSiteQuick', () => {
    it('should call generateSite with skipReview true', async () => {
      await generateSiteQuick(mockInput);

      expect(mockCreateGretly).toHaveBeenCalledWith(
        expect.objectContaining({
          skipReview: true,
          maxRefineIterations: 0,
        })
      );
    });

    it('should preserve other options', async () => {
      await generateSiteQuick(mockInput, { maxFixAttempts: 5 });

      expect(mockCreateGretly).toHaveBeenCalledWith(
        expect.objectContaining({
          skipReview: true,
          maxRefineIterations: 0,
          maxFixAttempts: 5,
        })
      );
    });
  });

  describe('prewarmEnvironment', () => {
    it('should call prewarmSandbox with project ID', async () => {
      mockPrewarmSandbox.mockResolvedValue({
        sandboxId: 'prewarmed-sandbox-123',
        workspace: {},
      });

      const result = await prewarmEnvironment('test-project');

      expect(mockPrewarmSandbox).toHaveBeenCalledWith('test-project');
      expect(result).toBeDefined();
      expect(result?.sandboxId).toBe('prewarmed-sandbox-123');
    });

    it('should handle null response', async () => {
      mockPrewarmSandbox.mockResolvedValue(null);

      const result = await prewarmEnvironment('test-project');

      expect(result).toBeNull();
    });
  });

  describe('Build Function Integration', () => {
    it('should use prewarmed sandbox when available', async () => {
      const prewarmedSandbox = {
        sandboxId: 'prewarmed-123',
        hasBun: true,
      };

      mockStartPreviewWithPrewarmedSandbox.mockResolvedValue({
        success: true,
        previewUrl: 'https://preview.test.com',
        sandboxId: 'prewarmed-123',
      });

      // Capture the buildFn passed to Gretly
      type BuildFn = (projectId: string, files: Record<string, string>) => Promise<unknown>;
      let capturedBuildFn: BuildFn | undefined;
      mockGretlyRun.mockImplementation((input: unknown, buildFn: BuildFn) => {
        capturedBuildFn = buildFn;
        return Promise.resolve(mockGretlyResult);
      });

      await generateSite(mockInput, { prewarmedSandbox });

      // Call the captured buildFn to verify it uses prewarmed sandbox
      if (capturedBuildFn) {
        await (capturedBuildFn as BuildFn)('test-project', { 'index.html': '<html></html>' });
        expect(mockStartPreviewWithPrewarmedSandbox).toHaveBeenCalled();
        expect(mockStartPreview).not.toHaveBeenCalled();
      }
    });

    it('should fall back to startPreview when no prewarmed sandbox', async () => {
      mockStartPreview.mockResolvedValue({
        success: true,
        previewUrl: 'https://preview.test.com',
        sandboxId: 'new-sandbox-456',
      });

      // Capture the buildFn passed to Gretly
      type BuildFn = (projectId: string, files: Record<string, string>) => Promise<unknown>;
      let capturedBuildFn: BuildFn | undefined;
      mockGretlyRun.mockImplementation((input: unknown, buildFn: BuildFn) => {
        capturedBuildFn = buildFn;
        return Promise.resolve(mockGretlyResult);
      });

      await generateSite(mockInput); // No prewarmedSandbox

      // Call the captured buildFn
      if (capturedBuildFn) {
        await (capturedBuildFn as BuildFn)('test-project', { 'index.html': '<html></html>' });
        expect(mockStartPreview).toHaveBeenCalled();
        expect(mockStartPreviewWithPrewarmedSandbox).not.toHaveBeenCalled();
      }
    });

    it('should return build error details when build fails', async () => {
      mockStartPreview.mockResolvedValue({
        success: false,
        error: 'Build failed',
        buildError: {
          file: 'src/index.astro',
          line: '5',
          message: 'Syntax error',
          fullOutput: 'Error: Syntax error at line 5...',
        },
      });

      // Capture the buildFn passed to Gretly
      type BuildFn = (projectId: string, files: Record<string, string>) => Promise<unknown>;
      let capturedBuildFn: BuildFn | undefined;
      mockGretlyRun.mockImplementation((input: unknown, buildFn: BuildFn) => {
        capturedBuildFn = buildFn;
        return Promise.resolve(mockGretlyResult);
      });

      await generateSite(mockInput);

      // Call the captured buildFn
      if (capturedBuildFn) {
        const buildResult = await (capturedBuildFn as BuildFn)('test-project', {}) as {
          success: boolean;
          buildError?: { file: string; message: string };
        };
        expect(buildResult.success).toBe(false);
        expect(buildResult.buildError).toBeDefined();
        expect(buildResult.buildError?.file).toBe('src/index.astro');
        expect(buildResult.buildError?.message).toBe('Syntax error');
      }
    });
  });
});

