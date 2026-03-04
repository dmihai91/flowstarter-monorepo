import 'server-only';
import { models } from '@/lib/ai/openrouter-client';
import { MVP_INDUSTRIES, type IndustryId } from '@/lib/industries';
import type { PlatformType } from '@/types/project-config';
import { generateText } from 'ai';

export interface ClassificationResult {
  platformType: PlatformType;
  industry: string;
  confidence: {
    platformType: number;
    industry: number;
  };
}

const PLATFORM_TYPES: { id: PlatformType; description: string }[] = [
  {
    id: 'business-site',
    description:
      'Professional business website for companies, agencies, or services',
  },
  {
    id: 'personal-brand',
    description:
      'Personal brand or professional profile for individuals, coaches, consultants',
  },
  {
    id: 'portfolio',
    description:
      'Portfolio site to showcase creative work, projects, or professional achievements',
  },
];

function buildClassificationPrompt(userPrompt: string): string {
  const platformOptions = PLATFORM_TYPES.map(
    (p) => `- "${p.id}": ${p.description}`
  ).join('\n');

  const industryOptions = MVP_INDUSTRIES.map(
    (i) => `- "${i.id}": ${i.name} - ${i.description}`
  ).join('\n');

  return `You are a classification agent. Analyze the user's business description and classify it into the most appropriate platform type and industry.

USER'S BUSINESS DESCRIPTION:
"${userPrompt}"

AVAILABLE PLATFORM TYPES:
${platformOptions}

AVAILABLE INDUSTRIES:
${industryOptions}

INSTRUCTIONS:
1. Read the business description carefully
2. Choose the single best matching platform type based on the nature of the website needed
3. Choose the single best matching industry based on the business domain
4. Provide confidence scores (0.0 to 1.0) for each classification
5. If unsure, use "other" for industry and lower confidence scores

Respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{"platformType":"<id>","industry":"<id>","confidence":{"platformType":<0.0-1.0>,"industry":<0.0-1.0>}}`;
}

async function callOpenRouter(prompt: string): Promise<ClassificationResult> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  const { text: content } = await generateText({
    model: models.projectDetails,
    messages: [
      {
        role: 'system',
        content:
          'You are a precise classification agent. Always respond with valid JSON only, no markdown formatting.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.1, // Low temperature for consistent classification
    maxOutputTokens: 150,
  });

  if (!content) {
    throw new Error('No content in response');
  }

  // Parse JSON response, handling potential markdown wrapping
  const cleanContent = content
    .replace(/^```json\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();

  return JSON.parse(cleanContent);
}

function validateResult(result: unknown): ClassificationResult {
  const r = result as Record<string, unknown>;

  // Validate platformType
  const validPlatformTypes = PLATFORM_TYPES.map((p) => p.id);
  if (!validPlatformTypes.includes(r.platformType as PlatformType)) {
    r.platformType = 'business-site'; // Default fallback
  }

  // Validate industry
  const validIndustries = MVP_INDUSTRIES.map((i) => i.id);
  if (!validIndustries.includes(r.industry as IndustryId)) {
    r.industry = 'other'; // Default fallback
  }

  // Validate confidence scores
  const confidence = r.confidence as Record<string, number> | undefined;
  if (!confidence || typeof confidence !== 'object') {
    r.confidence = { platformType: 0.5, industry: 0.5 };
  } else {
    r.confidence = {
      platformType: Math.min(
        1,
        Math.max(0, Number(confidence.platformType) || 0.5)
      ),
      industry: Math.min(1, Math.max(0, Number(confidence.industry) || 0.5)),
    };
  }

  return r as unknown as ClassificationResult;
}

export async function classifyProject(
  userPrompt: string
): Promise<ClassificationResult> {
  const prompt = buildClassificationPrompt(userPrompt);

  try {
    const result = await callOpenRouter(prompt);
    return validateResult(result);
  } catch (error) {
    console.error('OpenRouter classification failed:', error);

    // Return safe defaults on error
    return {
      platformType: 'business-site',
      industry: 'other',
      confidence: {
        platformType: 0,
        industry: 0,
      },
    };
  }
}
