/**
 * Site Content Agent
 * 
 * Domain-specialized content generation for website creation.
 * Uses domain-specific prompts to generate optimized content
 * for different business types.
 */

// Import from centralized prompt system
import {
  detectDomain,
  getContentPrompt,
  getRecommendedSections,
  getDesignRecommendations,
  getConversionSettings,
  getSampleHeadlines,
  type BusinessContext,
  type SiteContent,
  type SectionContent,
  type DomainConfig,
} from './prompts';

// Re-export types and utilities
export * from './prompts';

// Import LLM (path will be adjusted when moved to actual location)
// import { generateCompletion } from '../llm';

/**
 * Content generation result
 */
export interface ContentGenerationResult {
  success: boolean;
  content?: SiteContent;
  domain: string;
  error?: string;
}

/**
 * Section generation options
 */
export interface GenerateSectionOptions {
  sectionType: string;
  context: BusinessContext;
  existingSections?: SectionContent[];
}

/**
 * Generate complete site content for a business
 */
export async function generateSiteContent(
  context: BusinessContext,
  // generateCompletion: (messages: any[], options: any) => Promise<string>,
): Promise<ContentGenerationResult> {
  const domain = detectDomain(context.description);
  
  try {
    // Get domain-specific prompt
    const systemPrompt = getContentPrompt(context);
    const sections = getRecommendedSections(context.description);
    const conversion = getConversionSettings(context.description);
    
    // Build user message with specific section requirements
    const userMessage = buildUserMessage(context, sections, conversion);
    
    // This would call the LLM
    // const response = await generateCompletion([
    //   { role: 'system', content: systemPrompt },
    //   { role: 'user', content: userMessage },
    // ], { model: 'anthropic/claude-sonnet-4', temperature: 0.7 });
    
    // For now, return structure (actual LLM call would parse response)
    return {
      success: true,
      domain: domain.id,
      content: undefined, // Would be parsed from LLM response
    };
    
  } catch (error) {
    return {
      success: false,
      domain: domain.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate content for a single section
 */
export async function generateSectionContent(
  options: GenerateSectionOptions,
  // generateCompletion: (messages: any[], options: any) => Promise<string>,
): Promise<SectionContent | null> {
  const { sectionType, context, existingSections } = options;
  const domain = detectDomain(context.description);
  
  const systemPrompt = `${getContentPrompt(context)}

TASK: Generate content for the ${sectionType.toUpperCase()} section only.
${existingSections ? `\nExisting sections for context: ${existingSections.map(s => s.type).join(', ')}` : ''}

Return JSON with this structure:
{
  "id": "${sectionType}",
  "type": "${sectionType}",
  "headline": "...",
  "subheadline": "...",
  "body": "...",
  "cta": { "text": "...", "action": "..." },
  "items": [{ "title": "...", "description": "..." }]
}`;

  // Would call LLM and parse response
  return null;
}

/**
 * Build the user message for content generation
 */
function buildUserMessage(
  context: BusinessContext,
  sections: { required: string[]; recommended: string[]; optional: string[] },
  conversion: DomainConfig['conversion'],
): string {
  const parts: string[] = [];
  
  parts.push(`Generate website content for: ${context.description}`);
  
  if (context.ownerName) {
    parts.push(`Business owner: ${context.ownerName}`);
  }
  if (context.location) {
    parts.push(`Location: ${context.location}`);
  }
  if (context.services && context.services.length > 0) {
    parts.push(`Services: ${context.services.join(', ')}`);
  }
  if (context.targetAudience) {
    parts.push(`Target audience: ${context.targetAudience}`);
  }
  if (context.uniqueApproach) {
    parts.push(`Unique approach: ${context.uniqueApproach}`);
  }
  
  parts.push('');
  parts.push(`REQUIRED SECTIONS: ${sections.required.join(', ')}`);
  parts.push(`RECOMMENDED SECTIONS: ${sections.recommended.join(', ')}`);
  parts.push('');
  parts.push(`PRIMARY CTA: "${conversion.primaryCta}"`);
  parts.push(`SECONDARY CTA: "${conversion.secondaryCta}"`);
  parts.push(`URGENCY LEVEL: ${conversion.urgencyLevel}`);
  
  parts.push('');
  parts.push('Return a JSON object with content for each section.');
  
  return parts.join('\n');
}

/**
 * Get content suggestions based on domain
 * Useful for UI hints and autocomplete
 */
export function getContentSuggestions(description: string): {
  headlines: string[];
  ctas: string[];
  sections: string[];
  designNotes: string[];
} {
  const domain = detectDomain(description);
  const sections = getRecommendedSections(description);
  const design = getDesignRecommendations(description);
  const conversion = getConversionSettings(description);
  
  return {
    headlines: getSampleHeadlines(description),
    ctas: [conversion.primaryCta, conversion.secondaryCta],
    sections: [...sections.required, ...sections.recommended],
    designNotes: [
      `Color mood: ${design.colorMoods.join(', ')}`,
      `Image style: ${design.imageStyle}`,
      `Layout: ${design.layoutStyle}`,
    ],
  };
}

/**
 * Validate content against domain best practices
 */
export function validateContent(
  content: SiteContent,
  description: string,
): { valid: boolean; warnings: string[] } {
  const domain = detectDomain(description);
  const sections = getRecommendedSections(description);
  const warnings: string[] = [];
  
  // Check required sections
  for (const required of sections.required) {
    const hasSection = content.sections.some(s => s.type === required) || 
                       (required === 'hero' && content.hero);
    if (!hasSection) {
      warnings.push(`Missing required section: ${required}`);
    }
  }
  
  // Check hero CTA exists
  if (!content.hero?.cta?.text) {
    warnings.push('Hero section should have a call-to-action');
  }
  
  // Domain-specific validations could go here
  // e.g., therapist sites should mention confidentiality
  
  return {
    valid: warnings.length === 0,
    warnings,
  };
}
