/**
 * Flowstarter Self-Healing Tool
 *
 * Three-tier self-healing system for fixing build errors:
 * - Tier 1: Rule-based fixes (instant)
 * - Tier 2: Search-based fixes (via SearchTool)
 * - Tier 3: LLM-based fixes (Sonnet-4-6)
 */

import { BaseTool, type ToolContext } from '~/lib/flowops/base-tool';
import { getSearchTool, type SearchOutput } from './search-tool';
import { generateJSON } from '~/lib/services/llm';

/*
 * ============================================================================
 * Types
 * ============================================================================
 */

export interface SelfHealingInput {
  /** The file content to fix */
  content: string;

  /** File path */
  file: string;

  /** Error message */
  errorMessage: string;

  /** Line number (if known) */
  line?: number;

  /** Error type */
  errorType?: 'syntax' | 'type' | 'runtime' | 'dependency' | 'css' | 'unknown';

  /** Framework */
  framework?: 'astro' | 'react' | 'vue' | 'svelte';

  /** Full build output */
  fullOutput?: string;

  /** Which tiers to enable */
  enableTiers?: {
    rule?: boolean;
    search?: boolean;
    llm?: boolean;
  };

  /** Maximum LLM attempts */
  maxLLMAttempts?: number;
}

export interface SelfHealingOutput {
  /** Whether a fix was applied */
  fixed: boolean;

  /** The fixed content (if successful) */
  fixedContent?: string;

  /** Summary of what was fixed */
  summary?: string;

  /** Which tier provided the fix */
  tier: 'rule' | 'search' | 'llm' | 'none';

  /** Number of attempts made */
  attempts: number;

  /** Search results used (if any) */
  searchContext?: SearchOutput;
}

/*
 * ============================================================================
 * CSS Class Replacements (Tier 1)
 * 
 * Order matters! Specific patterns should come before generic patterns.
 * ============================================================================
 */

const CSS_REPLACEMENTS: [RegExp, string][] = [
  // ── Specific hover/focus variants (must come first) ──────────────────────
  [/\bhover:bg-primary-dark\b/g, 'hover:bg-blue-700'],
  [/\bhover:bg-dark\b/g, 'hover:bg-gray-800'],
  [/\bhover:text-primary\b/g, 'hover:text-blue-600'],
  [/\bfocus:ring-primary\b/g, 'focus:ring-blue-500'],
  [/\bfocus:border-primary\b/g, 'focus:border-blue-500'],

  // ── Font classes ─────────────────────────────────────────────────────────
  [/\bfont-display\b/g, 'font-sans'],
  [/\bfont-heading\b/g, 'font-serif'],

  // ── Background colors ────────────────────────────────────────────────────
  [/\bbg-dark\b/g, 'bg-gray-900'],
  [/\bbg-light\b/g, 'bg-gray-100'],
  [/\bbg-cream\b/g, 'bg-stone-100'],
  [/\bbg-lime\b/g, 'bg-lime-400'],
  [/\bbg-primary\b/g, 'bg-blue-600'],
  [/\bbg-secondary\b/g, 'bg-gray-600'],
  [/\bbg-accent\b/g, 'bg-amber-500'],
  [/\bbg-dark-\d+\b/g, 'bg-gray-800'],

  // ── Text colors ──────────────────────────────────────────────────────────
  [/\btext-dark\b/g, 'text-gray-900'],
  [/\btext-light\b/g, 'text-gray-100'],
  [/\btext-cream\b/g, 'text-stone-100'],
  [/\btext-primary\b/g, 'text-blue-600'],
  [/\btext-secondary\b/g, 'text-gray-600'],

  // ── Border colors ────────────────────────────────────────────────────────
  [/\bborder-dark\b/g, 'border-gray-900'],
  [/\bborder-light\b/g, 'border-gray-100'],
  [/\bborder-primary\b/g, 'border-blue-600'],

  // ── Generic suffix handling (MUST come last) ─────────────────────────────
  // Only match standalone classes, not those with variant prefixes like hover:
  [/(?<![:\w])\b(bg|text|border|ring)-([a-z]+)-dark\b/g, '$1-$2-700'],
  [/(?<![:\w])\b(bg|text|border|ring)-([a-z]+)-light\b/g, '$1-$2-300'],
];

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
 * Self-Healing Tool Implementation
 * ============================================================================
 */

export class SelfHealingTool extends BaseTool<SelfHealingInput, SelfHealingOutput> {
  constructor() {
    super({
      name: 'self-healing',
      description: 'Three-tier self-healing system for build errors',
      version: '2.0.0',
      category: 'code',
      requiresNetwork: true,
      cacheable: false, // Results depend on file content
      timeoutMs: 60000, // LLM can be slow
    });
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * BaseTool implementation
   * ──────────────────────────────────────────────────────────────────────────
   */

  protected validateInput(input: SelfHealingInput): string | null {
    if (!input.content || input.content.trim().length === 0) {
      return 'Content is required';
    }

    if (!input.file) {
      return 'File path is required';
    }

    if (!input.errorMessage) {
      return 'Error message is required';
    }

    return null;
  }

  protected async execute(input: SelfHealingInput, context: ToolContext): Promise<SelfHealingOutput> {
    const enableTiers = {
      rule: input.enableTiers?.rule ?? true,
      search: input.enableTiers?.search ?? true,
      llm: input.enableTiers?.llm ?? true,
    };

    let attempts = 0;
    let searchContext: SearchOutput | undefined;

    this.logger.info(`Starting self-heal for ${input.file}: ${input.errorMessage.slice(0, 100)}`);

    /*
     * ─────────────────────────────────────────────────────────────────────────
     * Tier 1: Rule-based (instant)
     * ─────────────────────────────────────────────────────────────────────────
     */
    if (enableTiers.rule) {
      attempts++;
      context.onProgress?.('Applying rule-based fixes...', 10);

      const ruleFix = this.applyRuleBasedFixes(input.content, input.file, input.errorMessage);

      if (ruleFix && this.validateFix(ruleFix, input.file)) {
        this.logger.info('Tier 1 (rule-based) fix applied');
        return {
          fixed: true,
          fixedContent: ruleFix,
          summary: 'Applied rule-based CSS/syntax fix',
          tier: 'rule',
          attempts,
        };
      }
    }

    /*
     * ─────────────────────────────────────────────────────────────────────────
     * Tier 2: Search-based (via SearchTool)
     * ─────────────────────────────────────────────────────────────────────────
     */
    if (enableTiers.search) {
      attempts++;
      context.onProgress?.('Searching for solutions...', 30);

      try {
        const searchTool = getSearchTool();
        const searchResult = await searchTool.searchError(input.errorMessage, input.framework);

        if (searchResult && searchResult.results.length > 0) {
          searchContext = searchResult;

          // If we got an answer with high confidence, we can use it
          if (searchResult.answer && searchResult.results[0]?.score > 0.7) {
            this.logger.info('Tier 2 (search-based) found high-confidence answer');

            // Note: Tier 2 provides context, actual fix is applied in Tier 3
          }
        }
      } catch (err) {
        this.logger.warn('Search-based lookup failed:', err);
      }
    }

    /*
     * ─────────────────────────────────────────────────────────────────────────
     * Tier 3: LLM-based (Sonnet-4-6)
     * ─────────────────────────────────────────────────────────────────────────
     */
    if (enableTiers.llm) {
      const maxAttempts = input.maxLLMAttempts ?? 2;

      for (let llmAttempt = 1; llmAttempt <= maxAttempts; llmAttempt++) {
        attempts++;
        context.onProgress?.(`Requesting LLM fix (attempt ${llmAttempt})...`, 50 + llmAttempt * 20);

        try {
          const llmFix = await this.applyLLMFix(input, searchContext);

          if (llmFix && this.validateFix(llmFix.fixedContent, input.file)) {
            this.logger.info(`Tier 3 (LLM-based) fix applied: ${llmFix.summary}`);
            return {
              fixed: true,
              fixedContent: llmFix.fixedContent,
              summary: llmFix.summary,
              tier: 'llm',
              attempts,
              searchContext,
            };
          }
        } catch (err) {
          this.logger.warn(`LLM fix attempt ${llmAttempt} failed:`, err);
        }
      }
    }

    /*
     * ─────────────────────────────────────────────────────────────────────────
     * No fix found
     * ─────────────────────────────────────────────────────────────────────────
     */
    this.logger.error(`Self-healing failed after ${attempts} attempts`);
    context.onProgress?.('Self-healing failed', 100);

    return {
      fixed: false,
      tier: 'none',
      attempts,
      searchContext,
    };
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Tier 1: Rule-based fixes
   * ──────────────────────────────────────────────────────────────────────────
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

    // Astro-specific: Remove astro-icon imports (case-insensitive check)
    if (file.endsWith('.astro') && error.toLowerCase().includes('icon')) {
      const before = fixed;
      fixed = fixed.replace(/import\s*{\s*Icon\s*}\s*from\s*['"]astro-icon\/components['"];?\n?/g, '');
      fixed = fixed.replace(/<Icon[^>]*\/>/g, '<!-- Icon removed -->');
      fixed = fixed.replace(/<Icon[^>]*>.*?<\/Icon>/gs, '<!-- Icon removed -->');

      if (fixed !== before) {
        hasChanges = true;
      }
    }

    return hasChanges ? fixed : null;
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Tier 3: LLM-based fixes
   * ──────────────────────────────────────────────────────────────────────────
   */

  private async applyLLMFix(
    input: SelfHealingInput,
    searchContext?: SearchOutput,
  ): Promise<{ fixedContent: string; summary: string } | null> {
    // Build context from search results
    let searchHints = '';

    if (searchContext) {
      if (searchContext.answer) {
        searchHints += `\n\nAI ANSWER FROM SEARCH:\n${searchContext.answer}`;
      }

      if (searchContext.results.length > 0) {
        searchHints +=
          '\n\nRELEVANT SEARCH RESULTS:\n' +
          searchContext.results
            .slice(0, 3)
            .map((r) => `- ${r.title} (score: ${(r.score * 100).toFixed(0)}%)\n  ${r.content.slice(0, 200)}`)
            .join('\n');
      }
    }

    const prompt = `Fix this build error. Return ONLY the complete fixed file.

ERROR:
- File: ${input.file}
- Line: ${input.line ?? 'unknown'}
- Message: ${input.errorMessage}

FULL ERROR OUTPUT:
${(input.fullOutput ?? input.errorMessage).slice(0, 1500)}
${searchHints}

CURRENT FILE:
\`\`\`
${input.content}
\`\`\`

RULES:
1. Fix ONLY the error - don't refactor other code
2. For CSS errors: use standard Tailwind classes (bg-gray-900 not bg-dark)
3. For missing imports in Astro: add imports between --- markers
4. Return the COMPLETE file, not just the fix

OUTPUT (JSON only):
{
  "success": true,
  "fixedContent": "complete fixed file here",
  "summary": "brief description of fix"
}`;

    const response = await generateJSON<LLMFixResponse>([{ role: 'user', content: prompt }], {
      model: 'anthropic/claude-sonnet-4-6',
      temperature: 0.1,
      maxTokens: 8000,
    });

    if (response.success && response.fixedContent) {
      if (response.fixedContent === input.content) {
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
   * ──────────────────────────────────────────────────────────────────────────
   * Validation
   * ──────────────────────────────────────────────────────────────────────────
   */

  private validateFix(content: string | undefined, filePath: string): boolean {
    if (!content) {
      return false;
    }

    // Check bracket balance - reject if difference is more than 1
    const opens = (content.match(/[{[(]/g) || []).length;
    const closes = (content.match(/[}\])]/g) || []).length;

    if (Math.abs(opens - closes) > 1) {
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

  getInputSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'File content to fix' },
        file: { type: 'string', description: 'File path' },
        errorMessage: { type: 'string', description: 'Error message' },
        line: { type: 'number', description: 'Line number' },
        errorType: { type: 'string', enum: ['syntax', 'type', 'runtime', 'dependency', 'css', 'unknown'] },
        framework: { type: 'string', enum: ['astro', 'react', 'vue', 'svelte'] },
        fullOutput: { type: 'string', description: 'Full build output' },
        enableTiers: {
          type: 'object',
          properties: {
            rule: { type: 'boolean', default: true },
            search: { type: 'boolean', default: true },
            llm: { type: 'boolean', default: true },
          },
        },
        maxLLMAttempts: { type: 'number', default: 2 },
      },
      required: ['content', 'file', 'errorMessage'],
    };
  }

  getOutputSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        fixed: { type: 'boolean' },
        fixedContent: { type: 'string' },
        summary: { type: 'string' },
        tier: { type: 'string', enum: ['rule', 'search', 'llm', 'none'] },
        attempts: { type: 'number' },
      },
    };
  }
}

/*
 * ============================================================================
 * Singleton instance
 * ============================================================================
 */

let selfHealingToolInstance: SelfHealingTool | null = null;

/**
 * Get the singleton SelfHealingTool instance.
 */
export function getSelfHealingTool(): SelfHealingTool {
  if (!selfHealingToolInstance) {
    selfHealingToolInstance = new SelfHealingTool();
  }

  return selfHealingToolInstance;
}

/**
 * Reset the singleton (for testing).
 */
export function resetSelfHealingTool(): void {
  selfHealingToolInstance = null;
}


