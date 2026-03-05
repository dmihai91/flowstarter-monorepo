/**
 * Project Name Extraction
 *
 * Extracts/interprets project names from conversational user input.
 * Handles confirmations, explicit names, and refinement requests.
 */

// eslint-disable-next-line no-restricted-imports
import { generateCompletion } from '../llm';
import { createScopedLogger } from '~/utils/logger';
import { API_MESSAGE_KEYS, getApiMessage } from '~/lib/i18n/api-messages';
import { buildExtractionPrompt, containsBannedWord, getBannedWord, getRandomFallbackName } from './prompts';
import type { ConversationContext, NameExtractionResult } from './types';
import { cleanLLMResponse } from './response-utils';

const logger = createScopedLogger('ProjectNameAgent');

const NAME_GENERATION_MODEL = 'anthropic/claude-sonnet-4';

/**
 * Extract/interpret a project name from user input
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

    const cleaned = cleanLLMResponse(response);

    const parsed = JSON.parse(cleaned) as {
      type: 'question' | 'name';
      name: string;
      message?: string;
      extractedRequirements?: string[];
    };

    if (parsed.type === 'question' && parsed.name && parsed.message) {
      return handleQuestionResponse(parsed, context);
    }

    if (parsed.type === 'name' && parsed.name) {
      const extractedName = parsed.name.trim();
      logger.info(`Extracted name: "${extractedName}"`);
      return { projectName: extractedName };
    }

    // Fallback: use the name field if present
    if (parsed.name) {
      return handleFallbackName(parsed.name, context);
    }

    throw new Error('Invalid response format');
  } catch (error) {
    logger.error('Name extraction failed:', error);
    return simpleFallbackExtraction(userInput, context?.previousSuggestion);
  }
}

/**
 * Handle LLM response of type 'question' (needs follow-up)
 */
function handleQuestionResponse(
  parsed: { name: string; message?: string; extractedRequirements?: string[] },
  context?: ConversationContext,
): NameExtractionResult {
  logger.info(`Follow-up: name="${parsed.name}", message="${parsed.message?.substring(0, 50)}..."`);

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

/**
 * Handle fallback when parsed name doesn't have a clear type
 */
function handleFallbackName(
  name: string,
  context?: ConversationContext,
): NameExtractionResult {
  const extractedName = name.trim();

  if (context?.previousSuggestion && extractedName.toLowerCase() === context.previousSuggestion.toLowerCase()) {
    return { projectName: extractedName };
  }

  return {
    needsFollowUp: true,
    suggestedName: extractedName,
    followUpMessage: getApiMessage(API_MESSAGE_KEYS.NAME_CONFIRM, { name: extractedName }),
  };
}

/**
 * Simple fallback extraction when LLM fails
 */
export function simpleFallbackExtraction(input: string, previousSuggestion?: string): NameExtractionResult {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

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
