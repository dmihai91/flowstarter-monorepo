/**
 * FlowOps Fixer Agent (Support)
 *
 * A dedicated agent for fixing code errors with three-tier approach:
 * 1. Rule-based fixes (instant, no LLM)
 * 2. Search-based fixes (Tavily search for solutions)
 * 3. LLM-based fixes (Kimi K2 primary, Claude Sonnet fallback)
 *
 * Model Strategy:
 * - Primary: Kimi K2 (fast, cheap) for most fixes
 * - Fallback: Claude Sonnet (higher quality) when K2 struggles
 *
 * This agent is called by Gretly Engine when build errors are detected.
 * Communicates with PlannerAgent (for escalation) via FlowOps protocol.
 */

import { BaseAgent, type AgentContext, type AgentResponse } from '~/lib/flowops/agent';
import { getSearchTool } from '~/lib/flowstarter/tools/search-tool';
import { FixerRequestSchema, type FixerRequestDTO, type FixerResponseDTO } from '~/lib/flowops/schema';

// Re-export FixerResponseDTO for consumers
export type { FixerResponseDTO } from '~/lib/flowops/schema';
import { generateJSON } from '~/lib/services/llm';

/*
 * ============================================================================
 * CSS Class Replacements (Tier 1 - Rule-based)
 * ============================================================================
 */

const CSS_REPLACEMENTS: [RegExp, string][] = [
  // Font classes
  [/\bfont-display\b/g, 'font-sans'],
  [/\bfont-heading\b/g, 'font-serif'],

  // Background colors
  [/\bbg-dark\b/g, 'bg-gray-900'],
  [/\bbg-light\b/g, 'bg-gray-100'],
  [/\bbg-cream\b/g, 'bg-stone-100'],
  [/\bbg-lime\b/g, 'bg-lime-400'],
  [/\bbg-primary\b/g, 'bg-blue-600'],
  [/\bbg-secondary\b/g, 'bg-gray-600'],
  [/\bbg-accent\b/g, 'bg-amber-500'],
  [/\bbg-dark-\d+\b/g, 'bg-gray-800'],

  // Text colors
  [/\btext-dark\b/g, 'text-gray-900'],
  [/\btext-light\b/g, 'text-gray-100'],
  [/\btext-cream\b/g, 'text-stone-100'],
  [/\btext-primary\b/g, 'text-blue-600'],
  [/\btext-secondary\b/g, 'text-gray-600'],

  // Border colors
  [/\bborder-dark\b/g, 'border-gray-900'],
  [/\bborder-light\b/g, 'border-gray-100'],
  [/\bborder-primary\b/g, 'border-blue-600'],

  // Hover variants
  [/\bhover:bg-primary-dark\b/g, 'hover:bg-blue-700'],
  [/\bhover:bg-dark\b/g, 'hover:bg-gray-800'],
  [/\bhover:text-primary\b/g, 'hover:text-blue-600'],

  // Focus variants
  [/\bfocus:ring-primary\b/g, 'focus:ring-blue-500'],
  [/\bfocus:border-primary\b/g, 'focus:border-blue-500'],

  // Generic suffix handling
  [/\b(bg|text|border|ring)-([a-z]+)-dark\b/g, '$1-$2-700'],
  [/\b(bg|text|border|ring)-([a-z]+)-light\b/g, '$1-$2-300'],
];

/*
 * ============================================================================
 * Constants
 * ============================================================================
 */

/** Primary model for fixes - Claude Sonnet 4 (fresh perspective, high quality) */
const PRIMARY_MODEL = 'anthropic/claude-sonnet-4';

/** Fast fallback model - Kimi K2 on Groq (for simpler errors) */
const FAST_MODEL = 'moonshotai/kimi-k2-instruct-0905';

/*
 * ============================================================================
 * LLM Response Type
 * ============================================================================
 */

interface LLMFixResponse {
  success: boolean;
  fixedContent?: string;
  summary?: string;
}

/*
 * ============================================================================
 * Fixer Agent Implementation
 * ============================================================================
 */

export class FixerAgent extends BaseAgent {
  /** Whether to try fast model (K2) first before Sonnet */
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
Sonnet 4 is your primary model - it brings a fresh perspective to analyze and fix issues.

CRITICAL: TypeScript implicit 'any' errors are common. Fix them by:
- Adding types to .map() callbacks: {items.map((item) => ...)} → {items.map((item: ItemType) => ...)}
- Common fixes: (slot) → (slot: {day: string; times: string[]}), (time, i) → (time: string, i: number)
- For unknown types, use explicit inline types or 'as any' as last resort`,
      allowedTools: ['search'],
      allowedAgents: ['planner'], // Can escalate to PlannerAgent
    });
    this.tryFastModelFirst = tryFastModelFirst;
  }

  protected async process(message: string, context: AgentContext): Promise<AgentResponse> {
    context.onProgress?.('Parsing fix request...', 5);

    // Parse and validate request
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

    // Track attempts
    let attempts = 0;

    /*
     * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
     * Tier 1: Rule-based fixes (instant)
     * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
     */
    attempts++;
    context.onProgress?.('Applying rule-based fixes...', 15);

    const ruleFix = this.applyRuleBasedFixes(request.content, request.file, request.error);

    if (ruleFix && this.validateFix(ruleFix, request.file)) {
      this.logger.info('Tier 1 (rule-based) fix applied');
      return this.createSuccessResponse({
        success: true,
        fixedContent: ruleFix,
        summary: 'Applied rule-based CSS/syntax fix',
        tier: 'rule',
        attempts,
      });
    }

    /*
     * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
     * Tier 2: Search-based (via SearchTool)
     * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
     */
    attempts++;
    context.onProgress?.('Searching for solutions...', 35);

    let searchContext: string = '';

    try {
      const searchTool = getSearchTool();
      const framework = this.detectFramework(request.file);
      const searchResult = await searchTool.searchError(request.error, framework);

      if (searchResult && searchResult.results.length > 0) {
        // Build context from search results
        if (searchResult.answer) {
          searchContext += `\n\nAI ANSWER FROM SEARCH:\n${searchResult.answer}`;
        }

        searchContext +=
          '\n\nRELEVANT SEARCH RESULTS:\n' +
          searchResult.results
            .slice(0, 3)
            .map((r) => `- ${r.title} (score: ${(r.score * 100).toFixed(0)}%)\n  ${r.content.slice(0, 200)}`)
            .join('\n');

        this.logger.info('Tier 2 (search-based) found context');
      }
    } catch (err) {
      this.logger.warn('Search-based lookup failed:', err);
    }

    /*
     * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
     * Tier 3a: Fast model (K2) - Optional, only if tryFastModelFirst is true
     * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
     */
    if (this.tryFastModelFirst) {
      attempts++;
      context.onProgress?.('Trying fast fix with Kimi K2...', 50);

      try {
        const k2Fix = await this.applyLLMFix(request, searchContext, FAST_MODEL);

        if (k2Fix && this.validateFix(k2Fix.fixedContent, request.file)) {
          this.logger.info(`Tier 3a (Kimi K2 fast) fix applied: ${k2Fix.summary}`);
          return this.createSuccessResponse({
            success: true,
            fixedContent: k2Fix.fixedContent,
            summary: `[K2] ${k2Fix.summary}`,
            tier: 'llm',
            attempts,
          });
        }
      } catch (err) {
        this.logger.warn('Kimi K2 fast fix failed, escalating to Sonnet:', err);
      }
    }

    /*
     * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
     * Tier 3b: Claude Sonnet 4 (Primary - Fresh Perspective)
     * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
     */
    const maxSonnetAttempts = 2;

    for (let sonnetAttempt = 1; sonnetAttempt <= maxSonnetAttempts; sonnetAttempt++) {
      attempts++;
      context.onProgress?.(`Claude Sonnet 4 analyzing error (attempt ${sonnetAttempt})...`, 60 + sonnetAttempt * 15);

      try {
        const sonnetFix = await this.applyLLMFix(request, searchContext, PRIMARY_MODEL);

        if (sonnetFix && this.validateFix(sonnetFix.fixedContent, request.file)) {
          this.logger.info(`Tier 3b (Sonnet 4) fix applied: ${sonnetFix.summary}`);
          return this.createSuccessResponse({
            success: true,
            fixedContent: sonnetFix.fixedContent,
            summary: sonnetFix.summary,
            tier: 'llm',
            attempts,
          });
        }
      } catch (err) {
        this.logger.warn(`Sonnet 4 fix attempt ${sonnetAttempt} failed:`, err);
      }
    }

    /*
     * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
     * All tiers failed
     * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
     */
    this.logger.error(`Fix failed after ${attempts} attempts`);
    context.onProgress?.('Fix failed', 100);

    return this.createSuccessResponse({
      success: false,
      tier: 'none',
      attempts,
      error: 'All fix attempts failed',
    });
  }

  /*
   * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   * Tier 1: Rule-based fixes
   * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   */

  private applyRuleBasedFixes(content: string, file: string, error: string): string | null {
    if (!file.match(/\.(css|scss|astro|tsx?|jsx?)$/)) {
      return null;
    }

    let fixed = content;
    let hasChanges = false;

    // Apply CSS replacements
    for (const [pattern, replacement] of CSS_REPLACEMENTS) {
      const before = fixed;
      fixed = fixed.replace(pattern, replacement);

      if (fixed !== before) {
        hasChanges = true;
      }
    }

    // Astro-specific: Remove astro-icon imports
    if (file.endsWith('.astro') && error.includes('Icon')) {
      const before = fixed;
      fixed = fixed.replace(/import\s*{\s*Icon\s*}\s*from\s*['"]astro-icon\/components['"];?\n?/g, '');
      fixed = fixed.replace(/<Icon[^>]*\/>/g, '<!-- Icon removed -->');
      fixed = fixed.replace(/<Icon[^>]*>.*?<\/Icon>/gs, '<!-- Icon removed -->');

      if (fixed !== before) {
        hasChanges = true;
      }
    }

    // TypeScript: Fix implicit 'any' in .map() callbacks
    if ((file.endsWith('.astro') || file.endsWith('.tsx')) && error.includes("implicitly has an 'any' type")) {
      const before = fixed;
      
      // Fix common untyped .map() patterns
      // slots.map((slot) => ...) -> slots.map((slot: { day: string; times: string[] }) => ...)
      fixed = fixed.replace(/\.map\(\(slot\)\s*=>/g, '.map((slot: { day: string; times: string[] }) =>');
      
      // time, i -> time: string, i: number
      fixed = fixed.replace(/\.map\(\(time,\s*i\)\s*=>/g, '.map((time: string, i: number) =>');
      fixed = fixed.replace(/\.map\(\(time\)\s*=>/g, '.map((time: string) =>');
      
      // item -> item: any (fallback)
      fixed = fixed.replace(/\.map\(\(item\)\s*=>/g, '.map((item: any) =>');
      
      // feature -> feature: { title: string; description: string }
      fixed = fixed.replace(/\.map\(\(feature\)\s*=>/g, '.map((feature: { title?: string; description?: string; icon?: string; name?: string }) =>');
      
      // benefit -> benefit: string
      fixed = fixed.replace(/\.map\(\(benefit\)\s*=>/g, '.map((benefit: string | { title?: string; text?: string }) =>');
      
      // stat -> stat: { value: string; label: string }
      fixed = fixed.replace(/\.map\(\(stat\)\s*=>/g, '.map((stat: { value: string; label: string }) =>');
      
      // plan -> plan: any (complex type)
      fixed = fixed.replace(/\.map\(\(plan\)\s*=>/g, '.map((plan: any) =>');
      
      // service -> service: any
      fixed = fixed.replace(/\.map\(\(service\)\s*=>/g, '.map((service: any) =>');
      
      // link -> link: { href: string; label: string }
      fixed = fixed.replace(/\.map\(\(link\)\s*=>/g, '.map((link: { href: string; label: string; text?: string }) =>');
      
      // hour -> hour: { day: string; hours: string }
      fixed = fixed.replace(/\.map\(\(hour\)\s*=>/g, '.map((hour: { day: string; hours: string }) =>');
      
      // image -> image: string
      fixed = fixed.replace(/\.map\(\(image\)\s*=>/g, '.map((image: string) =>');
      fixed = fixed.replace(/\.map\(\(image,\s*index\)\s*=>/g, '.map((image: string, index: number) =>');
      
      // testimonial/review
      fixed = fixed.replace(/\.map\(\(testimonial\)\s*=>/g, '.map((testimonial: { name: string; text: string; rating?: number; role?: string }) =>');
      fixed = fixed.replace(/\.map\(\(review\)\s*=>/g, '.map((review: { name: string; text: string; rating?: number }) =>');
      
      if (fixed !== before) {
        hasChanges = true;
        this.logger.info('Applied TypeScript implicit any fixes');
      }
    }

    return hasChanges ? fixed : null;
  }

  /*
   * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   * Tier 3: LLM-based fixes
   * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   */

  private async applyLLMFix(
    request: FixerRequestDTO,
    searchContext: string,
    model: string = PRIMARY_MODEL,
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
   - {items.map((item) => ...)} -> {items.map((item: ItemType) => ...)}
   - (slot) -> (slot: { day: string; times: string[] })
   - (time, i) -> (time: string, i: number)
   - (feature) -> (feature: { title: string; description: string })
   - When in doubt, use 'any' as the type

OUTPUT (JSON only):
{
  "success": true,
  "fixedContent": "complete fixed file here",
  "summary": "brief description of fix"
}`;

    const response = await generateJSON<LLMFixResponse>([{ role: 'user', content: prompt }], {
      model,
      temperature: 0.1,
      maxTokens: 8000,
    });

    if (response.success && response.fixedContent) {
      if (response.fixedContent === request.content) {
        this.logger.warn('LLM fix did not modify content');
        return null;
      }

      return {
        fixedContent: response.fixedContent,
        summary: response.summary ?? 'Fixed error',
      };
    }

    return null;
  }

  /*
   * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   * Validation
   * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   */

  private validateFix(content: string, filePath: string): boolean {
    // Check bracket balance
    const opens = (content.match(/[{[(]/g) || []).length;
    const closes = (content.match(/[}\])]/g) || []).length;

    if (Math.abs(opens - closes) > 2) {
      this.logger.warn(`Fix has unbalanced brackets: ${opens} opens, ${closes} closes`);
      return false;
    }

    // Check Astro frontmatter balance
    if (filePath.endsWith('.astro')) {
      const markers = (content.match(/^---$/gm) || []).length;

      if (markers !== 0 && markers !== 2) {
        this.logger.warn(`Fix has invalid Astro frontmatter: ${markers} markers`);
        return false;
      }
    }

    // Check for empty content
    if (content.trim().length < 10) {
      this.logger.warn('Fix resulted in near-empty file');
      return false;
    }

    return true;
  }

  private detectFramework(file: string): string | undefined {
    if (file.endsWith('.astro')) {
      return 'astro';
    }

    if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      return 'react';
    }

    if (file.endsWith('.vue')) {
      return 'vue';
    }

    if (file.endsWith('.svelte')) {
      return 'svelte';
    }

    return undefined;
  }

  /*
   * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   * Response helpers
   * �"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?�"?
   */

  private createSuccessResponse(data: FixerResponseDTO): AgentResponse {
    return {
      message: this.createMessage('agent', JSON.stringify(data)),
      complete: true,
      toolCalls: [],
    };
  }

  private createErrorResponse(error: string, _context: AgentContext): AgentResponse {
    const data: FixerResponseDTO = {
      success: false,
      tier: 'none',
      attempts: 0,
      error,
    };
    return {
      message: this.createMessage('agent', JSON.stringify(data)),
      complete: false,
      nextAction: 'Provide valid input',
    };
  }
}

/*
 * ============================================================================
 * Singleton instance
 * ============================================================================
 */

let fixerAgentInstance: FixerAgent | null = null;

/**
 * Get the singleton FixerAgent instance.
 * @param tryFastModelFirst Whether to try K2 before Sonnet (default: false - Sonnet is primary)
 */
export function getFixerAgent(tryFastModelFirst?: boolean): FixerAgent {
  if (!fixerAgentInstance) {
    fixerAgentInstance = new FixerAgent(tryFastModelFirst);
  }

  return fixerAgentInstance;
}

/**
 * Reset the singleton (for testing).
 */
export function resetFixerAgent(): void {
  fixerAgentInstance = null;
}



