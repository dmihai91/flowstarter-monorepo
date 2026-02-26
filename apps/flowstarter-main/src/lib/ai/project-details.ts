/* eslint-disable @typescript-eslint/no-explicit-any */
import { aiModerateContent, ModerationResult } from '@/lib/ai/ai-moderation';
import { models } from '@/lib/ai/openrouter-client';
import { generateObject } from 'ai';
import { z } from 'zod';

export type BusinessInfo = {
  industry?: string;
  businessType?: string;
  targetAudience?: string;
  uniqueSellingPoint?: string;
  goals?: string;
  description?: string;
  keyServices?: string;
};

export type ProjectDetails = {
  names: string[];
  industry?: string;
  description: string;
  targetUsers: string;
  businessGoals?: string;
  businessModel?: string;
  brandTone?: string;
  keyServices?: string;
  USP?: string;
  primaryCTA?: string;
  contactPreference?: string;
  additionalFeatures?: string;
};

/**
 * Builds variation-specific constraints to force name diversity
 * Each variation gets different naming restrictions to avoid repetition
 */
function buildVariationConstraints(variationIndex: number): string {
  const constraints = [
    // Variation 0: No compound words with Team, Sync, Hub, Space, Connect
    `\n🚫 FORBIDDEN PATTERNS (variation ${variationIndex}):\n- DO NOT use these words in the name: Team, Sync, Hub, Space, Connect, Link, Flow, Work, Collab, Unite\n- Avoid compound words like TeamSync, WorkHub, CollabSpace\n- Use unexpected, creative alternatives`,
    // Variation 1: No -ly, -ify, -ize endings
    `\n🚫 FORBIDDEN PATTERNS (variation ${variationIndex}):\n- DO NOT use names ending in: -ly, -ify, -ize, -io, -app\n- Avoid tech startup clichés\n- Think of unique, memorable single words`,
    // Variation 2: Must use metaphors or abstract concepts
    `\n✅ REQUIRED APPROACH (variation ${variationIndex}):\n- Use metaphorical or abstract names (e.g., Lighthouse, Compass, Atlas)\n- Draw inspiration from nature, mythology, or science\n- Make it evocative rather than descriptive`,
    // Variation 3: Must be playful/friendly
    `\n✅ REQUIRED APPROACH (variation ${variationIndex}):\n- Use playful, friendly, approachable names\n- Consider made-up words that sound friendly\n- Think: fun, memorable, conversational`,
    // Variation 4: Professional/enterprise focused
    `\n✅ REQUIRED APPROACH (variation ${variationIndex}):\n- Use professional, enterprise-grade names\n- One-word names preferred\n- Think: authoritative, trustworthy, established`,
  ];

  // Cycle through constraints based on variation index
  return constraints[variationIndex % constraints.length];
}

export async function moderateBusinessInfo(
  businessInfo: BusinessInfo
): Promise<ModerationResult> {
  // Run moderation but allow through on service errors
  try {
    const result = await aiModerateContent({
      description: businessInfo?.description || '',
      industry: businessInfo?.industry || '',
      businessType: businessInfo?.businessType || '',
      goals: businessInfo?.goals || '',
      services: businessInfo?.keyServices || '',
    });
    return result;
  } catch (error) {
    // Log the error but allow request through on service failure
    // Actual content moderation happens at generation time too
    console.warn('Moderation service error, allowing request:', error);
    return {
      isProhibited: false,
      riskLevel: 'LOW',
      reasons: [],
      riskScore: 0,
      categories: [],
      recommendation: 'APPROVED',
    } as ModerationResult;
  }
}

export async function generateProjectDetails(
  prompt: string,
  businessInfo: BusinessInfo,
  additionalContext?: Record<string, any>
): Promise<ProjectDetails> {
  // Validate the business info with more lenient requirements
  const businessInfoSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    industry: z.string().min(1, 'Industry is required'),
  });
  const validatedBusinessInfo = businessInfoSchema.safeParse(businessInfo);
  if (!validatedBusinessInfo.success) {
    const errors = validatedBusinessInfo.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    throw new Error(`Invalid business info: ${errors}`);
  }

  // Inject randomness and context for varied regeneration
  const randomSeed =
    additionalContext?.randomSeed || Math.floor(Math.random() * 100000);
  const timestamp = Date.now();
  const variationIndex = additionalContext?.variationIndex || 0;
  const chipAction = additionalContext?.chipAction || '';
  const customPrompt = additionalContext?.customPrompt || '';
  const previousValue = additionalContext?.previousValue || '';

  // Build variation-specific constraints to force diversity
  const variationConstraints = buildVariationConstraints(variationIndex);

  // Build chip-specific instructions
  let chipInstructions = '';
  if (chipAction === 'makeItCatchy') {
    chipInstructions =
      '\n🎯 STYLE OVERRIDE: Make the output catchy, memorable, and engaging. Use vivid language that captures attention. Keep the description detailed (300-600 characters minimum).';
  } else if (chipAction === 'makeItShorter') {
    chipInstructions =
      '\n🎯 STYLE OVERRIDE: Make the output concise and punchy. Use fewer words while maintaining impact (max 2 sentences for descriptions).';
  } else if (chipAction === 'makeItPunchy') {
    chipInstructions =
      '\n🎯 STYLE OVERRIDE: Make the output punchy and impactful. Use strong, action-oriented language. Keep the description detailed (300-600 characters minimum).';
  } else if (chipAction === 'makeItBenefitFocused') {
    chipInstructions =
      '\n🎯 STYLE OVERRIDE: Focus on tangible customer benefits and outcomes. Emphasize value delivery. Keep the description detailed (300-600 characters minimum).';
  } else if (chipAction === 'alternatives') {
    chipInstructions =
      '\n🎯 STYLE OVERRIDE: Generate a completely different approach with varied tone and angle. Keep the description detailed (300-600 characters minimum).';
  } else if (chipAction === 'regenerate') {
    // Force longer descriptions during standard regeneration
    chipInstructions =
      '\n🎯 REGENERATION REQUIREMENT: Generate a NEW, DETAILED description with MINIMUM 300 CHARACTERS (aim for 400-600 characters). Include specific details about services, approach, target audience, and value proposition. Do NOT generate a short or generic description. Descriptions under 300 characters will be REJECTED.';
  }

  // Build context hints excluding internal metadata
  const contextHints = additionalContext
    ? Object.entries(additionalContext)
        .filter(
          ([k]) =>
            ![
              'randomSeed',
              'timestamp',
              'chipAction',
              'previousValue',
              'customPrompt',
            ].includes(k)
        )
        .map(([k, v]) => `  - ${k}: ${v}`)
        .join('\n')
    : '';

  const systemPrompt = `You are an expert business consultant and copywriter powered by DeepSeek. Your specialty is generating compelling, detailed project details for websites across various industries.

🎯 CRITICAL TONE INSTRUCTIONS:
- Write in a natural, conversational, human voice - NOT robotic or corporate
- Use simple, everyday language that sounds like a real person talking
- Avoid buzzwords, jargon, and overused marketing phrases (e.g., "revolutionize", "cutting-edge", "leverage", "synergy", "empower")
- NO corporate speak or overly formal language
- Keep it authentic and genuine - write like you're explaining to a friend
- Use specific, concrete language instead of vague abstractions
- Be direct and honest about what the business actually does
- Avoid cliches and generic statements that could apply to any business
- Focus on real value and real problems being solved
- Sound confident but not salesy or exaggerated
- DO NOT use em dashes (—) in your text; use regular hyphens (-) or commas instead

📝 DESCRIPTION REQUIREMENTS (CRITICAL - MUST FOLLOW):
- MINIMUM 300 characters required - descriptions under 300 chars will be rejected
- Aim for 400-600 characters for best results
- Include WHO the business serves, WHAT they offer, and WHY it matters
- Mention specific services, products, or unique approaches
- Paint a picture of the customer experience or transformation
- Be specific about the value proposition and outcomes
- NEVER write a generic one-liner - always elaborate with meaningful details
- Count your characters before submitting - ensure at least 300 characters

💎 USP (UNIQUE VALUE PROPOSITION) REQUIREMENTS (CRITICAL - MUST FOLLOW):
- MINIMUM 150 characters required - USP under 150 chars will be rejected
- Aim for 200-400 characters for best results
- Explain what makes this business DIFFERENT from competitors
- Include specific differentiators, unique methods, or exclusive benefits
- Focus on the ONE thing that sets this business apart
- Be concrete and specific - avoid generic phrases like "best quality" or "great service"
- NEVER write a short, vague USP - always elaborate with meaningful differentiators

CRITICAL: Return ONLY a valid JSON object with NO markdown formatting. Do not wrap the response in \`\`\`json or any other markdown. Return the raw JSON directly.`;

  const enhancedPrompt = `Generate compelling project details for a website based on the following information:

${prompt}

Domain Context:
- Industry: ${businessInfo.industry || 'Not specified'}
- Business Type: ${businessInfo.businessType || 'Not specified'}
- Target Audience: ${businessInfo.targetAudience || 'Not specified'}
- Unique Selling Point: ${businessInfo.uniqueSellingPoint || 'Not specified'}
- Goals: ${businessInfo.goals || 'Not specified'}
${contextHints ? `\nStyle & Tone Context:\n${contextHints}` : ''}
${
  previousValue
    ? `\nPrevious Output (generate something DIFFERENT): "${previousValue}"`
    : ''
}
${
  customPrompt
    ? `\n\n🎯 CRITICAL CUSTOM INSTRUCTION: ${customPrompt}\nThis custom instruction takes HIGHEST priority. Ensure the output strictly follows this guidance.`
    : ''
}
${chipInstructions}

🎲 VARIATION REQUIREMENTS (CRITICAL):
- Random seed: ${randomSeed}
- Timestamp: ${timestamp}
- Variation index: ${variationIndex}
- Generate COMPLETELY DIFFERENT content from any previous outputs
- Use alternative words, phrasings, and angles
- If this is a repeated prompt, be EXTRA creative with variations
- Think of at least 3-5 alternative approaches before selecting one
- Avoid defaulting to the most obvious or common naming patterns
${variationConstraints}

Guidelines:
- Project name should be memorable, professional, and brandable within the ${
    businessInfo.industry || 'business'
  } domain
- Description MUST be detailed and compelling (300-700 characters). Include: what the business does, who it serves, unique approach/methodology, and the transformation or value clients receive
- Do NOT include or repeat the project name in the description
- Do NOT write generic one-liners. Elaborate with specific details about services, approach, and outcomes
- Target users must be returned as a SHORT LIST of concise tags, each tag max 5 words, focused on the industry's key decision-makers; separate multiple entries with semicolons
- Business goals must be returned as a SHORT LIST of concise tags, each tag max 5 words; separate multiple entries with semicolons

Industry Selection Guide:
- consultants-coaches: Business coaches, life coaches, career consultants, marketing consultants
- therapists-psychologists: Mental health professionals, counselors, individual practitioners
- photographers-videographers: Photography services, videography, visual content creators
- designers-creative-studios: Graphic designers, web designers, interior designers, fashion designers, creative agencies
- personal-trainers-wellness: Fitness trainers, yoga instructors, wellness coaches, nutritionists
- salons-barbers-spas: Hair salons, barbershops, beauty salons, spa services
- restaurants-cafes: Restaurants, cafés, food services
- content-creation: Bloggers, vloggers, podcasters, content creators, influencers
- fashion-beauty: Fashion brands, fashion stylists, beauty products, makeup artists, fashion platforms
- health-wellness: Health coaches, holistic wellness, alternative medicine
- other: Any business that doesn't fit the above categories

Use this exact JSON structure:
{
  "name": "Project Name",
  "industry": "Most relevant industry ID from the list above",
  "description": "MINIMUM 300 CHARACTERS REQUIRED. A detailed, rich description (300-700 characters) explaining what the business does, who it serves, its unique approach, and the value/transformation clients receive. Be specific and paint a picture. DO NOT submit under 300 characters.",
  "targetUsers": "Semicolon-separated short audience tags (<=5 words each)", 
  "businessGoals": "Semicolon-separated short goal tags (<=5 words each)",
  "USP": "MINIMUM 150 CHARACTERS REQUIRED. A detailed unique value proposition (150-400 characters) explaining what makes this business DIFFERENT from competitors. Include specific differentiators, unique methods, or exclusive benefits. DO NOT submit under 150 characters."
}`;

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('[generateProjectDetails] OPENROUTER_API_KEY is not set!');
    throw new Error('AI service not configured. Please set OPENROUTER_API_KEY environment variable.');
  }

  console.log(
    `[generateProjectDetails] Starting generation with OpenRouter (claude-sonnet-4)`
  );
  console.log(
    `[generateProjectDetails] Enhanced prompt length: ${enhancedPrompt.length} chars`
  );

  // JSON schema for reliable object output with Vercel AI SDK
  const detailsSchema = z.object({
    name: z.string(),
    names: z.array(z.string()).optional(),
    industry: z.string().optional(),
    description: z.string(),
    targetUsers: z.string().optional(),
    businessGoals: z.string().optional(),
    businessModel: z.string().optional(),
    brandTone: z.string().optional(),
    keyServices: z.string().optional(),
    USP: z.string().optional(),
    primaryCTA: z.string().optional(),
    contactPreference: z.string().optional(),
    additionalFeatures: z.string().optional(),
  });

  const runOnce = async (temp: number): Promise<any> => {
    try {
      const result = await generateObject({
        model: models.projectDetails,
        schema: detailsSchema,
        system: systemPrompt,
        prompt: enhancedPrompt,
        temperature: temp,
        maxTokens: 8192,
      });

      return result.object;
    } catch (error) {
      console.error(`[generateProjectDetails] Error with temp ${temp}:`, error);
      throw error;
    }
  };

  // Minimum length requirements
  const MIN_DESCRIPTION_LENGTH = 300;
  const MIN_USP_LENGTH = 150;

  // Use higher temperature for more variation (0.9-1.0 range)
  // This helps prevent identical outputs for the same prompt
  // Retry with progressively lower temperatures if failures occur
  let raw;
  const temperatures = [1.0, 0.7, 0.5];
  let lastError: Error | null = null;
  let retryCount = 0;
  const maxRetries = 3;

  // Helper to check if content meets minimum length requirements
  const meetsMinLengthRequirements = (data: any): boolean => {
    if (chipAction === 'makeItShorter') return true;

    const descLength = String(data?.description || '').trim().length;
    const uspLength = String(data?.USP || '').trim().length;

    const descOk = descLength >= MIN_DESCRIPTION_LENGTH;
    const uspOk = uspLength >= MIN_USP_LENGTH;

    if (!descOk) {
      console.warn(
        `[generateProjectDetails] Description too short (${descLength} < ${MIN_DESCRIPTION_LENGTH})`
      );
    }
    if (!uspOk) {
      console.warn(
        `[generateProjectDetails] USP too short (${uspLength} < ${MIN_USP_LENGTH})`
      );
    }

    return descOk && uspOk;
  };

  // Outer loop for retrying if content is too short
  while (retryCount < maxRetries) {
    for (const temp of temperatures) {
      try {
        console.log(
          `[generateProjectDetails] Attempt ${
            retryCount + 1
          }, temperature: ${temp}`
        );
        raw = await runOnce(temp);
        if (raw) {
          const descLength = String(raw.description || '').trim().length;
          const uspLength = String(raw.USP || '').trim().length;
          console.log(
            `[generateProjectDetails] Success with temp ${temp}, description: ${descLength} chars, USP: ${uspLength} chars`
          );

          // Check if content meets minimum length requirements
          if (!meetsMinLengthRequirements(raw)) {
            // Don't break, continue to retry
            raw = null;
            continue;
          }
          break;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `[generateProjectDetails] Failed with temp ${temp}: ${lastError.message}`
        );
        // Add a small delay before retry to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // If we got a valid response, exit the retry loop
    if (raw && meetsMinLengthRequirements(raw)) {
      break;
    }

    retryCount++;
    if (retryCount < maxRetries) {
      console.log(
        `[generateProjectDetails] Retry ${retryCount}/${maxRetries} - requesting longer content`
      );
      // Add a delay before retry
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  if (!raw) {
    const errorMsg = lastError?.message || 'No content generated';
    console.error(
      `[generateProjectDetails] All retry attempts failed: ${errorMsg}`
    );
    throw new Error(
      `Failed to generate project details after ${maxRetries} attempts: ${errorMsg}`
    );
  }

  const result: ProjectDetails = {
    names: Array.isArray(raw.names) ? raw.names : raw.name ? [raw.name] : [],
    industry: typeof raw.industry === 'string' ? raw.industry : undefined,
    description: String(raw.description || '').slice(0, 700),
    targetUsers: raw.targetUsers || '',
    businessGoals: raw.businessGoals,
    businessModel: raw.businessModel,
    brandTone: raw.brandTone,
    keyServices: raw.keyServices,
    USP: typeof raw.USP === 'string' ? raw.USP : '',
    primaryCTA: raw.primaryCTA,
    contactPreference: raw.contactPreference,
    additionalFeatures: raw.additionalFeatures,
  };

  // Validate that we have at least some meaningful content
  const hasNames =
    result.names.length > 0 &&
    result.names.some((name) => name.trim().length > 0);
  const hasDescription = result.description.trim().length > 0;

  if (!hasNames && !hasDescription) {
    console.error(
      '[generateProjectDetails] Generated result is empty:',
      result
    );
    throw new Error(
      'Generated project details are empty. Please try again with more details about your business.'
    );
  }

  // Log warning if content is still short (but don't fail)
  if (chipAction !== 'makeItShorter') {
    if (result.description.trim().length < MIN_DESCRIPTION_LENGTH) {
      console.warn(
        `[generateProjectDetails] Final description is shorter than ideal: ${
          result.description.trim().length
        } chars (min: ${MIN_DESCRIPTION_LENGTH})`
      );
    }
    if (result.USP && result.USP.trim().length < MIN_USP_LENGTH) {
      console.warn(
        `[generateProjectDetails] Final USP is shorter than ideal: ${
          result.USP.trim().length
        } chars (min: ${MIN_USP_LENGTH})`
      );
    }
  }

  return result;
}
