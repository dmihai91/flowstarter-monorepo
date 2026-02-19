/**
 * Project Name Agent
 *
 * Handles project name generation and natural language name extraction.
 * Uses modular category-specific prompts for better naming quality.
 *
 * - Generates creative, human-friendly project names
 * - Extracts/interprets names from conversational user input
 * - Supports follow-up conversations and confirmation flows
 */

// eslint-disable-next-line no-restricted-imports
import { generateCompletion } from '../llm';
import { createScopedLogger } from '~/utils/logger';
import { API_MESSAGE_KEYS, getApiMessage } from '~/lib/i18n/api-messages';

// Import modular prompt system
import {
  detectCategory,
  getGenerationPrompt,
  getRandomFallbackName,
  buildRefinementPrompt,
  buildExtractionPrompt,
  containsBannedWord,
  getBannedWord,
  type UserContext,
} from './prompts';

// Re-export UserContext for external use
export type { UserContext } from './prompts';

const logger = createScopedLogger('ProjectNameAgent');

// Model for project name generation - Claude Sonnet 4 for creative, quality naming
const NAME_GENERATION_MODEL = 'anthropic/claude-sonnet-4';

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERFACES
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface NameGenerationResult {
  projectName: string;
  allOptions?: string[];
  category?: string;
  success: boolean;
}

export interface NameExtractionResult {
  projectName?: string;
  needsFollowUp?: boolean;
  suggestedName?: string;
  followUpMessage?: string;
  extractedRequirements?: string[];
  error?: boolean;
  errorType?: string;
  message?: string;
  canRetry?: boolean;
}

export interface ConversationContext {
  previousSuggestion?: string;
  projectDescription?: string;
  previouslySuggested?: string[];
  accumulatedRequirements?: string[];
}

export interface RefinementContext {
  previousName: string;
  refinementFeedback: string;
  projectDescription?: string;
  previouslySuggested?: string[];
  accumulatedRequirements?: string[];
}

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * MAIN FUNCTIONS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Options for name generation
 */
export interface GenerateNameOptions {
  templateName?: string;
  returnAllOptions?: boolean;
  userContext?: UserContext;
}

/**
 * Generate creative project name(s) from a description
 * Uses category-specific prompts for better quality
 *
 * @param projectDescription - Business description
 * @param optionsOrTemplateName - Generation options object, or templateName string (legacy)
 * @param legacyReturnAllOptions - Legacy boolean for returnAllOptions (when using templateName string)
 */
export async function generateProjectName(
  projectDescription: string,
  optionsOrTemplateName?: GenerateNameOptions | string,
  legacyReturnAllOptions?: boolean,
): Promise<NameGenerationResult> {
  /*
   * Handle backward compatibility for multiple call signatures:
   * 1. generateProjectName(desc) - no options
   * 2. generateProjectName(desc, templateName) - legacy string templateName
   * 3. generateProjectName(desc, templateName, returnAllOptions) - legacy with boolean
   * 4. generateProjectName(desc, undefined, returnAllOptions) - legacy with undefined templateName
   * 5. generateProjectName(desc, { templateName, userContext, returnAllOptions }) - new style
   */
  let opts: GenerateNameOptions;

  if (typeof optionsOrTemplateName === 'string') {
    // Legacy: second arg is templateName string
    opts = {
      templateName: optionsOrTemplateName,
      returnAllOptions: legacyReturnAllOptions ?? false,
    };
  } else if (optionsOrTemplateName === undefined && legacyReturnAllOptions !== undefined) {
    // Legacy: generateProjectName(desc, undefined, true)
    opts = {
      returnAllOptions: legacyReturnAllOptions,
    };
  } else {
    opts = optionsOrTemplateName || {};
  }

  const { templateName, returnAllOptions = false, userContext } = opts;

  const hasDescription = projectDescription && projectDescription.trim().length > 0;
  const descriptionForGeneration = hasDescription ? projectDescription : 'a new creative project';

  // Detect category for logging
  const category = detectCategory(descriptionForGeneration);
  const hasPersonalization = userContext && Object.keys(userContext).length > 0;
  logger.info(
    `Generating name for category "${category.id}"${hasPersonalization ? ' (personalized)' : ''}: "${descriptionForGeneration.substring(0, 100)}..."`,
  );

  if (hasPersonalization) {
    logger.info(`Personalization: ${JSON.stringify(userContext)}`);
  }

  // Check if API key is configured
  const hasApiKey = !!process.env.OPEN_ROUTER_API_KEY;

  if (!hasApiKey) {
    logger.error('OPEN_ROUTER_API_KEY not configured - using fallback name generator');

    const fallbackName = getRandomFallbackName(projectDescription);
    logger.info(`Generated fallback name: ${fallbackName}`);

    return {
      projectName: fallbackName,
      category: category.id,
      success: false,
    };
  }

  try {
    // Get category-specific system prompt (with personalization if provided)
    const systemPrompt = getGenerationPrompt(descriptionForGeneration, userContext);

    const userMessage = templateName
      ? `Project description: ${descriptionForGeneration}\nTemplate: ${templateName}`
      : `Project description: ${descriptionForGeneration}`;

    const response = await generateCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      {
        model: NAME_GENERATION_MODEL,
        temperature: 0.9,
        maxTokens: 100,
      },
    );

    logger.info(`LLM response: "${response}"`);

    // Parse the 3 names
    const rawOptions = response
      .split('\n')
      .map((line) =>
        line
          .replace(/^\d+[.\)]\s*/, '')
          .replace(/[\"']/g, '')
          .trim(),
      )
      .filter((name) => name.length > 0 && name.length < 50);

    // Filter out any banned names
    const nameOptions = rawOptions.filter((name) => {
      if (containsBannedWord(name)) {
        const bannedWord = getBannedWord(name);
        logger.warn(`Filtering out banned name "${name}" (contains "${bannedWord}")`);

        return false;
      }

      return true;
    });

    if (nameOptions.length === 0) {
      logger.warn('No valid names after filtering banned words, using fallback');
      return {
        projectName: getRandomFallbackName(projectDescription),
        category: category.id,
        success: false,
      };
    }

    // Randomly select one from filtered options
    const selectedName = nameOptions[Math.floor(Math.random() * nameOptions.length)];

    logger.info(`Generated ${nameOptions.length} options: [${nameOptions.join(', ')}] -> "${selectedName}"`);

    return {
      projectName: selectedName,
      allOptions: returnAllOptions ? nameOptions : undefined,
      category: category.id,
      success: true,
    };
  } catch (error) {
    logger.error('Name generation failed:', error);
    logger.error('Error details:', error instanceof Error ? error.message : String(error));

    return {
      projectName: getRandomFallbackName(projectDescription),
      category: category.id,
      success: false,
    };
  }
}

/**
 * Extract/interpret a project name from user input
 * Handles confirmations, explicit names, and refinement requests
 */
export async function extractProjectName(
  userInput: string,
  context?: ConversationContext,
): Promise<NameExtractionResult> {
  if (!userInput || userInput.trim().length === 0) {
    return {
      error: true,
      errorType: 'empty_input',
      message: getApiMessage(API_MESSAGE_KEYS.NAME_PROVIDE),
      canRetry: true,
    };
  }

  try {
    const systemPrompt = buildExtractionPrompt(
      context?.previousSuggestion,
      context?.projectDescription,
      context?.previouslySuggested,
      context?.accumulatedRequirements,
    );

    logger.info(`Extracting name from: "${userInput.substring(0, 50)}..."`);

    if (context?.previouslySuggested?.length) {
      logger.info(`Previously suggested to avoid: [${context.previouslySuggested.join(', ')}]`);
    }

    const response = await generateCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      {
        model: NAME_GENERATION_MODEL,
        temperature: 0.7,
        maxTokens: 300,
      },
    );

    // Clean up response - remove markdown code blocks if present
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

    // Parse JSON
    const parsed = JSON.parse(cleaned) as {
      type: 'question' | 'name';
      name: string;
      message?: string;
      extractedRequirements?: string[];
    };

    if (parsed.type === 'question' && parsed.name && parsed.message) {
      logger.info(`Follow-up: name="${parsed.name}", message="${parsed.message.substring(0, 50)}..."`);

      // Reject banned names
      if (containsBannedWord(parsed.name)) {
        const bannedWord = getBannedWord(parsed.name);
        logger.warn(`LLM suggested banned name "${parsed.name}" (contains "${bannedWord}") - using fallback`);

        const fallbackName = getRandomFallbackName(context?.projectDescription || '');

        return {
          needsFollowUp: true,
          suggestedName: fallbackName,
          followUpMessage: `How about **${fallbackName}**? It has a warm, distinctive feel.`,
          extractedRequirements: parsed.extractedRequirements,
        };
      }

      return {
        needsFollowUp: true,
        suggestedName: parsed.name,
        followUpMessage: parsed.message,
        extractedRequirements: parsed.extractedRequirements,
      };
    }

    if (parsed.type === 'name' && parsed.name) {
      const extractedName = parsed.name.trim();
      logger.info(`Extracted name: "${extractedName}"`);

      return { projectName: extractedName };
    }

    // Fallback: use the name field if present
    if (parsed.name) {
      const extractedName = parsed.name.trim();

      if (context?.previousSuggestion && extractedName.toLowerCase() === context.previousSuggestion.toLowerCase()) {
        return { projectName: extractedName };
      }

      return {
        needsFollowUp: true,
        suggestedName: extractedName,
        followUpMessage: getApiMessage(API_MESSAGE_KEYS.NAME_CONFIRM, { name: extractedName }),
      };
    }

    throw new Error('Invalid response format');
  } catch (error) {
    logger.error('Name extraction failed:', error);
    return simpleFallbackExtraction(userInput, context?.previousSuggestion);
  }
}

/**
 * Refine an existing project name based on user feedback
 */
export async function refineProjectName(context: RefinementContext): Promise<NameGenerationResult> {
  const { previousName, refinementFeedback, projectDescription, previouslySuggested, accumulatedRequirements } =
    context;
  const category = detectCategory(projectDescription || '');

  logger.info(
    `Refining name "${previousName}" for category "${category.id}" with feedback: "${refinementFeedback.substring(0, 50)}..."`,
  );

  const hasApiKey = !!process.env.OPEN_ROUTER_API_KEY;

  if (!hasApiKey) {
    logger.error('OPEN_ROUTER_API_KEY not configured - using fallback refinement');

    const fallbackName = generateFallbackRefinement(previousName, refinementFeedback, projectDescription);

    return {
      projectName: fallbackName,
      category: category.id,
      success: false,
    };
  }

  try {
    const systemPrompt = buildRefinementPrompt(
      previousName,
      refinementFeedback,
      projectDescription,
      previouslySuggested,
      accumulatedRequirements,
    );

    const response = await generateCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Refine "${previousName}" to be more ${refinementFeedback}` },
      ],
      {
        model: NAME_GENERATION_MODEL,
        temperature: 0.9,
        maxTokens: 100,
      },
    );

    logger.info(`LLM refinement response: "${response}"`);

    // Clean up response
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

    const parsed = JSON.parse(cleaned) as { name: string };

    if (parsed.name && parsed.name.length > 0 && parsed.name.length < 50) {
      // Reject banned names
      if (containsBannedWord(parsed.name)) {
        const bannedWord = getBannedWord(parsed.name);
        logger.warn(`LLM suggested banned name "${parsed.name}" (contains "${bannedWord}") - using fallback`);

        const fallbackName = getRandomFallbackName(projectDescription || '');

        return {
          projectName: fallbackName,
          category: category.id,
          success: false,
        };
      }

      logger.info(`Refined name: "${parsed.name}"`);

      return {
        projectName: parsed.name,
        category: category.id,
        success: true,
      };
    }

    throw new Error('Invalid name in response');
  } catch (error) {
    logger.error('Name refinement failed:', error);

    const fallbackName = generateFallbackRefinement(previousName, refinementFeedback, projectDescription);

    return {
      projectName: fallbackName,
      category: category.id,
      success: false,
    };
  }
}

/**
 * Generate fallback name (exported for API route)
 */
export function generateFallbackName(description: string): string {
  return getRandomFallbackName(description);
}

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * HELPER FUNCTIONS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Simple fallback extraction when LLM fails
 */
function simpleFallbackExtraction(input: string, previousSuggestion?: string): NameExtractionResult {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  // Extract name from common patterns
  const extractionPatterns: RegExp[] = [
    /^(?:let'?s?\s+)?call\s+it\s+["']?(.+?)["']?\s*$/i,
    /^(?:let'?s?\s+)?name\s+it\s+["']?(.+?)["']?\s*$/i,
    /^(?:let'?s?\s+)?go\s+with\s+["']?(.+?)["']?\s*$/i,
    /^how\s+about\s+["']?(.+?)["']?\s*$/i,
    /^use\s+["']?(.+?)["']?\s*$/i,
    /^["'](.+?)["']\s*$/,
  ];

  for (const pattern of extractionPatterns) {
    const match = trimmed.match(pattern);

    if (match && match[1]) {
      const extractedName = match[1].trim();
      logger.info(`Fallback pattern extraction: "${extractedName}"`);

      return { projectName: extractedName };
    }
  }

  // Check for confirmation
  if (previousSuggestion) {
    const confirmationWords = ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'perfect', 'great', 'good'];
    const confirmationPhrases = ['that works', 'sounds good', 'sounds great', 'i like it', 'love it'];

    const isConfirmation =
      confirmationWords.some((word) => lower === word || lower.startsWith(word + ' ')) ||
      confirmationPhrases.some((phrase) => lower.includes(phrase));

    if (isConfirmation) {
      logger.info(`Fallback: Confirmed previous suggestion "${previousSuggestion}"`);
      return { projectName: previousSuggestion };
    }
  }

  // Use input as suggested name
  let suggestedName = trimmed
    .replace(/^[\"']|[\"']$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (suggestedName.length > 50) {
    suggestedName = suggestedName.substring(0, 50).trim();
  }

  if (suggestedName.length < 2) {
    return {
      needsFollowUp: true,
      suggestedName: 'My Project',
      followUpMessage: getApiMessage(API_MESSAGE_KEYS.NAME_UNCLEAR),
    };
  }

  logger.info(`Fallback: Using input as name "${suggestedName}"`);

  return {
    needsFollowUp: true,
    suggestedName,
    followUpMessage: getApiMessage(API_MESSAGE_KEYS.NAME_CONFIRM, { name: suggestedName }),
  };
}

/**
 * Generate a simple fallback refinement when LLM is unavailable
 */
function generateFallbackRefinement(previousName: string, feedback: string, projectDescription?: string): string {
  const lowerFeedback = feedback.toLowerCase();

  // If they want something shorter
  if (lowerFeedback.includes('shorter')) {
    const words = previousName.split(' ');

    if (words.length > 1) {
      return words[0];
    }
  }

  // If they want something different
  if (lowerFeedback.includes('different') || lowerFeedback.includes('another') || lowerFeedback.includes('else')) {
    if (projectDescription) {
      return getRandomFallbackName(projectDescription);
    }
  }

  // Default: generate from description or return generic
  if (projectDescription) {
    return getRandomFallbackName(projectDescription);
  }

  return getRandomFallbackName('');
}
