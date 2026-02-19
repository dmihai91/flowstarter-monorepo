/**
 * Preview Service (Optimized)
 *
 * Main orchestration for starting, refreshing, and stopping previews.
 * Includes optimizations:
 * - Pre-warmed sandbox pool
 * - Hash-based install skipping
 * - Parallel operations
 * - Log-based error detection during wait phase
 */

import { getClient, getCachedSandbox, setCachedSandbox, deleteCachedSandbox, log } from './client';
import { persistPreviewUrl, clearPersistedPreviewUrl, fetchPreviewUrl } from './convexClient';
import { ensureSandboxRunning } from './sandboxService';
import { uploadFiles } from './fileService';
import { checkBunAvailable, installBun, bunInstall } from './bunService';
import {
  killExistingDevServers,
  startDevServerTest,
  startDevServerBackground,
  getPreviewUrl,
  checkDevLogForPort,
  waitForDevServer,
  readDevLog,
  checkServerStarted,
  hasFatalError,
  parseErrorDetails,
  createBuildError,
  runAstroCheck,
} from './devServerService';
import { runNpmFallback } from './npmFallbackService';
import { getOrCreateSandbox, verifySandbox } from './sandboxHelpers';
import { getWarmSandbox, initializePool } from './sandboxPool';
import { needsInstall, recordInstall } from './hashCache';
import type { DaytonaEnv, PreviewResult } from './types';

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
    // OPTIMIZATION 0: Check for existing running sandbox (memory cache → Convex persistence)
    const cached = getCachedSandbox(projectId);
    let existingUrl = cached?.previewUrl;
    let existingSandboxId = cached?.sandboxId;

    // If not in memory, check Convex persistence (survives server restarts)
    if (!existingUrl) {
      const persisted = await fetchPreviewUrl(projectId);
      if (persisted?.workspaceUrl) {
        existingUrl = persisted.workspaceUrl;
        existingSandboxId = persisted.sandboxId;
        log.debug(` Found persisted preview URL from Convex: ${existingUrl}`);
      }
    } else {
      log.debug(` Found cached preview URL in memory: ${existingUrl}`);
    }

    // If we have an existing URL, verify the sandbox is still alive
    if (existingUrl && existingSandboxId) {
      try {
        progress('Reconnecting to existing preview...');
        const existingSandbox = await client.get(existingSandboxId);

        // Quick health check - try to fetch the preview URL
        const healthCheck = await fetch(existingUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
        }).catch(() => null);

        if (healthCheck && healthCheck.ok) {
          log.debug(` Existing sandbox is alive! Returning cached preview instantly`);
          // Re-cache in memory if it was only in Convex
          setCachedSandbox(projectId, { sandboxId: existingSandboxId, previewUrl: existingUrl });
          return { success: true, previewUrl: existingUrl, sandboxId: existingSandboxId };
        }

        // Sandbox exists but dev server not responding — try to ensure it's running
        log.debug(` Sandbox exists but not responding, checking if it's still running...`);
        await ensureSandboxRunning(client, existingSandbox);

        // Re-check after ensuring sandbox is running
        const retryCheck = await fetch(existingUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(8000),
        }).catch(() => null);

        if (retryCheck && retryCheck.ok) {
          log.debug(` Existing sandbox recovered! Returning cached preview`);
          setCachedSandbox(projectId, { sandboxId: existingSandboxId, previewUrl: existingUrl });
          return { success: true, previewUrl: existingUrl, sandboxId: existingSandboxId };
        }

        // Sandbox is dead, need to start fresh — but reuse the sandbox if possible
        log.debug(` Existing sandbox not recoverable, starting fresh preview on same sandbox`);
        deleteCachedSandbox(projectId);
      } catch (e) {
        log.debug(` Failed to reconnect to existing sandbox: ${e instanceof Error ? e.message : 'unknown'}`);
        deleteCachedSandbox(projectId);
      }
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

    // Start dev server
    progress('Starting Astro dev server...');
    await killExistingDevServers(sandbox, workDir);

    // Run astro check first to catch type errors with file info
    const astroCheckResult = await runAstroCheck(sandbox, workDir);
    if (!astroCheckResult.success && astroCheckResult.errors.length > 0) {
      const firstError = astroCheckResult.errors[0];
      log.warn(` Astro check failed: ${firstError.message} in ${firstError.file}`);
      return {
        success: false,
        error: `Type error in ${firstError.file}: ${firstError.message}`,
        buildError: {
          file: firstError.file,
          line: firstError.line,
          message: firstError.message,
          fullOutput: firstError.fullOutput,
        },
        sandboxId: sandbox.id,
      };
    }

    const { output } = await startDevServerTest(sandbox, workDir);
    const serverStarted = checkServerStarted(output);

    if (hasFatalError(output, serverStarted)) {
      return handleBuildError(output, currentSandboxId);
    }

    // Start background server and get preview URL
    await startDevServerBackground(sandbox, workDir);

    const previewUrl = await setupPreviewUrl(sandbox, workDir, output);

    if (!previewUrl) {
      // Before giving up, check the dev log for errors
      const devLog = await readDevLog(sandbox, workDir, 100);
      if (devLog && hasFatalError(devLog, false)) {
        return handleBuildError(devLog, currentSandboxId);
      }
      return { success: false, error: 'Failed to get preview URL for dev server', sandboxId: currentSandboxId };
    }

    // Wait for dev server to be ready — with log monitoring
    progress('Waiting for dev server to respond...');
    log.debug(' Waiting for dev server to be ready (with log monitoring)...');

    const waitResult = await waitForDevServer(previewUrl, 60000, {
      sandbox,
      workDir,
      logCheckInterval: 3, // Check logs every 3 HTTP attempts
    });

    if (!waitResult.ready) {
      if (waitResult.buildError) {
        log.error(` Dev server has build error: ${waitResult.buildError.message.slice(0, 100)}`);
        return {
          success: false,
          error: `Dev server failed: ${waitResult.buildError.message.slice(0, 200)}`,
          buildError: waitResult.buildError,
          sandboxId: currentSandboxId,
        };
      }

      // No specific build error — might just be slow
      log.error(' Dev server failed to start or respond');

      // Final attempt: check logs for any error info
      const devLog = await readDevLog(sandbox, workDir, 100);
      if (devLog && hasFatalError(devLog, false)) {
        return handleBuildError(devLog, currentSandboxId);
      }

      return {
        success: false,
        error: 'The preview server is taking too long to start.',
        sandboxId: currentSandboxId,
      };
    }

    progress('Preview server is live!');
    log.debug(' Dev server is responding');

    // Cache the result
    setCachedSandbox(projectId, { sandboxId: sandbox.id, previewUrl });

    persistPreviewUrl(projectId, previewUrl, sandbox.id).catch((e) => {
      log.warn(' Failed to persist preview URL to Convex:', e);
    });

    log.debug(` Preview ready: ${previewUrl}`);

    return { success: true, previewUrl, sandboxId: sandbox.id };
  } catch (e) {
    log.error(' Error in startPreview:', e);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Ensure bun is ready (check + install if needed)
 */
async function ensureBunReady(
  sandbox: NonNullable<Awaited<ReturnType<typeof getOrCreateSandbox>>>,
  workDir: string,
): Promise<boolean> {
  let hasBun = await checkBunAvailable(sandbox, workDir);
  if (!hasBun) {
    hasBun = await installBun(sandbox, workDir);
  }
  return hasBun;
}

/**
 * Handle build error and return appropriate result
 */
function handleBuildError(output: string, sandboxId?: string): PreviewResult {
  log.debug(` Fatal error detected in output. First 500 chars: ${output.slice(0, 500)}`);

  const errorDetails = parseErrorDetails(output);

  return {
    success: false,
    error: `Dev server failed to start. ${errorDetails?.message?.slice(0, 200) || output.slice(0, 200)}`,
    buildError: createBuildError(errorDetails, output),
    sandboxId,
  };
}

/**
 * Setup preview URL, handling port detection
 */
async function setupPreviewUrl(
  sandbox: NonNullable<Awaited<ReturnType<typeof getOrCreateSandbox>>>,
  workDir: string,
  output: string,
): Promise<string | null> {
  const detectedPort = output.match(/localhost:(\d+)/i)?.[1];
  const portNum = detectedPort ? parseInt(detectedPort, 10) : null;

  const previewResult = await getPreviewUrl(sandbox, portNum);

  if (!previewResult) {
    log.error(' Could not get preview URL for any port');
    return null;
  }

  let { url: previewUrl, port: workingPort } = previewResult;

  log.debug(` Preview URL: ${previewUrl} (port ${workingPort})`);

  await new Promise((r) => setTimeout(r, 2000));

  const bgPort = await checkDevLogForPort(sandbox, workDir);

  if (bgPort && bgPort !== workingPort) {
    log.debug(` Background server using different port: ${bgPort}`);

    try {
      const newPreviewLink = await sandbox.getPreviewLink(bgPort);
      previewUrl = newPreviewLink.url;
      log.debug(` Updated preview URL to port ${bgPort}: ${previewUrl}`);
    } catch {
      log.debug(` Could not get preview URL for port ${bgPort}, keeping original`);
    }
  }

  return previewUrl;
}


/**
 * Retry preview on an existing sandbox with new (fixed) files.
 * Much faster than startPreview because it skips sandbox creation and dep installation.
 * Used by the self-healing loop after fixing build errors.
 */
export async function retryPreviewWithFiles(
  projectId: string,
  sandboxId: string,
  files: Record<string, string>,
  env?: DaytonaEnv,
  onProgress?: (message: string) => void,
): Promise<PreviewResult> {
  const progress = onProgress || (() => {});
  log.debug(` retryPreviewWithFiles: reusing sandbox ${sandboxId} for project ${projectId}`);

  let client;
  try {
    client = getClient(env);
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'Unknown error';
    log.error(' Failed to get Daytona client:', errorMsg);
    return { success: false, error: errorMsg };
  }

  try {
    const sandbox = await client.get(sandboxId);
    await ensureSandboxRunning(client, sandbox);
    const workDir = (await sandbox.getWorkDir()) || '/home/daytona';

    // Re-upload fixed files
    progress('Re-uploading fixed files...');
    log.debug(` Re-uploading ${Object.keys(files).length} fixed files...`);
    await uploadFiles(sandbox, files);

    // Kill existing dev servers and restart
    progress('Restarting dev server with fixes...');
    await killExistingDevServers(sandbox, workDir);

    // Run astro check first to catch type errors with file info
    const astroCheckResult = await runAstroCheck(sandbox, workDir);
    if (!astroCheckResult.success && astroCheckResult.errors.length > 0) {
      const firstError = astroCheckResult.errors[0];
      log.warn(` Astro check failed on retry: ${firstError.message} in ${firstError.file}`);
      return {
        success: false,
        error: `Type error in ${firstError.file}: ${firstError.message}`,
        buildError: {
          file: firstError.file,
          line: firstError.line,
          message: firstError.message,
          fullOutput: firstError.fullOutput,
        },
        sandboxId: sandbox.id,
      };
    }

    const { output } = await startDevServerTest(sandbox, workDir);
    const serverStarted = checkServerStarted(output);

    if (hasFatalError(output, serverStarted)) {
      return handleBuildError(output, sandboxId);
    }

    // Start background server and get preview URL
    await startDevServerBackground(sandbox, workDir);

    const previewUrl = await setupPreviewUrl(sandbox, workDir, output);

    if (!previewUrl) {
      const devLog = await readDevLog(sandbox, workDir, 100);
      if (devLog && hasFatalError(devLog, false)) {
        return handleBuildError(devLog, sandboxId);
      }
      return { success: false, error: 'Failed to get preview URL for dev server', sandboxId };
    }

    // Wait for dev server to be ready
    progress('Waiting for fixed dev server to respond...');
    log.debug(' Waiting for dev server to be ready after retry...');

    const waitResult = await waitForDevServer(previewUrl, 60000, {
      sandbox,
      workDir,
      logCheckInterval: 3,
    });

    if (!waitResult.ready) {
      if (waitResult.buildError) {
        log.error(` Dev server still has build error after fix: ${waitResult.buildError.message.slice(0, 100)}`);
        return {
          success: false,
          error: `Dev server failed: ${waitResult.buildError.message.slice(0, 200)}`,
          buildError: waitResult.buildError,
          sandboxId,
        };
      }

      const devLog = await readDevLog(sandbox, workDir, 100);
      if (devLog && hasFatalError(devLog, false)) {
        return handleBuildError(devLog, sandboxId);
      }

      return {
        success: false,
        error: 'The preview server is taking too long to start.',
        sandboxId,
      };
    }

    progress('Preview server is live after fix!');
    log.debug(' Dev server is responding after retry');

    // Cache the result
    setCachedSandbox(projectId, { sandboxId: sandbox.id, previewUrl });
    persistPreviewUrl(projectId, previewUrl, sandbox.id).catch((e) => {
      log.warn(' Failed to persist preview URL to Convex:', e);
    });

    log.debug(` Preview ready after retry: ${previewUrl}`);
    return { success: true, previewUrl, sandboxId: sandbox.id };
  } catch (e) {
    log.error(' Error in retryPreviewWithFiles:', e);
    // Fall back to full startPreview if sandbox reuse fails
    log.debug(' Falling back to full startPreview...');
    return startPreview(projectId, files, env, onProgress);
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

