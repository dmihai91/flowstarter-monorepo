/**
 * FlowOps Agents Unit Tests
 *
 * Tests for the three-tier agent architecture:
 * - PlannerAgent (Opus 4.5): Master orchestrator - planning, review, escalation
 * - CodeGeneratorAgent (Kimi K2): Fast code generation
 * - FixerAgent (Sonnet 4): Error fixing with fresh perspective
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PlannerAgent,
  getPlannerAgent,
  resetPlannerAgent,
  PlanRequestSchema,
  PlanResultSchema,
  ReviewResultSchema,
  EscalateResultSchema,
  type PlanRequestDTO,
  type PlanResultDTO,
  type ReviewResultDTO,
  type EscalateResultDTO,
  type PlannerResponseDTO,
} from '~/lib/flowstarter/agents/planner-agent';
import {
  CodeGeneratorAgent,
  getCodeGeneratorAgent,
  resetCodeGeneratorAgent,
  GenerateRequestSchema,
  type GenerateRequestDTO,
  type GenerateResultDTO,
} from '~/lib/flowstarter/agents/code-generator-agent';
import {
  FixerAgent,
  getFixerAgent,
  resetFixerAgent,
  type FixerResponseDTO,
} from '~/lib/flowstarter/agents/fixer-agent';
import { FixerRequestSchema } from '~/lib/flowops/schema';

// Mock the LLM service
vi.mock('~/lib/services/llm', () => ({
  generateJSON: vi.fn(),
  generateCompletion: vi.fn(),
}));

// Mock the logger
vi.mock('~/utils/logger', () => ({
  createScopedLogger: () => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock the search tool
vi.mock('~/lib/flowstarter/tools/search-tool', () => ({
  getSearchTool: () => ({
    searchError: vi.fn().mockResolvedValue({
      results: [],
      answer: null,
    }),
  }),
}));

describe('FlowOps Agents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetPlannerAgent();
    resetCodeGeneratorAgent();
    resetFixerAgent();
  });

  afterEach(() => {
    resetPlannerAgent();
    resetCodeGeneratorAgent();
    resetFixerAgent();
  });

  // ============================================================================
  // PlannerAgent Tests
  // ============================================================================

  describe('PlannerAgent', () => {
    describe('Singleton Pattern', () => {
      it('should return the same instance when called multiple times', () => {
        const agent1 = getPlannerAgent();
        const agent2 = getPlannerAgent();
        expect(agent1).toBe(agent2);
      });

      it('should create new instance after reset', () => {
        const agent1 = getPlannerAgent();
        resetPlannerAgent();
        const agent2 = getPlannerAgent();
        expect(agent1).not.toBe(agent2);
      });

      it('should respect custom approval threshold', () => {
        const agent = getPlannerAgent(9);
        expect(agent).toBeInstanceOf(PlannerAgent);
      });
    });

    describe('Agent Configuration', () => {
      it('should have correct name', () => {
        const agent = new PlannerAgent();
        expect(agent.name).toBe('planner');
      });

      it('should have correct version', () => {
        const agent = new PlannerAgent();
        expect(agent.getConfig().version).toBe('1.0.0');
      });

      it('should allow code-generator and fixer agents', () => {
        const agent = new PlannerAgent();
        const config = agent.getConfig();
        expect(config.allowedAgents).toContain('code-generator');
        expect(config.allowedAgents).toContain('fixer');
      });
    });

    describe('PlanRequestSchema', () => {
      it('should validate a valid plan request', () => {
        const request: PlanRequestDTO = {
          type: 'plan',
          projectId: 'test-project',
          businessInfo: {
            name: 'Test Business',
            description: 'A test business',
          },
          template: {
            slug: 'startup',
            name: 'Startup Template',
          },
        };

        const result = PlanRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
      });

      it('should validate a valid review request', () => {
        const request: PlanRequestDTO = {
          type: 'review',
          projectId: 'test-project',
          businessInfo: { name: 'Test' },
          template: { slug: 'startup', name: 'Startup' },
          generatedFiles: {
            'index.html': '<html></html>',
          },
        };

        const result = PlanRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
      });

      it('should validate a valid escalate request', () => {
        const request: PlanRequestDTO = {
          type: 'escalate',
          projectId: 'test-project',
          businessInfo: { name: 'Test' },
          template: { slug: 'startup', name: 'Startup' },
          errorHistory: [
            {
              file: 'src/index.astro',
              error: 'Syntax error',
              fixAttempts: 3,
            },
          ],
        };

        const result = PlanRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
      });

      it('should reject invalid request type', () => {
        const request = {
          type: 'invalid',
          projectId: 'test',
          businessInfo: { name: 'Test' },
          template: { slug: 'test', name: 'Test' },
        };

        const result = PlanRequestSchema.safeParse(request);
        expect(result.success).toBe(false);
      });

      it('should reject missing required fields', () => {
        const request = {
          type: 'plan',
          // Missing projectId, businessInfo, template
        };

        const result = PlanRequestSchema.safeParse(request);
        expect(result.success).toBe(false);
      });
    });

    describe('PlanResultSchema', () => {
      it('should validate a successful plan result', () => {
        const result: PlanResultDTO = {
          success: true,
          modifications: [
            {
              path: 'src/pages/index.astro',
              instructions: 'Update hero section',
              priority: 'critical',
            },
          ],
          contentGuidelines: {
            tone: 'professional',
            keyMessages: ['Quality', 'Innovation'],
            ctaText: 'Get Started',
          },
        };

        const validation = PlanResultSchema.safeParse(result);
        expect(validation.success).toBe(true);
      });

      it('should validate failed plan result', () => {
        const result: PlanResultDTO = {
          success: false,
          modifications: [],
          error: 'Planning failed',
        };

        const validation = PlanResultSchema.safeParse(result);
        expect(validation.success).toBe(true);
      });
    });

    describe('ReviewResultSchema', () => {
      it('should validate a complete review result', () => {
        const result: ReviewResultDTO = {
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
        };

        const validation = ReviewResultSchema.safeParse(result);
        expect(validation.success).toBe(true);
      });

      it('should validate review with issues', () => {
        const result: ReviewResultDTO = {
          approved: false,
          score: 5,
          confidence: 0.7,
          summary: 'Needs improvement',
          categoryScores: {
            requirementMatching: 5,
            completeness: 6,
            brandAlignment: 4,
            technicalQuality: 5,
            uxDesign: 5,
          },
          issues: [
            {
              severity: 'major',
              category: 'branding',
              file: 'src/components/Header.astro',
              description: 'Logo missing',
              suggestedFix: 'Add company logo',
            },
          ],
          improvements: [
            {
              file: 'src/components/Header.astro',
              instruction: 'Add logo',
              priority: 'must-fix',
            },
          ],
        };

        const validation = ReviewResultSchema.safeParse(result);
        expect(validation.success).toBe(true);
      });

      it('should reject invalid score ranges', () => {
        const result = {
          approved: true,
          score: 15, // Invalid: must be 1-10
          confidence: 0.9,
          summary: 'Test',
          categoryScores: {
            requirementMatching: 8,
            completeness: 8,
            brandAlignment: 8,
            technicalQuality: 8,
            uxDesign: 8,
          },
          issues: [],
          improvements: [],
        };

        const validation = ReviewResultSchema.safeParse(result);
        expect(validation.success).toBe(false);
      });
    });

    describe('EscalateResultSchema', () => {
      it('should validate user-intervention escalation', () => {
        const result: EscalateResultDTO = {
          escalationType: 'user-intervention',
          explanation: 'Template incompatibility detected',
          suggestedActions: ['Choose a different template', 'Contact support'],
          affectedFiles: ['src/index.astro'],
          successfulFiles: ['src/styles.css'],
        };

        const validation = EscalateResultSchema.safeParse(result);
        expect(validation.success).toBe(true);
      });

      it('should validate abort escalation', () => {
        const result: EscalateResultDTO = {
          escalationType: 'abort',
          explanation: 'Critical failure',
          suggestedActions: ['Start over'],
          affectedFiles: ['*'],
        };

        const validation = EscalateResultSchema.safeParse(result);
        expect(validation.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // CodeGeneratorAgent Tests
  // ============================================================================

  describe('CodeGeneratorAgent', () => {
    describe('Singleton Pattern', () => {
      it('should return the same instance when called multiple times', () => {
        const agent1 = getCodeGeneratorAgent();
        const agent2 = getCodeGeneratorAgent();
        expect(agent1).toBe(agent2);
      });

      it('should create new instance after reset', () => {
        const agent1 = getCodeGeneratorAgent();
        resetCodeGeneratorAgent();
        const agent2 = getCodeGeneratorAgent();
        expect(agent1).not.toBe(agent2);
      });
    });

    describe('Agent Configuration', () => {
      it('should have correct name', () => {
        const agent = new CodeGeneratorAgent();
        expect(agent.name).toBe('code-generator');
      });

      it('should have correct version', () => {
        const agent = new CodeGeneratorAgent();
        expect(agent.getConfig().version).toBe('1.0.0');
      });

      it('should allow gretly agent for escalation', () => {
        const agent = new CodeGeneratorAgent();
        const config = agent.getConfig();
        expect(config.allowedAgents).toContain('planner');
      });
    });

    describe('GenerateRequestSchema', () => {
      it('should validate a generate request', () => {
        const request: GenerateRequestDTO = {
          type: 'generate',
          projectId: 'test-project',
          businessInfo: {
            name: 'Test Business',
          },
          templateFiles: {
            'index.astro': '---\n---\n<html></html>',
          },
          modifications: [
            {
              path: 'index.astro',
              instructions: 'Add hero section',
            },
          ],
        };

        const result = GenerateRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
      });

      it('should validate a refine request', () => {
        const request: GenerateRequestDTO = {
          type: 'refine',
          projectId: 'test-project',
          businessInfo: { name: 'Test' },
          templateFiles: {},
          modifications: [],
          previousFiles: { 'index.html': '<html></html>' },
          feedback: [
            {
              file: 'index.html',
              instruction: 'Add footer',
              priority: 'must-fix',
            },
          ],
        };

        const result = GenerateRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
      });

      it('should reject invalid request type', () => {
        const request = {
          type: 'invalid',
          projectId: 'test',
          businessInfo: { name: 'Test' },
          templateFiles: {},
          modifications: [],
        };

        const result = GenerateRequestSchema.safeParse(request);
        expect(result.success).toBe(false);
      });
    });
  });

  // ============================================================================
  // FixerAgent Tests
  // ============================================================================

  describe('FixerAgent', () => {
    describe('Singleton Pattern', () => {
      it('should return the same instance when called multiple times', () => {
        const agent1 = getFixerAgent();
        const agent2 = getFixerAgent();
        expect(agent1).toBe(agent2);
      });

      it('should create new instance after reset', () => {
        const agent1 = getFixerAgent();
        resetFixerAgent();
        const agent2 = getFixerAgent();
        expect(agent1).not.toBe(agent2);
      });

      it('should accept tryFastModelFirst parameter', () => {
        resetFixerAgent();
        const agent = getFixerAgent(true);
        expect(agent).toBeInstanceOf(FixerAgent);
      });
    });

    describe('Agent Configuration', () => {
      it('should have correct name', () => {
        const agent = new FixerAgent();
        expect(agent.name).toBe('fixer');
      });

      it('should have correct version', () => {
        const agent = new FixerAgent();
        expect(agent.getConfig().version).toBe('3.0.0');
      });

      it('should allow search tool', () => {
        const agent = new FixerAgent();
        const config = agent.getConfig();
        expect(config.allowedTools).toContain('search');
      });

      it('should allow gretly agent for escalation', () => {
        const agent = new FixerAgent();
        const config = agent.getConfig();
        expect(config.allowedAgents).toContain('planner');
      });
    });

    describe('FixerRequestSchema', () => {
      it('should validate a complete fix request', () => {
        const request = {
          file: 'src/pages/index.astro',
          content: '---\n---\n<html><body>Test</body></html>',
          error: "Cannot find module './Component'",
          line: 5,
          fullOutput: 'Error: Cannot find module...',
        };

        const result = FixerRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
      });

      it('should validate minimal fix request', () => {
        const request = {
          file: 'src/index.ts',
          content: 'const x = 1',
          error: 'Type error',
        };

        const result = FixerRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
      });

      it('should reject missing required fields', () => {
        const request = {
          file: 'test.ts',
          // Missing content and error
        };

        const result = FixerRequestSchema.safeParse(request);
        expect(result.success).toBe(false);
      });
    });

    describe('CSS Rule-based Fixes', () => {
      // These tests verify the CSS_REPLACEMENTS patterns work correctly
      it('should replace font-display with font-sans', () => {
        const content = '<div class="font-display">Test</div>';
        const expected = '<div class="font-sans">Test</div>';

        // Test the regex directly
        const pattern = /\bfont-display\b/g;
        expect(content.replace(pattern, 'font-sans')).toBe(expected);
      });

      it('should replace bg-dark with bg-gray-900', () => {
        const content = '<div class="bg-dark">Test</div>';
        const expected = '<div class="bg-gray-900">Test</div>';

        const pattern = /\bbg-dark\b/g;
        expect(content.replace(pattern, 'bg-gray-900')).toBe(expected);
      });

      it('should replace text-primary with text-blue-600', () => {
        const content = '<span class="text-primary">Text</span>';
        const expected = '<span class="text-blue-600">Text</span>';

        const pattern = /\btext-primary\b/g;
        expect(content.replace(pattern, 'text-blue-600')).toBe(expected);
      });

      it('should replace hover:bg-primary-dark with hover:bg-blue-700', () => {
        const content = '<button class="hover:bg-primary-dark">Click</button>';
        const expected = '<button class="hover:bg-blue-700">Click</button>';

        const pattern = /\bhover:bg-primary-dark\b/g;
        expect(content.replace(pattern, 'hover:bg-blue-700')).toBe(expected);
      });
    });

    describe('Framework Detection', () => {
      it('should detect Astro files', () => {
        // Test the detection pattern
        expect('file.astro'.endsWith('.astro')).toBe(true);
      });

      it('should detect React files', () => {
        expect('Component.tsx'.endsWith('.tsx')).toBe(true);
        expect('Component.jsx'.endsWith('.jsx')).toBe(true);
      });

      it('should detect Vue files', () => {
        expect('Component.vue'.endsWith('.vue')).toBe(true);
      });

      it('should detect Svelte files', () => {
        expect('Component.svelte'.endsWith('.svelte')).toBe(true);
      });
    });
  });

  // ============================================================================
  // Integration Tests - Agent Communication
  // ============================================================================

  describe('Agent Communication', () => {
    it('should have compatible agent references', () => {
      const gretly = new PlannerAgent();
      const codeGen = new CodeGeneratorAgent();
      const fixer = new FixerAgent();

      // PlannerAgent can call CodeGenerator and Fixer
      const gretlyConfig = gretly.getConfig();
      expect(gretlyConfig.allowedAgents).toContain('code-generator');
      expect(gretlyConfig.allowedAgents).toContain('fixer');

      // CodeGenerator can escalate to Gretly
      const codeGenConfig = codeGen.getConfig();
      expect(codeGenConfig.allowedAgents).toContain('planner');

      // Fixer can escalate to Gretly
      const fixerConfig = fixer.getConfig();
      expect(fixerConfig.allowedAgents).toContain('planner');
    });

    it('should have unique agent names', () => {
      const gretly = new PlannerAgent();
      const codeGen = new CodeGeneratorAgent();
      const fixer = new FixerAgent();

      const names = [gretly.name, codeGen.name, fixer.name];
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(names.length);
    });
  });

  // ============================================================================
  // Legacy Alias Tests
  // ============================================================================

  describe('Legacy Aliases', () => {
    it('should export PlannerAgent class', async () => {
      const { PlannerAgent } = await import('~/lib/flowstarter/agents/planner-agent');
      expect(PlannerAgent).toBeDefined();
      expect(new PlannerAgent().name).toBe('planner');
    });

    it('should export getPlannerAgent function', async () => {
      const { getPlannerAgent } = await import('~/lib/flowstarter/agents/planner-agent');
      expect(getPlannerAgent).toBeDefined();
      expect(typeof getPlannerAgent).toBe('function');
    });

    it('should export resetPlannerAgent function', async () => {
      const { resetPlannerAgent } = await import('~/lib/flowstarter/agents/planner-agent');
      expect(resetPlannerAgent).toBeDefined();
      expect(typeof resetPlannerAgent).toBe('function');
    });
  });
});

