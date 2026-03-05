/**
 * Preview Service (Optimized)
 *
 * Main orchestration for starting, refreshing, and stopping previews.
 */

import { getClient, getCachedSandbox, setCachedSandbox, deleteCachedSandbox, log } from './client';
import { persistPreviewUrl, clearPersistedPreviewUrl } from './convexClient';
import { ensureSandboxRunning } from './sandboxService';
import { uploadFiles } from './fileService';
import { checkBunAvailable, installBun, bunInstall } from './bunService';
import type { PreviewResult as PreviewResultType } from './types';
import { runNpmFallback } from './npmFallbackService';
import { getOrCreateSandbox, verifySandbox } from './sandboxHelpers';
import { getWarmSandbox, initializePool } from './sandboxPool';
import { needsInstall, recordInstall } from './hashCache';
import { tryReuseExistingSandbox, ensureBunReady, startAndWaitForDevServer } from './preview-helpers';
import type { DaytonaEnv, PreviewResult } from './types';

// Re-export retryPreviewWithFiles from its module
export { retryPreviewWithFiles } from './preview-retry';

/**
 * Full preview flow (optimized)
 */
export async function startPreview(
  projectId: string,
  files: Record<string, string>,
  env?: DaytonaEnv,
  onProgress?: (message: string) => void,
): Promise<PreviewResult> {
  const progress = onProgress || (() => {});
  log.debug(` startPreview called for project ${projectId}`);
  log.debug(` Files to upload: ${Object.keys(files).length}`);

  let client;

  try {
    client = getClient(env);
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'Unknown error';
    log.error(' Failed to get Daytona client:', errorMsg);
    return { success: false, error: errorMsg };
  }

  try {
    // OPTIMIZATION 0: Check for existing running sandbox
    const reuseResult = await tryReuseExistingSandbox(projectId, client, progress);
    if (reuseResult) {
      return reuseResult;
    }

    // OPTIMIZATION 1: Try to get a pre-warmed sandbox from pool
    const pooled = await getWarmSandbox(client);

    let sandbox;
    let workDir: string;
    let hasBun = false;
    let currentSandboxId: string | undefined;

    if (pooled) {
      sandbox = pooled.sandbox;
      workDir = pooled.workDir;
      hasBun = pooled.hasBun;
      currentSandboxId = sandbox.id;
      log.debug(' Using pre-warmed sandbox from pool');
      progress('Provisioning cloud sandbox...');
    } else {
      progress('Provisioning cloud sandbox...');
      sandbox = await getOrCreateSandbox(client, projectId);
      if (!sandbox) {
        return { success: false, error: 'Failed to get or create sandbox' };
      }
      currentSandboxId = sandbox.id;
      workDir = (await sandbox.getWorkDir()) || '/home/daytona';
    }

    // OPTIMIZATION 2: Parallel file upload + bun check (if not from pool)
    const packageJson = files['package.json'] || '';

    if (pooled?.hasBun) {
      progress(`Uploading ${Object.keys(files).length} files to sandbox...`);
      log.debug(' Uploading files (bun already installed from pool)...');
      await uploadFiles(sandbox, files);
    } else {
      progress(`Uploading ${Object.keys(files).length} files to sandbox...`);
      log.debug(' Parallel: uploading files + checking bun...');
      const [, bunReady] = await Promise.all([uploadFiles(sandbox, files), ensureBunReady(sandbox, workDir)]);
      hasBun = bunReady;
    }

    log.debug(' Files uploaded successfully');

    // Verify sandbox is working
    const sandboxReady = await verifySandbox(sandbox, workDir);
    if (!sandboxReady) {
      return { success: false, error: 'Sandbox not ready' };
    }

    // OPTIMIZATION 3: Skip install if package.json unchanged
    if (!hasBun) {
      hasBun = await checkBunAvailable(sandbox, workDir);
      if (!hasBun) {
        hasBun = await installBun(sandbox, workDir);
        if (!hasBun) {
          return runNpmFallback(sandbox, workDir, projectId, (id, info) => setCachedSandbox(id, info));
        }
      }
    }

    // Check if we need to install dependencies
    const shouldInstall = needsInstall(projectId, packageJson);

    if (shouldInstall) {
      progress('Installing dependencies...');
      log.debug(' Installing dependencies (package.json changed or first run)...');
      const installSuccess = await bunInstall(sandbox, workDir);
      if (!installSuccess) {
        return {
          success: false,
          error: 'Failed to install dependencies with bun. Please check your package.json.',
        };
      }
      recordInstall(projectId, packageJson);
    } else {
      log.debug(' Skipping install - package.json unchanged');
    }

    // Start dev server, wait for it, get preview URL
    const devResult = await startAndWaitForDevServer(sandbox, workDir, currentSandboxId, progress);

    if ('success' in devResult && !devResult.success) {
      return devResult as PreviewResult;
    }

    const previewUrl = (devResult as { previewUrl: string }).previewUrl;

    // Cache the result
    setCachedSandbox(projectId, { sandboxId: sandbox.id, previewUrl });
    persistPreviewUrl(projectId, previewUrl, sandbox.id).catch((e) => {
      log.warn(' Failed to persist preview URL to Convex:', e);
    });

    return { success: true, previewUrl, sandboxId: sandbox.id };
  } catch (e) {
    log.error(' Error in startPreview:', e);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}


/**
 * Refresh preview (re-sync files) - optimized
 */
export async function refreshPreview(
  projectId: string,
  files: Record<string, string>,
  env?: DaytonaEnv,
): Promise<{ success: boolean; previewUrl?: string; sandboxId?: string; error?: string }> {
  let client;

  try {
    client = getClient(env);
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }

  const cached = getCachedSandbox(projectId);

  if (!cached?.sandboxId) {
    return startPreview(projectId, files, env);
  }

  try {
    const sandbox = await client.get(cached.sandboxId);
    await ensureSandboxRunning(client, sandbox);
    await uploadFiles(sandbox, files);

    return {
      success: true,
      previewUrl: cached.previewUrl || undefined,
      sandboxId: cached.sandboxId,
    };
  } catch {
    deleteCachedSandbox(projectId);
    return startPreview(projectId, files, env);
  }
}

/**
 * Stop preview
 */
export async function stopPreview(projectId: string, env?: DaytonaEnv): Promise<void> {
  const cached = getCachedSandbox(projectId);

  if (cached?.sandboxId) {
    try {
      const client = getClient(env);
      const sandbox = await client.get(cached.sandboxId);
      await client.delete(sandbox);
    } catch (e) {
      log.error(' Failed to delete sandbox:', e);
    }
  }

  deleteCachedSandbox(projectId);
  clearPersistedPreviewUrl(projectId).catch(() => {});
}

// Initialize pool on module load (lazy - only when first preview requested)
let poolInitPromise: Promise<void> | null = null;

export function ensurePoolInitialized(env?: DaytonaEnv): Promise<void> {
  if (!poolInitPromise) {
    poolInitPromise = initializePool(env);
  }
  return poolInitPromise;
}

