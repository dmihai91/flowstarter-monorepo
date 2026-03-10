/**
 * Preview Helpers
 *
 * Shared helper functions for preview operations:
 * - Sandbox reuse and health checking
 * - Build error handling
 * - Preview URL setup and port detection
 * - Bun readiness checks
 */

import { getCachedSandbox, setCachedSandbox, deleteCachedSandbox, log } from './client';
import { fetchPreviewUrl } from './convexClient';
import { ensureSandboxRunning } from './sandboxService';
import { checkBunAvailable, installBun } from './bunService';
import {
  killExistingDevServers,
  startDevServerTest,
  startDevServerBackground,
  checkDevLogForPort,
  getPreviewUrl,
  checkServerStarted,
  hasFatalError,
  waitForDevServer,
  readDevLog,
  runAstroCheck,
  parseErrorDetails,
  createBuildError,
} from './devServerService';
import { getOrCreateSandbox } from './sandboxHelpers';
import { extractPreviewUrlValue } from './previewUrl';
import type { PreviewResult } from './types';

/**
 * Try to reuse an existing sandbox for a project.
 * Returns the preview result if successful, null otherwise.
 */
export async function tryReuseExistingSandbox(
  projectId: string,
  client: Awaited<ReturnType<typeof import('./client').getClient>>,
  progress: (message: string) => void,
): Promise<PreviewResult | null> {
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

  if (!existingUrl || !existingSandboxId) {
    return null;
  }

  try {
    progress('Reconnecting to existing preview...');
    const existingSandbox = await client.get(existingSandboxId);

    // Quick health check
    const healthCheck = await fetch(existingUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);

    if (healthCheck && healthCheck.ok) {
      log.debug(` Existing sandbox is alive! Returning cached preview instantly`);
      setCachedSandbox(projectId, { sandboxId: existingSandboxId, previewUrl: existingUrl });
      return { success: true, previewUrl: existingUrl, sandboxId: existingSandboxId };
    }

    // Sandbox exists but dev server not responding — try to ensure it's running
    log.debug(` Sandbox exists but not responding, checking if it's still running...`);
    await ensureSandboxRunning(client, existingSandbox);

    const retryCheck = await fetch(existingUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);

    if (retryCheck && retryCheck.ok) {
      log.debug(` Existing sandbox recovered! Returning cached preview`);
      setCachedSandbox(projectId, { sandboxId: existingSandboxId, previewUrl: existingUrl });
      return { success: true, previewUrl: existingUrl, sandboxId: existingSandboxId };
    }

    log.debug(` Existing sandbox not recoverable, starting fresh preview on same sandbox`);
    deleteCachedSandbox(projectId);
  } catch (e) {
    log.debug(` Failed to reconnect to existing sandbox: ${e instanceof Error ? e.message : 'unknown'}`);
    deleteCachedSandbox(projectId);
  }

  return null;
}

/**
 * Ensure bun is ready (check + install if needed)
 */
export async function ensureBunReady(
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
export function handleBuildError(output: string, sandboxId?: string): PreviewResult {
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
 * Start dev server, run checks, wait for it to be ready, and return preview URL.
 * Returns a PreviewResult on error, or the preview URL string on success.
 */
export async function startAndWaitForDevServer(
  sandbox: NonNullable<Awaited<ReturnType<typeof getOrCreateSandbox>>>,
  workDir: string,
  sandboxId: string | undefined,
  progress: (message: string) => void,
): Promise<PreviewResult | { previewUrl: string }> {
  progress('Starting Astro dev server...');
  console.error('[Daytona:startAndWaitForDevServer] Starting preview flow', {
    sandboxId: sandbox.id,
    workDir,
  });
  await killExistingDevServers(sandbox, workDir);

  const astroCheckResult = await runAstroCheck(sandbox, workDir);
  if (!astroCheckResult.success && astroCheckResult.errors.length > 0) {
    const firstError = astroCheckResult.errors[0];
    console.error('[Daytona:startAndWaitForDevServer] Astro check failed', {
      sandboxId: sandbox.id,
      file: firstError.file,
      line: firstError.line,
      message: firstError.message,
    });
    log.warn(` Astro check failed: ${firstError.message} in ${firstError.file}`);
    return {
      success: false,
      error: `Type error in ${firstError.file}: ${firstError.message}`,
      buildError: { file: firstError.file, line: firstError.line, message: firstError.message, fullOutput: firstError.fullOutput },
      sandboxId: sandbox.id,
    };
  }

  const { output } = await startDevServerTest(sandbox, workDir);
  console.error('[Daytona:startAndWaitForDevServer] Dev server test completed', {
    sandboxId: sandbox.id,
    outputSnippet: output.slice(0, 500),
  });
  if (hasFatalError(output, checkServerStarted(output))) {
    console.error('[Daytona:startAndWaitForDevServer] Fatal error detected in test output', {
      sandboxId: sandbox.id,
    });
    return handleBuildError(output, sandboxId);
  }

  await startDevServerBackground(sandbox, workDir);
  console.error('[Daytona:startAndWaitForDevServer] Background server launched', {
    sandboxId: sandbox.id,
  });

  const previewUrl = await setupPreviewUrl(sandbox, workDir, output);
  if (!previewUrl) {
    console.error('[Daytona:startAndWaitForDevServer] Preview URL setup returned empty', {
      sandboxId: sandbox.id,
    });
    const devLog = await readDevLog(sandbox, workDir, 100);
    if (devLog && hasFatalError(devLog, false)) {
      return handleBuildError(devLog, sandboxId);
    }
    return { success: false, error: 'Failed to get preview URL for dev server', sandboxId };
  }

  progress('Waiting for dev server to respond...');
  console.error('[Daytona:startAndWaitForDevServer] Waiting for preview URL health check', {
    sandboxId: sandbox.id,
    previewUrl,
  });
  const waitResult = await waitForDevServer(previewUrl, 60000, { sandbox, workDir, logCheckInterval: 3 });

  if (!waitResult.ready) {
    console.error('[Daytona:startAndWaitForDevServer] Preview URL never became ready', {
      sandboxId: sandbox.id,
      previewUrl,
      buildError: waitResult.buildError,
    });
    if (waitResult.buildError) {
      return { success: false, error: `Dev server failed: ${waitResult.buildError.message.slice(0, 200)}`, buildError: waitResult.buildError, sandboxId };
    }
    const devLog = await readDevLog(sandbox, workDir, 100);
    if (devLog && hasFatalError(devLog, false)) {
      return handleBuildError(devLog, sandboxId);
    }
    return { success: false, error: 'The preview server is taking too long to start.', sandboxId };
  }

  progress('Preview server is live!');
  console.error('[Daytona:startAndWaitForDevServer] Preview URL is live', {
    sandboxId: sandbox.id,
    previewUrl,
  });
  return { previewUrl };
}

/**
 * Setup preview URL, handling port detection
 */
export async function setupPreviewUrl(
  sandbox: NonNullable<Awaited<ReturnType<typeof getOrCreateSandbox>>>,
  workDir: string,
  output: string,
): Promise<string | null> {
  const detectedPort = output.match(/localhost:(\d+)/i)?.[1];
  const portNum = detectedPort ? parseInt(detectedPort, 10) : null;
  console.error('[Daytona:setupPreviewUrl] Resolving preview URL', {
    sandboxId: sandbox.id,
    detectedPort: portNum,
    outputSnippet: output.slice(0, 300),
  });

  const previewResult = await getPreviewUrl(sandbox, portNum);

  if (!previewResult) {
    console.error('[Daytona:setupPreviewUrl] No preview URL returned for any port', {
      sandboxId: sandbox.id,
      detectedPort: portNum,
    });
    log.error(' Could not get preview URL for any port');
    return null;
  }

  let { url: previewUrl, port: workingPort } = previewResult;

  log.debug(` Preview URL: ${previewUrl} (port ${workingPort})`);

  await new Promise((r) => setTimeout(r, 2000));

  const bgPort = await checkDevLogForPort(sandbox, workDir);

  if (bgPort && bgPort !== workingPort) {
    log.debug(` Background server using different port: ${bgPort}`);
    console.error('[Daytona:setupPreviewUrl] Background dev log reported a different port', {
      sandboxId: sandbox.id,
      initialPort: workingPort,
      backgroundPort: bgPort,
    });

    try {
      const newPreviewLink = await sandbox.getPreviewLink(bgPort);
      const nextUrl = extractPreviewUrlValue(newPreviewLink);

      if (!nextUrl) {
        console.error('[Daytona:setupPreviewUrl] Alternate preview link had no URL', {
          sandboxId: sandbox.id,
          backgroundPort: bgPort,
          previewLink: newPreviewLink,
        });
      } else {
        previewUrl = nextUrl;
      }
      log.debug(` Updated preview URL to port ${bgPort}: ${previewUrl}`);
    } catch (error) {
      console.error('[Daytona:setupPreviewUrl] Failed to resolve alternate port preview URL', {
        sandboxId: sandbox.id,
        backgroundPort: bgPort,
        error: error instanceof Error ? error.message : String(error),
      });
      log.debug(` Could not get preview URL for port ${bgPort}, keeping original`);
    }
  }

  console.error('[Daytona:setupPreviewUrl] Returning preview URL', {
    sandboxId: sandbox.id,
    previewUrl,
    port: workingPort,
  });
  return previewUrl;
}
