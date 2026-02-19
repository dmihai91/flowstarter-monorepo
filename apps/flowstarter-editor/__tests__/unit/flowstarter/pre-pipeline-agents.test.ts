/**
 * Flowstarter Pre-Pipeline Agents Unit Tests
 *
 * Tests for agents that run before the Gretly pipeline:
 * - BusinessDataAgent: Interactive business information gathering
 * - TemplateRecommenderAgent: AI-powered template selection
 * - CustomizerAgent: Font, palette, and theme customization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  BusinessDataAgent,
  getBusinessDataAgent,
  resetBusinessDataAgent,
  type BusinessData,
  type BusinessDataRequest,
  type BusinessDataResponse,
} from '~/lib/flowstarter/agents/business-data-agent';
import {
  TemplateRecommenderAgent,
  getTemplateRecommenderAgent,
  resetTemplateRecommenderAgent,
  type BusinessInfo as TemplateBusinessInfo,
  type RecommendRequest,
  type RecommendResponse,
} from '~/lib/flowstarter/agents/template-recommender-agent';
import {
  CustomizerAgent,
  getCustomizerAgent,
  resetCustomizerAgent,
  type CustomizeRequest,
  type CustomizeResponse,
  type BusinessContext,
} from '~/lib/flowstarter/agents/customizer-agent';
import type { Template } from '~/components/editor/template-preview/types';

// Mock the LLM service
vi.mock('~/lib/services/llm', () => ({
  generateJSON: vi.fn(),
  generateCompletion: vi.fn(),
  prompts: {
    businessAgent: 'You are a helpful business consultant...',
    generateProjectMetadata: vi.fn().mockReturnValue('Generate project metadata...'),
  },
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

// Import mocked modules
import { generateJSON, generateCompletion } from '~/lib/services/llm';

const mockedGenerateJSON = vi.mocked(generateJSON);
const mockedGenerateCompletion = vi.mocked(generateCompletion);

describe('Flowstarter Pre-Pipeline Agents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetBusinessDataAgent();
    resetTemplateRecommenderAgent();
    resetCustomizerAgent();
  });

  afterEach(() => {
    resetBusinessDataAgent();
    resetTemplateRecommenderAgent();
    resetCustomizerAgent();
  });

  // ============================================================================
  // BusinessDataAgent Tests
  // ============================================================================

  describe('BusinessDataAgent', () => {
    describe('Singleton Pattern', () => {
      it('should return the same instance when called multiple times', () => {
        const agent1 = getBusinessDataAgent();
        const agent2 = getBusinessDataAgent();
        expect(agent1).toBe(agent2);
      });

      it('should create new instance after reset', () => {
        const agent1 = getBusinessDataAgent();
        resetBusinessDataAgent();
        const agent2 = getBusinessDataAgent();
        expect(agent1).not.toBe(agent2);
      });
    });

    describe('Agent Configuration', () => {
      it('should have correct name', () => {
        const agent = new BusinessDataAgent();
        expect(agent.name).toBe('business-data');
      });

      it('should have correct version', () => {
        const agent = new BusinessDataAgent();
        expect(agent.getConfig().version).toBe('1.0.0');
      });

      it('should allow planner and template-recommender agents', () => {
        const agent = new BusinessDataAgent();
        const config = agent.getConfig();
        expect(config.allowedAgents).toContain('planner');
        expect(config.allowedAgents).toContain('template-recommender');
      });
    });

    describe('Request Handling', () => {
      it('should handle start request', async () => {
        mockedGenerateCompletion.mockResolvedValue(
          "Hello! I'd love to help you create a website. What's your business called?"
        );

        const agent = new BusinessDataAgent();
        const request: BusinessDataRequest = { type: 'start' };
        const result = await agent.chat(JSON.stringify(request));

        expect(result.message).toBeDefined();
        const response: BusinessDataResponse = JSON.parse(result.message.content);
        expect(response.success).toBe(true);
        expect(response.isComplete).toBe(false);
        expect(response.message).toContain('Hello');
      });

      it('should handle continue request with user message', async () => {
        mockedGenerateJSON.mockResolvedValue({
          businessName: 'Tech Startup',
          description: 'A SaaS platform for developers',
        });
        mockedGenerateCompletion.mockResolvedValue(
          "That sounds great! What makes your platform unique?"
        );

        const agent = new BusinessDataAgent();

        // First, start the conversation
        const startRequest: BusinessDataRequest = { type: 'start' };
        mockedGenerateCompletion.mockResolvedValueOnce("What's your business?");
        await agent.chat(JSON.stringify(startRequest));

        // Then continue with user response
        const continueRequest: BusinessDataRequest = {
          type: 'continue',
          userMessage: "We're Tech Startup, a SaaS platform for developers",
        };
        const result = await agent.chat(JSON.stringify(continueRequest));

        expect(result.message).toBeDefined();
        const response: BusinessDataResponse = JSON.parse(result.message.content);
        expect(response.success).toBe(true);
      });

      it('should reject continue request without userMessage', async () => {
        const agent = new BusinessDataAgent();
        const request: BusinessDataRequest = { type: 'continue' };
        const result = await agent.chat(JSON.stringify(request));

        const response: BusinessDataResponse = JSON.parse(result.message.content);
        expect(response.success).toBe(false);
        expect(response.message).toContain('userMessage is required');
      });

      it('should handle extract request', async () => {
        mockedGenerateJSON.mockResolvedValue({
          businessName: 'FitnessPro',
          industry: 'Fitness',
          targetAudience: 'Health-conscious adults',
        });

        const agent = new BusinessDataAgent();
        const request: BusinessDataRequest = {
          type: 'extract',
          userMessage: 'FitnessPro is a fitness app for health-conscious adults',
        };
        const result = await agent.chat(JSON.stringify(request));

        const response: BusinessDataResponse = JSON.parse(result.message.content);
        expect(response.success).toBe(true);
        expect(response.extractedFields).toBeDefined();
        expect(response.extractedFields).toContain('businessName');
      });

      it('should handle validate request', async () => {
        const agent = new BusinessDataAgent();
        const request: BusinessDataRequest = {
          type: 'validate',
          partialData: {
            businessName: 'TestCo',
            description: 'A test company',
            uvp: 'Best testing',
            targetAudience: 'Developers',
            businessGoals: ['Grow'],
          },
        };
        const result = await agent.chat(JSON.stringify(request));

        const response: BusinessDataResponse = JSON.parse(result.message.content);
        expect(response.success).toBe(true);
        expect(response.isComplete).toBe(true);
      });

      it('should reject validate request without partialData', async () => {
        const agent = new BusinessDataAgent();
        const request: BusinessDataRequest = { type: 'validate' };
        const result = await agent.chat(JSON.stringify(request));

        const response: BusinessDataResponse = JSON.parse(result.message.content);
        expect(response.success).toBe(false);
        expect(response.message).toContain('partialData is required');
      });
    });

    describe('Information Extraction', () => {
      it('should identify missing required fields', async () => {
        const agent = new BusinessDataAgent();
        const request: BusinessDataRequest = {
          type: 'validate',
          partialData: {
            businessName: 'TestCo',
            // Missing: description, uvp, targetAudience, businessGoals
          },
        };
        const result = await agent.chat(JSON.stringify(request));

        const response: BusinessDataResponse = JSON.parse(result.message.content);
        expect(response.isComplete).toBe(false);
        expect(response.missingFields).toContain('business description');
        expect(response.missingFields).toContain('unique value proposition');
        expect(response.missingFields).toContain('target audience');
        expect(response.missingFields).toContain('main goals');
      });

      it('should merge extracted data without overwriting with null', async () => {
        mockedGenerateJSON
          .mockResolvedValueOnce({ businessName: 'Company A' })
          .mockResolvedValueOnce({ industry: 'Tech' }); // No businessName

        const agent = new BusinessDataAgent();

        // First extraction
        await agent.chat(
          JSON.stringify({ type: 'extract', userMessage: 'Company A is our name' })
        );

        // Second extraction should not overwrite businessName
        await agent.chat(
          JSON.stringify({ type: 'extract', userMessage: 'We are in the tech industry' })
        );

        // Validate current state
        const validateResult = await agent.chat(
          JSON.stringify({ type: 'validate', partialData: {} })
        );
        const response: BusinessDataResponse = JSON.parse(validateResult.message.content);

        // businessName should still be set
        expect(response.missingFields).not.toContain('business name');
      });
    });

    describe('State Management', () => {
      it('should allow setting business data for restoration', () => {
        const agent = new BusinessDataAgent();
        const testData: Partial<BusinessData> = {
          businessName: 'Restored Business',
          description: 'Restored from state',
        };

        agent.setBusinessData(testData);
        const history = agent.getConversationHistory();

        expect(history).toBeDefined();
      });

      it('should allow setting conversation history', () => {
        const agent = new BusinessDataAgent();
        const testHistory = [
          { role: 'assistant' as const, content: 'Hello!' },
          { role: 'user' as const, content: 'Hi!' },
        ];

        agent.setConversationHistory(testHistory);
        expect(agent.getConversationHistory()).toEqual(testHistory);
      });

      it('should reset agent state', () => {
        const agent = new BusinessDataAgent();
        agent.setBusinessData({ businessName: 'Test' });
        agent.setConversationHistory([{ role: 'user', content: 'Hi' }]);

        agent.reset();

        expect(agent.getConversationHistory()).toHaveLength(0);
      });
    });

    describe('Direct Message Parsing', () => {
      it('should treat non-JSON message as continue type', async () => {
        mockedGenerateJSON.mockResolvedValue({ businessName: 'Direct Message Corp' });
        mockedGenerateCompletion.mockResolvedValue('Tell me more!');

        const agent = new BusinessDataAgent();
        // Send a plain text message instead of JSON
        const result = await agent.chat('My business is Direct Message Corp');

        const response: BusinessDataResponse = JSON.parse(result.message.content);
        expect(response.success).toBe(true);
      });
    });
  });

  // ============================================================================
  // TemplateRecommenderAgent Tests
  // ============================================================================

  describe('TemplateRecommenderAgent', () => {
    const mockTemplates: Template[] = [
      {
        id: 'fitness-gym',
        name: 'Fitness Gym',
        description: 'A modern template for fitness centers',
        thumbnail: '/templates/fitness-gym/thumbnail.png',
        category: 'Health & Fitness',
      },
      {
        id: 'saas-product',
        name: 'SaaS Product',
        description: 'Clean template for SaaS products',
        thumbnail: '/templates/saas-product/thumbnail.png',
        category: 'Technology',
      },
      {
        id: 'creative-portfolio',
        name: 'Creative Portfolio',
        description: 'Showcase your creative work',
        thumbnail: '/templates/creative-portfolio/thumbnail.png',
        category: 'Portfolio',
      },
    ];

    const mockBusinessInfo: TemplateBusinessInfo = {
      uvp: 'Best personal training in town',
      targetAudience: 'Fitness enthusiasts',
      businessGoals: ['Increase memberships'],
      brandTone: 'Energetic',
      industry: 'Fitness',
    };

    describe('Singleton Pattern', () => {
      it('should return the same instance when called multiple times', () => {
        const agent1 = getTemplateRecommenderAgent();
        const agent2 = getTemplateRecommenderAgent();
        expect(agent1).toBe(agent2);
      });

      it('should create new instance after reset', () => {
        const agent1 = getTemplateRecommenderAgent();
        resetTemplateRecommenderAgent();
        const agent2 = getTemplateRecommenderAgent();
        expect(agent1).not.toBe(agent2);
      });
    });

    describe('Agent Configuration', () => {
      it('should have correct name', () => {
        const agent = new TemplateRecommenderAgent();
        expect(agent.name).toBe('template-recommender');
      });

      it('should have correct version', () => {
        const agent = new TemplateRecommenderAgent();
        expect(agent.getConfig().version).toBe('1.0.0');
      });

      it('should allow business-data and planner agents', () => {
        const agent = new TemplateRecommenderAgent();
        const config = agent.getConfig();
        expect(config.allowedAgents).toContain('business-data');
        expect(config.allowedAgents).toContain('planner');
      });
    });

    describe('Request Validation', () => {
      it('should reject request with empty templates array', async () => {
        const agent = new TemplateRecommenderAgent();
        const request: RecommendRequest = {
          templates: [],
          projectDescription: 'A fitness website',
          businessInfo: mockBusinessInfo,
        };

        const result = await agent.chat(JSON.stringify(request));
        const response: RecommendResponse = JSON.parse(result.message.content);

        expect(response.success).toBe(false);
        expect(response.error).toContain('templates array is required');
      });

      it('should reject request without projectDescription', async () => {
        const agent = new TemplateRecommenderAgent();
        const request = {
          templates: mockTemplates,
          businessInfo: mockBusinessInfo,
        };

        const result = await agent.chat(JSON.stringify(request));
        const response: RecommendResponse = JSON.parse(result.message.content);

        expect(response.success).toBe(false);
        expect(response.error).toContain('projectDescription is required');
      });

      it('should reject request without businessInfo', async () => {
        const agent = new TemplateRecommenderAgent();
        const request = {
          templates: mockTemplates,
          projectDescription: 'A fitness website',
        };

        const result = await agent.chat(JSON.stringify(request));
        const response: RecommendResponse = JSON.parse(result.message.content);

        expect(response.success).toBe(false);
        expect(response.error).toContain('businessInfo is required');
      });

      it('should reject invalid JSON', async () => {
        const agent = new TemplateRecommenderAgent();
        const result = await agent.chat('not valid json');
        const response: RecommendResponse = JSON.parse(result.message.content);

        expect(response.success).toBe(false);
        expect(response.error).toContain('Invalid JSON');
      });
    });

    describe('Template Recommendation', () => {
      it('should return ranked recommendations', async () => {
        mockedGenerateCompletion.mockResolvedValue(
          JSON.stringify({
            recommendations: [
              { templateId: 'fitness-gym', reasoning: 'Perfect for fitness', matchScore: 95 },
              { templateId: 'saas-product', reasoning: 'Not a good fit', matchScore: 30 },
              { templateId: 'creative-portfolio', reasoning: 'Wrong category', matchScore: 20 },
            ],
          })
        );

        const agent = new TemplateRecommenderAgent();
        const request: RecommendRequest = {
          templates: mockTemplates,
          projectDescription: 'A personal training business website',
          projectName: 'FitPro',
          businessInfo: mockBusinessInfo,
          topN: 3,
          minScore: 60,
        };

        const result = await agent.chat(JSON.stringify(request));
        const response: RecommendResponse = JSON.parse(result.message.content);

        expect(response.success).toBe(true);
        expect(response.recommendations.length).toBe(1); // Only fitness-gym meets minScore
        expect(response.recommendations[0].template.id).toBe('fitness-gym');
        expect(response.recommendations[0].matchScore).toBe(95);
      });

      it('should handle markdown code blocks in LLM response', async () => {
        mockedGenerateCompletion.mockResolvedValue(
          '```json\n' +
            JSON.stringify({
              recommendations: [
                { templateId: 'fitness-gym', reasoning: 'Good fit', matchScore: 90 },
              ],
            }) +
            '\n```'
        );

        const agent = new TemplateRecommenderAgent();
        const request: RecommendRequest = {
          templates: mockTemplates,
          projectDescription: 'Fitness website',
          businessInfo: mockBusinessInfo,
        };

        const result = await agent.chat(JSON.stringify(request));
        const response: RecommendResponse = JSON.parse(result.message.content);

        expect(response.success).toBe(true);
        expect(response.recommendations.length).toBeGreaterThan(0);
      });

      it('should use default topN and minScore when not provided', async () => {
        mockedGenerateCompletion.mockResolvedValue(
          JSON.stringify({
            recommendations: [
              { templateId: 'fitness-gym', reasoning: 'Good', matchScore: 90 },
              { templateId: 'saas-product', reasoning: 'OK', matchScore: 70 },
              { templateId: 'creative-portfolio', reasoning: 'Meh', matchScore: 65 },
            ],
          })
        );

        const agent = new TemplateRecommenderAgent();
        const request: RecommendRequest = {
          templates: mockTemplates,
          projectDescription: 'Test project',
          businessInfo: mockBusinessInfo,
          // No topN or minScore - should use defaults (3, 60)
        };

        const result = await agent.chat(JSON.stringify(request));
        const response: RecommendResponse = JSON.parse(result.message.content);

        expect(response.success).toBe(true);
        expect(response.recommendations.length).toBe(3); // All meet default minScore
      });

      it('should handle LLM errors gracefully', async () => {
        mockedGenerateCompletion.mockRejectedValue(new Error('LLM service unavailable'));

        const agent = new TemplateRecommenderAgent();
        const request: RecommendRequest = {
          templates: mockTemplates,
          projectDescription: 'Test project',
          businessInfo: mockBusinessInfo,
        };

        const result = await agent.chat(JSON.stringify(request));
        const response: RecommendResponse = JSON.parse(result.message.content);

        expect(response.success).toBe(false);
        expect(response.error).toContain('Failed to generate recommendations');
      });

      it('should warn when template ID not found', async () => {
        mockedGenerateCompletion.mockResolvedValue(
          JSON.stringify({
            recommendations: [
              { templateId: 'non-existent-template', reasoning: 'Test', matchScore: 90 },
            ],
          })
        );

        const agent = new TemplateRecommenderAgent();
        const request: RecommendRequest = {
          templates: mockTemplates,
          projectDescription: 'Test project',
          businessInfo: mockBusinessInfo,
        };

        const result = await agent.chat(JSON.stringify(request));
        const response: RecommendResponse = JSON.parse(result.message.content);

        expect(response.success).toBe(true);
        expect(response.topCount).toBe(0); // Template not found, so not included
      });
    });
  });

  // ============================================================================
  // CustomizerAgent Tests
  // ============================================================================

  describe('CustomizerAgent', () => {
    const mockTemplate: Template = {
      id: 'test-template',
      name: 'Test Template',
      description: 'A test template',
      thumbnail: '/templates/test-template/thumbnail.png',
      category: 'Test',
      fonts: [
        {
          id: 'inter',
          name: 'Inter',
          heading: 'Inter',
          body: 'Inter',
          googleFonts: 'https://fonts.googleapis.com/css2?family=Inter',
        },
        {
          id: 'poppins-opensans',
          name: 'Poppins & Open Sans',
          heading: 'Poppins',
          body: 'Open Sans',
          googleFonts: 'https://fonts.googleapis.com/css2?family=Poppins&family=Open+Sans',
        },
      ],
      palettes: [
        {
          id: 'ocean-blue',
          name: 'Ocean Blue',
          colors: {
            primary: '#2563eb',
            secondary: '#1e40af',
            accent: '#3b82f6',
            background: '#ffffff',
            text: '#0f172a',
          },
        },
        {
          id: 'forest-green',
          name: 'Forest Green',
          colors: {
            primary: '#16a34a',
            secondary: '#15803d',
            accent: '#22c55e',
            background: '#f0fdf4',
            text: '#052e16',
          },
        },
      ],
    };

    const mockTemplateWithoutMetadata: Template = {
      id: 'bare-template',
      name: 'Bare Template',
      description: 'A template without fonts or palettes',
      thumbnail: '/templates/bare-template/thumbnail.png',
      category: 'Test',
      // No fonts or palettes
    };

    const mockBusinessContext: BusinessContext = {
      businessName: 'TechCorp',
      industry: 'Technology',
      brandTone: 'Professional',
      targetAudience: 'Enterprise clients',
      existingColors: ['#0066cc'],
      preferences: {
        darkMode: false,
        fontStyle: 'sans-serif',
      },
    };

    describe('Singleton Pattern', () => {
      it('should return the same instance when called multiple times', () => {
        const agent1 = getCustomizerAgent();
        const agent2 = getCustomizerAgent();
        expect(agent1).toBe(agent2);
      });

      it('should create new instance after reset', () => {
        const agent1 = getCustomizerAgent();
        resetCustomizerAgent();
        const agent2 = getCustomizerAgent();
        expect(agent1).not.toBe(agent2);
      });
    });

    describe('Agent Configuration', () => {
      it('should have correct name', () => {
        const agent = new CustomizerAgent();
        expect(agent.name).toBe('customizer');
      });

      it('should have correct version', () => {
        const agent = new CustomizerAgent();
        expect(agent.getConfig().version).toBe('2.0.0');
      });

      it('should allow business-data and template-recommender agents', () => {
        const agent = new CustomizerAgent();
        const config = agent.getConfig();
        expect(config.allowedAgents).toContain('business-data');
        expect(config.allowedAgents).toContain('template-recommender');
      });
    });

    describe('Request Validation', () => {
      it('should reject request without template', async () => {
        const agent = new CustomizerAgent();
        const request = {
          type: 'fonts',
          businessContext: mockBusinessContext,
        };

        const result = await agent.chat(JSON.stringify(request));
        const response: CustomizeResponse = JSON.parse(result.message.content);

        expect(response.success).toBe(false);
        expect(response.error).toContain('template is required');
      });

      it('should reject request without businessContext', async () => {
        const agent = new CustomizerAgent();
        const request = {
          type: 'fonts',
          template: mockTemplate,
        };

        const result = await agent.chat(JSON.stringify(request));
        const response: CustomizeResponse = JSON.parse(result.message.content);

        expect(response.success).toBe(false);
        expect(response.error).toContain('businessContext is required');
      });

      it('should reject invalid JSON', async () => {
        const agent = new CustomizerAgent();
        const result = await agent.chat('not valid json');
        const response: CustomizeResponse = JSON.parse(result.message.content);

        expect(response.success).toBe(false);
        expect(response.error).toContain('Invalid JSON');
      });

      it('should reject unknown request type', async () => {
        const agent = new CustomizerAgent();
        const request = {
          type: 'unknown',
          template: mockTemplate,
          businessContext: mockBusinessContext,
        };

        const result = await agent.chat(JSON.stringify(request));
        const response: CustomizeResponse = JSON.parse(result.message.content);

        expect(response.success).toBe(false);
        expect(response.error).toContain('Unknown request type');
      });
    });

    describe('Font Recommendations', () => {
      it('should return font recommendations from template metadata', async () => {
        mockedGenerateJSON.mockResolvedValue({
          rankings: [
            { index: 0, score: 95, reasoning: 'Inter is clean and professional' },
            { index: 1, score: 85, reasoning: 'Poppins is also good' },
          ],
        });

        const agent = new CustomizerAgent();
        const request: CustomizeRequest = {
          type: 'fonts',
          template: mockTemplate,
          businessContext: mockBusinessContext,
          count: 2,
        };

        const result = await agent.chat(JSON.stringify(request));
        const response: CustomizeResponse = JSON.parse(result.message.content);

        expect(response.success).toBe(true);
        expect(response.fonts).toBeDefined();
        expect(response.fonts!.length).toBe(2);
        expect(response.fonts![0].font.id).toBe('inter');
        expect(response.fonts![0].matchScore).toBe(95);
      });

      it('should use default fonts when template has no font metadata', async () => {
        const agent = new CustomizerAgent();
        const request: CustomizeRequest = {
          type: 'fonts',
          template: mockTemplateWithoutMetadata,
          businessContext: mockBusinessContext,
          count: 2,
        };

        const result = await agent.chat(JSON.stringify(request));
        const response: CustomizeResponse = JSON.parse(result.message.content);

        expect(response.success).toBe(true);
        expect(response.fonts).toBeDefined();
        expect(response.fonts!.length).toBeGreaterThan(0);
        // Should use default fallback fonts
      });

      it('should return all fonts when count exceeds available', async () => {
        const agent = new CustomizerAgent();
        const request: CustomizeRequest = {
          type: 'fonts',
          template: mockTemplate,
          businessContext: mockBusinessContext,
          count: 10, // More than available
        };

        const result = await agent.chat(JSON.stringify(request));
        const response: CustomizeResponse = JSON.parse(result.message.content);

        expect(response.success).toBe(true);
        expect(response.fonts).toBeDefined();
        expect(response.fonts!.length).toBe(2); // Only 2 fonts in template
      });

      it('should fallback to sequential return on LLM error', async () => {
        mockedGenerateJSON.mockRejectedValue(new Error('LLM error'));

        const agent = new CustomizerAgent();
        const request: CustomizeRequest = {
          type: 'fonts',
          template: mockTemplate,
          businessContext: mockBusinessContext,
          count: 2,
        };

        const result = await agent.chat(JSON.stringify(request));
        const response: CustomizeResponse = JSON.parse(result.message.content);

        expect(response.success).toBe(true);
        expect(response.fonts).toBeDefined();
        // Should still return fonts (fallback)
      });
    });

    describe('Palette Recommendations', () => {
      it('should return palette recommendations from template metadata', async () => {
        mockedGenerateJSON.mockResolvedValue({
          rankings: [
            { index: 0, score: 90, reasoning: 'Ocean blue matches tech industry' },
            { index: 1, score: 75, reasoning: 'Forest green is calming' },
          ],
        });

        const agent = new CustomizerAgent();
        const request: CustomizeRequest = {
          type: 'palette',
          template: mockTemplate,
          businessContext: mockBusinessContext,
          count: 2,
        };

        const result = await agent.chat(JSON.stringify(request));
        const response: CustomizeResponse = JSON.parse(result.message.content);

        expect(response.success).toBe(true);
        expect(response.palettes).toBeDefined();
        expect(response.palettes!.length).toBe(2);
        expect(response.palettes![0].palette.id).toBe('ocean-blue');
      });

      it('should use default palettes when template has no palette metadata', async () => {
        const agent = new CustomizerAgent();
        const request: CustomizeRequest = {
          type: 'palette',
          template: mockTemplateWithoutMetadata,
          businessContext: mockBusinessContext,
          count: 2,
        };

        const result = await agent.chat(JSON.stringify(request));
        const response: CustomizeResponse = JSON.parse(result.message.content);

        expect(response.success).toBe(true);
        expect(response.palettes).toBeDefined();
        expect(response.palettes!.length).toBeGreaterThan(0);
      });
    });

    describe('Theme Generation', () => {
      it('should generate complete theme customization', async () => {
        mockedGenerateJSON
          .mockResolvedValueOnce({
            rankings: [{ index: 0, score: 95, reasoning: 'Best font' }],
          })
          .mockResolvedValueOnce({
            rankings: [{ index: 0, score: 90, reasoning: 'Best palette' }],
          });

        const agent = new CustomizerAgent();
        const request: CustomizeRequest = {
          type: 'theme',
          template: mockTemplate,
          businessContext: mockBusinessContext,
        };

        const result = await agent.chat(JSON.stringify(request));
        const response: CustomizeResponse = JSON.parse(result.message.content);

        expect(response.success).toBe(true);
        expect(response.theme).toBeDefined();
        expect(response.theme!.font).toBeDefined();
        expect(response.theme!.palette).toBeDefined();
        expect(response.theme!.borderRadius).toBeDefined();
        expect(response.theme!.spacing).toBe('normal');
        expect(response.theme!.style).toBeDefined();
      });

      it('should match style to brand tone', async () => {
        mockedGenerateJSON
          .mockResolvedValueOnce({ rankings: [{ index: 0, score: 90, reasoning: 'OK' }] })
          .mockResolvedValueOnce({ rankings: [{ index: 0, score: 90, reasoning: 'OK' }] });

        const agent = new CustomizerAgent();

        // Test professional tone
        const professionalRequest: CustomizeRequest = {
          type: 'theme',
          template: mockTemplate,
          businessContext: { ...mockBusinessContext, brandTone: 'professional' },
        };
        const professionalResult = await agent.chat(JSON.stringify(professionalRequest));
        const professionalResponse: CustomizeResponse = JSON.parse(
          professionalResult.message.content
        );
        expect(professionalResponse.theme!.style).toBe('modern');

        // Test playful tone
        mockedGenerateJSON
          .mockResolvedValueOnce({ rankings: [{ index: 0, score: 90, reasoning: 'OK' }] })
          .mockResolvedValueOnce({ rankings: [{ index: 0, score: 90, reasoning: 'OK' }] });

        const playfulRequest: CustomizeRequest = {
          type: 'theme',
          template: mockTemplate,
          businessContext: { ...mockBusinessContext, brandTone: 'playful' },
        };
        const playfulResult = await agent.chat(JSON.stringify(playfulRequest));
        const playfulResponse: CustomizeResponse = JSON.parse(playfulResult.message.content);
        expect(playfulResponse.theme!.style).toBe('playful');
      });
    });

    describe('Full Customization', () => {
      it('should return fonts, palettes, and theme in full mode', async () => {
        mockedGenerateJSON.mockResolvedValue({
          rankings: [
            { index: 0, score: 95, reasoning: 'Best' },
            { index: 1, score: 85, reasoning: 'Good' },
          ],
        });

        const agent = new CustomizerAgent();
        const request: CustomizeRequest = {
          type: 'full',
          template: mockTemplate,
          businessContext: mockBusinessContext,
          count: 2,
        };

        const result = await agent.chat(JSON.stringify(request));
        const response: CustomizeResponse = JSON.parse(result.message.content);

        expect(response.success).toBe(true);
        expect(response.fonts).toBeDefined();
        expect(response.palettes).toBeDefined();
        expect(response.theme).toBeDefined();
      });
    });
  });

  // ============================================================================
  // Integration Tests - Agent Communication
  // ============================================================================

  describe('Pre-Pipeline Agent Communication', () => {
    it('should have compatible agent references', () => {
      const businessData = new BusinessDataAgent();
      const templateRec = new TemplateRecommenderAgent();
      const customizer = new CustomizerAgent();

      // BusinessDataAgent can call template-recommender and planner
      const bdConfig = businessData.getConfig();
      expect(bdConfig.allowedAgents).toContain('template-recommender');
      expect(bdConfig.allowedAgents).toContain('planner');

      // TemplateRecommenderAgent can call business-data and planner
      const trConfig = templateRec.getConfig();
      expect(trConfig.allowedAgents).toContain('business-data');
      expect(trConfig.allowedAgents).toContain('planner');

      // CustomizerAgent can call business-data and template-recommender
      const custConfig = customizer.getConfig();
      expect(custConfig.allowedAgents).toContain('business-data');
      expect(custConfig.allowedAgents).toContain('template-recommender');
    });

    it('should have unique agent names', () => {
      const businessData = new BusinessDataAgent();
      const templateRec = new TemplateRecommenderAgent();
      const customizer = new CustomizerAgent();

      const names = [businessData.name, templateRec.name, customizer.name];
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(names.length);
    });
  });
});

