import { buildCategoryPromptContext } from '~/lib/config/supported-categories';
import { generateCompletion } from './llm';
import { createScopedLogger } from '~/utils/logger';
import type {
  Template,
  TemplatePalette,
  TemplateFont,
  TemplateTheme,
} from '~/components/editor/template-preview/types';

const logger = createScopedLogger('TemplateRecommendationAgent');

/**
 * Template Recommendation Agent
 *
 * Uses LLM to intelligently match business information with website templates.
 * Provides ranked recommendations with reasoning and match scores.
 */

// ─── TYPES ─────────────────────────────────────────────────────────────────

// Re-export for convenience
export type { Template, TemplatePalette, TemplateFont, TemplateTheme };

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

export interface RecommendationResult {
  recommendations: FullTemplateRecommendation[];
  success: boolean;
  topCount?: number;
}

// ─── SYSTEM PROMPT ─────────────────────────────────────────────────────────

function buildSystemPrompt(templates: Template[]): string {
  const templateDescriptions = templates
    .map((t) => {
      return `- **${t.id}** (${t.name}): ${t.description} [Category: ${t.category}]`;
    })
    .join('\n');

  return `You are an expert web design consultant helping independent service professionals (coaches, therapists, trainers, stylists, content creators) find the perfect website template.

## Available Templates

${templateDescriptions}

## Supported Business Categories

The platform currently focuses on independent service professionals:
${buildCategoryPromptContext()}

## Your Task

Analyze the business information provided and RANK the available templates from best match to least match.
Assign a Match Score (0-100) to each template based on how well it fits the business type and goals.

CRITICAL RULES FOR RANKING:
1. **Category Match is King** — match the template [Category] to the business industry:
   - FITNESS business (gym, trainer, yoga, coaching) → templates with [Category: fitness] or [Category: health-fitness] MUST be ranked #1 (score 95+). Score all other categories < 55.
   - RESTAURANT/FOOD/CAFE/COFFEE SHOP business → [Category: food-service] MUST be #1 (score 95+). Score all other categories < 55.
   - REAL ESTATE → [Category: real-estate] MUST be #1.
   - HEALTHCARE (dentist, doctor, clinic) → [Category: healthcare] or [Category: health] MUST be #1.
   - EDUCATION → [Category: education] MUST be #1.
   - SaaS/SOFTWARE → [Category: saas-product] MUST be #1.
   - CONSULTING/BUSINESS → [Category: business] should be #1.
   - CREATIVE (artist, photographer, designer) → [Category: personal-brand] or [Category: creative] should be #1.
2. **Penalize category mismatches HARD**: When a direct category match exists (e.g., food-service for restaurants, fitness for gyms), ALL non-matching categories MUST score below 55. Specifically:
   - 'Consultant Pro' (business) is ONLY for consulting/coaching firms — score < 45 for food, fitness, healthcare, education, creative businesses.
   - 'Creative Portfolio' is ONLY for artists/designers/photographers — score < 30 for everything else.
   - 'Tutor Online' (education) is ONLY for educators/tutors — score < 40 for non-education businesses.
   - 'SaaS Landing' is ONLY for software products — score < 35 for brick-and-mortar businesses.
   - Templates with [Category: local-business] or [Category: business] are acceptable fallbacks (score 55-70) when no perfect category match exists.
3. **Visual Style**: Match the brand tone to the template aesthetic.
4. **Functionality**: A portfolio needs galleries. A SaaS needs pricing. A fitness site needs booking/scheduling.

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

// ─── USER PROMPT ───────────────────────────────────────────────────────────

function buildUserPrompt(
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

// ─── AGENT FUNCTION ────────────────────────────────────────────────────────

/**
 * Get template recommendations based on business information
 * Returns top 3 templates with scores >= 60, with full template objects including palettes
 */
export async function recommendTemplates(
  templates: Template[],
  projectDescription: string,
  projectName: string | undefined,
  businessInfo: BusinessInfo,
  topN: number = 3,
  minScore: number = 60,
): Promise<RecommendationResult> {
  if (templates.length === 0) {
    logger.warn('No templates provided');
    return {
      recommendations: [],
      success: false,
      topCount: 0,
    };
  }

  try {
    const systemPrompt = buildSystemPrompt(templates);
    const userPrompt = buildUserPrompt(projectDescription, projectName, businessInfo);

    logger.info(`Recommending from ${templates.length} templates (min score: ${minScore})`);

    const response = await generateCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        // Use Kimi K2.5 via OpenRouter for template recommendations
        model: 'google/gemini-2.5-flash',
        temperature: 0.3,
        maxTokens: 2000,
      },
    );

    // Parse response
    const llmRecommendations = parseResponse(response);

    // Create template map for quick lookup
    const templateMap = new Map(templates.map((t) => [t.id, t]));

    // Sort by score descending
    llmRecommendations.sort((a, b) => b.matchScore - a.matchScore);

    // Filter by minimum score, but always include at least 3 recommendations
    const MIN_RECOMMENDATIONS = 3;
    const aboveThreshold = llmRecommendations.filter((rec) => rec.matchScore >= minScore);
    const filteredRecommendations =
      aboveThreshold.length >= MIN_RECOMMENDATIONS
        ? aboveThreshold.slice(0, topN)
        : llmRecommendations.slice(0, Math.max(MIN_RECOMMENDATIONS, aboveThreshold.length)).slice(0, topN);

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
        logger.warn(`Template ${rec.templateId} not found in template list`);
      }
    }

    const count = fullRecommendations.length;

    if (count === 0) {
      logger.warn(`No templates met minimum score threshold of ${minScore}`);
    } else if (count < topN) {
      logger.info(`Only ${count} template(s) met minimum score of ${minScore}`);
    }

    logger.info(
      `Recommended ${count} template(s): ${fullRecommendations.map((r) => `${r.template.id}(${r.matchScore})`).join(', ')}`,
    );

    return {
      recommendations: fullRecommendations,
      success: true,
      topCount: count,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error('Template recommendation failed:', errMsg);
    console.error('[TemplateRecommendationAgent] Full error:', error);

    // Fallback: throw error instead of returning a low-quality fallback
    throw new Error(`Failed to generate template recommendations: ${errMsg}`);
  }
}

/**
 * Parse LLM response into recommendations
 */
function parseResponse(response: string): TemplateRecommendation[] {
  // Clean up markdown code blocks if present
  let cleaned = response.trim();

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




