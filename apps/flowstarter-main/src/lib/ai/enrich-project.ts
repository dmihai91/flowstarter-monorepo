import { models } from '@/lib/ai/openrouter-client';
import { generateText } from 'ai';

export interface EnrichedProjectData {
  businessName: string;
  description: string;
  industry: string;
  targetAudience: string;
  uvp: string;
  goal: 'leads' | 'sales' | 'bookings';
  offerType: 'premium' | 'accessible' | 'free';
  brandTone: 'professional' | 'bold' | 'friendly';
  offerings: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  website: string;
}

function buildEnrichmentPrompt(userPrompt: string): string {
  return `You are a business analyst. From the user's description, extract all available information and intelligently fill in what's missing based on the context.

USER'S INPUT:
"${userPrompt}"

Extract or infer the following fields. For fields you can't determine, make a reasonable professional guess based on the business type and industry. Leave contact fields empty ("") if not mentioned.

Respond with ONLY valid JSON:
{
  "businessName": "Best guess for the business name (extract from text or suggest based on what they do)",
  "description": "A polished 1-2 sentence business description",
  "industry": "One of: health-wellness, beauty-salon, legal, real-estate, coaching, fitness, restaurant, photography, consulting, dental, veterinary, accounting, education, home-services, other",
  "targetAudience": "Who their ideal clients are (infer from business type)",
  "uvp": "What makes them unique / their key differentiator (infer a compelling one)",
  "goal": "One of: leads, sales, bookings (pick the most likely for this business type)",
  "offerType": "One of: premium, accessible, free (infer from context)",
  "brandTone": "One of: professional, bold, friendly (infer from context)",
  "offerings": "Their likely packages/services with estimated pricing in EUR (infer typical offerings for this type of business)",
  "contactEmail": "Extract if mentioned, otherwise empty string",
  "contactPhone": "Extract if mentioned, otherwise empty string",
  "contactAddress": "Extract if mentioned, otherwise empty string",
  "website": "Extract if mentioned, otherwise empty string"
}`;
}

export async function enrichProject(userPrompt: string): Promise<EnrichedProjectData> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const { text: content } = await generateText({
    model: models.projectDetails,
    messages: [
      {
        role: 'system',
        content: 'You are a precise business analyst. Always respond with valid JSON only, no markdown formatting. Prices should be in EUR (€).',
      },
      {
        role: 'user',
        content: buildEnrichmentPrompt(userPrompt),
      },
    ],
    temperature: 0.3,
    maxTokens: 600,
  });

  if (!content) {
    throw new Error('No content in enrichment response');
  }

  const cleanContent = content
    .replace(/^```json\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();

  const result = JSON.parse(cleanContent) as EnrichedProjectData;

  // Validate enums
  const validGoals = ['leads', 'sales', 'bookings'];
  if (!validGoals.includes(result.goal)) result.goal = 'leads';

  const validOfferTypes = ['premium', 'accessible', 'free'];
  if (!validOfferTypes.includes(result.offerType)) result.offerType = 'accessible';

  const validTones = ['professional', 'bold', 'friendly'];
  if (!validTones.includes(result.brandTone)) result.brandTone = 'professional';

  return result;
}
