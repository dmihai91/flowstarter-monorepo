import 'server-only';
import { models } from '@/lib/ai/openrouter-client';
import { generateText } from 'ai';

export interface EnrichedProjectData {
  siteName: string;
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
}

export interface ClarificationResult {
  status: 'needsMoreInfo';
  followUpQuestions: string[];
}

export interface CompleteResult extends EnrichedProjectData {
  status: 'complete';
}

export type EnrichmentResult = CompleteResult | ClarificationResult;

function buildEnrichmentPrompt(userPrompt: string): string {
  return `You are a business analyst. Analyze the user's description and decide whether you have enough context to build a complete project brief.

USER'S INPUT:
"${userPrompt}"

STEP 1 — Evaluate completeness:
A description is SUFFICIENT if it mentions at least: the type of business AND either location, services, or target audience.
A description is INSUFFICIENT if it is too vague (e.g. just a business name, a single word, or no clear business type).

STEP 2 — Respond accordingly:

IF INSUFFICIENT, respond with:
{
  "status": "needsMoreInfo",
  "followUpQuestions": ["Question 1?", "Question 2?", "Question 3?"]
}
Ask 2-4 specific, actionable follow-up questions to gather the missing info. Questions MUST be in the SAME LANGUAGE as the user's input.

IF SUFFICIENT, extract and enrich the data. Respond with:
{
  "status": "complete",
  "siteName": "A short, catchy website name for this business (e.g. 'Smile Dental', 'Peak Fitness Studio')",
  "description": "A polished 1-2 sentence business description",
  "industry": "One of: health-wellness, beauty-salon, legal, real-estate, coaching, fitness, restaurant, photography, consulting, dental, veterinary, accounting, education, home-services, other",
  "targetAudience": "Who their ideal clients are",
  "uvp": "What makes them unique / key differentiator",
  "goal": "One of: leads, sales, bookings",
  "offerType": "One of: premium, accessible, free",
  "brandTone": "One of: professional, bold, friendly",
  "offerings": "Plain text summary of packages/services with pricing in EUR. Do NOT return arrays.",
  "contactEmail": "ONLY if explicitly mentioned, otherwise empty string",
  "contactPhone": "ONLY if explicitly mentioned, otherwise empty string",
  "contactAddress": "ONLY if explicitly mentioned, otherwise empty string"
}

IMPORTANT language rules:
- ALL text values (siteName, description, targetAudience, uvp, offerings, followUpQuestions) MUST be in the SAME LANGUAGE as the user's input.
- ONLY JSON keys and enum values (industry, goal, offerType, brandTone, status) stay in English.
- For CONTACT fields: ONLY extract if explicitly mentioned. Do NOT fabricate.
- For OFFERINGS: infer typical packages for this business type with estimated pricing in EUR.

IMPORTANT writing style:
- Write naturally, like a human copywriter. No AI-sounding language.
- NEVER use em dashes (—), semicolons in marketing copy, or filler words like "leverage", "elevate", "unlock", "empower", "cutting-edge", "state-of-the-art".
- Use commas, periods, and simple connectors instead of em dashes.
- Keep descriptions direct, warm, and conversational. Avoid corporate buzzwords.

Respond with ONLY valid JSON.`;
}

export async function enrichProject(
  userPrompt: string
): Promise<EnrichmentResult> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const { text: content } = await generateText({
    model: models.projectDetails,
    messages: [
      {
        role: 'system',
        content:
          'You are a precise business analyst. Always respond with valid JSON only, no markdown formatting. Prices should be in EUR (\u20ac). Match the language of the user input for all text values. Write naturally like a human copywriter. Never use em dashes, semicolons in marketing text, or AI-typical words like leverage, elevate, unlock, empower, cutting-edge, state-of-the-art.',
      },
      {
        role: 'user',
        content: buildEnrichmentPrompt(userPrompt),
      },
    ],
    temperature: 0.3,
    maxOutputTokens: 700,
  });

  if (!content) {
    throw new Error('No content in enrichment response');
  }

  const cleanContent = content
    .replace(/^```json\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();

  const raw = JSON.parse(cleanContent);

  // If AI says it needs more info, return clarification
  if (raw.status === 'needsMoreInfo') {
    const questions = Array.isArray(raw.followUpQuestions)
      ? raw.followUpQuestions.filter(
          (q: unknown) => typeof q === 'string' && q.trim()
        )
      : [];

    // Fallback: if no questions returned, treat as complete with defaults
    if (questions.length === 0) {
      raw.status = 'complete';
    } else {
      return { status: 'needsMoreInfo', followUpQuestions: questions };
    }
  }

  // Normalize offerings — AI sometimes returns array of objects instead of string
  if (raw.offerings && typeof raw.offerings !== 'string') {
    if (Array.isArray(raw.offerings)) {
      raw.offerings = raw.offerings
        .map((o: Record<string, unknown>) =>
          typeof o === 'string'
            ? o
            : `${o.name || o.service || ''} - ${o.price || ''}`
        )
        .filter(Boolean)
        .join(', ');
    } else {
      raw.offerings = JSON.stringify(raw.offerings);
    }
  }

  const result = raw as CompleteResult;
  result.status = 'complete';

  // Validate enums
  const validGoals = ['leads', 'sales', 'bookings'];
  if (!validGoals.includes(result.goal)) result.goal = 'leads';

  const validOfferTypes = ['premium', 'accessible', 'free'];
  if (!validOfferTypes.includes(result.offerType)) result.offerType = 'accessible';

  const validTones = ['professional', 'bold', 'friendly'];
  if (!validTones.includes(result.brandTone)) result.brandTone = 'professional';

  return result;
}
