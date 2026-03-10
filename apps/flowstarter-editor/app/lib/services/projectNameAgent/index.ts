/**
 * Project Name Agent
 *
 * Handles project name generation and natural language name extraction.
 * Uses modular category-specific prompts for better naming quality.
 */

// eslint-disable-next-line no-restricted-imports
import { generateCompletion } from '../llm';
import { createScopedLogger } from '~/utils/logger';
import {
  detectCategory,
  getGenerationPrompt,
  getFallbackNames,
  getRandomFallbackName,
  containsBannedWord,
  getBannedWord,
} from './prompts';

// Re-export types and sub-modules for external use
export type { UserContext } from './prompts';
export type {
  NameGenerationResult,
  NameExtractionResult,
  ConversationContext,
  RefinementContext,
  GenerateNameOptions,
} from './types';
export { extractProjectName } from './name-extraction';
import { refineProjectName as refineProjectNameBase } from './name-refinement';

import type { NameGenerationResult, GenerateNameOptions, RefinementContext } from './types';

const logger = createScopedLogger('ProjectNameAgent');

const NAME_GENERATION_MODEL = 'anthropic/claude-sonnet-4';

/**
 * Generate creative project name(s) from a description.
 * Uses category-specific prompts for better quality.
 */
export async function generateProjectName(
  projectDescription: string,
  optionsOrTemplateName?: GenerateNameOptions | string,
  legacyReturnAllOptions?: boolean,
): Promise<NameGenerationResult> {
  const opts = resolveOptions(optionsOrTemplateName, legacyReturnAllOptions);
  const { templateName, returnAllOptions = false, userContext } = opts;

  const hasDescription = projectDescription && projectDescription.trim().length > 0;
  const descriptionForGeneration = hasDescription ? projectDescription : 'a new creative project';

  const category = detectCategory(descriptionForGeneration);
  const hasPersonalization = userContext && Object.keys(userContext).length > 0;
  logger.info(
    `Generating name for category "${category.id}"${hasPersonalization ? ' (personalized)' : ''}: "${descriptionForGeneration.substring(0, 100)}..."`,
  );

  if (hasPersonalization) {
    logger.info(`Personalization: ${JSON.stringify(userContext)}`);
  }

  const hasApiKey = !!process.env.OPEN_ROUTER_API_KEY;

  if (!hasApiKey) {
    logger.error('OPEN_ROUTER_API_KEY not configured - using fallback name generator');
    return {
      projectName: getRandomFallbackName(projectDescription),
      category: category.id,
      success: false,
    };
  }

  try {
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

    const nameOptions = parseAndFilterNames(response, projectDescription);

    if (nameOptions.length === 0) {
      logger.warn('No valid names after filtering banned words, using fallback');
      return {
        projectName: getRandomFallbackName(projectDescription),
        category: category.id,
        success: false,
      };
    }

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
    return {
      projectName: getRandomFallbackName(projectDescription),
      category: category.id,
      success: false,
    };
  }
}

/**
 * Generate fallback name (exported for API route)
 */
export function generateFallbackName(description: string, exclude?: string | string[]): string {
  const exclusions = new Set(toExcludedNames(exclude));
  const names = getFallbackNames(description);
  const availableNames = names.filter((name) => !exclusions.has(normalizeName(name)));

  if (availableNames.length === 0) {
    return getRandomFallbackName(description);
  }

  return availableNames[Math.floor(Math.random() * availableNames.length)];
}

export async function refineProjectName(context: RefinementContext): Promise<NameGenerationResult> {
  const result = await refineProjectNameBase(context);

  if (!result.success && normalizeName(result.projectName) === normalizeName(context.previousName)) {
    return {
      ...result,
      projectName: generateFallbackName(context.projectDescription || '', context.previousName),
    };
  }

  return result;
}

/**
 * Resolve backward-compatible options from multiple call signatures
 */
function resolveOptions(
  optionsOrTemplateName?: GenerateNameOptions | string,
  legacyReturnAllOptions?: boolean,
): GenerateNameOptions {
  if (typeof optionsOrTemplateName === 'string') {
    return {
      templateName: optionsOrTemplateName,
      returnAllOptions: legacyReturnAllOptions ?? false,
    };
  }

  if (optionsOrTemplateName === undefined && legacyReturnAllOptions !== undefined) {
    return { returnAllOptions: legacyReturnAllOptions };
  }

  return optionsOrTemplateName || {};
}

/**
 * Parse LLM response into name options and filter banned words
 */
function parseAndFilterNames(response: string, projectDescription: string): string[] {
  const rawOptions = response
    .split('\n')
    .map((line) =>
      line
        .replace(/^\d+[.\)]\s*/, '')
        .replace(/[\"']/g, '')
        .trim(),
    )
    .filter((name) => name.length > 0 && name.length < 50);

  return rawOptions.filter((name) => {
    if (containsBannedWord(name)) {
      const bannedWord = getBannedWord(name);
      logger.warn(`Filtering out banned name "${name}" (contains "${bannedWord}")`);
      return false;
    }
    return true;
  });
}

function toExcludedNames(exclude?: string | string[]): string[] {
  if (!exclude) {
    return [];
  }

  return (Array.isArray(exclude) ? exclude : [exclude]).map(normalizeName).filter(Boolean);
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}
