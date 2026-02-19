/**
 * Cleanup Service
 *
 * Handles cleanup of Daytona sandboxes to free up disk space.
 */

import { getClient, clearSandboxCache, log } from './client';
import type { CleanupResult, DaytonaEnv } from './types';

/**
 * Cleanup all flowstarter sandboxes from Daytona
 * Use this to free up disk space when hitting quota limits
 */
export async function cleanupAllSandboxes(env?: DaytonaEnv): Promise<CleanupResult> {
  const errors: string[] = [];
  let deleted = 0;
  let failed = 0;

  try {
    const client = getClient(env);

    // List all flowstarter sandboxes
    const { items: sandboxes } = await client.list({ source: 'flowstarter' });
    log.debug(` Found ${sandboxes.length} flowstarter sandboxes to cleanup`);

    // Delete each sandbox
    for (const sandbox of sandboxes) {
      try {
        log.debug(` Deleting sandbox ${sandbox.id} (project: ${sandbox.labels?.project || 'unknown'})`);
        await client.delete(sandbox);
        deleted++;
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Unknown error';
        log.error(` Failed to delete sandbox ${sandbox.id}:`, errorMsg);
        errors.push(`${sandbox.id}: ${errorMsg}`);
        failed++;
      }
    }

    // Clear local cache
    clearSandboxCache();

    return { deleted, failed, errors };
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'Unknown error';
    log.error(' Failed to list sandboxes for cleanup:', errorMsg);
    errors.push(`List failed: ${errorMsg}`);

    return { deleted, failed, errors };
  }
}

