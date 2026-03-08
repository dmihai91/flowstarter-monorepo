/**
 * OpenRouter Configuration
 *
 * Flowstarter uses OpenRouter as the single LLM provider.
 * Configure via environment variables.
 */

export const OPENROUTER_CONFIG = {
  baseUrl: 'https://openrouter.ai/api/v1',
  defaultModel: import.meta.env.VITE_OPENROUTER_MODEL || 'anthropic/claude-sonnet-4-6',
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
};

export function getOpenRouterApiKey(): string {
  const key = OPENROUTER_CONFIG.apiKey;

  if (!key) {
    console.warn('OpenRouter API key not configured. Set VITE_OPENROUTER_API_KEY environment variable.');
  }

  return key;
}

export function getOpenRouterModel(): string {
  return OPENROUTER_CONFIG.defaultModel;
}

