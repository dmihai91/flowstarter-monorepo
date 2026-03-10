/**
 * Prewarm Service
 *
 * Handles pre-warming sandboxes to reduce startup latency.
 * Call prewarmSandbox in parallel with LLM generation to save 30-60s.
 */

import type { Sandbox } from '@daytonaio/sdk';
import { getClient, setCachedSandbox, log } from './client';
import { ensureSandboxRunning } from './sandboxService';
import { uploadFiles } from './fileService';
import { checkBunAvailable, bunInstall, getBunPathSetup } from './bunService';
import {
  killExistingDevServers,
  startDevServerTest,
  startDevServerBackground,
  waitForDevServer,
  checkServerStarted,
  hasFatalError,
  runAstroCheck,
  getPreviewUrl,
} from './devServerService';
import { getOrCreateSandbox } from './sandboxHelpers';
import { startPreview } from './previewService';
import type { DaytonaEnv, PrewarmedSandbox, PreviewResult } from './types';

/**
 * Pre-warm a sandbox for a project
 * Call this in parallel with LLM generation to save 30-60s
 */
export async function prewarmSandbox(projectId: string, env?: DaytonaEnv): Promise<PrewarmedSandbox | null> {
  const startTime = Date.now();

  log.debug(` Pre-warming sandbox for project ${projectId}...`);

  let client;

  try {
    client = getClient(env);
  } catch {
    log.error(' No API key configured for pre-warming');
    return null;
  }

  try {
    const sandbox = await getOrCreateSandbox(client, projectId);

    if (!sandbox) {
      return null;
    }

    // Give it a moment to fully initialize
    await new Promise((r) => setTimeout(r, 3000));

    const workDir = (await sandbox.getWorkDir()) || '/home/daytona';

    // Check if bun is already available
    let hasBun = await checkBunAvailable(sandbox, workDir);

    // Pre-install bun if not available
    if (!hasBun) {
      log.debug(` Pre-warming: installing bun...`);
      hasBun = await installBunForPrewarm(sandbox, workDir);

      if (hasBun) {
        log.debug(` Pre-warm: bun installed successfully`);
      }
    }

    // Cache the sandbox
    setCachedSandbox(projectId, { sandboxId: sandbox.id, previewUrl: null });

    const elapsed = Date.now() - startTime;
    log.debug(` Sandbox pre-warmed in ${elapsed}ms (hasBun=${hasBun})`);

    return { sandboxId: sandbox.id, hasBun };
  } catch (e) {
    log.error(' Pre-warm failed:', e);
    return null;
  }
}

/**
 * Install bun specifically for pre-warming (simpler method selection)
 */
async function installBunForPrewarm(sandbox: Sandbox, workDir: string): Promise<boolean> {
  const installMethods = [
    {
      name: 'curl',
      command:
        'curl -fsSL https://bun.sh/install | bash 2>&1 && export BUN_INSTALL="$HOME/.bun" && export PATH="$BUN_INSTALL/bin:$PATH"',
    },
    {
      name: 'wget',
      command:
        'wget -qO- https://bun.sh/install | bash 2>&1 && export BUN_INSTALL="$HOME/.bun" && export PATH="$BUN_INSTALL/bin:$PATH"',
    },
  ];

  const installPromises = installMethods.map(async (method) => {
    try {
      const result = await sandbox.process.executeCommand(method.command, workDir, undefined, 90);

      if (result.exitCode === 0) {
        const verify = await sandbox.process.executeCommand(
          'export BUN_INSTALL="$HOME/.bun" && export PATH="$BUN_INSTALL/bin:$PATH" && bun --version 2>/dev/null',
          workDir,
          undefined,
          10,
        );

        if (verify.exitCode === 0 && verify.result && !verify.result.includes('not found')) {
          return { success: true, method: method.name };
        }
      }

      return { success: false, method: method.name };
    } catch {
      return { success: false, method: method.name };
    }
  });

  const results = await Promise.all(installPromises);

  return results.some((r) => r.success);
}

/**
 * Start preview with a pre-warmed sandbox
 */
export async function startPreviewWithPrewarmedSandbox(
  projectId: string,
  files: Record<string, string>,
  prewarmedSandbox: PrewarmedSandbox,
  env?: DaytonaEnv,
  onProgress?: (message: string) => void,
): Promise<PreviewResult> {
  const progress = onProgress || (() => {});
  const { sandboxId, hasBun } = prewarmedSandbox;
  const startTime = Date.now();

  log.debug(` Starting preview with pre-warmed sandbox ${sandboxId} (hasBun=${hasBun})`);

  let client;

  try {
    client = getClient(env);
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }

  try {
    const sandbox = await client.get(sandboxId);

    // Ensure sandbox is still running
    const isRunning = await ensureSandboxRunning(client, sandbox);

    if (!isRunning) {
      log.debug(' Pre-warmed sandbox not running, falling back to full startPreview');
      return startPreview(projectId, files, env, onProgress);
    }

    const workDir = (await sandbox.getWorkDir()) || '/home/daytona';

    // Upload files
    progress(`Uploading ${Object.keys(files).length} files to sandbox...`);
    log.debug(' Uploading files to pre-warmed sandbox...');
    await uploadFiles(sandbox, files);

    // If bun wasn't pre-installed, install it now
    if (!hasBun) {
      progress('Installing bun runtime...');
      log.debug(' Bun not pre-installed, installing now...');

      const installResult = await sandbox.process.executeCommand(
        'curl -fsSL https://bun.sh/install | bash 2>&1',
        workDir,
        undefined,
        90,
      );

      if (installResult.exitCode !== 0) {
        return { success: false, error: 'Failed to install bun', sandboxId };
      }
    }

    // Install dependencies
    progress('Installing dependencies...');
    log.debug(' Running bun install...');

    const installSuccess = await bunInstall(sandbox, workDir);

    if (!installSuccess) {
      return { success: false, error: 'Failed to install dependencies with bun', sandboxId };
    }

    // Kill existing dev servers
    progress('Starting Astro dev server...');
    await killExistingDevServers(sandbox, workDir);

    // Run astro check first to catch type errors with file info
    log.info(' Running astro type check before preview...');
    progress('Running type check...');
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

    // Start dev server (test run first)
    const { output } = await startDevServerTest(sandbox, workDir);
    const serverStarted = checkServerStarted(output);

    if (hasFatalError(output, serverStarted)) {
      const errorMatch = output.match(/\[ERROR\][^\n]*/);
      return {
        success: false,
        error: `Dev server failed: ${errorMatch?.[0] || output.slice(0, 200)}`,
        buildError: {
          file: '',
          line: '0',
          message: errorMatch?.[0] || 'Build error',
          fullOutput: output,
        },
        sandboxId,
      };
    }

    // Start background dev server
    await startDevServerBackground(sandbox, workDir);

    // Get preview URL
    const previewUrl = await getPreviewUrlFromSandbox(sandbox, output);

    if (!previewUrl) {
      return { success: false, error: 'Failed to get preview URL', sandboxId };
    }

    // Wait for server to be ready
    progress('Waiting for dev server to respond...');
    await new Promise((r) => setTimeout(r, 2000));

    const waitResult = await waitForDevServer(previewUrl, 60000);
    const serverReady = waitResult.ready;

    if (!serverReady) {
      return {
        success: false,
        error: waitResult.buildError?.message || 'Preview server failed to start',
        buildError: waitResult.buildError,
        sandboxId,
      };
    }

    // Update cache
    setCachedSandbox(projectId, { sandboxId: sandbox.id, previewUrl });

    const elapsed = Date.now() - startTime;
    log.debug(` Preview ready in ${elapsed}ms (pre-warmed): ${previewUrl}`);

    return { success: true, previewUrl, sandboxId: sandbox.id };
  } catch (e) {
    log.error(' Error with pre-warmed sandbox:', e);
    return startPreview(projectId, files, env, onProgress);
  }
}

/**
 * Get preview URL from sandbox, trying detected port first then common ports
 */
async function getPreviewUrlFromSandbox(sandbox: Sandbox, output: string): Promise<string | null> {
  const portMatch = output.match(/localhost:(\d+)/i);
  const port = portMatch ? parseInt(portMatch[1], 10) : 4321;
  console.error('[Daytona:prewarm] Resolving preview URL from prewarmed sandbox', {
    sandboxId: sandbox.id,
    detectedPort: port,
    outputSnippet: output.slice(0, 300),
  });

  const previewResult = await getPreviewUrl(sandbox, port);
  if (!previewResult) {
    console.error('[Daytona:prewarm] Failed to resolve preview URL from prewarmed sandbox', {
      sandboxId: sandbox.id,
      detectedPort: port,
    });
    return null;
  }

  return previewResult.url;
}
