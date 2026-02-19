/**
 * Daytona Client Manager
 *
 * Manages the singleton Daytona SDK client instance and sandbox cache.
 */

import { Daytona, type DaytonaConfig } from '@daytonaio/sdk';
import { createLogger } from '~/lib/utils/logger';
import type { CachedSandboxInfo, DaytonaEnv } from './types';

const log = createLogger('Daytona');

// Singleton Daytona client (created lazily)
let daytonaClient: Daytona | null = null;

// In-memory cache for sandbox info (will reset on worker restart)
const sandboxCache = new Map<string, CachedSandboxInfo>();

/**
 * Get or create the Daytona SDK client
 */
export function getClient(env?: DaytonaEnv): Daytona {
  const apiKey = env?.DAYTONA_API_KEY || process.env.DAYTONA_API_KEY || '';
  const apiUrl = env?.DAYTONA_API_URL || process.env.DAYTONA_API_URL || 'https://app.daytona.io/api';

  log.debug(`Config: apiUrl=${apiUrl}, hasApiKey=${!!apiKey}`);

  if (!apiKey) {
    throw new Error('Daytona API key not configured. Add DAYTONA_API_KEY to your .env file.');
  }

  // Reuse client if already created
  if (daytonaClient) {
    return daytonaClient;
  }

  const config: DaytonaConfig = {
    apiKey,
    apiUrl,
  };

  daytonaClient = new Daytona(config);

  return daytonaClient;
}

/**
 * Get cached sandbox info for a project
 */
export function getCachedSandbox(projectId: string): CachedSandboxInfo | undefined {
  return sandboxCache.get(projectId);
}

/**
 * Set cached sandbox info for a project
 */
export function setCachedSandbox(projectId: string, info: CachedSandboxInfo): void {
  sandboxCache.set(projectId, info);
}

/**
 * Delete cached sandbox info for a project
 */
export function deleteCachedSandbox(projectId: string): void {
  sandboxCache.delete(projectId);
}

/**
 * Clear all cached sandbox info
 */
export function clearSandboxCache(): void {
  sandboxCache.clear();
}

/**
 * Get cached preview URL for a project
 */
export function getCachedPreviewUrl(projectId: string): string | null {
  return sandboxCache.get(projectId)?.previewUrl || null;
}

/**
 * Clear cached preview (alias for deleteCachedSandbox)
 */
export function clearCachedPreview(projectId: string): void {
  sandboxCache.delete(projectId);
}

export { log };

