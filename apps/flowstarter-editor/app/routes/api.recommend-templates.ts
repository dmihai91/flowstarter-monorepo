/**
 * LLM-Based Template Recommendations API Route
 *
 * Uses an LLM to intelligently match business info to the best templates.
 * The LLM receives a description of all available templates and the business
 * context to make informed, contextual recommendations.
 */

import { type ActionFunctionArgs, json } from '@remix-run/cloudflare';
import { createScopedLogger } from '~/utils/logger';
import type {
  Template,
  TemplatePalette,
  TemplateFont,
  TemplateRecommendation,
} from '~/components/editor/template-preview/types';
import type { BusinessInfo } from '~/components/editor/editor-chat/types';
import { recommendTemplates } from '~/lib/services/templateRecommendationAgent';

const logger = createScopedLogger('api.recommend-templates');

interface RecommendRequest {
  businessInfo: BusinessInfo;
  projectDescription: string;
  projectName: string;
}

interface RecommendResponse {
  success: true;
  recommendations: TemplateRecommendation[];
}

interface ErrorResponse {
  success: false;
  error: string;
}

interface LLMRecommendation {
  templateId: string;
  reasoning: string;
  matchScore: number;
}

/**
 * Get default palettes if template doesn't have them
 */
function getDefaultPalettes(): TemplatePalette[] {
  return [
    {
      id: 'modern',
      name: 'Modern',
      colors: { primary: '#3B82F6', secondary: '#8B5CF6', accent: '#60A5FA', background: '#0F172A', text: '#F8FAFC' },
    },
    {
      id: 'forest',
      name: 'Forest',
      colors: { primary: '#059669', secondary: '#10B981', accent: '#34D399', background: '#052E16', text: '#F0FDF4' },
    },
    {
      id: 'sunset',
      name: 'Sunset',
      colors: { primary: '#F97316', secondary: '#EA580C', accent: '#FB923C', background: '#1C1210', text: '#FFF7ED' },
    },
    {
      id: 'rose',
      name: 'Rose',
      colors: { primary: '#F43F5E', secondary: '#EC4899', accent: '#FB7185', background: '#1C1017', text: '#FFF1F2' },
    },
    {
      id: 'midnight',
      name: 'Midnight',
      colors: { primary: '#6366F1', secondary: '#8B5CF6', accent: '#818CF8', background: '#0F0F23', text: '#EEF2FF' },
    },
  ];
}

/**
 * Normalize palettes from MCP server to ensure they have required fields
 * - Adds `id` field derived from name (kebab-case) if missing
 * - Ensures `background` and `text` fields exist (with sensible defaults)
 */
function normalizePalettes(palettes: any[] | undefined): TemplatePalette[] {
  if (!palettes || !Array.isArray(palettes) || palettes.length === 0) {
    return getDefaultPalettes();
  }

  return palettes.map((p, index) => {
    // Generate id from name or use index-based fallback
    const id = p.id || (p.name ? p.name.toLowerCase().replace(/\s+/g, '-') : `palette-${index}`);

    // Ensure colors object has all required fields
    const colors = p.colors || {};
    return {
      id,
      name: p.name || `Palette ${index + 1}`,
      colors: {
        primary: colors.primary || '#3B82F6',
        secondary: colors.secondary || '#8B5CF6',
        accent: colors.accent || '#60A5FA',
        background: colors.background || '#0F172A',
        text: colors.text || '#F8FAFC',
      },
    };
  });
}

/**
 * Get default fonts if template doesn't have them
 */
function getDefaultFonts(): TemplateFont[] {
  return [
    { id: 'modern', name: 'Modern', heading: 'Inter', body: 'Inter', googleFonts: 'Inter:wght@400;500;600;700' },
    {
      id: 'elegant',
      name: 'Elegant',
      heading: 'Playfair Display',
      body: 'Lato',
      googleFonts: 'Playfair+Display:wght@400;500;600;700&family=Lato:wght@400;700',
    },
    {
      id: 'bold',
      name: 'Bold',
      heading: 'Montserrat',
      body: 'Open Sans',
      googleFonts: 'Montserrat:wght@500;600;700&family=Open+Sans:wght@400;500;600',
    },
    {
      id: 'minimal',
      name: 'Minimal',
      heading: 'DM Sans',
      body: 'DM Sans',
      googleFonts: 'DM+Sans:wght@400;500;600;700',
    },
    {
      id: 'classic',
      name: 'Classic',
      heading: 'Merriweather',
      body: 'Source Sans Pro',
      googleFonts: 'Merriweather:wght@400;700&family=Source+Sans+Pro:wght@400;600',
    },
  ];
}

/**
 * Build the system prompt describing all available templates
 */
function buildSystemPrompt(templates: Template[]): string {
  const templateDescriptions = templates
    .map((t) => {
      return `- **${t.id}** (${t.name}): ${t.description} [Category: ${t.category}]`;
    })
    .join('\n');

  return `You are an expert web design consultant helping match businesses with the perfect website template.

## Available Templates

${templateDescriptions}

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
2. **Penalize mismatches**: 'Creative Portfolio' is ONLY for artists/designers/photographers. Score it < 30 for any non-creative business. 'Consultant Pro' is for consulting firms, not fitness/health businesses — score it < 50 for non-business industries.
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

/**
 * Build the user prompt with business context
 */
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

/**
 * Parse LLM response into recommendations
 */
function parseLLMResponse(response: string): LLMRecommendation[] {
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
    recommendations?: LLMRecommendation[];
  };

  if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
    throw new Error('Invalid LLM response format - missing recommendations array');
  }

  return parsed.recommendations;
}

/**
 * POST /api/recommend-templates
 */
export async function action({ context, request }: ActionFunctionArgs): Promise<Response> {
  try {
    const body = (await request.json()) as RecommendRequest;
    const { businessInfo, projectDescription, projectName } = body;

    if (!businessInfo || !projectDescription) {
      return json<ErrorResponse>(
        { success: false, error: 'Missing businessInfo or projectDescription' },
        { status: 400 },
      );
    }

    logger.info(`Recommending templates for: ${projectName || projectDescription.slice(0, 50)}`);

    /*
     * Fetch all templates from the MCP server
     * Add cache buster to ensure fresh list
     * Add 5s timeout to prevent hanging
     */
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let templatesData: any = { success: false };

    try {
      const templatesResponse = await fetch(`${new URL(request.url).origin}/api/templates?refresh=1&t=${Date.now()}`, {
        signal: controller.signal,
      });
      templatesData = await templatesResponse.json();
    } catch (e) {
      logger.warn('Failed to fetch templates (timeout or error), using fallbacks', e);
    } finally {
      clearTimeout(timeoutId);
    }

    if (!templatesData.success) {
      logger.warn('Template fetch unsuccessful, proceeding with known templates');
    }

    // Parse templates from MCP response
    let templates: Template[] = [];

    if (templatesData.data?.templates) {
      templates = templatesData.data.templates.map((t: any) => ({
        id: t.slug,
        name: t.displayName,
        description: t.description,
        thumbnail: t.thumbnailUrl || '',
        category: t.category,
        theme: t.theme,
        palettes: normalizePalettes(t.palettes),
        fonts: t.fonts && t.fonts.length > 0 ? t.fonts : getDefaultFonts(),
      }));
    } else if (templatesData.data?.content?.[0]?.text) {
      try {
        const parsed = JSON.parse(templatesData.data.content[0].text);
        templates = (parsed.templates || []).map((t: any) => ({
          id: t.slug,
          name: t.displayName,
          description: t.description,
          thumbnail: t.thumbnailUrl || '',
          category: t.category,
          theme: t.theme,
          palettes: normalizePalettes(t.palettes),
          fonts: t.fonts && t.fonts.length > 0 ? t.fonts : getDefaultFonts(),
        }));
      } catch {
        logger.error('Failed to parse MCP response');
      }
    }

    /*
     * INJECT MISSING TEMPLATES (Virtual Templates)
     * This ensures we always have a good variety even if the backend only returns a few
     */
    const knownTemplates = [
      {
        id: 'modern-business',
        name: 'Modern Business',
        category: 'local-business',
        description: 'A versatile, clean template for any business.',
      },
      {
        id: 'fitness-studio',
        name: 'Fitness Studio',
        category: 'fitness',
        description: 'Energetic design for gyms, trainers, and yoga studios.',
      },
      {
        id: 'restaurant-page',
        name: 'Restaurant',
        category: 'food-service',
        description: 'Appetizing design with menu and reservation features.',
      },
      {
        id: 'local-service',
        name: 'Local Service',
        category: 'local-business',
        description: 'Trustworthy design for plumbers, electricians, and contractors.',
      },
      {
        id: 'saas-landing',
        name: 'SaaS Landing',
        category: 'saas-product',
        description: 'High-conversion landing page for software products.',
      },
      {
        id: 'real-estate-pro',
        name: 'Real Estate',
        category: 'real-estate',
        description: 'Property listings and agent profiles.',
      },
      {
        id: 'agency-modern',
        name: 'Digital Agency',
        category: 'creative',
        description: 'Professional showcase for agencies and consultancies.',
      },
      {
        id: 'minimal-blog',
        name: 'Minimal Blog',
        category: 'blog',
        description: 'Content-focused layout for writers and publishers.',
      },
      {
        id: 'creative-portfolio',
        name: 'Creative Portfolio',
        category: 'creative',
        description: 'Showcase your work with style and bold visuals.',
      },
    ];

    // DISABLED: Virtual template injection - only recommend templates that actually exist
    // const existingIds = new Set(templates.map((t) => t.id));
    // for (const t of knownTemplates) {
    //   if (!existingIds.has(t.id)) {
    //     templates.push({...});
    //   }
    // }

    logger.info(`Fetched ${templates.length} templates: ${templates.map((t) => t.id).join(', ')}`);

    if (templates.length === 0) {
      return json<ErrorResponse>({ success: false, error: 'No templates available' }, { status: 503 });
    }

    // Get API keys from environment
    const env = (context.cloudflare?.env || process.env) as unknown as Record<string, string>;
    const openRouterApiKey = env.OPEN_ROUTER_API_KEY || env.OPENROUTER_API_KEY;
    const groqApiKey = env.GROQ_API_KEY;

    // Use template recommendation agent
    const agentResult = await recommendTemplates(templates, projectDescription, projectName, {
      uvp: businessInfo.uvp || '',
      targetAudience: businessInfo.targetAudience || '',
      brandTone: businessInfo.brandTone || '',
      businessGoals: businessInfo.businessGoals,
      pricingOffers: businessInfo.pricingOffers,
      industry: businessInfo.industry,
    });

    const llmRecs = agentResult.recommendations;

    // Create a map for quick lookup
    const templateMap = new Map(templates.map((t) => [t.id, t]));
    const recommendations: TemplateRecommendation[] = [];
    const usedIds = new Set<string>();

    /*
     * Process recommendations
     * 1. Add LLM ranked templates (rec is FullTemplateRecommendation with .template object)
     */
    for (const rec of llmRecs) {
      // rec.template already contains the full template object
      recommendations.push({
        template: rec.template,
        palettes: normalizePalettes(rec.template.palettes),
        fonts: rec.template.fonts && rec.template.fonts.length > 0 ? rec.template.fonts : getDefaultFonts(),
        reasoning: rec.reasoning,
        matchScore: rec.matchScore || 0,
      });
      usedIds.add(rec.template.id);
    }

    // Only return templates that scored above the threshold — no zero-score fallbacks
    return json<RecommendResponse>({
      success: true,
      recommendations,
    });
  } catch (error) {
    logger.error('Failed to recommend templates:', error);
    return json<ErrorResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to recommend templates',
      },
      { status: 500 },
    );
  }
}

