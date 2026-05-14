import 'server-only';
/**
 * OpenRouter-backed chat models for server-side AI tasks.
 * Single entry point for all `lib/ai` LLM calls.
 */

import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const models = {
  projectDetails: openrouter.chat('anthropic/claude-sonnet-4'),
  templateAgent: openrouter.chat('anthropic/claude-sonnet-4'),
  claude: openrouter.chat('anthropic/claude-sonnet-4'),
  gpt4: openrouter.chat('openai/gpt-4o'),
  llama: openrouter.chat('meta-llama/llama-3.1-70b-instruct'),
  reasoning: openrouter.chat('deepseek/deepseek-r1'),
  vision: openrouter.chat('anthropic/claude-3.7-sonnet'),
} as const;

export function getModel(modelName?: string) {
  if (!modelName) {
    return models.projectDetails;
  }

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

  return openrouter.chat(modelName);
}

export function isOpenRouterConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

export default openrouter;
