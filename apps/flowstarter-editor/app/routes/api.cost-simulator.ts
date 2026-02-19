/**
 * Cost Simulator API
 *
 * Simulates and estimates the cost of website generation
 * based on all models involved in the pipeline.
 *
 * Pricing Sources (as of Feb 2026):
 * - OpenRouter: https://openrouter.ai/models
 * - Groq: https://groq.com/pricing
 * - fal.ai: https://fal.ai/pricing
 */

import { json, type ActionFunctionArgs } from '@remix-run/node';

/**
 * Model pricing per 1M tokens (USD)
 */
const MODEL_PRICING = {
  // Claude models (via OpenRouter)
  'anthropic/claude-opus-4-6': {
    input: 15.00,
    output: 75.00,
    name: 'Claude Opus 4.6',
    provider: 'OpenRouter',
  },
  'anthropic/claude-sonnet-4': {
    input: 3.00,
    output: 15.00,
    name: 'Claude Sonnet 4',
    provider: 'OpenRouter',
  },
  
  // Kimi K2.5 (via OpenRouter)
  'moonshotai/kimi-k2-instruct-0905': {
    input: 0.60,
    output: 2.40,
    name: 'Kimi K2.5',
    provider: 'OpenRouter',
  },
  
  // Llama 3.3 (via Groq - fast inference)
  'llama-3.3-70b-versatile': {
    input: 0.59,
    output: 0.79,
    name: 'Llama 3.3 70B',
    provider: 'Groq',
  },
};

/**
 * fal.ai image generation pricing
 */
const IMAGE_PRICING = {
  'fal-ai/flux/schnell': {
    perImage: 0.025,
    name: 'FLUX Schnell',
  },
  'fal-ai/flux/dev': {
    perImage: 0.05,
    name: 'FLUX Dev',
  },
};

/**
 * Estimated token usage per phase
 */
interface PhaseEstimate {
  phase: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  calls: number;
  description: string;
}

/**
 * Full website generation cost breakdown
 */
function estimateGenerationCost(options: {
  complexity: 'simple' | 'medium' | 'complex';
  includeAssets: boolean;
  numAssets: number;
  numFixAttempts: number;
  includeReview: boolean;
}): {
  phases: Array<PhaseEstimate & { cost: number }>;
  imageCost: number;
  totalCost: number;
  breakdown: Record<string, number>;
} {
  const { complexity, includeAssets, numAssets, numFixAttempts, includeReview } = options;
  
  // Complexity multipliers
  const multiplier = complexity === 'simple' ? 0.7 : complexity === 'complex' ? 1.5 : 1.0;
  
  const phases: PhaseEstimate[] = [
    // Phase 1: Planning (Opus 4.6)
    {
      phase: 'Planning',
      model: 'anthropic/claude-opus-4-6',
      inputTokens: Math.round(3000 * multiplier),  // Template + business info context
      outputTokens: Math.round(2000 * multiplier), // Modification plan
      calls: 1,
      description: 'PlannerAgent creates modification plan',
    },
    
    // Phase 2: Code Generation (Kimi K2.5)
    {
      phase: 'Code Generation',
      model: 'moonshotai/kimi-k2-instruct-0905',
      inputTokens: Math.round(8000 * multiplier),  // Template files + plan
      outputTokens: Math.round(15000 * multiplier), // Generated code
      calls: Math.round(5 * multiplier), // Multiple file batches
      description: 'CodeGeneratorAgent generates/modifies files',
    },
    
    // Phase 3: Build & Fix (Sonnet 4) - conditional
    ...Array(numFixAttempts).fill(null).map((_, i) => ({
      phase: `Fix Attempt ${i + 1}`,
      model: 'anthropic/claude-sonnet-4',
      inputTokens: 2000,  // Error log + file content
      outputTokens: 3000, // Fixed code
      calls: 1,
      description: 'FixerAgent fixes build errors',
    })),
    
    // Phase 4: Review (Opus 4.6) - conditional
    ...(includeReview ? [{
      phase: 'Review',
      model: 'anthropic/claude-opus-4-6',
      inputTokens: Math.round(5000 * multiplier),  // Generated files
      outputTokens: 1000, // Review feedback
      calls: 1,
      description: 'PlannerAgent reviews output quality',
    }] : []),
  ];
  
  // Calculate costs per phase
  const phasesWithCost = phases.map(phase => {
    const pricing = MODEL_PRICING[phase.model as keyof typeof MODEL_PRICING];
    const inputCost = (phase.inputTokens * phase.calls / 1_000_000) * pricing.input;
    const outputCost = (phase.outputTokens * phase.calls / 1_000_000) * pricing.output;
    return {
      ...phase,
      cost: inputCost + outputCost,
    };
  });
  
  // Image generation cost
  const imageCost = includeAssets 
    ? numAssets * IMAGE_PRICING['fal-ai/flux/schnell'].perImage 
    : 0;
  
  // Breakdown by model
  const breakdown: Record<string, number> = {};
  for (const phase of phasesWithCost) {
    const modelName = MODEL_PRICING[phase.model as keyof typeof MODEL_PRICING].name;
    breakdown[modelName] = (breakdown[modelName] || 0) + phase.cost;
  }
  if (imageCost > 0) {
    breakdown['fal.ai Images'] = imageCost;
  }
  
  const totalCost = phasesWithCost.reduce((sum, p) => sum + p.cost, 0) + imageCost;
  
  return {
    phases: phasesWithCost,
    imageCost,
    totalCost,
    breakdown,
  };
}

/**
 * Modification cost (simpler flow)
 */
function estimateModificationCost(options: {
  route: 'simple' | 'gretly';
  numFixAttempts: number;
}): {
  phases: Array<PhaseEstimate & { cost: number }>;
  totalCost: number;
  breakdown: Record<string, number>;
} {
  const { route, numFixAttempts } = options;
  
  const phases: PhaseEstimate[] = [
    // Routing (Llama 3.3 on Groq)
    {
      phase: 'Routing',
      model: 'llama-3.3-70b-versatile',
      inputTokens: 200,
      outputTokens: 50,
      calls: 1,
      description: 'Router classifies request complexity',
    },
  ];
  
  if (route === 'simple') {
    // Simple modification (single Sonnet call)
    phases.push({
      phase: 'Simple Modification',
      model: 'anthropic/claude-sonnet-4',
      inputTokens: 4000,  // Files + instruction
      outputTokens: 3000, // Modified files
      calls: 1,
      description: 'Direct file modification',
    });
  } else {
    // Gretly pipeline
    phases.push(
      {
        phase: 'Planning',
        model: 'anthropic/claude-opus-4-6',
        inputTokens: 3000,
        outputTokens: 1500,
        calls: 1,
        description: 'PlannerAgent creates modification plan',
      },
      {
        phase: 'Code Generation',
        model: 'moonshotai/kimi-k2-instruct-0905',
        inputTokens: 6000,
        outputTokens: 10000,
        calls: 3,
        description: 'CodeGeneratorAgent modifies files',
      },
      ...Array(numFixAttempts).fill(null).map((_, i) => ({
        phase: `Fix Attempt ${i + 1}`,
        model: 'anthropic/claude-sonnet-4' as const,
        inputTokens: 2000,
        outputTokens: 3000,
        calls: 1,
        description: 'FixerAgent fixes build errors',
      })),
      {
        phase: 'Review',
        model: 'anthropic/claude-opus-4-6',
        inputTokens: 4000,
        outputTokens: 800,
        calls: 1,
        description: 'PlannerAgent reviews changes',
      }
    );
  }
  
  // Calculate costs
  const phasesWithCost = phases.map(phase => {
    const pricing = MODEL_PRICING[phase.model as keyof typeof MODEL_PRICING];
    const inputCost = (phase.inputTokens * phase.calls / 1_000_000) * pricing.input;
    const outputCost = (phase.outputTokens * phase.calls / 1_000_000) * pricing.output;
    return {
      ...phase,
      cost: inputCost + outputCost,
    };
  });
  
  // Breakdown by model
  const breakdown: Record<string, number> = {};
  for (const phase of phasesWithCost) {
    const modelName = MODEL_PRICING[phase.model as keyof typeof MODEL_PRICING].name;
    breakdown[modelName] = (breakdown[modelName] || 0) + phase.cost;
  }
  
  const totalCost = phasesWithCost.reduce((sum, p) => sum + p.cost, 0);
  
  return { phases: phasesWithCost, totalCost, breakdown };
}

/**
 * API Handler
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json() as {
      type: 'generation' | 'modification';
      complexity?: 'simple' | 'medium' | 'complex';
      includeAssets?: boolean;
      numAssets?: number;
      numFixAttempts?: number;
      includeReview?: boolean;
      route?: 'simple' | 'gretly';
    };

    if (body.type === 'generation') {
      const result = estimateGenerationCost({
        complexity: body.complexity || 'medium',
        includeAssets: body.includeAssets ?? true,
        numAssets: body.numAssets ?? 3,
        numFixAttempts: body.numFixAttempts ?? 1,
        includeReview: body.includeReview ?? true,
      });
      
      return json({
        success: true,
        type: 'generation',
        ...result,
        summary: {
          totalCost: `$${result.totalCost.toFixed(4)}`,
          perSite: `~$${result.totalCost.toFixed(2)} per site`,
        },
      });
    } else {
      const result = estimateModificationCost({
        route: body.route || 'simple',
        numFixAttempts: body.numFixAttempts ?? 0,
      });
      
      return json({
        success: true,
        type: 'modification',
        route: body.route || 'simple',
        ...result,
        summary: {
          totalCost: `$${result.totalCost.toFixed(4)}`,
          perModification: `~$${result.totalCost.toFixed(3)} per modification`,
        },
      });
    }
  } catch (error) {
    console.error('[CostSimulator] Error:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * Quick summary for logging/display
 */
export function getCostSummary() {
  const generation = estimateGenerationCost({
    complexity: 'medium',
    includeAssets: true,
    numAssets: 3,
    numFixAttempts: 1,
    includeReview: true,
  });
  
  const simpleModification = estimateModificationCost({
    route: 'simple',
    numFixAttempts: 0,
  });
  
  const gretlyModification = estimateModificationCost({
    route: 'gretly',
    numFixAttempts: 1,
  });
  
  return {
    generation: {
      total: generation.totalCost,
      breakdown: generation.breakdown,
    },
    simpleModification: {
      total: simpleModification.totalCost,
      breakdown: simpleModification.breakdown,
    },
    gretlyModification: {
      total: gretlyModification.totalCost,
      breakdown: gretlyModification.breakdown,
    },
  };
}

