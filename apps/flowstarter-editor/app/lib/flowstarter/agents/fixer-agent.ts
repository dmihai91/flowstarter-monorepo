/**
 * FlowOps Fixer Agent (Support)
 *
 * Three-tier approach: rule-based → search-based → LLM-based fixes.
 * Primary: Claude Sonnet 4, Fallback: Kimi K2.
 * Called by Gretly Engine when build errors are detected.
 */

import { BaseAgent, type AgentContext, type AgentResponse } from '~/lib/flowops/agent';
import { getSearchTool } from '~/lib/flowstarter/tools/search-tool';
import { FixerRequestSchema, type FixerRequestDTO, type FixerResponseDTO } from '~/lib/flowops/schema';
import { generateJSON } from '~/lib/services/llm';
import { applyRuleBasedFixes, validateFix, detectFramework } from './fixer-agent-rules';

export type { FixerResponseDTO } from '~/lib/flowops/schema';

const PRIMARY_MODEL = 'anthropic/claude-sonnet-4';
const FAST_MODEL = 'moonshotai/kimi-k2-instruct-0905';

interface LLMFixResponse {
  success: boolean;
  fixedContent?: string;
  summary?: string;
}

export class FixerAgent extends BaseAgent {
  private tryFastModelFirst: boolean;

  constructor(tryFastModelFirst: boolean = false) {
    super({
      name: 'fixer',
      description: 'Dedicated agent for fixing code errors (Claude Sonnet 4 primary for fresh perspective)',
      version: '3.0.0',
      systemPrompt: `You are a code fixing agent for Astro/TypeScript websites. You analyze build errors and fix them using:
1. Rule-based fixes for common CSS/syntax issues
2. Web search for documented solutions
3. LLM reasoning for errors (Claude Sonnet 4 primary - brings fresh perspective)

Your goal is to fix errors with minimal changes while maintaining code quality.

CRITICAL: TypeScript implicit 'any' errors are common. Fix them by:
- Adding types to .map() callbacks: {items.map((item) => ...)} → {items.map((item: ItemType) => ...)}
- For unknown types, use explicit inline types or 'as any' as last resort`,
      allowedTools: ['search'],
      allowedAgents: ['planner'],
    });
    this.tryFastModelFirst = tryFastModelFirst;
  }

  protected async process(message: string, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Parsing fix request...', 5);
    let request: FixerRequestDTO;
    try {
      const parsed = JSON.parse(message);
      const validation = FixerRequestSchema.safeParse(parsed);
      if (!validation.success) {
        return this.createErrorResponse(`Invalid request: ${validation.error.message}`, context);
      }
      request = validation.data;
    } catch {
      return this.createErrorResponse('Invalid JSON. Expected: { file, content, error, line?, fullOutput? }', context);
    }

    this.logger.info(`Fixing error in ${request.file}: ${request.error.slice(0, 100)}`);
    let attempts = 0;

    // Tier 1: Rule-based fixes (instant)
    attempts++;
    context.onProgress?.('Applying rule-based fixes...', 15);
    const ruleFix = applyRuleBasedFixes(request.content, request.file, request.error);
    if (ruleFix && validateFix(ruleFix, request.file)) {
      this.logger.info('Tier 1 (rule-based) fix applied');
      return this.createSuccessResponse({
        success: true, fixedContent: ruleFix,
        summary: 'Applied rule-based CSS/syntax fix', tier: 'rule', attempts,
      });
    }

    // Tier 2: Search-based (via SearchTool)
    attempts++;
    context.onProgress?.('Searching for solutions...', 35);
    let searchContext = '';
    try {
      const searchTool = getSearchTool();
      const framework = detectFramework(request.file);
      const searchResult = await searchTool.searchError(request.error, framework);
      if (searchResult && searchResult.results.length > 0) {
        if (searchResult.answer) searchContext += `\n\nAI ANSWER FROM SEARCH:\n${searchResult.answer}`;
        searchContext += '\n\nRELEVANT SEARCH RESULTS:\n' +
          searchResult.results.slice(0, 3)
            .map((r) => `- ${r.title} (score: ${(r.score * 100).toFixed(0)}%)\n  ${r.content.slice(0, 200)}`)
            .join('\n');
        this.logger.info('Tier 2 (search-based) found context');
      }
    } catch (err) {
      this.logger.warn('Search-based lookup failed:', err);
    }

    // Tier 3a: Fast model (K2) - Optional
    if (this.tryFastModelFirst) {
      attempts++;
      context.onProgress?.('Trying fast fix with Kimi K2...', 50);
      try {
        const k2Fix = await this.applyLLMFix(request, searchContext, FAST_MODEL);
        if (k2Fix && validateFix(k2Fix.fixedContent, request.file)) {
          this.logger.info(`Tier 3a (Kimi K2 fast) fix applied: ${k2Fix.summary}`);
          return this.createSuccessResponse({
            success: true, fixedContent: k2Fix.fixedContent,
            summary: `[K2] ${k2Fix.summary}`, tier: 'llm', attempts,
          });
        }
      } catch (err) {
        this.logger.warn('Kimi K2 fast fix failed, escalating to Sonnet:', err);
      }
    }

    // Tier 3b: Claude Sonnet 4 (Primary)
    const maxSonnetAttempts = 2;
    for (let sonnetAttempt = 1; sonnetAttempt <= maxSonnetAttempts; sonnetAttempt++) {
      attempts++;
      context.onProgress?.(`Claude Sonnet 4 analyzing error (attempt ${sonnetAttempt})...`, 60 + sonnetAttempt * 15);
      try {
        const sonnetFix = await this.applyLLMFix(request, searchContext, PRIMARY_MODEL);
        if (sonnetFix && validateFix(sonnetFix.fixedContent, request.file)) {
          this.logger.info(`Tier 3b (Sonnet 4) fix applied: ${sonnetFix.summary}`);
          return this.createSuccessResponse({
            success: true, fixedContent: sonnetFix.fixedContent,
            summary: sonnetFix.summary, tier: 'llm', attempts,
          });
        }
      } catch (err) {
        this.logger.warn(`Sonnet 4 fix attempt ${sonnetAttempt} failed:`, err);
      }
    }

    // All tiers failed
    this.logger.error(`Fix failed after ${attempts} attempts`);
    context.onProgress?.('Fix failed', 100);
    return this.createSuccessResponse({ success: false, tier: 'none', attempts, error: 'All fix attempts failed' });
  }

  private async applyLLMFix(
    request: FixerRequestDTO, searchContext: string, model: string = PRIMARY_MODEL,
  ): Promise<{ fixedContent: string; summary: string } | null> {
    const prompt = `Fix this build error. Return ONLY the complete fixed file.

ERROR:
- File: ${request.file}
- Line: ${request.line ?? 'unknown'}
- Message: ${request.error}

FULL ERROR OUTPUT:
${(request.fullOutput ?? request.error).slice(0, 1500)}
${searchContext}

CURRENT FILE:
\`\`\`
${request.content}
\`\`\`

RULES:
1. Fix ONLY the error - don't refactor other code
2. For CSS errors: use standard Tailwind classes (bg-gray-900 not bg-dark)
3. For missing imports in Astro: add imports between --- markers
4. Return the COMPLETE file, not just the fix
5. For TypeScript 'implicit any' errors: ADD EXPLICIT TYPES to callback parameters

OUTPUT (JSON only):
{
  "success": true,
  "fixedContent": "complete fixed file here",
  "summary": "brief description of fix"
}`;

    const response = await generateJSON<LLMFixResponse>([{ role: 'user', content: prompt }], {
      model, temperature: 0.1, maxTokens: 8000,
    });
    if (response.success && response.fixedContent) {
      if (response.fixedContent === request.content) {
        this.logger.warn('LLM fix did not modify content');
        return null;
      }
      return { fixedContent: response.fixedContent, summary: response.summary ?? 'Fixed error' };
    }
    return null;
  }

  private createSuccessResponse(data: FixerResponseDTO): AgentResponse {
    return { message: this.createMessage('agent', JSON.stringify(data)), complete: true, toolCalls: [] };
  }

  private createErrorResponse(error: string, _context: AgentContext): AgentResponse {
    const data: FixerResponseDTO = { success: false, tier: 'none', attempts: 0, error };
    return { message: this.createMessage('agent', JSON.stringify(data)), complete: false, nextAction: 'Provide valid input' };
  }
}

let fixerAgentInstance: FixerAgent | null = null;

export function getFixerAgent(tryFastModelFirst?: boolean): FixerAgent {
  if (!fixerAgentInstance) fixerAgentInstance = new FixerAgent(tryFastModelFirst);
  return fixerAgentInstance;
}

export function resetFixerAgent(): void {
  fixerAgentInstance = null;
}
