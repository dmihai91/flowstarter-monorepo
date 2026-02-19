/**
 * Gretly Engine (Orchestrator) Tests
 *
 * Tests the three-tier agent orchestrator:
 * - PlannerAgent (Opus 4.5): Planning, review, escalation
 * - CodeGeneratorAgent (Kimi K2): Fast code generation
 * - FixerAgent (Sonnet 4): Error fixing
 *
 * Pipeline Flow:
 * PLAN → GENERATE → BUILD → FIX (loop) → REVIEW → REFINE (loop) → ESCALATE/PUBLISH
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  Gretly,
  createGretly,
  type GretlyConfig,
  type GretlyInput,
  type GretlyResult,
  type GretlyPhase,
  type BusinessInfo,
  type TemplateInfo,
  type DesignInfo,
  type GretlyDataFetcher,
} from '~/lib/gretly/gretlyEngine';
import type { BuildErrorDTO } from '~/lib/flowops/schema';

// Mock the FlowOps registry
const mockRegistrySend = vi.fn();
vi.mock('~/lib/flowops', () => ({
  getAgentRegistry: () => ({
    has: vi.fn().mockReturnValue(false),
    register: vi.fn(),
    send: mockRegistrySend,
  }),
}));

// Mock the agents
vi.mock('~/lib/flowstarter/agents/planner-agent', () => ({
  getPlannerAgent: () => ({
    name: 'planner',
    chat: vi.fn(),
  }),
}));

vi.mock('~/lib/flowstarter/agents/code-generator-agent', () => ({
  getCodeGeneratorAgent: () => ({
    name: 'code-generator',
    chat: vi.fn(),
  }),
}));

vi.mock('~/lib/flowstarter/agents/fixer-agent', () => ({
  getFixerAgent: () => ({
    name: 'fixer',
    chat: vi.fn(),
  }),
}));

vi.mock('~/utils/logger', () => ({
  createScopedLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('~/lib/i18n/editor-labels', () => ({
  EDITOR_LABEL_KEYS: {
    ORCH_FETCHING_PROJECT: 'ORCH_FETCHING_PROJECT',
    ORCH_PLANNER_CREATING_PLAN: 'ORCH_PLANNER_CREATING_PLAN',
    ORCH_CODE_GENERATING: 'ORCH_CODE_GENERATING',
    ORCH_CODE_REFINING: 'ORCH_CODE_REFINING',
    ORCH_BUILDING_SITE: 'ORCH_BUILDING_SITE',
    ORCH_FIXER_FIXING: 'ORCH_FIXER_FIXING',
    ORCH_RETRYING_BUILD: 'ORCH_RETRYING_BUILD',
    ORCH_PLANNER_ANALYZING: 'ORCH_PLANNER_ANALYZING',
    ORCH_BUILD_FAILED_MAX: 'ORCH_BUILD_FAILED_MAX',
    ORCH_BUILD_FAILED: 'ORCH_BUILD_FAILED',
    ORCH_PLANNER_REVIEWING: 'ORCH_PLANNER_REVIEWING',
    ORCH_MAX_REFINE_REACHED: 'ORCH_MAX_REFINE_REACHED',
    ORCH_PREPARING_REFINEMENT: 'ORCH_PREPARING_REFINEMENT',
    ORCH_PUBLISHING_SITE: 'ORCH_PUBLISHING_SITE',
    ORCH_GENERATION_COMPLETE: 'ORCH_GENERATION_COMPLETE',
  },
  t: (key: string) => key,
}));

describe('Gretly Engine (Orchestrator)', () => {
  const mockBusinessInfo: BusinessInfo = {
    name: 'Test Business',
    description: 'A test business for unit testing',
    tagline: 'Testing made simple',
    services: ['Web Development', 'Testing'],
    targetAudience: 'Developers',
    businessGoals: ['Increase testing coverage'],
    brandTone: 'Professional',
  };

  const mockTemplate: TemplateInfo = {
    slug: 'test-template',
    name: 'Test Template',
  };

  const mockDesign: DesignInfo = {
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    accentColor: '#10B981',
    fontFamily: 'Inter',
  };

  const mockInput: GretlyInput = {
    projectId: 'test-project-123',
    businessInfo: mockBusinessInfo,
    template: mockTemplate,
    design: mockDesign,
  };

  const mockFiles: Record<string, string> = {
    'src/pages/index.astro': '---\n---\n<html><body>Test</body></html>',
    'src/components/Header.astro': '<header>Header</header>',
    'src/styles/global.css': 'body { margin: 0; }',
  };

  const mockPlanResponse = {
    type: 'plan' as const,
    result: {
      success: true,
      modifications: [
        { path: 'src/pages/index.astro', instructions: 'Update hero section with business info' },
        { path: 'src/components/Header.astro', instructions: 'Add business name and navigation' },
      ],
      contentGuidelines: {
        tone: 'Professional',
        keywords: ['testing', 'development'],
      },
    },
  };

  const mockGenerateResponse = {
    success: true,
    files: mockFiles,
  };

  const mockReviewResponse = {
    type: 'review' as const,
    result: {
      approved: true,
      score: 8,
      summary: 'Site meets all requirements',
      improvements: [],
    },
  };

  const mockBuildSuccess = {
    success: true,
    previewUrl: 'https://preview.test.com',
    sandboxId: 'sandbox-123',
  };

  let mockBuildFn: ReturnType<typeof vi.fn>;
  let mockPublishFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockBuildFn = vi.fn().mockResolvedValue(mockBuildSuccess);
    mockPublishFn = vi.fn().mockResolvedValue(undefined);

    // Setup default registry responses
    mockRegistrySend.mockImplementation(async (agentName: string, _message: string) => {
      switch (agentName) {
        case 'planner':
          return { message: { content: JSON.stringify(mockPlanResponse) } };
        case 'code-generator':
          return { message: { content: JSON.stringify(mockGenerateResponse) } };
        case 'fixer':
          return { message: { content: JSON.stringify({ success: true, fixedContent: 'fixed content', summary: 'Fixed error' }) } };
        default:
          return { message: { content: '{}' } };
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createGretly', () => {
    it('should create a Gretly instance with default config', () => {
      const gretly = createGretly();
      expect(gretly).toBeInstanceOf(Gretly);
      expect(gretly.getPhase()).toBe('idle');
    });

    it('should create a Gretly instance with custom config', () => {
      const config: GretlyConfig = {
        maxFixAttempts: 5,
        maxRefineIterations: 3,
        approvalThreshold: 8,
        skipReview: true,
      };
      const gretly = createGretly(config);
      expect(gretly).toBeInstanceOf(Gretly);
    });
  });

  describe('Gretly.getPhase', () => {
    it('should return idle phase initially', () => {
      const gretly = createGretly();
      expect(gretly.getPhase()).toBe('idle');
    });
  });

  describe('Gretly.run - Success Path', () => {
    it('should execute complete pipeline successfully', async () => {
      const phaseChanges: GretlyPhase[] = [];
      const gretly = createGretly({
        skipReview: true,
        onPhaseChange: (phase) => phaseChanges.push(phase),
      });

      const result = await gretly.run(mockInput, mockBuildFn, mockPublishFn);

      expect(result.success).toBe(true);
      expect(result.files).toEqual(mockFiles);
      expect(result.fixAttempts).toBe(0);
      expect(result.refineIterations).toBe(0);

      // Verify phase progression
      expect(phaseChanges).toContain('planning');
      expect(phaseChanges).toContain('generating');
      expect(phaseChanges).toContain('building');
      expect(phaseChanges).toContain('publishing');
      expect(phaseChanges).toContain('complete');
    });

    it('should call planner agent for planning', async () => {
      const gretly = createGretly({ skipReview: true });
      await gretly.run(mockInput, mockBuildFn, mockPublishFn);

      expect(mockRegistrySend).toHaveBeenCalledWith(
        'planner',
        expect.stringContaining('"type":"plan"')
      );
    });

    it('should call code-generator agent for generation', async () => {
      const gretly = createGretly({ skipReview: true });
      await gretly.run(mockInput, mockBuildFn, mockPublishFn);

      expect(mockRegistrySend).toHaveBeenCalledWith(
        'code-generator',
        expect.stringContaining('"type":"generate"')
      );
    });

    it('should call build function with project ID and files', async () => {
      const gretly = createGretly({ skipReview: true });
      await gretly.run(mockInput, mockBuildFn, mockPublishFn);

      expect(mockBuildFn).toHaveBeenCalledWith(mockInput.projectId, mockFiles);
    });

    it('should call publish function on success', async () => {
      const gretly = createGretly({ skipReview: true });
      await gretly.run(mockInput, mockBuildFn, mockPublishFn);

      expect(mockPublishFn).toHaveBeenCalledWith(mockInput.projectId, mockFiles);
    });

    it('should report progress through callback', async () => {
      const progressMessages: Array<{ phase: GretlyPhase; message: string; progress?: number }> = [];
      const gretly = createGretly({
        skipReview: true,
        onProgress: (phase, message, progress) => {
          progressMessages.push({ phase, message, progress });
        },
      });

      await gretly.run(mockInput, mockBuildFn, mockPublishFn);

      expect(progressMessages.length).toBeGreaterThan(0);
      expect(progressMessages.some((p) => p.phase === 'planning')).toBe(true);
      expect(progressMessages.some((p) => p.phase === 'generating')).toBe(true);
    });
  });

  describe('Gretly.run - Review Flow', () => {
    it('should include review when skipReview is false', async () => {
      // Setup planner to return review response on second call
      let callCount = 0;
      mockRegistrySend.mockImplementation(async (agentName: string) => {
        if (agentName === 'planner') {
          callCount++;
          if (callCount === 1) {
            return { message: { content: JSON.stringify(mockPlanResponse) } };
          }
          return { message: { content: JSON.stringify(mockReviewResponse) } };
        }
        return { message: { content: JSON.stringify(mockGenerateResponse) } };
      });

      const phaseChanges: GretlyPhase[] = [];
      const gretly = createGretly({
        skipReview: false,
        onPhaseChange: (phase) => phaseChanges.push(phase),
      });

      const result = await gretly.run(mockInput, mockBuildFn, mockPublishFn);

      expect(result.success).toBe(true);
      expect(phaseChanges).toContain('reviewing');
      expect(result.reviewScore).toBe(8);
    });

    it('should skip review when skipReview is true', async () => {
      const phaseChanges: GretlyPhase[] = [];
      const gretly = createGretly({
        skipReview: true,
        onPhaseChange: (phase) => phaseChanges.push(phase),
      });

      await gretly.run(mockInput, mockBuildFn, mockPublishFn);

      expect(phaseChanges).not.toContain('reviewing');
    });
  });

  describe('Gretly.run - Self-Healing (Fixer Agent)', () => {
    it('should call fixer agent when build fails with error', async () => {
      const buildError: BuildErrorDTO = {
        file: 'src/pages/index.astro',
        message: 'Syntax error',
        line: '10',
        fullOutput: 'Error: Syntax error at line 10',
      };

      // First build fails, second succeeds
      mockBuildFn
        .mockResolvedValueOnce({ success: false, buildError })
        .mockResolvedValueOnce(mockBuildSuccess);

      const gretly = createGretly({ skipReview: true, maxFixAttempts: 3 });
      const result = await gretly.run(mockInput, mockBuildFn, mockPublishFn);

      expect(result.success).toBe(true);
      expect(result.fixAttempts).toBe(1);
      expect(mockRegistrySend).toHaveBeenCalledWith(
        'fixer',
        expect.stringContaining('"error":"Syntax error"')
      );
    });

    it('should retry build after fix', async () => {
      const buildError: BuildErrorDTO = {
        file: 'src/pages/index.astro',
        message: 'Type error',
        line: '5',
        fullOutput: 'Type error at line 5',
      };

      mockBuildFn
        .mockResolvedValueOnce({ success: false, buildError })
        .mockResolvedValueOnce(mockBuildSuccess);

      const gretly = createGretly({ skipReview: true });
      await gretly.run(mockInput, mockBuildFn, mockPublishFn);

      // Build should be called twice
      expect(mockBuildFn).toHaveBeenCalledTimes(2);
    });

    it('should fail after max fix attempts', async () => {
      const buildError: BuildErrorDTO = {
        file: 'src/pages/index.astro',
        message: 'Persistent error',
        line: '1',
        fullOutput: 'Error that cannot be fixed',
      };

      // Always fail
      mockBuildFn.mockResolvedValue({ success: false, buildError });

      // Mock fixer to always succeed (but build keeps failing)
      mockRegistrySend.mockImplementation(async (agentName: string) => {
        if (agentName === 'planner') {
          return { message: { content: JSON.stringify(mockPlanResponse) } };
        }
        if (agentName === 'fixer') {
          return { message: { content: JSON.stringify({ success: true, fixedContent: 'attempted fix', summary: 'Tried to fix' }) } };
        }
        return { message: { content: JSON.stringify(mockGenerateResponse) } };
      });

      const gretly = createGretly({ skipReview: true, maxFixAttempts: 2 });
      const result = await gretly.run(mockInput, mockBuildFn, mockPublishFn);

      expect(result.success).toBe(false);
      expect(result.phases).toContain('failed');
    });
  });

  describe('Gretly.run - Refinement Flow', () => {
    it('should refine when review rejects output', async () => {
      const rejectedReview = {
        type: 'review' as const,
        result: {
          approved: false,
          score: 5,
          summary: 'Needs improvement',
          improvements: [
            { file: 'src/pages/index.astro', instruction: 'Add more content', priority: 'must-fix' as const },
          ],
        },
      };

      const approvedReview = {
        type: 'review' as const,
        result: {
          approved: true,
          score: 8,
          summary: 'Good now',
          improvements: [],
        },
      };

      let plannerCallCount = 0;
      let generatorCallCount = 0;

      mockRegistrySend.mockImplementation(async (agentName: string) => {
        if (agentName === 'planner') {
          plannerCallCount++;
          if (plannerCallCount === 1) {
            return { message: { content: JSON.stringify(mockPlanResponse) } };
          } else if (plannerCallCount === 2) {
            return { message: { content: JSON.stringify(rejectedReview) } };
          } else {
            return { message: { content: JSON.stringify(approvedReview) } };
          }
        }
        if (agentName === 'code-generator') {
          generatorCallCount++;
          return { message: { content: JSON.stringify(mockGenerateResponse) } };
        }
        return { message: { content: '{}' } };
      });

      const gretly = createGretly({
        skipReview: false,
        maxRefineIterations: 2,
        approvalThreshold: 7,
      });

      const result = await gretly.run(mockInput, mockBuildFn, mockPublishFn);

      expect(result.success).toBe(true);
      expect(result.refineIterations).toBe(1);
      // Generator should be called twice: initial + refine
      expect(generatorCallCount).toBe(2);
    });
  });

  describe('Gretly.run - Escalation Flow', () => {
    it('should escalate when fixes repeatedly fail', async () => {
      const buildError: BuildErrorDTO = {
        file: 'src/pages/index.astro',
        message: 'Unfixable error',
        line: '1',
        fullOutput: 'Critical error',
      };

      const escalateResponse = {
        type: 'escalate' as const,
        result: {
          escalationType: 'user_intervention' as const,
          explanation: 'Unable to fix automatically',
          suggestedActions: ['Review the code manually'],
        },
      };

      // Build always fails
      mockBuildFn.mockResolvedValue({ success: false, buildError });

      // Fixer always fails to fix
      let plannerCallCount = 0;
      mockRegistrySend.mockImplementation(async (agentName: string) => {
        if (agentName === 'planner') {
          plannerCallCount++;
          if (plannerCallCount === 1) {
            return { message: { content: JSON.stringify(mockPlanResponse) } };
          }
          return { message: { content: JSON.stringify(escalateResponse) } };
        }
        if (agentName === 'fixer') {
          return { message: { content: JSON.stringify({ success: false, error: 'Cannot fix' }) } };
        }
        return { message: { content: JSON.stringify(mockGenerateResponse) } };
      });

      const gretly = createGretly({ skipReview: true, maxFixAttempts: 1 });
      const result = await gretly.run(mockInput, mockBuildFn, mockPublishFn);

      expect(result.success).toBe(false);
      expect(result.escalation).toBeDefined();
      expect(result.escalation?.escalationType).toBe('user_intervention');
    });
  });

  describe('Gretly.run - Data Fetcher', () => {
    it('should use data fetcher when provided', async () => {
      const mockFetchBusinessInfo = vi.fn().mockResolvedValue({
        name: 'Fetched Business',
        description: 'From database',
      });

      const mockFetchTemplate = vi.fn().mockResolvedValue({
        info: mockTemplate,
        files: { 'index.html': '<html></html>' },
      });

      const dataFetcher: GretlyDataFetcher = {
        fetchBusinessInfo: mockFetchBusinessInfo,
        fetchTemplate: mockFetchTemplate,
      };

      const gretly = createGretly({ skipReview: true, dataFetcher });
      await gretly.run(mockInput, mockBuildFn, mockPublishFn);

      expect(mockFetchBusinessInfo).toHaveBeenCalledWith(mockInput.projectId);
      expect(mockFetchTemplate).toHaveBeenCalledWith(mockTemplate.slug);
    });
  });

  describe('Gretly.run - Error Handling', () => {
    it('should handle planning failure gracefully', async () => {
      const failedPlan = {
        type: 'plan' as const,
        result: {
          success: false,
          error: 'Planning failed',
          modifications: [],
        },
      };

      mockRegistrySend.mockImplementation(async (agentName: string) => {
        if (agentName === 'planner') {
          return { message: { content: JSON.stringify(failedPlan) } };
        }
        return { message: { content: '{}' } };
      });

      const gretly = createGretly({ skipReview: true });
      const result = await gretly.run(mockInput, mockBuildFn, mockPublishFn);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Planning failed');
      expect(result.phases).toContain('failed');
    });

    it('should handle generation failure gracefully', async () => {
      const failedGenerate = {
        success: false,
        files: {},
        error: 'Generation failed',
      };

      mockRegistrySend.mockImplementation(async (agentName: string) => {
        if (agentName === 'planner') {
          return { message: { content: JSON.stringify(mockPlanResponse) } };
        }
        if (agentName === 'code-generator') {
          return { message: { content: JSON.stringify(failedGenerate) } };
        }
        return { message: { content: '{}' } };
      });

      const gretly = createGretly({ skipReview: true });
      const result = await gretly.run(mockInput, mockBuildFn, mockPublishFn);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Generation failed');
    });

    it('should handle exceptions gracefully', async () => {
      mockRegistrySend.mockRejectedValue(new Error('Network error'));

      const gretly = createGretly({ skipReview: true });
      const result = await gretly.run(mockInput, mockBuildFn, mockPublishFn);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.phases).toContain('failed');
    });
  });

  describe('Gretly Phase Tracking', () => {
    it('should track all phases in order', async () => {
      const gretly = createGretly({ skipReview: true });
      const result = await gretly.run(mockInput, mockBuildFn, mockPublishFn);

      expect(result.phases).toEqual([
        'planning',
        'generating',
        'building',
        'publishing',
        'complete',
      ]);
    });

    it('should include fixing phase when errors occur', async () => {
      const buildError: BuildErrorDTO = {
        file: 'src/pages/index.astro',
        message: 'Error',
        line: '1',
        fullOutput: 'Error',
      };

      mockBuildFn
        .mockResolvedValueOnce({ success: false, buildError })
        .mockResolvedValueOnce(mockBuildSuccess);

      const gretly = createGretly({ skipReview: true });
      const result = await gretly.run(mockInput, mockBuildFn, mockPublishFn);

      expect(result.phases).toContain('fixing');
    });
  });
});

describe('Gretly Type Exports', () => {
  it('should export all types from gretly module', async () => {
    const {
      Gretly,
      createGretly,
    } = await import('~/lib/gretly');

    expect(Gretly).toBeDefined();
    expect(createGretly).toBeDefined();
  });
});

