/**
 * Phase 1: Architect — Creates a comprehensive Design Brief using Opus 4.
 */

import type { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { trackLLMUsage } from '~/lib/.server/llm/cost-tracker';
import { generateText } from 'ai';
import { createScopedLogger } from '~/utils/logger';
import type { BusinessInfo, DesignBrief } from './types';
import { ARCHITECT_MODEL } from './types';

const logger = createScopedLogger('template-customize.architect');

const ARCHITECT_SYSTEM = `You are a WORLD-CLASS BRAND STRATEGIST and COPYWRITER.

Your job is to create a comprehensive Design Brief that will guide the customization of a website template.

The brief must be:
- SPECIFIC to this exact business (no generic copy)
- COMPELLING and conversion-focused
- CONSISTENT in voice and messaging
- PROFESSIONAL yet approachable

You will output a JSON object with the exact structure specified.`;

function buildArchitectPrompt(
  projectDescription: string,
  businessInfo: BusinessInfo | undefined,
  templateName: string | undefined,
  fileList: string[],
): string {
  const businessBlock = businessInfo
    ? `\nBUSINESS DETAILS:
- Unique Value Proposition: "${businessInfo.uvp}"
- Target Audience: "${businessInfo.targetAudience}"
- Goals: ${businessInfo.businessGoals.join(', ')}
- Brand Tone: "${businessInfo.brandTone}"
${businessInfo.pricingOffers ? `- Pricing/Offers: "${businessInfo.pricingOffers}"` : ''}\n`
    : '';

  return `Create a Design Brief for this business:

PROJECT: ${templateName || 'Business Website'}
DESCRIPTION: ${projectDescription}
${businessBlock}
FILES TO CUSTOMIZE:
${fileList.slice(0, 20).join('\n')}

Create a comprehensive Design Brief as JSON with this EXACT structure:
{
  "brandPersonality": "2-3 sentence description of the brand's personality",
  "toneGuidelines": "specific guidance on writing tone",
  "heroHeadline": "compelling 5-10 word headline",
  "heroSubheadline": "supporting 10-20 word subheadline",
  "tagline": "memorable 3-7 word tagline",
  "valuePropositions": ["prop 1", "prop 2", "prop 3"],
  "keyBenefits": ["benefit 1", "benefit 2", "benefit 3", "benefit 4"],
  "socialProof": "social proof statement",
  "primaryCTA": "main call-to-action text",
  "secondaryCTA": "secondary call-to-action text",
  "aboutSection": { "headline": "about section headline", "paragraph": "2-3 sentence about paragraph" },
  "servicesSection": {
    "headline": "services headline",
    "items": [
      {"title": "Service 1", "description": "brief description"},
      {"title": "Service 2", "description": "brief description"},
      {"title": "Service 3", "description": "brief description"}
    ]
  },
  "contactSection": { "headline": "contact headline", "subheadline": "encouraging subheadline" },
  "colorUsage": {
    "primary": "when to use primary color",
    "secondary": "when to use secondary color",
    "accent": "when to use accent color"
  },
  "avoidList": ["thing to avoid 1", "thing to avoid 2", "thing to avoid 3"]
}

IMPORTANT:
- Make ALL copy specific to THIS business
- NO generic phrases like "Welcome to our website" or "We're passionate about..."
- NO buzzwords like "revolutionize", "leverage", "synergy"
- Keep everything concise and punchy
- The hero headline should be MEMORABLE and UNIQUE

Output ONLY the JSON object, no markdown.`;
}

function buildFallbackBrief(
  projectDescription: string,
  businessInfo: BusinessInfo | undefined,
  templateName: string | undefined,
): DesignBrief {
  return {
    brandPersonality: `Professional and trustworthy ${templateName || 'business'}`,
    toneGuidelines: 'Clear, confident, and approachable',
    heroHeadline: businessInfo?.uvp?.slice(0, 50) || 'Your Success Starts Here',
    heroSubheadline: projectDescription.slice(0, 100),
    tagline: 'Excellence Delivered',
    valuePropositions: businessInfo?.businessGoals || ['Quality', 'Trust', 'Results'],
    keyBenefits: ['Professional service', 'Expert team', 'Proven results', 'Customer focus'],
    socialProof: 'Trusted by businesses worldwide',
    primaryCTA: 'Get Started',
    secondaryCTA: 'Learn More',
    aboutSection: { headline: 'About Us', paragraph: projectDescription.slice(0, 200) },
    servicesSection: {
      headline: 'What We Offer',
      items: [
        { title: 'Service One', description: 'Professional service delivery' },
        { title: 'Service Two', description: 'Expert consultation' },
        { title: 'Service Three', description: 'Ongoing support' },
      ],
    },
    contactSection: { headline: 'Get In Touch', subheadline: "We'd love to hear from you" },
    colorUsage: {
      primary: 'CTAs, headers, key elements',
      secondary: 'Backgrounds, cards, sections',
      accent: 'Highlights, hover states, icons',
    },
    avoidList: ['Generic greetings', 'Buzzwords', 'Walls of text'],
  };
}

export async function createDesignBrief(
  openRouter: ReturnType<typeof createOpenRouter>,
  projectDescription: string,
  businessInfo: BusinessInfo | undefined,
  templateName: string | undefined,
  fileList: string[],
): Promise<DesignBrief> {
  const model = openRouter.chat(ARCHITECT_MODEL) as any;
  const userPrompt = buildArchitectPrompt(projectDescription, businessInfo, templateName, fileList);

  try {
    const result = await generateText({
      model,
      system: ARCHITECT_SYSTEM,
      prompt: userPrompt,
      maxTokens: 4000,
      temperature: 0.7,
    });

    const brief = JSON.parse(result.text.trim()) as DesignBrief;
    logger.info('Design Brief created successfully');
    return brief;
  } catch (error) {
    logger.error('Failed to create Design Brief:', error);
    return buildFallbackBrief(projectDescription, businessInfo, templateName);
  }
}
