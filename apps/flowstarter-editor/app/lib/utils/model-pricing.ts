/**
 * Model pricing configuration for cost tracking
 * Prices are per 1M tokens in USD
 */

export interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
  provider: string;
}

// Comprehensive pricing table - update as needed
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // ANTHROPIC CLAUDE (via OpenRouter)
  // ═══════════════════════════════════════════════════════════════════════════
  'claude-opus-4-6': { inputPer1M: 5.00, outputPer1M: 25.00, provider: 'anthropic' },
  'anthropic/claude-opus-4-6': { inputPer1M: 5.00, outputPer1M: 25.00, provider: 'anthropic' },
  'claude-opus-4-6': { inputPer1M: 15.00, outputPer1M: 75.00, provider: 'anthropic' },
  'anthropic/claude-opus-4-6': { inputPer1M: 15.00, outputPer1M: 75.00, provider: 'anthropic' },
  'claude-sonnet-4-6': { inputPer1M: 3.00, outputPer1M: 15.00, provider: 'anthropic' },
  'anthropic/claude-sonnet-4-6': { inputPer1M: 3.00, outputPer1M: 15.00, provider: 'anthropic' },
  'claude-3-5-sonnet-20241022': { inputPer1M: 3.00, outputPer1M: 15.00, provider: 'anthropic' },
  'claude-3-5-sonnet': { inputPer1M: 3.00, outputPer1M: 15.00, provider: 'anthropic' },
  'claude-3-haiku': { inputPer1M: 0.25, outputPer1M: 1.25, provider: 'anthropic' },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // OPENAI
  // ═══════════════════════════════════════════════════════════════════════════
  'gpt-4o': { inputPer1M: 2.50, outputPer1M: 10.00, provider: 'openai' },
  'gpt-4o-mini': { inputPer1M: 0.15, outputPer1M: 0.60, provider: 'openai' },
  'gpt-4-turbo': { inputPer1M: 10.00, outputPer1M: 30.00, provider: 'openai' },
  'gpt-4': { inputPer1M: 30.00, outputPer1M: 60.00, provider: 'openai' },
  'o1': { inputPer1M: 15.00, outputPer1M: 60.00, provider: 'openai' },
  'o1-mini': { inputPer1M: 3.00, outputPer1M: 12.00, provider: 'openai' },
  'o3-mini': { inputPer1M: 1.10, outputPer1M: 4.40, provider: 'openai' },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GOOGLE
  // ═══════════════════════════════════════════════════════════════════════════
  'gemini-2.0-flash': { inputPer1M: 0.10, outputPer1M: 0.40, provider: 'google' },
  'gemini-2.0-flash-lite': { inputPer1M: 0.075, outputPer1M: 0.30, provider: 'google' },
  'gemini-1.5-pro': { inputPer1M: 1.25, outputPer1M: 5.00, provider: 'google' },
  'gemini-1.5-flash': { inputPer1M: 0.075, outputPer1M: 0.30, provider: 'google' },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GROQ (free tier, but track for usage)
  // ═══════════════════════════════════════════════════════════════════════════
  'llama-3.3-70b-versatile': { inputPer1M: 0.59, outputPer1M: 0.79, provider: 'groq' },
  'llama-3.1-8b-instant': { inputPer1M: 0.05, outputPer1M: 0.08, provider: 'groq' },
  'llama-3.2-90b-vision-preview': { inputPer1M: 0.90, outputPer1M: 0.90, provider: 'groq' },
  'mixtral-8x7b-32768': { inputPer1M: 0.24, outputPer1M: 0.24, provider: 'groq' },
  'gemma2-9b-it': { inputPer1M: 0.20, outputPer1M: 0.20, provider: 'groq' },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // OPENROUTER
  // ═══════════════════════════════════════════════════════════════════════════
  // DeepSeek
  'deepseek/deepseek-chat': { inputPer1M: 0.14, outputPer1M: 0.28, provider: 'openrouter' },
  'deepseek/deepseek-coder': { inputPer1M: 0.14, outputPer1M: 0.28, provider: 'openrouter' },
  'deepseek-chat': { inputPer1M: 0.14, outputPer1M: 0.28, provider: 'deepseek' },
  'deepseek-coder': { inputPer1M: 0.14, outputPer1M: 0.28, provider: 'deepseek' },
  
  // Kimi (Moonshot AI) - CORRECT model name from OpenRouter API
  'moonshotai/kimi-k2-instruct-0905': { inputPer1M: 0.45, outputPer1M: 2.50, provider: 'openrouter' },
  'kimi-k2': { inputPer1M: 0.45, outputPer1M: 2.50, provider: 'openrouter' },
  
  // Qwen
  'qwen/qwen-2.5-coder-32b-instruct': { inputPer1M: 0.18, outputPer1M: 0.18, provider: 'openrouter' },
  'qwen/qwen-2.5-72b-instruct': { inputPer1M: 0.35, outputPer1M: 0.40, provider: 'openrouter' },
  'qwen/qwen3-coder-next': { inputPer1M: 0.07, outputPer1M: 0.30, provider: 'openrouter' },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FAL.AI (Image generation - per image, not per token)
  // ═══════════════════════════════════════════════════════════════════════════
  'fal-ai/flux/schnell': { inputPer1M: 0, outputPer1M: 0, provider: 'fal' }, // ~$0.003/image
  'fal-ai/flux-pro': { inputPer1M: 0, outputPer1M: 0, provider: 'fal' }, // ~$0.05/image
};

// Default fallback pricing for unknown models
const DEFAULT_PRICING: ModelPricing = {
  inputPer1M: 1.00,
  outputPer1M: 3.00,
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
  
  // Try without provider prefix (e.g., "anthropic/claude-opus-4" -> "claude-opus-4")
  const withoutPrefix = model.split('/').pop() || model;
  if (MODEL_PRICING[withoutPrefix]) {
    return MODEL_PRICING[withoutPrefix];
  }
  
  // Try partial match for versioned models
  const baseModel = model.replace(/-\d{8}$/, ''); // Remove date suffix like -20241022
  if (MODEL_PRICING[baseModel]) {
    return MODEL_PRICING[baseModel];
  }
  
  console.warn(`[costs] Unknown model pricing for: ${model}, using defaults`);
  return DEFAULT_PRICING;
}

/**
 * Calculate cost for a single LLM call
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = getModelPricing(model);
  const inputCost = (promptTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (completionTokens / 1_000_000) * pricing.outputPer1M;
  return inputCost + outputCost;
}

/**
 * Calculate cost for image generation (fixed per-image pricing)
 */
export function calculateImageCost(model: string, imageCount: number = 1): number {
  const imagePricing: Record<string, number> = {
    'fal-ai/flux/schnell': 0.003,
    'fal-ai/flux-pro': 0.05,
    'fal-ai/flux-realism': 0.025,
    'fal-ai/stable-diffusion-v3': 0.035,
  };
  
  const pricePerImage = imagePricing[model] || 0.01; // Default $0.01/image
  return pricePerImage * imageCount;
}

/**
 * Format cost for display
 */
export function formatCost(costUSD: number): string {
  if (costUSD < 0.01) {
    return `$${(costUSD * 100).toFixed(3)}¢`;
  }
  return `$${costUSD.toFixed(4)}`;
}

/**
 * Aggregate costs summary
 */
export interface CostSummary {
  totalCostUSD: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  byModel: Record<string, {
    costUSD: number;
    inputTokens: number;
    outputTokens: number;
    calls: number;
  }>;
  byOperation: Record<string, {
    costUSD: number;
    calls: number;
  }>;
}

export function createEmptyCostSummary(): CostSummary {
  return {
    totalCostUSD: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    byModel: {},
    byOperation: {},
  };
}
