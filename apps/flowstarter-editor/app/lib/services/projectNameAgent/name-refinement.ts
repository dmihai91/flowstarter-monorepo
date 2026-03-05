/**
 * Project Name Refinement
 *
 * Refines existing project names based on user feedback.
 */

// eslint-disable-next-line no-restricted-imports
import { generateCompletion } from '../llm';
import { createScopedLogger } from '~/utils/logger';
import {
  detectCategory,
  buildRefinementPrompt,
  containsBannedWord,
  getBannedWord,
  getRandomFallbackName,
} from './prompts';
import type { RefinementContext, NameGenerationResult } from './types';
import { cleanLLMResponse } from './response-utils';

const logger = createScopedLogger('ProjectNameAgent');

const NAME_GENERATION_MODEL = 'anthropic/claude-sonnet-4';

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

    const cleaned = cleanLLMResponse(response);
    const parsed = JSON.parse(cleaned) as { name: string };

    if (parsed.name && parsed.name.length > 0 && parsed.name.length < 50) {
      if (containsBannedWord(parsed.name)) {
        const bannedWord = getBannedWord(parsed.name);
        logger.warn(`LLM suggested banned name "${parsed.name}" (contains "${bannedWord}") - using fallback`);

        return {
          projectName: getRandomFallbackName(projectDescription || ''),
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
 * Generate a simple fallback refinement when LLM is unavailable
 */
export function generateFallbackRefinement(
  previousName: string,
  feedback: string,
  projectDescription?: string,
): string {
  const lowerFeedback = feedback.toLowerCase();

  if (lowerFeedback.includes('shorter')) {
    const words = previousName.split(' ');

    if (words.length > 1) {
      return words[0];
    }
  }

  if (lowerFeedback.includes('different') || lowerFeedback.includes('another') || lowerFeedback.includes('else')) {
    if (projectDescription) {
      return getRandomFallbackName(projectDescription);
    }
  }

  if (projectDescription) {
    return getRandomFallbackName(projectDescription);
  }

  return getRandomFallbackName('');
}
