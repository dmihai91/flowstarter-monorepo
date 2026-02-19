/**
 * Business Info Generation API Route
 *
 * Generates comprehensive business information from a project description using LLM:
 * - UVP (Unique Value Proposition)
 * - Target Audience
 * - Business Goals
 * - Brand Tone/Voice
 * - Pricing/Offers (if applicable)
 */

import { type ActionFunctionArgs, json } from '@remix-run/cloudflare';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.generate-business-info');

interface BusinessInfoRequest {
  projectDescription: string;
  projectName?: string;
}

export interface BusinessInfo {
  uvp: string;
  targetAudience: string;
  businessGoals: string[];
  brandTone: string;
  pricingOffers?: string;
}

interface BusinessInfoResponse {
  success: true;
  info: BusinessInfo;
}

interface BusinessInfoError {
  success: false;
  error: string;
  errorType: 'no_api_keys' | 'llm_failed' | 'parse_error' | 'unknown';
  message: string;
  canRetry: boolean;
}

export async function action({ context, request }: ActionFunctionArgs) {
  try {
    const body = (await request.json()) as BusinessInfoRequest;
    const { projectDescription, projectName } = body;

    if (!projectDescription) {
      return json<BusinessInfoError>(
        {
          success: false,
          error: 'Project description is required',
          errorType: 'unknown',
          message: 'Please provide a project description.',
          canRetry: false,
        },
        { status: 400 },
      );
    }

    logger.info(`Generating business info for: "${projectDescription.substring(0, 50)}..."`);

    // Get API keys from environment (check both naming conventions)
    const env = (context.cloudflare?.env || process.env) as unknown as Record<string, string>;
    const openRouterApiKey = env.OPEN_ROUTER_API_KEY || env.OPENROUTER_API_KEY;
    const groqApiKey = env.GROQ_API_KEY;

    logger.info(`API keys available - OpenRouter: ${!!openRouterApiKey}, Groq: ${!!groqApiKey}`);

    if (!openRouterApiKey && !groqApiKey) {
      logger.error('No API keys configured (GROQ_API_KEY or OPENROUTER_API_KEY)');

      return json<BusinessInfoError>(
        {
          success: false,
          error: 'Service unavailable',
          errorType: 'no_api_keys',
          message: 'Unable to generate business information right now. Please try again later.',
          canRetry: true,
        },
        { status: 503 },
      );
    }

    const systemPrompt = buildBusinessInfoPrompt();
    const userPrompt = buildUserPrompt(projectDescription, projectName);

    let responseText: string | null = null;

    // Try OpenRouter with Claude first
    if (openRouterApiKey) {
      logger.info('Trying OpenRouter API for business info generation...');

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openRouterApiKey}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 700,
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        responseText = data.choices?.[0]?.message?.content?.trim() || null;

        if (responseText) {
          logger.info('OpenRouter response received');
        }
      } else {
        logger.warn(`OpenRouter API failed: ${response.status}`);
      }
    }

    // Try Groq as fallback
    if (!responseText && groqApiKey) {
      logger.info('Trying Groq API as fallback...');

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 700,
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        responseText = data.choices?.[0]?.message?.content?.trim() || null;

        if (responseText) {
          logger.info('Groq response received');
        }
      } else {
        logger.warn(`Groq API failed: ${response.status}`);
      }
    }

    // Parse the response
    if (responseText) {
      try {
        const info = parseBusinessInfoResponse(responseText);
        logger.info('Successfully parsed business info');

        // Return both formats for compatibility
        return json({ success: true, info, businessInfo: info });
      } catch (parseError) {
        logger.error('Failed to parse LLM response:', parseError);

        return json<BusinessInfoError>(
          {
            success: false,
            error: 'Failed to parse response',
            errorType: 'parse_error',
            message: 'Failed to understand the AI response. Please try again.',
            canRetry: true,
          },
          { status: 500 },
        );
      }
    }

    // LLM calls failed
    logger.error('All LLM calls failed - no response received');

    return json<BusinessInfoError>(
      {
        success: false,
        error: 'LLM calls failed',
        errorType: 'llm_failed',
        message: 'Failed to generate business information. Please try again.',
        canRetry: true,
      },
      { status: 500 },
    );
  } catch (error) {
    logger.error('Error generating business info:', error);

    return json<BusinessInfoError>(
      {
        success: false,
        error: 'Unknown error',
        errorType: 'unknown',
        message: 'Something went wrong. Please try again.',
        canRetry: true,
      },
      { status: 500 },
    );
  }
}

function buildBusinessInfoPrompt(): string {
  return `You are a creative brand strategist who helps entrepreneurs build businesses people genuinely connect with. Your job is to craft business positioning that feels HUMAN and WARM, not corporate and generic.

Based on the project description, generate business information that feels authentic and inspiring.

YOUR PHILOSOPHY:
- Write like you're talking to a friend starting their dream business
- Avoid corporate jargon and buzzwords (no "leverage", "synergy", "best-in-class", "cutting-edge", "solutions")
- Focus on the genuine human value the business provides
- Make the business feel approachable and relatable
- Think boutique café energy, not Fortune 500 corporate speak

Generate the following:

1. UVP (Unique Value Proposition)
   - 1-2 sentences that capture the HEART of what makes this business special
   - Focus on the transformation or feeling customers get, not features
   - Write it like a warm invitation, not a sales pitch
   - Start with something that resonates emotionally, then explain the value
   - AVOID: corporate language, buzzwords, "we help X achieve Y" formulas

2. Target Audience
   - Describe the ideal customers as REAL PEOPLE with real lives
   - Be specific but warm—paint a picture of who they are
   - Include their aspirations, struggles, or what they're hoping for
   - AVOID: demographic-only descriptions, marketing speak, "target segments"

3. Business Goals (3 goals)
   - Make them specific, inspiring, and human-centered
   - Focus on impact and meaning, not just metrics
   - Each goal should feel achievable and exciting
   - AVOID: generic business goals, purely financial targets, corporate objectives

4. Brand Tone
   - 2-4 words that capture the personality authentically
   - Think of how a friend would describe the vibe after visiting
   - Make it specific to this business, not generic
   - AVOID: overused combinations, anything that sounds like marketing copy

5. Pricing/Offers (if applicable)
   - Suggest pricing that feels fair and accessible for the target audience
   - Frame offers in a welcoming, low-pressure way
   - Make it feel inviting to get started
   - Leave empty if not applicable to the business type

Respond with ONLY valid JSON:
{
  "uvp": "Your unique, warm value proposition specific to this business",
  "targetAudience": "Description of the real people this serves",
  "businessGoals": ["Goal 1", "Goal 2", "Goal 3"],
  "brandTone": "Authentic tone description",
  "pricingOffers": "Welcoming pricing approach (or empty string if N/A)"
}

IMPORTANT: Generate content that is 100% unique to the project description provided. Do not use generic templates or filler text.`;
}

function buildUserPrompt(description: string, name?: string): string {
  if (name) {
    return `Project Name: ${name}\nProject Description: ${description}`;
  }

  return `Project Description: ${description}`;
}

function parseBusinessInfoResponse(response: string): BusinessInfo {
  // Clean up markdown code blocks if present
  let cleaned = response.trim();

  // Try to find JSON object within the text if it's not pure JSON
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  // Remove markdown wrappers if they still exist
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }

  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned) as {
      uvp?: string;
      targetAudience?: string;
      businessGoals?: string[];
      brandTone?: string;
      pricingOffers?: string;
    };

    // Validate required fields
    if (!parsed.uvp || !parsed.targetAudience || !parsed.businessGoals || !parsed.brandTone) {
      throw new Error('Missing required fields in LLM response');
    }

    return {
      uvp: parsed.uvp,
      targetAudience: parsed.targetAudience,
      businessGoals: Array.isArray(parsed.businessGoals) ? parsed.businessGoals.slice(0, 3) : [],
      brandTone: parsed.brandTone,
      pricingOffers: parsed.pricingOffers || undefined,
    };
  } catch (e) {
    console.error('Failed to parse JSON:', cleaned);
    throw e;
  }
}

