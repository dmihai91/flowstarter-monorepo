/**
 * Scaffold Data Fetching
 *
 * Fetches scaffold data from MCP server with streaming support and caching.
 */

import type { ScaffoldData, ScaffoldFile } from './types';
import { getCachedScaffold, setCachedScaffold } from './cache';
import { getPlaceholderTemplate, getPlaceholderFiles } from './placeholders';

/**
 * Fetch scaffold data using streaming endpoint for faster, progressive loading
 * Falls back to regular endpoint if streaming fails
 */
async function fetchScaffoldDataStreaming(
  templateSlug: string,
  onProgress?: (loaded: number, total: number) => void,
  timeoutMs = 15000, // 15 second connection timeout - fail fast, fall back to regular
): Promise<ScaffoldData> {
  console.log(`Cloning template "${templateSlug}"...`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;

  try {
    response = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'scaffold-stream', slug: templateSlug }),
      signal: controller.signal,
    });
  } catch (fetchError) {
    clearTimeout(timeoutId);
    throw fetchError;
  }

  clearTimeout(timeoutId);

  if (!response.ok || !response.body) {
    throw new Error('Streaming not available');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let template: ScaffoldData['template'] | null = null;
  const files: ScaffoldFile[] = [];
  let total = 0;

  // Per-read timeout to prevent hanging on slow/stalled streams
  const readWithTimeout = async (): Promise<ReadableStreamReadResult<Uint8Array>> => {
    const readTimeoutMs = 5000; // 5 second per-read timeout - fail fast
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Read timeout')), readTimeoutMs),
    );

    return Promise.race([reader.read(), timeoutPromise]);
  };

  try {
    while (true) {
      const { done, value } = await readWithTimeout();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }

        try {
          const msg = JSON.parse(line);

          switch (msg.type) {
            case 'metadata':
              template = msg.template;
              break;
            case 'progress':
              total = msg.total;
              onProgress?.(0, total);
              break;
            case 'file':
              files.push({ path: msg.path, content: msg.content, type: 'file' });
              onProgress?.(files.length, total);
              break;
            case 'error':
              throw new Error(msg.message);
            case 'complete':
              console.log(`✓ Cloned ${msg.count} files for "${templateSlug}"`);
              break;
          }
        } catch (parseError) {
          console.warn('Failed to parse streaming message:', line);
        }
      }
    }

    if (!template) {
      throw new Error('No template metadata received');
    }

    return { template, files };
  } finally {
    reader.releaseLock();
  }
}

/**
 * Fetch scaffold data from MCP server via API route with timeout and caching
 * Tries streaming first, falls back to regular endpoint
 */
export async function fetchScaffoldData(
  templateSlug: string,
  timeoutMs = 30000, // 30 second total timeout
  onProgress?: (loaded: number, total: number) => void,
): Promise<ScaffoldData> {
  console.log(`[fetchScaffoldData] Starting fetch for "${templateSlug}"`);

  const fetchStart = Date.now();

  // 1. Check cache first
  console.log(`[fetchScaffoldData] Checking cache...`);

  const cacheStart = Date.now();
  const cached = await getCachedScaffold(templateSlug);
  console.log(`[fetchScaffoldData] Cache check completed in ${Date.now() - cacheStart}ms`);

  if (cached) {
    console.log(`[fetchScaffoldData] Using cached template "${templateSlug}"`);
    return cached;
  }

  // 2. Try streaming endpoint first (faster progressive loading)
  console.log(`[fetchScaffoldData] No cache, trying streaming endpoint...`);

  const streamStart = Date.now();

  try {
    const result = await fetchScaffoldDataStreaming(templateSlug, onProgress);
    console.log(`[fetchScaffoldData] Streaming completed in ${Date.now() - streamStart}ms`);

    // Cache successful result
    console.log(`[fetchScaffoldData] Caching result...`);
    void setCachedScaffold(templateSlug, result);
    console.log(`[fetchScaffoldData] Total time: ${Date.now() - fetchStart}ms`);

    return result;
  } catch (streamError) {
    console.warn(`[fetchScaffoldData] Streaming failed after ${Date.now() - streamStart}ms:`, streamError);
  }

  // 3. Fall back to regular endpoint
  console.log(`[fetchScaffoldData] Falling back to regular endpoint...`);

  const fallbackStart = Date.now();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    console.log(`[fetchScaffoldData] Sending POST request to /api/templates...`);

    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'scaffold',
        slug: templateSlug,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log(`[fetchScaffoldData] Response received in ${Date.now() - fallbackStart}ms, status: ${response.status}`);

    if (!response.ok) {
      console.warn(`Scaffold request failed with status ${response.status}, using placeholder files`);
      return {
        template: getPlaceholderTemplate(templateSlug),
        files: getPlaceholderFiles(),
      };
    }

    interface ApiResponse {
      success: boolean;
      error?: string;
      data?: unknown;
    }

    const data = (await response.json()) as ApiResponse;

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch template scaffold data');
    }

    /*
     * Parse the MCP response structure
     * MCP returns: { content: [{ type: 'text', text: '{"scaffold": {...}}' }] }
     */
    let scaffoldData = data.data as Record<string, unknown> | undefined;

    // Handle MCP content wrapper
    if (scaffoldData?.content && Array.isArray(scaffoldData.content)) {
      const textContent = scaffoldData.content.find((c: { type: string }) => c.type === 'text');

      if (textContent?.text) {
        try {
          scaffoldData = JSON.parse(textContent.text);
        } catch {
          console.warn('Failed to parse MCP text content');
        }
      }
    }

    // Handle string response
    if (typeof scaffoldData === 'string') {
      try {
        scaffoldData = JSON.parse(scaffoldData);
      } catch {
        // Keep as-is if not JSON
      }
    }

    /*
     * Extract from scaffold wrapper if present
     * MCP scaffold_template returns: { scaffold: { template: {...}, files: [...] } }
     */
    if (scaffoldData?.scaffold) {
      const scaffold = scaffoldData.scaffold as Record<string, unknown>;

      const result: ScaffoldData = {
        template: (scaffold.template as ScaffoldData['template']) || {
          metadata: {
            name: templateSlug,
            slug: templateSlug,
            displayName: templateSlug,
            description: '',
            category: 'landing',
            features: [],
            techStack: {
              framework: 'Astro',
              styling: 'Tailwind CSS',
              typescript: true,
            },
          },
          packageJson: {
            dependencies: {},
            devDependencies: {},
            scripts: {},
          },
        },
        files: (scaffold.files as ScaffoldData['files']) || [],
      };

      // Cache successful result
      void setCachedScaffold(templateSlug, result);

      return result;
    }

    // Ensure we have the expected structure
    if (!scaffoldData || !scaffoldData.files || !Array.isArray(scaffoldData.files)) {
      // If MCP server returns data differently, create a minimal structure
      console.warn('Scaffold data missing files array, using fallback');

      return {
        template: {
          metadata: {
            name: templateSlug,
            slug: templateSlug,
            displayName: templateSlug,
            description: '',
            category: 'landing',
            features: [],
            techStack: {
              framework: 'Astro',
              styling: 'Tailwind CSS',
              typescript: true,
            },
          },
          packageJson: {
            dependencies: {},
            devDependencies: {},
            scripts: {},
          },
        },
        files: getPlaceholderFiles(),
      };
    }

    // Cache successful result - at this point scaffoldData is validated to have files array
    const finalData = scaffoldData as unknown as ScaffoldData;
    void setCachedScaffold(templateSlug, finalData);

    return finalData;
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort (timeout) or any other fetch error
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`MCP scaffold request timed out after ${timeoutMs}ms, using placeholder files`);
    } else {
      console.warn('MCP scaffold request failed:', error);
    }

    // Return placeholder data so the project can still be created
    return {
      template: getPlaceholderTemplate(templateSlug),
      files: getPlaceholderFiles(),
    };
  }
}

