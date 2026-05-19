/**
 * Bootstrap Orchestrator
 *
 * 8-step workspace bootstrap sequence for Daytona sandboxes.
 * Targets @daytonaio/sdk v0.150.0 API.
 */

import type { Sandbox } from '@daytonaio/sdk';
import { getClient } from './client';
import { getOrCreateSandbox, ensureSandboxRunning, getPreviewUrl } from './sandbox';
import type { BootstrapOptions, BootstrapResult } from './types';

const STEP_NAMES = [
  'Provisioning sandbox',
  'Verifying sandbox health',
  'Uploading project files',
  'Detecting runtime',
  'Installing dependencies',
  'Running type check',
  'Starting dev server',
  'Establishing preview URL',
] as const;

function progress(
  opts: BootstrapOptions,
  step: number,
  message?: string,
): void {
  opts.onProgress?.(step, message || STEP_NAMES[step - 1]);
}

function fail(step: number, error: string): BootstrapResult {
  return { success: false, error, failedAtStep: step };
}

/** Upload files to the sandbox working directory. */
async function uploadFiles(
  sandbox: Sandbox,
  files: Record<string, string>,
  workDir: string,
): Promise<void> {
  const entries = Object.entries(files);
  if (entries.length === 0) return;

  // Collect unique directories
  const dirs = new Set<string>();
  for (const [filePath] of entries) {
    const parts = filePath.split('/');
    if (parts.length > 1) {
      dirs.add(parts.slice(0, -1).join('/'));
    }
  }

  // Create directories first
  if (dirs.size > 0) {
    const mkdirCmd = `mkdir -p ${Array.from(dirs).map((d) => `"${workDir}/${d}"`).join(' ')}`;
    await sandbox.process.executeCommand(mkdirCmd, workDir);
  }

  // Upload files in parallel batches of 5
  const batchSize = 5;
  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    await Promise.all(
      batch.map(([filePath, content]) =>
        sandbox.fs.uploadFile(
          Buffer.from(content, 'utf-8'),
          `${workDir}/${filePath}`,
        ),
      ),
    );
  }
}

/** Check if bun is available, install if needed. */
async function ensureBunReady(
  sandbox: Sandbox,
  workDir: string,
): Promise<boolean> {
  // Check if bun is already available
  try {
    const result = await sandbox.process.executeCommand(
      'bun --version',
      workDir,
      undefined,
      10,
    );
    if (result.exitCode === 0) return true;
  } catch {
    // Not available
  }

  // Try to install bun
  const installMethods = [
    'curl -fsSL https://bun.sh/install | bash && export BUN_INSTALL="$HOME/.bun" && export PATH="$BUN_INSTALL/bin:$PATH"',
    'npm install -g bun',
  ];

  for (const cmd of installMethods) {
    try {
      const result = await sandbox.process.executeCommand(
        cmd,
        workDir,
        undefined,
        60,
      );
      if (result.exitCode === 0) {
        // Verify install
        const verify = await sandbox.process.executeCommand(
          'bun --version',
          workDir,
          undefined,
          10,
        );
        if (verify.exitCode === 0) return true;
      }
    } catch {
      // Try next method
    }
  }

  return false;
}

/** Run bun/npm install. */
async function installDependencies(
  sandbox: Sandbox,
  workDir: string,
  hasBun: boolean,
): Promise<boolean> {
  const cmd = hasBun ? 'bun install' : 'npm install';
  try {
    const result = await sandbox.process.executeCommand(
      cmd,
      workDir,
      undefined,
      180,
    );
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

/** Run type checking. */
async function runTypeCheck(
  sandbox: Sandbox,
  workDir: string,
): Promise<{ passed: boolean; output: string }> {
  for (const cmd of ['npx astro check', 'npx tsc --noEmit']) {
    try {
      const result = await sandbox.process.executeCommand(
        cmd,
        workDir,
        undefined,
        60,
      );
      return { passed: result.exitCode === 0, output: result.result || '' };
    } catch {
      // Try next
    }
  }
  // If neither works, pass (some projects don't have TS)
  return { passed: true, output: '' };
}

/** Start the dev server in the background. */
async function startDevServer(
  sandbox: Sandbox,
  workDir: string,
  hasBun: boolean,
): Promise<boolean> {
  // Kill any existing dev processes
  try {
    await sandbox.process.executeCommand(
      "pkill -f 'bun run dev|astro dev|vite|next dev' || true",
      workDir,
      undefined,
      5,
    );
  } catch {
    // Ignore
  }

  // Force binding to 0.0.0.0 so the Daytona proxy can reach the dev server
  // (astro/vite default to 127.0.0.1, which the proxy cannot route → 502).
  const cmd = hasBun ? 'bun run dev' : 'npm run dev';
  try {
    // Start in background
    await sandbox.process.executeCommand(
      `nohup ${cmd} -- --host 0.0.0.0 > /tmp/dev.log 2>&1 &`,
      workDir,
      undefined,
      10,
    );

    // Wait for server to start
    await new Promise((r) => setTimeout(r, 5000));

    return true;
  } catch {
    return false;
  }
}

/** Poll for a working preview URL. */
async function waitForPreview(
  sandbox: Sandbox,
  timeoutMs = 60000,
): Promise<string | undefined> {
  const start = Date.now();
  const backoffMs = [2000, 3000, 5000, 5000, 10000];
  let attempt = 0;

  while (Date.now() - start < timeoutMs) {
    const url = await getPreviewUrl(sandbox);
    if (url) return url;

    const delay = backoffMs[Math.min(attempt, backoffMs.length - 1)];
    await new Promise((r) => setTimeout(r, delay));
    attempt++;
  }

  return undefined;
}

/**
 * Execute the full 8-step bootstrap sequence.
 */
export async function bootstrapWorkspace(
  opts: BootstrapOptions,
): Promise<BootstrapResult> {
  let client;
  try {
    client = getClient(opts.env);
  } catch (e) {
    return fail(1, e instanceof Error ? e.message : 'Failed to create Daytona client');
  }

  // Step 1: Provision sandbox
  progress(opts, 1);
  let sandbox: Sandbox;
  try {
    const result = await getOrCreateSandbox(client, opts.projectId);
    sandbox = result.sandbox;
  } catch (e) {
    return fail(1, e instanceof Error ? e.message : 'Failed to provision sandbox');
  }

  const sandboxId = sandbox.id;

  // Step 2: Verify sandbox health
  progress(opts, 2);
  try {
    const result = await sandbox.process.executeCommand(
      'echo "ok" && pwd',
      undefined,
      undefined,
      15,
    );
    if (result.exitCode !== 0) {
      await ensureSandboxRunning(sandbox);
      const retry = await sandbox.process.executeCommand(
        'echo "ok"',
        undefined,
        undefined,
        15,
      );
      if (retry.exitCode !== 0) {
        return fail(2, 'Sandbox health check failed after retry');
      }
    }
  } catch (e) {
    return fail(2, e instanceof Error ? e.message : 'Sandbox health check failed');
  }

  let workDir: string;
  try {
    workDir = (await sandbox.getWorkDir()) || '/home/daytona';
  } catch {
    workDir = '/home/daytona';
  }

  // Step 3: Upload project files
  progress(opts, 3);
  try {
    await uploadFiles(sandbox, opts.files, workDir);
  } catch (e) {
    return fail(3, e instanceof Error ? e.message : 'Failed to upload files');
  }

  // Step 4: Detect/install runtime
  progress(opts, 4);
  let hasBun: boolean;
  try {
    hasBun = await ensureBunReady(sandbox, workDir);
  } catch {
    hasBun = false;
  }

  // Step 5: Install dependencies
  progress(opts, 5);
  const installed = await installDependencies(sandbox, workDir, hasBun);
  if (!installed) {
    return fail(5, 'Failed to install dependencies');
  }

  // Step 6: Type check — informational only. A live `astro dev` preview does
  // not require a clean type-check; failing the whole bootstrap here would
  // block valid, renderable sites. Report progress and continue regardless.
  progress(opts, 6);
  const typeCheck = await runTypeCheck(sandbox, workDir);
  if (!typeCheck.passed) {
    progress(opts, 6, 'Type check reported issues (non-fatal, continuing)');
  }

  // Step 7: Start dev server
  progress(opts, 7);
  const serverStarted = await startDevServer(sandbox, workDir, hasBun);
  if (!serverStarted) {
    return fail(7, 'Failed to start dev server');
  }

  // Step 8: Establish preview URL
  progress(opts, 8);
  const previewUrl = await waitForPreview(sandbox);
  if (!previewUrl) {
    return fail(8, 'Preview URL not available after timeout');
  }

  return { success: true, sandboxId, previewUrl };
}
