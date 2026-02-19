/**
 * Error Search Service
 *
 * Tier 2 of the self-healing system: Search-based error resolution.
 * Searches for known solutions to build errors before falling back to LLM.
 *
 * Architecture:
 * 1. Normalize error message (strip noise, paths, line numbers)
 * 2. Check local cache of known error patterns
 * 3. Match against pattern database for instant fixes
 * 4. Use FlowOps SearchTool (Tavily API) for web search if not found locally
 * 5. Return high-confidence fixes for known errors
 */

import { createScopedLogger } from '~/utils/logger';
import { getSearchTool } from '~/lib/flowstarter/tools';

const logger = createScopedLogger('errorSearch');

/*
 * ============================================================================
 * Types
 * ============================================================================
 */

export interface ErrorContext {
  message: string;
  type?: 'syntax' | 'type' | 'runtime' | 'dependency' | 'css' | 'unknown';
  file?: string;
  line?: number;
  framework?: 'astro' | 'react' | 'vue' | 'svelte';
  fullOutput?: string;
}

export interface Solution {
  description: string;
  fix: string | ((content: string, error: ErrorContext) => string);
  confidence: number; // 0-1
  source: 'cache' | 'pattern' | 'search';
}

export interface SearchResult {
  error: ErrorContext;
  normalizedError: string;
  solutions: Solution[];
  fromCache: boolean;
  searchTimeMs: number;
}

/*
 * ============================================================================
 * Error Pattern Database
 * ============================================================================
 */

interface ErrorPattern {
  // Regex to match the error message
  pattern: RegExp;

  // Type of error
  type: ErrorContext['type'];

  // Solution generator
  solution: {
    description: string;

    // Can be a string (simple replacement) or function (complex fix)
    fix: string | ((content: string, error: ErrorContext, match: RegExpMatchArray) => string);
    confidence: number;
  };
}

/**
 * Database of known error patterns and their fixes.
 * These are instant fixes that don't require LLM calls.
 */
const ERROR_PATTERNS: ErrorPattern[] = [
  // CSS/Tailwind errors - Invalid class names
  {
    pattern: /The [`']([a-z-]+)[`'] class does not exist/i,
    type: 'css',
    solution: {
      description: 'Replace invalid Tailwind class with standard equivalent',
      fix: (content, _error, match) => {
        const invalidClass = match[1];
        const replacement = CSS_CLASS_REPLACEMENTS[invalidClass];

        if (replacement) {
          return content.replace(new RegExp(`\\b${invalidClass}\\b`, 'g'), replacement);
        }

        // If no known replacement, remove the class
        return content.replace(new RegExp(`\\s*${invalidClass}`, 'g'), '');
      },
      confidence: 0.95,
    },
  },

  // Astro Icon not defined
  {
    pattern: /ReferenceError: Icon is not defined/i,
    type: 'runtime',
    solution: {
      description: 'Add missing Icon import from astro-icon',
      fix: (content) => {
        // Check if import already exists
        if (content.includes("from 'astro-icon")) {
          return content;
        }

        // Add import after the opening ---
        return content.replace(/^---\n/m, "---\nimport { Icon } from 'astro-icon/components';\n");
      },
      confidence: 0.98,
    },
  },

  // Astro Image not defined
  {
    pattern: /ReferenceError: Image is not defined/i,
    type: 'runtime',
    solution: {
      description: 'Add missing Image import from astro:assets',
      fix: (content) => {
        if (content.includes("from 'astro:assets'")) {
          return content;
        }

        return content.replace(/^---\n/m, "---\nimport { Image } from 'astro:assets';\n");
      },
      confidence: 0.98,
    },
  },

  // Missing closing bracket
  {
    pattern: /Unexpected end of input|Expected [}\])] but found/i,
    type: 'syntax',
    solution: {
      description: 'Add missing closing bracket/brace',
      fix: (content, error) => {
        // Count brackets
        const opens = (content.match(/[{[(]/g) || []).length;
        const closes = (content.match(/[}\])]/g) || []).length;

        if (opens > closes) {
          // Find what's missing
          const openBraces = (content.match(/{/g) || []).length;
          const closeBraces = (content.match(/}/g) || []).length;
          const openParens = (content.match(/\(/g) || []).length;
          const closeParens = (content.match(/\)/g) || []).length;
          const openBrackets = (content.match(/\[/g) || []).length;
          const closeBrackets = (content.match(/\]/g) || []).length;

          let suffix = '';

          if (openBraces > closeBraces) {
            suffix += '}'.repeat(openBraces - closeBraces);
          }

          if (openParens > closeParens) {
            suffix += ')'.repeat(openParens - closeParens);
          }

          if (openBrackets > closeBrackets) {
            suffix += ']'.repeat(openBrackets - closeBrackets);
          }

          return content + '\n' + suffix;
        }

        return content;
      },
      confidence: 0.7,
    },
  },

  // Missing comma in object/array
  {
    pattern: /Expected [,}] but found (\w+)/i,
    type: 'syntax',
    solution: {
      description: 'Add missing comma before property',
      fix: (content, error, match) => {
        const nextToken = match[1];

        // Find the pattern: property/value followed by newline/whitespace then the next token
        const pattern = new RegExp(`([^,\\s])(\\s*\\n\\s*)(${nextToken})`, 'g');

        return content.replace(pattern, '$1,$2$3');
      },
      confidence: 0.8,
    },
  },

  // Cannot find module (internal path)
  {
    pattern: /Cannot find module ['"](@\/|\.\.?\/)/i,
    type: 'dependency',
    solution: {
      description: 'Fix internal import path',
      fix: 'Check that the file exists and the path is correct. Common fixes: use .js extension, check case sensitivity.',
      confidence: 0.5, // Lower confidence - needs manual review
    },
  },

  // Tailwind @apply with invalid class
  {
    pattern: /@apply.+?([a-z-]+).+?does not exist/i,
    type: 'css',
    solution: {
      description: 'Replace invalid class in @apply directive',
      fix: (content, _error, match) => {
        const invalidClass = match[1];
        const replacement = CSS_CLASS_REPLACEMENTS[invalidClass];

        if (replacement) {
          return content.replace(new RegExp(`@apply([^;]*?)\\b${invalidClass}\\b`, 'g'), `@apply$1${replacement}`);
        }

        // Remove the invalid class from @apply
        return content.replace(new RegExp(`@apply([^;]*?)\\s*${invalidClass}`, 'g'), '@apply$1');
      },
      confidence: 0.9,
    },
  },

  // Unexpected token in JSON
  {
    pattern: /Unexpected token .+ in JSON/i,
    type: 'syntax',
    solution: {
      description: 'Fix JSON syntax error - likely trailing comma or missing quote',
      fix: (content) => {
        // Remove trailing commas before } or ]
        return (
          content
            .replace(/,(\s*[}\]])/g, '$1')
            // Fix unquoted keys (common in hand-written JSON)
            .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
        );
      },
      confidence: 0.75,
    },
  },

  // PostCSS/Tailwind processing errors
  {
    pattern: /CssSyntaxError.*?Unknown word/i,
    type: 'css',
    solution: {
      description: 'Fix CSS syntax - possibly missing semicolon or invalid property',
      fix: 'Check for missing semicolons, invalid CSS properties, or unclosed blocks',
      confidence: 0.5,
    },
  },
];

/*
 * ============================================================================
 * CSS Class Replacement Map
 * ============================================================================
 */

/**
 * Map of hallucinated CSS classes to valid Tailwind equivalents.
 * Extracted from claudeAgentService.server.ts sanitizeCSS function.
 */
const CSS_CLASS_REPLACEMENTS: Record<string, string> = {
  // Font classes
  'font-display': 'font-sans',
  'font-heading': 'font-serif',
  'font-body': 'font-sans',

  // Background colors
  'bg-dark': 'bg-gray-900',
  'bg-light': 'bg-gray-100',
  'bg-cream': 'bg-stone-100',
  'bg-lime': 'bg-lime-400',
  'bg-primary': 'bg-blue-600',
  'bg-secondary': 'bg-gray-600',
  'bg-accent': 'bg-amber-500',
  'bg-dark-50': 'bg-gray-800',
  'bg-dark-100': 'bg-gray-800',
  'bg-dark-200': 'bg-gray-700',
  'bg-dark-300': 'bg-gray-600',

  // Text colors
  'text-dark': 'text-gray-900',
  'text-light': 'text-gray-100',
  'text-cream': 'text-stone-100',
  'text-lime': 'text-lime-400',
  'text-primary': 'text-blue-600',
  'text-secondary': 'text-gray-600',
  'text-accent': 'text-amber-500',

  // Border colors
  'border-dark': 'border-gray-900',
  'border-light': 'border-gray-100',
  'border-primary': 'border-blue-600',

  // Hover variants
  'hover:bg-primary-dark': 'hover:bg-blue-700',
  'hover:bg-primary-light': 'hover:bg-blue-500',
  'hover:bg-lime-dark': 'hover:bg-lime-500',
  'hover:bg-lime-light': 'hover:bg-lime-300',
  'hover:bg-dark': 'hover:bg-gray-800',
  'hover:bg-light': 'hover:bg-gray-200',
  'hover:text-dark': 'hover:text-gray-900',
  'hover:text-light': 'hover:text-gray-100',
  'hover:text-primary': 'hover:text-blue-600',
  'hover:border-primary': 'hover:border-blue-600',

  // Focus variants
  'focus:ring-primary': 'focus:ring-blue-500',
  'focus:border-primary': 'focus:border-blue-500',

  // Gradient stops
  'from-dark': 'from-gray-900',
  'to-dark': 'to-gray-900',
  'via-dark': 'via-gray-900',
  'from-primary': 'from-blue-600',
  'to-primary': 'to-blue-600',
  'via-primary': 'via-blue-600',

  // Ring/divide colors
  'ring-primary': 'ring-blue-500',
  'ring-dark': 'ring-gray-700',
  'divide-dark': 'divide-gray-700',
  'divide-primary': 'divide-blue-500',
};

/*
 * ============================================================================
 * Error Normalization
 * ============================================================================
 */

/**
 * Normalize an error message by removing noise (paths, line numbers, etc.)
 * This allows pattern matching to work across different contexts.
 */
function normalizeError(error: ErrorContext): string {
  let normalized = error.message;

  // Remove file paths
  normalized = normalized.replace(/[A-Za-z]:[\\\/][^\s:]+/g, '<FILE>');
  normalized = normalized.replace(/\/[^\s:]+\.[a-z]+/g, '<FILE>');

  // Remove line:column numbers
  normalized = normalized.replace(/:\d+:\d+/g, ':<LINE>:<COL>');
  normalized = normalized.replace(/\(\d+,\d+\)/g, '(<LINE>,<COL>)');
  normalized = normalized.replace(/line \d+/gi, 'line <LINE>');

  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/*
 * ============================================================================
 * Solution Cache
 * ============================================================================
 */

interface CacheEntry {
  normalizedError: string;
  solutions: Solution[];
  timestamp: number;
}

// In-memory cache for error solutions (cleared on server restart)
const solutionCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

function getCachedSolutions(normalizedError: string): Solution[] | null {
  const entry = solutionCache.get(normalizedError);

  if (!entry) {
    return null;
  }

  // Check if cache entry is still valid
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    solutionCache.delete(normalizedError);
    return null;
  }

  return entry.solutions;
}

function cacheSolutions(normalizedError: string, solutions: Solution[]): void {
  solutionCache.set(normalizedError, {
    normalizedError,
    solutions,
    timestamp: Date.now(),
  });
}

/*
 * ============================================================================
 * FlowOps Web Search
 * ============================================================================
 */

/**
 * Search the web for solutions using FlowOps SearchTool (Tavily API).
 * Tavily is optimized for AI agents with structured results and relevance scoring.
 */
async function searchWebForSolutions(error: ErrorContext): Promise<Solution[]> {
  try {
    const searchTool = getSearchTool();

    logger.info(`Searching web for: ${error.message.slice(0, 50)}...`);

    // Use the searchError convenience method
    const searchResult = await searchTool.searchError(error.message, error.framework);

    if (!searchResult || searchResult.results.length === 0) {
      logger.debug('No web search results found');
      return [];
    }

    // Convert search results to solutions
    const solutions: Solution[] = searchResult.results.map((r) => ({
      description: `${r.title} (score: ${(r.score * 100).toFixed(0)}%)`,
      fix: searchResult.answer
        ? `AI Answer: ${searchResult.answer}\n\nSource: ${r.url}\n\n${r.content}`
        : `See: ${r.url}\n\n${r.content}`,
      confidence: Math.min(r.score, 0.8), // Cap at 0.8 for web results
      source: 'search' as const,
    }));

    logger.info(`Tavily search found ${solutions.length} solutions in ${searchResult.responseTimeMs}ms`);

    return solutions;
  } catch (err) {
    // If Tavily API is not configured, log warning and continue
    logger.warn('Web search failed:', err);
    return [];
  }
}

/*
 * ============================================================================
 * Main Search Function
 * ============================================================================
 */

/**
 * Search for solutions to a build error.
 *
 * Flow:
 * 1. Normalize the error message
 * 2. Check cache for known solutions
 * 3. Match against pattern database
 * 4. If no high-confidence patterns, search the web
 * 5. Return solutions sorted by confidence
 */
export async function searchError(
  error: ErrorContext,
  options: { enableWebSearch?: boolean } = {},
): Promise<SearchResult> {
  const { enableWebSearch = true } = options;
  const startTime = Date.now();

  // Normalize the error
  const normalizedError = normalizeError(error);
  logger.debug(`Searching for: ${normalizedError}`);

  // Check cache first
  const cachedSolutions = getCachedSolutions(normalizedError);

  if (cachedSolutions && cachedSolutions.length > 0) {
    logger.info(`Cache hit for error: ${normalizedError.slice(0, 50)}...`);
    return {
      error,
      normalizedError,
      solutions: cachedSolutions,
      fromCache: true,
      searchTimeMs: Date.now() - startTime,
    };
  }

  // Match against pattern database
  const solutions: Solution[] = [];

  for (const pattern of ERROR_PATTERNS) {
    const match = error.message.match(pattern.pattern);

    if (match) {
      logger.info(`Pattern match: ${pattern.solution.description}`);

      solutions.push({
        description: pattern.solution.description,
        fix:
          typeof pattern.solution.fix === 'function'
            ? (content: string) => (pattern.solution.fix as Function)(content, error, match)
            : pattern.solution.fix,
        confidence: pattern.solution.confidence,
        source: 'pattern',
      });
    }
  }

  // If no high-confidence patterns found, search the web
  const hasHighConfidence = solutions.some((s) => s.confidence >= 0.8);

  if (!hasHighConfidence && enableWebSearch) {
    logger.info('No high-confidence patterns found, searching web...');

    const webSolutions = await searchWebForSolutions(error);
    solutions.push(...webSolutions);
  }

  // Sort by confidence (highest first)
  solutions.sort((a, b) => b.confidence - a.confidence);

  // Cache the results
  if (solutions.length > 0) {
    cacheSolutions(normalizedError, solutions);
  }

  return {
    error,
    normalizedError,
    solutions,
    fromCache: false,
    searchTimeMs: Date.now() - startTime,
  };
}

/**
 * Apply a solution to file content.
 *
 * @param content - The current file content
 * @param solution - The solution to apply
 * @param error - The error context
 * @returns The fixed content, or null if fix is not applicable
 */
export function applySolution(content: string, solution: Solution, error: ErrorContext): string | null {
  try {
    if (typeof solution.fix === 'function') {
      const result = solution.fix(content, error);

      // Verify something changed
      if (result === content) {
        logger.warn('Solution did not modify content');
        return null;
      }

      return result;
    }

    // String fix is just informational
    logger.info(`Manual fix required: ${solution.fix}`);

    return null;
  } catch (err) {
    logger.error('Error applying solution:', err);
    return null;
  }
}

/**
 * Get the best applicable fix for an error.
 * Returns the highest-confidence solution that can modify the content.
 */
export async function getBestFix(
  error: ErrorContext,
  content: string,
): Promise<{ fixed: string; solution: Solution } | null> {
  const result = await searchError(error);

  for (const solution of result.solutions) {
    if (solution.confidence < 0.6) {
      // Skip low-confidence solutions
      continue;
    }

    const fixed = applySolution(content, solution, error);

    if (fixed) {
      logger.info(`Applied fix: ${solution.description} (confidence: ${solution.confidence})`);
      return { fixed, solution };
    }
  }

  return null;
}

/*
 * ============================================================================
 * Exports for Testing
 * ============================================================================
 */

export const _testing = {
  normalizeError,
  CSS_CLASS_REPLACEMENTS,
  ERROR_PATTERNS,
  solutionCache,
  searchWebForSolutions,
};

