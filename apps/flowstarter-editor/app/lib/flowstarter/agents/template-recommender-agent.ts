/**
 * TemplateRecommenderAgent - FlowOps-based Template Selection
 *
 * Uses LLM to intelligently match business information with website templates.
 * Provides ranked recommendations with reasoning and match scores.
 *
 * Built on FlowOps protocol for standardized agent communication.
 */

import { BaseAgent, type AgentContext, type AgentResponse } from '~/lib/flowops/agent';
import { generateCompletion } from '~/lib/services/llm';
import { createScopedLogger } from '~/utils/logger';
import type { Template } from '~/components/editor/template-preview/types';

const logger = createScopedLogger('TemplateRecommenderAgent');

/*
 * ============================================================================
 * Types
 * ============================================================================
 */

export interface BusinessInfo {
  uvp: string;
  targetAudience: string;
  businessGoals?: string[];
  brandTone: string;
  pricingOffers?: string;
  industry?: string;
}

export interface TemplateRecommendation {
  templateId: string;
  reasoning: string;
  matchScore: number;
}

export interface FullTemplateRecommendation {
  template: Template;
  reasoning: string;
  matchScore: number;
}

export interface RecommendRequest {
  templates: Template[];
  projectDescription: string;
  projectName?: string;
  businessInfo: BusinessInfo;
  topN?: number;
  minScore?: number;
}

export interface RecommendResponse {
  success: boolean;
  recommendations: FullTemplateRecommendation[];
  topCount: number;
  error?: string;
}

/*
 * ============================================================================
 * TemplateRecommenderAgent Implementation
 * ============================================================================
 */

export class TemplateRecommenderAgent extends BaseAgent {
  constructor() {
    super({
      name: 'template-recommender',
      description: 'Intelligently matches business information with website templates',
      version: '1.0.0',
      systemPrompt: '', // Built dynamically based on available templates
      allowedTools: [],
      allowedAgents: ['business-data', 'planner'],
    });
  }

  protected async process(message: string, context: AgentContext): Promise<AgentResponse> {
    let request: RecommendRequest;

    try {
      request = JSON.parse(message);
    } catch {
      return this.createErrorResponse('Invalid JSON. Expected RecommendRequest object.');
    }

    // Validate required fields
    if (!request.templates || request.templates.length === 0) {
      return this.createErrorResponse('templates array is required and must not be empty');
    }

    if (!request.projectDescription) {
      return this.createErrorResponse('projectDescription is required');
    }

    if (!request.businessInfo) {
      return this.createErrorResponse('businessInfo is required');
    }

    context.onProgress?.('Analyzing templates for best match...', 20);

    const topN = request.topN ?? 3;
    const minScore = request.minScore ?? 60;

    try {
      const systemPrompt = this.buildSystemPrompt(request.templates);
      const userPrompt = this.buildUserPrompt(request.projectDescription, request.projectName, request.businessInfo);

      this.logger.info(`Recommending from ${request.templates.length} templates (min score: ${minScore})`);
      context.onProgress?.('Getting LLM recommendations...', 50);

      const response = await generateCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          model: 'llama-3.3-70b-versatile', // Fast, free on Groq
          temperature: 0.3,
          maxTokens: 2000,
        },
      );

      context.onProgress?.('Processing recommendations...', 80);

      // Parse response
      const llmRecommendations = this.parseResponse(response);

      // Create template map for quick lookup
      const templateMap = new Map(request.templates.map((t) => [t.id, t]));

      // Sort by score descending
      llmRecommendations.sort((a, b) => b.matchScore - a.matchScore);

      // Filter by minimum score and take top N
      const filteredRecommendations = llmRecommendations.filter((rec) => rec.matchScore >= minScore).slice(0, topN);

      // Build full recommendations with template objects
      const fullRecommendations: FullTemplateRecommendation[] = [];

      for (const rec of filteredRecommendations) {
        const template = templateMap.get(rec.templateId);

        if (template) {
          fullRecommendations.push({
            template,
            reasoning: rec.reasoning,
            matchScore: rec.matchScore,
          });
        } else {
          this.logger.warn(`Template ${rec.templateId} not found in template list`);
        }
      }

      const count = fullRecommendations.length;

      if (count === 0) {
        this.logger.warn(`No templates met minimum score threshold of ${minScore}`);
      }

      this.logger.info(
        `Recommended ${count} template(s): ${fullRecommendations.map((r) => `${r.template.id}(${r.matchScore})`).join(', ')}`,
      );

      const result: RecommendResponse = {
        success: true,
        recommendations: fullRecommendations,
        topCount: count,
      };

      return this.createSuccessResponse(result);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error('Template recommendation failed:', errMsg);

      return this.createErrorResponse(`Failed to generate recommendations: ${errMsg}`);
    }
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Prompt Building
   * ──────────────────────────────────────────────────────────────────────────
   */

  private buildSystemPrompt(templates: Template[]): string {
    const templateDescriptions = templates
      .map((t) => `- **${t.id}** (${t.name}): ${t.description} [Category: ${t.category}]`)
      .join('\n');

    return `You are an expert web design consultant helping match businesses with the perfect website template.

## Available Templates

${templateDescriptions}

## Your Task

Analyze the business information provided and RANK the available templates from best match to least match.
Assign a Match Score (0-100) to each template based on how well it fits the business type and goals.

CRITICAL RULES FOR RANKING:
1. **Industry Match is King**:
   - If the business is FITNESS (gym, trainer, yoga), rank 'fitness', 'health-wellness', or 'personal-brand' templates at the top (>90 score).
   - DO NOT recommend 'saas-product' or 'tech' templates for a fitness business (score < 40).
   - **NEVER** recommend 'Creative Portfolio' unless the business is explicitly an artist, designer, photographer, or portfolio.
   - If the business is a RESTAURANT, rank 'food-service' first.
2. **Visual Style**: Match the brand tone. 'Warm' tone shouldn't get a 'Cyberpunk' template.
3. **Functionality**: A portfolio needs an image gallery. A SaaS needs pricing tables.

## Response Format

Respond with ONLY valid JSON (no markdown code blocks):
{
  "recommendations": [
    {
      "templateId": "exact-template-id-from-list",
      "reasoning": "One compelling sentence explaining why this template is a good fit (or not)",
      "matchScore": 95
    }
  ]
}

IMPORTANT: You MUST include ALL ${templates.length} templates in your response, sorted by matchScore descending.`;
  }

  private buildUserPrompt(
    projectDescription: string,
    projectName: string | undefined,
    businessInfo: BusinessInfo,
  ): string {
    return `## Business Context

**Project Name**: ${projectName || 'Unnamed Project'}
**Description**: ${projectDescription}

**Unique Value Proposition**: ${businessInfo.uvp}
**Target Audience**: ${businessInfo.targetAudience}
**Business Goals**: ${businessInfo.businessGoals?.join(', ') || 'Not specified'}
**Brand Tone**: ${businessInfo.brandTone}
${businessInfo.pricingOffers ? `**Pricing/Offers**: ${businessInfo.pricingOffers}` : ''}
${businessInfo.industry ? `**Industry**: ${businessInfo.industry}` : ''}

Rank the templates for this business.`;
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Response Parsing
   * ──────────────────────────────────────────────────────────────────────────
   */

  private parseResponse(response: string): TemplateRecommendation[] {
    let cleaned = response.trim();

    // Clean up markdown code blocks if present
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }

    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }

    cleaned = cleaned.trim();

    const parsed = JSON.parse(cleaned) as {
      recommendations?: TemplateRecommendation[];
    };

    if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      throw new Error('Invalid LLM response format - missing recommendations array');
    }

    return parsed.recommendations;
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Response Helpers
   * ──────────────────────────────────────────────────────────────────────────
   */

  private createSuccessResponse(data: RecommendResponse): AgentResponse {
    return {
      message: this.createMessage('agent', JSON.stringify(data)),
      complete: true,
      toolCalls: [],
    };
  }

  private createErrorResponse(error: string): AgentResponse {
    const data: RecommendResponse = {
      success: false,
      recommendations: [],
      topCount: 0,
      error,
    };
    return {
      message: this.createMessage('agent', JSON.stringify(data)),
      complete: false,
      nextAction: 'Provide valid input',
    };
  }
}

/*
 * ============================================================================
 * Singleton
 * ============================================================================
 */

let templateRecommenderAgentInstance: TemplateRecommenderAgent | null = null;

export function getTemplateRecommenderAgent(): TemplateRecommenderAgent {
  if (!templateRecommenderAgentInstance) {
    templateRecommenderAgentInstance = new TemplateRecommenderAgent();
  }

  return templateRecommenderAgentInstance;
}

export function resetTemplateRecommenderAgent(): void {
  templateRecommenderAgentInstance = null;
}

