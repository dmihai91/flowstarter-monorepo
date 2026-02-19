/**
 * Hash Cache Manager
 * 
 * Tracks file hashes to skip unnecessary reinstalls.
 * If package.json hasn't changed, skip bun install entirely.
 */

import { createLogger } from '~/lib/utils/logger';

const log = createLogger('HashCache');

// Simple hash function (FNV-1a)
function hashString(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

interface ProjectHashes {
  packageJson: string;
  lastInstall: number;
}

// In-memory hash cache
const hashCache = new Map<string, ProjectHashes>();

/**
 * Check if package.json has changed since last install
 */
export function needsInstall(projectId: string, packageJsonContent: string): boolean {
  const currentHash = hashString(packageJsonContent);
  const cached = hashCache.get(projectId);
  
  if (!cached) {
    log.debug(`No cached hash for ${projectId}, needs install`);
    return true;
  }
  
  if (cached.packageJson !== currentHash) {
    log.debug(`package.json changed for ${projectId}, needs install`);
    return true;
  }
  
  // Check if last install was recent (within 1 hour)
  const oneHour = 60 * 60 * 1000;
  if (Date.now() - cached.lastInstall > oneHour) {
    log.debug(`Install cache expired for ${projectId}, needs install`);
    return true;
  }
  
  log.debug(`Skipping install for ${projectId} - package.json unchanged`);
  return false;
}

/**
 * Record that we've successfully installed dependencies
 */
export function recordInstall(projectId: string, packageJsonContent: string): void {
  const hash = hashString(packageJsonContent);
  hashCache.set(projectId, {
    packageJson: hash,
    lastInstall: Date.now(),
  });
  log.debug(`Recorded install for ${projectId}`);
}

/**
 * Clear hash cache for a project
 */
export function clearHashCache(projectId: string): void {
  hashCache.delete(projectId);
}

/**
 * Clear all hash caches
 */
export function clearAllHashCaches(): void {
  hashCache.clear();
}

/**
 * Get hash for a string (for external use)
 */
export function getHash(content: string): string {
  return hashString(content);
}

