import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText, type LanguageModelV1 } from 'ai';

/**
 * Type for language models from our providers.
 */
type ProviderModel = ReturnType<ReturnType<typeof createOpenRouter>> | ReturnType<ReturnType<typeof createOpenAI>>;

/**
 * Cost tracking for LLM operations
 */
export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  costUSD: number;
}

/**
 * Model pricing (per 1M tokens)
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic via OpenRouter
  'anthropic/claude-sonnet-4': { input: 3.0, output: 15.0 },
  'anthropic/claude-3.5-sonnet': { input: 3.0, output: 15.0 },
  'anthropic/claude-3-opus': { input: 15.0, output: 75.0 },
  'anthropic/claude-3-haiku': { input: 0.25, output: 1.25 },
  // Kimi via OpenRouter
  'moonshotai/kimi-k2-instruct-0905': { input: 0.6, output: 2.4 },
  // Groq (free tier, but track for visibility)
  'llama-3.3-70b-versatile': { input: 0.0, output: 0.0 },
  'llama-3.1-8b-instant': { input: 0.0, output: 0.0 },
  // Default fallback
  'default': { input: 3.0, output: 15.0 },
};

/**
 * Calculate cost based on token usage
 */
function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];
  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Global cost tracker for the current request
 */
let _currentRequestCosts: LLMUsage[] = [];

export function resetCostTracker(): void {
  _currentRequestCosts = [];
}

export function getCosts(): LLMUsage[] {
  return [..._currentRequestCosts];
}

export function getTotalCost(): { totalCostUSD: number; totalTokens: number; breakdown: LLMUsage[] } {
  const breakdown = getCosts();
  return {
    totalCostUSD: breakdown.reduce((sum, u) => sum + u.costUSD, 0),
    totalTokens: breakdown.reduce((sum, u) => sum + u.totalTokens, 0),
    breakdown,
  };
}

// Helper to get environment variable
function getEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  if (typeof globalThis !== 'undefined' && (globalThis as Record<string, unknown>).env) {
    return ((globalThis as Record<string, unknown>).env as Record<string, string>)[key];
  }
  return undefined;
}

// Lazy-initialized clients
let _openrouter: ReturnType<typeof createOpenRouter> | null = null;
let _groq: ReturnType<typeof createOpenAI> | null = null;

function getOpenRouter() {
  if (!_openrouter) {
    const apiKey = getEnv('OPEN_ROUTER_API_KEY');
    console.log('[LLM] Getting OpenRouter client, API key available:', !!apiKey);

    if (!apiKey) {
      console.error('[LLM] OPEN_ROUTER_API_KEY not found.');
      throw new Error('OPEN_ROUTER_API_KEY environment variable is not set');
    }
    _openrouter = createOpenRouter({ apiKey });
  }
  return _openrouter;
}

function getGroq() {
  if (!_groq) {
    const apiKey = getEnv('GROQ_API_KEY');
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }
    _groq = createOpenAI({
      apiKey,
      baseURL: getEnv('GROQ_API_BASE_URL') || 'https://api.groq.com/openai/v1',
    });
  }
  return _groq;
}

const DEFAULT_MODEL = 'anthropic/claude-sonnet-4';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  thinking?: { budget: number };
  trackCost?: boolean; // Default true
}

/**
 * Generate text completion (non-streaming) with cost tracking
 */
export async function generateCompletion(messages: LLMMessage[], options: LLMOptions = {}): Promise<string> {
  const { model = DEFAULT_MODEL, temperature = 0.7, maxTokens = 4000, trackCost = true } = options;
  console.log('[LLM] generateCompletion called with model:', model);
  console.log('[LLM] Messages count:', messages.length);

  let providerModel: ProviderModel;

  // Route to Groq for Llama, Kimi, and moonshotai models
  if (getEnv('GROQ_API_KEY') && (model.includes('llama') || model.includes('groq') || model.includes('kimi') || model.includes('moonshotai'))) {
    providerModel = getGroq()(model.replace('meta-llama/', ''));
  } else {
    providerModel = getOpenRouter()(model);
  }

  console.log('[LLM] About to call generateText...');

  const result = await generateText({
    model: providerModel as LanguageModelV1,
    messages,
    temperature,
    maxTokens,
    providerOptions: options.thinking
      ? {
          anthropic: { thinking: { type: 'enabled', budget_tokens: options.thinking.budget } },
          openrouter: { thinking: { type: 'enabled', budget_tokens: options.thinking.budget } },
        }
      : undefined,
  });

  // Track costs
  if (trackCost && result.usage) {
    const usage: LLMUsage = {
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      totalTokens: result.usage.totalTokens,
      model,
      costUSD: calculateCost(model, result.usage.promptTokens, result.usage.completionTokens),
    };
    _currentRequestCosts.push(usage);
    console.log(`[LLM] ${model}: ${usage.totalTokens} tokens, $${usage.costUSD.toFixed(4)}`);
  }

  return result.text;
}

/**
 * Generate streaming text completion
 */
export async function generateStreamingCompletion(messages: LLMMessage[], options: LLMOptions = {}) {
  const { model = DEFAULT_MODEL, temperature = 0.7, maxTokens = 4000 } = options;

  return streamText({
    model: getOpenRouter()(model) as LanguageModelV1,
    messages,
    temperature,
    maxTokens,
  });
}

/**
 * Generate structured JSON response
 */
export async function generateJSON<T>(messages: LLMMessage[], options: LLMOptions = {}): Promise<T> {
  const systemMessage: LLMMessage = {
    role: 'system',
    content: 'You must respond with valid JSON only. No markdown, no explanations, just JSON.',
  };

  const result = await generateCompletion([systemMessage, ...messages], { ...options, temperature: 0.3 });

  try {
    const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/) || result.match(/```\n([\s\S]*?)\n```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : result;
    return JSON.parse(jsonStr.trim());
  } catch (error) {
    console.error('Failed to parse JSON response:', result);
    throw new Error('Invalid JSON response from LLM');
  }
}

/**
 * Helper: Create a simple chat completion
 */
export async function chat(userMessage: string, systemPrompt?: string, options?: LLMOptions): Promise<string> {
  const messages: LLMMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userMessage });
  return generateCompletion(messages, options);
}

/**
 * Prompt templates for all agents
 */
export const prompts = {
  businessAgent: `You are a friendly business consultant helping users create their website.
Your job is to ask questions to understand their business and gather key information.
Be conversational, warm, and encouraging. Ask one question at a time.`,

  generateProjectMetadata: (businessInfo: string) => `Based on this business information:
${businessInfo}
Generate a professional project name and description.
Respond with JSON: {"projectName": "...", "description": "...", "tags": [...]}`,

  recommendTemplates: (businessInfo: string, templates: string) => `Based on this business information:
${businessInfo}
Available templates: ${templates}
Recommend the 2-3 best templates. Respond with JSON.`,

  fixBuildError: (errorLog: string, fileContent: string, filePath: string) => `Fix the build error in ${filePath}:
Error: ${errorLog}
File: ${fileContent}
Return ONLY the fixed file content, no explanations.`,
};

