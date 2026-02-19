/**
 * Gretly Pipeline Tests
 *
 * Tests the deterministic site generation pipeline:
 * PLAN → GENERATE → VALIDATE → BUILD → REVIEW → (REFINE) → PUBLISH
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Pipeline, createPipeline, type PipelineConfig, type BusinessInfo, type TemplateInfo, type PlanResult, type GenerateResult, type PipelineResult } from '~/lib/gretly/pipeline';
import type { BuildResult } from '~/lib/gretly';

// Mock FlowOps
vi.mock('~/lib/flowops', () => ({
  getAgentRegistry: () => ({
    has: () => true,
    register: vi.fn(),
    send: vi.fn().mockResolvedValue({
      message: {
        content: JSON.stringify({
          approved: true,
          score: 8,
          confidence: 0.9,
          summary: 'Site meets requirements',
          categoryScores: {
            requirementMatching: 8,
            completeness: 8,
            brandAlignment: 8,
            technicalQuality: 8,
            uxDesign: 8,
          },
          issues: [],
          improvements: [],
        }),
      },
    }),
  }),
}));

vi.mock('~/lib/flowops/agents/fixer-agent', () => ({
  getFixerAgent: () => ({
    name: 'fixer',
    chat: vi.fn(),
  }),
}));

vi.mock('~/lib/flowops/agents/reviewer-agent', () => ({
  getReviewerAgent: () => ({
    name: 'reviewer',
    chat: vi.fn(),
  }),
  ReviewRequestSchema: {
    safeParse: () => ({ success: true }),
  },
}));

vi.mock('~/utils/logger', () => ({
  createScopedLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('Gretly Pipeline', () => {
  const mockBusinessInfo: BusinessInfo = {
    name: 'Test Business',
    description: 'A test business for unit tests',
    tagline: 'Testing made easy',
    services: ['Testing', 'Quality Assurance'],
  };

  const mockTemplate: TemplateInfo = {
    slug: 'test-template',
    name: 'Test Template',
  };

  const mockPlanResult: PlanResult = {
    success: true,
    modifications: [
      { path: 'src/pages/index.astro', instructions: 'Update hero section' },
      { path: 'src/components/Header.astro', instructions: 'Add business name' },
    ],
  };

  const mockFiles: Record<string, string> = {
    'src/pages/index.astro': '---\n---\n<html><body>Test</body></html>',
    'src/components/Header.astro': '<header>Header</header>',
  };

  const mockGenerateResult: GenerateResult = {
    success: true,
    files: mockFiles,
  };

  const mockBuildResult: BuildResult = {
    success: true,
    previewUrl: 'https://preview.test.com',
    sandboxId: 'sandbox-123',
  };

  // Mock functions
  let mockPlanFn: ReturnType<typeof vi.fn>;
  let mockGenerateFn: ReturnType<typeof vi.fn>;
  let mockBuildFn: ReturnType<typeof vi.fn>;
  let mockPublishFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPlanFn = vi.fn().mockResolvedValue(mockPlanResult);
    mockGenerateFn = vi.fn().mockResolvedValue(mockGenerateResult);
    mockBuildFn = vi.fn().mockResolvedValue(mockBuildResult);
    mockPublishFn = vi.fn().mockResolvedValue(undefined);
  });

  describe('createPipeline', () => {
    it('should create a Pipeline instance with default config', () => {
      const pipeline = createPipeline();
      expect(pipeline).toBeInstanceOf(Pipeline);
      expect(pipeline.getPhase()).toBe('idle');
    });

    it('should create a Pipeline instance with custom config', () => {
      const config: PipelineConfig = {
        maxRefineIterations: 5,
        approvalThreshold: 9,
        skipReview: true,
      };
      const pipeline = createPipeline(config);
      expect(pipeline).toBeInstanceOf(Pipeline);
    });
  });

  describe('Pipeline.run', () => {
    it('should execute all phases in order for a successful run', async () => {
      const phaseChanges: string[] = [];
      const pipeline = createPipeline({
        skipReview: true, // Skip review for simpler test
        onPhaseChange: (phase) => phaseChanges.push(phase),
      });

      const result = await pipeline.run(
        'test-project',
        mockBusinessInfo,
        mockTemplate,
        mockPlanFn,
        mockGenerateFn,
        mockBuildFn,
        mockPublishFn
      );

      expect(result.success).toBe(true);
      expect(result.files).toEqual(mockFiles);
      expect(result.refineIterations).toBe(0);

      // Verify phase order
      expect(phaseChanges).toContain('planning');
      expect(phaseChanges).toContain('generating');
      expect(phaseChanges).toContain('validating');
      expect(phaseChanges).toContain('building');
      expect(phaseChanges).toContain('publishing');
      expect(phaseChanges).toContain('complete');
    });

    it('should call planFn with correct parameters', async () => {
      const pipeline = createPipeline({ skipReview: true });

      await pipeline.run(
        'test-project',
        mockBusinessInfo,
        mockTemplate,
        mockPlanFn,
        mockGenerateFn,
        mockBuildFn,
        mockPublishFn
      );

      expect(mockPlanFn).toHaveBeenCalledWith(mockBusinessInfo, mockTemplate);
    });

    it('should call generateFn with plan result', async () => {
      const pipeline = createPipeline({ skipReview: true });

      await pipeline.run(
        'test-project',
        mockBusinessInfo,
        mockTemplate,
        mockPlanFn,
        mockGenerateFn,
        mockBuildFn,
        mockPublishFn
      );

      expect(mockGenerateFn).toHaveBeenCalledWith(
        mockPlanResult,
        undefined, // No previous files on first iteration
        undefined  // No feedback on first iteration
      );
    });

    it('should call buildFn with project ID and files', async () => {
      const pipeline = createPipeline({ skipReview: true });

      await pipeline.run(
        'test-project',
        mockBusinessInfo,
        mockTemplate,
        mockPlanFn,
        mockGenerateFn,
        mockBuildFn,
        mockPublishFn
      );

      expect(mockBuildFn).toHaveBeenCalledWith('test-project', mockFiles);
    });

    it('should call publishFn on success', async () => {
      const pipeline = createPipeline({ skipReview: true });

      await pipeline.run(
        'test-project',
        mockBusinessInfo,
        mockTemplate,
        mockPlanFn,
        mockGenerateFn,
        mockBuildFn,
        mockPublishFn
      );

      expect(mockPublishFn).toHaveBeenCalledWith('test-project', mockFiles);
    });

    it('should fail when planning fails', async () => {
      mockPlanFn.mockResolvedValue({ success: false, modifications: [], error: 'Planning error' });
      const pipeline = createPipeline({ skipReview: true });

      const result = await pipeline.run(
        'test-project',
        mockBusinessInfo,
        mockTemplate,
        mockPlanFn,
        mockGenerateFn,
        mockBuildFn,
        mockPublishFn
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Planning failed');
      expect(result.phases).toContain('failed');
      expect(mockGenerateFn).not.toHaveBeenCalled();
    });

    it('should fail when generation fails', async () => {
      mockGenerateFn.mockResolvedValue({ success: false, files: {}, error: 'Generation error' });
      const pipeline = createPipeline({ skipReview: true });

      const result = await pipeline.run(
        'test-project',
        mockBusinessInfo,
        mockTemplate,
        mockPlanFn,
        mockGenerateFn,
        mockBuildFn,
        mockPublishFn
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Generation failed');
      expect(mockBuildFn).not.toHaveBeenCalled();
    });

    it('should fail when build fails after self-healing', async () => {
      mockBuildFn.mockResolvedValue({ success: false, error: 'Build error' });
      const pipeline = createPipeline({ skipReview: true });

      const result = await pipeline.run(
        'test-project',
        mockBusinessInfo,
        mockTemplate,
        mockPlanFn,
        mockGenerateFn,
        mockBuildFn,
        mockPublishFn
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Build failed after self-healing');
      expect(mockPublishFn).not.toHaveBeenCalled();
    });

    it('should report progress through callback', async () => {
      const progressMessages: string[] = [];
      const pipeline = createPipeline({
        skipReview: true,
        onProgress: (_phase, message) => progressMessages.push(message),
      });

      await pipeline.run(
        'test-project',
        mockBusinessInfo,
        mockTemplate,
        mockPlanFn,
        mockGenerateFn,
        mockBuildFn,
        mockPublishFn
      );

      expect(progressMessages.length).toBeGreaterThan(0);
      expect(progressMessages.some(m => m.includes('plan'))).toBe(true);
    });
  });

  describe('Pipeline with Review', () => {
    it('should skip review when skipReview is true', async () => {
      const phaseChanges: string[] = [];
      const pipeline = createPipeline({
        skipReview: true,
        onPhaseChange: (phase) => phaseChanges.push(phase),
      });

      await pipeline.run(
        'test-project',
        mockBusinessInfo,
        mockTemplate,
        mockPlanFn,
        mockGenerateFn,
        mockBuildFn,
        mockPublishFn
      );

      expect(phaseChanges).not.toContain('reviewing');
    });

    it('should include review when skipReview is false', async () => {
      const phaseChanges: string[] = [];
      const pipeline = createPipeline({
        skipReview: false,
        onPhaseChange: (phase) => phaseChanges.push(phase),
      });

      await pipeline.run(
        'test-project',
        mockBusinessInfo,
        mockTemplate,
        mockPlanFn,
        mockGenerateFn,
        mockBuildFn,
        mockPublishFn
      );

      expect(phaseChanges).toContain('reviewing');
    });

    it('should provide review result in output', async () => {
      const pipeline = createPipeline({ skipReview: false });

      const result = await pipeline.run(
        'test-project',
        mockBusinessInfo,
        mockTemplate,
        mockPlanFn,
        mockGenerateFn,
        mockBuildFn,
        mockPublishFn
      );

      expect(result.success).toBe(true);
      expect(result.reviewResult).toBeDefined();
      expect(result.reviewResult?.approved).toBe(true);
      expect(result.reviewResult?.score).toBe(8);
    });
  });

  describe('Pipeline Refinement', () => {
    // Note: Refinement tests require the mock to be set up at module level
    // The global mock always returns approved: true, so refinement doesn't trigger
    // These tests verify the refinement logic exists in the pipeline

    it('should complete without refinement when review passes', async () => {
      // With the default mock (approved: true, score: 8), no refinement needed
      const pipeline = createPipeline({
        skipReview: false,
        approvalThreshold: 7,
        maxRefineIterations: 2,
      });

      const result = await pipeline.run(
        'test-project',
        mockBusinessInfo,
        mockTemplate,
        mockPlanFn,
        mockGenerateFn,
        mockBuildFn,
        mockPublishFn
      );

      expect(result.success).toBe(true);
      expect(result.refineIterations).toBe(0); // No refinement needed
      expect(mockGenerateFn).toHaveBeenCalledTimes(1); // Only initial generation
    });

    it('should include review result when review passes first time', async () => {
      const pipeline = createPipeline({
        skipReview: false,
        approvalThreshold: 7,
        maxRefineIterations: 2,
      });

      const result = await pipeline.run(
        'test-project',
        mockBusinessInfo,
        mockTemplate,
        mockPlanFn,
        mockGenerateFn,
        mockBuildFn,
        mockPublishFn
      );

      expect(result.success).toBe(true);
      expect(result.reviewResult).toBeDefined();
      expect(result.reviewResult?.approved).toBe(true);
    });
  });

  describe('Pipeline Error Handling', () => {
    it('should handle exceptions gracefully', async () => {
      mockPlanFn.mockRejectedValue(new Error('Unexpected error'));
      const pipeline = createPipeline({ skipReview: true });

      const result = await pipeline.run(
        'test-project',
        mockBusinessInfo,
        mockTemplate,
        mockPlanFn,
        mockGenerateFn,
        mockBuildFn,
        mockPublishFn
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error');
      expect(result.phases).toContain('failed');
    });

    it('should preserve generated files even when build fails', async () => {
      // Generate succeeds but build fails
      mockBuildFn.mockResolvedValue({ success: false, error: 'Build error' });
      const pipeline = createPipeline({ skipReview: true });

      const result = await pipeline.run(
        'test-project',
        mockBusinessInfo,
        mockTemplate,
        mockPlanFn,
        mockGenerateFn,
        mockBuildFn,
        mockPublishFn
      );

      expect(result.success).toBe(false);
      // Gretly preserves files through the build process, so they're available
      // even on failure (for debugging/retry purposes)
      expect(Object.keys(result.files).length).toBeGreaterThan(0);
    });
  });
});

describe('Gretly (Build Orchestrator)', () => {
  // These tests focus on the lower-level Gretly class
  // The Gretly class is tested through the Pipeline tests above
  // since Pipeline uses Gretly internally

  it('should be exported from gretly module', async () => {
    const { Gretly, createGretly } = await import('~/lib/gretly');
    expect(Gretly).toBeDefined();
    expect(createGretly).toBeDefined();
  });
});

