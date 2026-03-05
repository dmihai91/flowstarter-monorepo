/**
 * Error Search Service — Tier 2 of the self-healing system.
 * Searches for known solutions before falling back to LLM.
 */

import { createScopedLogger } from '~/utils/logger';
import { getSearchTool } from '~/lib/flowstarter/tools';
import { ERROR_PATTERNS, CSS_CLASS_REPLACEMENTS } from './error-patterns';

const logger = createScopedLogger('errorSearch');

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
  confidence: number;
  source: 'cache' | 'pattern' | 'search';
}

export interface SearchResult {
  error: ErrorContext;
  normalizedError: string;
  solutions: Solution[];
  fromCache: boolean;
  searchTimeMs: number;
}

function normalizeError(error: ErrorContext): string {
  let normalized = error.message;
  normalized = normalized.replace(/[A-Za-z]:[\\\/][^\s:]+/g, '<FILE>');
  normalized = normalized.replace(/\/[^\s:]+\.[a-z]+/g, '<FILE>');
  normalized = normalized.replace(/:\d+:\d+/g, ':<LINE>:<COL>');
  normalized = normalized.replace(/\(\d+,\d+\)/g, '(<LINE>,<COL>)');
  normalized = normalized.replace(/line \d+/gi, 'line <LINE>');
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return normalized;
}

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
  if (!entry) return null;
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

async function searchWebForSolutions(error: ErrorContext): Promise<Solution[]> {
  try {
    const searchTool = getSearchTool();
    logger.info(`Searching web for: ${error.message.slice(0, 50)}...`);
    const searchResult = await searchTool.searchError(error.message, error.framework);
    if (!searchResult || searchResult.results.length === 0) {
      logger.debug('No web search results found');
      return [];
    }
    const solutions: Solution[] = searchResult.results.map((r) => ({
      description: `${r.title} (score: ${(r.score * 100).toFixed(0)}%)`,
      fix: searchResult.answer
        ? `AI Answer: ${searchResult.answer}\n\nSource: ${r.url}\n\n${r.content}`
        : `See: ${r.url}\n\n${r.content}`,
      confidence: Math.min(r.score, 0.8),
      source: 'search' as const,
    }));
    logger.info(`Tavily search found ${solutions.length} solutions in ${searchResult.responseTimeMs}ms`);
    return solutions;
  } catch (err) {
    logger.warn('Web search failed:', err);
    return [];
  }
}

export async function searchError(
  error: ErrorContext,
  options: { enableWebSearch?: boolean } = {},
): Promise<SearchResult> {
  const { enableWebSearch = true } = options;
  const startTime = Date.now();

  const normalizedError = normalizeError(error);
  logger.debug(`Searching for: ${normalizedError}`);

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

  const hasHighConfidence = solutions.some((s) => s.confidence >= 0.8);
  if (!hasHighConfidence && enableWebSearch) {
    logger.info('No high-confidence patterns found, searching web...');
    const webSolutions = await searchWebForSolutions(error);
    solutions.push(...webSolutions);
  }

  solutions.sort((a, b) => b.confidence - a.confidence);
  if (solutions.length > 0) cacheSolutions(normalizedError, solutions);

  return {
    error,
    normalizedError,
    solutions,
    fromCache: false,
    searchTimeMs: Date.now() - startTime,
  };
}

export function applySolution(content: string, solution: Solution, error: ErrorContext): string | null {
  try {
    if (typeof solution.fix === 'function') {
      const result = solution.fix(content, error);
      if (result === content) {
        logger.warn('Solution did not modify content');
        return null;
      }
      return result;
    }
    logger.info(`Manual fix required: ${solution.fix}`);
    return null;
  } catch (err) {
    logger.error('Error applying solution:', err);
    return null;
  }
}

export async function getBestFix(
  error: ErrorContext,
  content: string,
): Promise<{ fixed: string; solution: Solution } | null> {
  const result = await searchError(error);
  for (const solution of result.solutions) {
    if (solution.confidence < 0.6) continue;
    const fixed = applySolution(content, solution, error);
    if (fixed) {
      logger.info(`Applied fix: ${solution.description} (confidence: ${solution.confidence})`);
      return { fixed, solution };
    }
  }
  return null;
}

export const _testing = {
  normalizeError,
  CSS_CLASS_REPLACEMENTS,
  ERROR_PATTERNS,
  solutionCache,
  searchWebForSolutions,
};

