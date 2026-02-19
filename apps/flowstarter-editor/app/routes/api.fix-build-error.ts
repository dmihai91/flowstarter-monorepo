/**
 * API endpoint for auto-fixing build errors
 *
 * Uses the FlowOps three-tier self-healing system:
 * 1. Rule-based fixes (instant CSS/syntax patterns)
 * 2. Search-based fixes (Tavily web search for solutions)
 * 3. LLM-based fixes (Kimi K2 for complex errors)
 */

import { type ActionFunctionArgs, json } from '@remix-run/cloudflare';
import { createScopedLogger } from '~/utils/logger';
import { getSelfHealingTool, type SelfHealingInput } from '~/lib/flowstarter/tools';

const logger = createScopedLogger('api.fix-build-error');

interface FixBuildErrorRequest {
  buildError: {
    file: string;
    line: string;
    message: string;
    fullOutput: string;
  };
  fileContent: string;
  maxAttempts?: number;
}

interface FixBuildErrorResponse {
  success: boolean;
  fixedContent?: string;
  summary?: string;
  tier?: 'rule' | 'search' | 'llm' | 'escalate';
  attempts?: number;
  timeMs?: number;
  error?: string;
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const startTime = Date.now();

  try {
    const body = (await request.json()) as FixBuildErrorRequest;
    const { buildError, fileContent, maxAttempts = 3 } = body;

    if (!buildError || !fileContent) {
      return json({ error: 'buildError and fileContent are required' }, { status: 400 });
    }

    logger.info(`Attempting to fix build error in ${buildError.file} at line ${buildError.line}`);

    // Use FlowOps SelfHealingTool
    const selfHealingTool = getSelfHealingTool();

    const input: SelfHealingInput = {
      content: fileContent,
      file: buildError.file,
      errorMessage: buildError.message,
      line: parseInt(buildError.line, 10) || undefined,
      errorType: detectErrorType(buildError.message),
      framework: 'astro', // Default to astro for template projects
      fullOutput: buildError.fullOutput,
      enableTiers: {
        rule: true,
        search: true,
        llm: true,
      },
      maxLLMAttempts: Math.max(1, maxAttempts - 1), // Reserve first attempt for rule-based
    };

    const result = await selfHealingTool.run(input);
    const timeMs = Date.now() - startTime;

    if (result.success && result.data?.fixed && result.data.fixedContent) {
      logger.info(`Successfully fixed build error using tier: ${result.data.tier} (${timeMs}ms)`);

      const response: FixBuildErrorResponse = {
        success: true,
        fixedContent: result.data.fixedContent,
        summary: result.data.summary || 'Fixed build error',
        tier: result.data.tier === 'none' ? 'escalate' : result.data.tier,
        attempts: result.data.attempts,
        timeMs,
      };

      return json(response);
    }

    // All tiers failed
    const attempts = result.data?.attempts ?? 1;
    logger.error(`Failed to fix build error after ${attempts} attempts`);

    const response: FixBuildErrorResponse = {
      success: false,
      tier: result.data?.tier === 'none' ? 'escalate' : result.data?.tier,
      attempts,
      timeMs,
      error: result.error || 'Failed to fix build error',
    };

    return json(response, { status: 500 });
  } catch (error) {
    logger.error('Fix build error API error:', error);

    const response: FixBuildErrorResponse = {
      success: false,
      timeMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return json(response, { status: 500 });
  }
}

/**
 * Detect error type from message
 */
function detectErrorType(message: string): SelfHealingInput['errorType'] {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes('class does not exist') ||
    lowerMessage.includes('tailwind') ||
    lowerMessage.includes('postcss')
  ) {
    return 'css';
  }

  if (
    lowerMessage.includes('syntaxerror') ||
    lowerMessage.includes('unexpected token') ||
    lowerMessage.includes('expected')
  ) {
    return 'syntax';
  }

  if (lowerMessage.includes('typeerror') || lowerMessage.includes('type') || lowerMessage.includes('ts')) {
    return 'type';
  }

  if (lowerMessage.includes('referenceerror') || lowerMessage.includes('is not defined')) {
    return 'runtime';
  }

  if (lowerMessage.includes('cannot find module') || lowerMessage.includes('module not found')) {
    return 'dependency';
  }

  return 'unknown';
}

