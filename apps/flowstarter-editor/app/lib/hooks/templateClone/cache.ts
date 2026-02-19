/**
 * Template Cache Operations
 *
 * Caches scaffold data in memory to avoid repeated MCP requests.
 * Uses a simple Map for caching with TTL support.
 */

import type { ScaffoldData, CachedScaffold } from './types';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache for template scaffolds
const scaffoldCache = new Map<string, CachedScaffold>();

export async function getCachedScaffold(slug: string): Promise<ScaffoldData | null> {
  try {
    const cached = scaffoldCache.get(slug);

    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      console.log(`✓ Template "${slug}" loaded from cache`);
      return cached.data;
    }

    if (cached) {
      console.log(`Cache expired for template "${slug}"`);
      scaffoldCache.delete(slug);
    }

    return null;
  } catch (err) {
    console.warn('Cache access failed:', err);
    return null;
  }
}

export async function setCachedScaffold(slug: string, data: ScaffoldData): Promise<void> {
  try {
    const cached: CachedScaffold = {
      slug,
      data,
      cachedAt: Date.now(),
    };
    scaffoldCache.set(slug, cached);
    console.log(`✓ Template "${slug}" cached successfully`);
  } catch {
    // Caching is best-effort, don't fail the operation
  }
}

/**
 * Clear the template cache (useful for debugging or forcing fresh data)
 */
export async function clearTemplateCache(): Promise<void> {
  try {
    scaffoldCache.clear();
    console.log('Template cache cleared');
  } catch {
    // Ignore errors
  }
}

