/**
 * OpenRouter AI Client
 * Unified AI provider using OpenRouter for simplified model access
 */

import { createOpenRouter } from '@openrouter/ai-sdk-provider';

// Initialize OpenRouter provider
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

/**
 * Model configurations for different use cases
 * OpenRouter provides unified access to models from multiple providers
 */
export const models = {
  // Fast, cost-effective model for project details and content generation
  // DeepSeek is excellent for structured output and creative tasks
  projectDetails: openrouter.chat('deepseek/deepseek-chat'),

  // High-quality model for template generation and complex tasks
  // Claude Sonnet 4 excels at code generation and following instructions
  templateAgent: openrouter.chat('anthropic/claude-sonnet-4-20250514'),

  // Alternative high-performance models
  claude: openrouter.chat('anthropic/claude-sonnet-4-20250514'),
  gpt4: openrouter.chat('openai/gpt-4o'),
  llama: openrouter.chat('meta-llama/llama-3.1-70b-instruct'),

  // Specialized models
  reasoning: openrouter.chat('deepseek/deepseek-r1'), // For complex reasoning tasks
  vision: openrouter.chat('anthropic/claude-3.5-sonnet'), // For image understanding
} as const;

/**
 * Get a model by name with fallback
 */
export function getModel(modelName?: string) {
  if (!modelName) {
    return models.projectDetails;
  }

  // Map old model names to new OpenRouter models
  const modelMap: Record<string, keyof typeof models> = {
    'moonshotai/kimi-k2-instruct': 'projectDetails',
    'claude-sonnet-4-20250514': 'claude',
    'llama-3.1-70b-versatile': 'llama',
    'gpt-4o-mini': 'gpt4',
  };

  const mappedName = modelMap[modelName];
  if (mappedName && mappedName in models) {
    return models[mappedName];
  }

  // Try direct model access via OpenRouter
  return openrouter.chat(modelName);
}

/**
 * Check if OpenRouter is configured
 */
export function isOpenRouterConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

export default openrouter;
