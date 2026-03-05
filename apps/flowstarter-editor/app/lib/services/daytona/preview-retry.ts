/**
 * Preview Retry
 *
 * Retry preview on an existing sandbox with new (fixed) files.
 * Much faster than startPreview because it skips sandbox creation and dep installation.
 * Used by the self-healing loop after fixing build errors.
 */

import { getClient, setCachedSandbox, log } from './client';
import { persistPreviewUrl } from './convexClient';
import { ensureSandboxRunning } from './sandboxService';
import { uploadFiles } from './fileService';
import {
  killExistingDevServers,
  startDevServerTest,
  startDevServerBackground,
  checkServerStarted,
  hasFatalError,
  waitForDevServer,
  readDevLog,
  runAstroCheck,
} from './devServerService';
import { handleBuildError, setupPreviewUrl } from './preview-helpers';
import { startPreview } from './previewService';
import type { DaytonaEnv, PreviewResult } from './types';

/**
 * Retry preview on an existing sandbox with new (fixed) files.
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
