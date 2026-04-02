/**
 * Model pricing data (per 1M tokens, USD)
 * Used for cost tracking and simulation.
 */

export interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
  provider: string;
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  /*
   * ═══════════════════════════════════════════════════════════════════════════
   * ANTHROPIC CLAUDE (direct API + OpenRouter)
   * ═══════════════════════════════════════════════════════════════════════════
   */
  'claude-opus-4-6': { inputPer1M: 15.0, outputPer1M: 75.0, provider: 'anthropic' },
  'anthropic/claude-opus-4-6': { inputPer1M: 15.0, outputPer1M: 75.0, provider: 'anthropic' },
  'claude-sonnet-4-6': { inputPer1M: 3.0, outputPer1M: 15.0, provider: 'anthropic' },
  'anthropic/claude-sonnet-4-6': { inputPer1M: 3.0, outputPer1M: 15.0, provider: 'anthropic' },
  'claude-haiku-3-5': { inputPer1M: 0.8, outputPer1M: 4.0, provider: 'anthropic' },
  'anthropic/claude-haiku-3-5': { inputPer1M: 0.8, outputPer1M: 4.0, provider: 'anthropic' },

  /*
   * ═══════════════════════════════════════════════════════════════════════════
   * KIMI K2 (Groq / Moonshot)
   * ═══════════════════════════════════════════════════════════════════════════
   */
  'moonshotai/kimi-k2-instruct-0905': { inputPer1M: 0.15, outputPer1M: 0.6, provider: 'moonshot' },
  'kimi-k2-instruct-0905': { inputPer1M: 0.15, outputPer1M: 0.6, provider: 'moonshot' },

  /*
   * ═══════════════════════════════════════════════════════════════════════════
   * GPT (OpenAI via OpenRouter)
   * ═══════════════════════════════════════════════════════════════════════════
   */
  'openai/gpt-4o': { inputPer1M: 2.5, outputPer1M: 10.0, provider: 'openai' },
  'openai/gpt-4o-mini': { inputPer1M: 0.15, outputPer1M: 0.6, provider: 'openai' },
  'openai/o3-mini': { inputPer1M: 1.1, outputPer1M: 4.4, provider: 'openai' },

  /*
   * ═══════════════════════════════════════════════════════════════════════════
   * GEMINI (Google via OpenRouter)
   * ═══════════════════════════════════════════════════════════════════════════
   */
  'google/gemini-2.5-pro': { inputPer1M: 1.25, outputPer1M: 10.0, provider: 'google' },
  'google/gemini-2.5-flash': { inputPer1M: 0.15, outputPer1M: 0.6, provider: 'google' },
};

// Default fallback pricing for unknown models
const DEFAULT_PRICING: ModelPricing = {
  inputPer1M: 1.0,
  outputPer1M: 3.0,
  provider: 'unknown',
};

/**
 * Get pricing for a model (with fallback)
 */
export function getModelPricing(model: string): ModelPricing {
  // Try exact match
  if (MODEL_PRICING[model]) {
    return MODEL_PRICING[model];
  }

  // Try without provider prefix (e.g., "anthropic/claude-opus-4-6" -> "claude-opus-4-6")
  const withoutPrefix = model.split('/').pop() ?? model;

  if (MODEL_PRICING[withoutPrefix]) {
    return MODEL_PRICING[withoutPrefix];
  }

  return DEFAULT_PRICING;
}

/**
 * Calculate cost for a given model and token counts
 */
export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = getModelPricing(model);
  return (inputTokens / 1_000_000) * pricing.inputPer1M + (outputTokens / 1_000_000) * pricing.outputPer1M;
}

export { MODEL_PRICING };
