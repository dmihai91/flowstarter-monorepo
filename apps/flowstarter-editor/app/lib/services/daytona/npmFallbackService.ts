/**
 * NPM Fallback Service
 *
 * Handles fallback to npm when bun installation fails.
 */

import type { Sandbox } from '@daytonaio/sdk';
import { log } from './client';
import { waitForDevServer } from './devServerService';
import type { PreviewResult } from './types';

/**
 * Check if npm is available in the sandbox
 */
export async function checkNpmAvailable(sandbox: Sandbox, workDir: string): Promise<boolean> {
  const npmCheck = await sandbox.process.executeCommand('npm --version', workDir, undefined, 30);
  return npmCheck.exitCode === 0;
}

/**
 * Run the entire preview flow using npm as a fallback
 */
export async function runNpmFallback(
  sandbox: Sandbox,
  workDir: string,
  projectId: string,
  setCachedSandbox: (id: string, info: { sandboxId: string; previewUrl: string }) => void,
): Promise<PreviewResult> {
  log.debug(' checking for npm as fallback...');

  const npmCheck = await sandbox.process.executeCommand('npm --version', workDir, undefined, 30);

  if (npmCheck.exitCode !== 0) {
    return {
      success: false,
      error:
        'Failed to install bun and npm is not available. The sandbox appears to have no internet access to download tools.',
    };
  }

  log.debug(` NPM found (version ${npmCheck.result?.trim()}), using as fallback`);

  // Use npm instead of bun
  log.debug(' Running npm install...');

  const installResult = await sandbox.process.executeCommand('npm install', workDir, undefined, 300);
  log.debug(` npm install result: exit=${installResult.exitCode}, output=${installResult.result?.slice(0, 500)}`);

  if (installResult.exitCode !== 0) {
    return {
      success: false,
      error: 'Failed to install dependencies with npm fallback. Please check your network connection.',
    };
  }

  // Kill existing servers
  log.debug(' Killing any existing dev server processes...');
  await sandbox.process.executeCommand(
    'pkill -f "npm run dev" 2>/dev/null || true; pkill -f "node" 2>/dev/null || true; sleep 1',
    workDir,
    undefined,
    10,
  );

  // Start dev server with npm
  const devCommand = 'timeout 10 npm run dev -- --host 0.0.0.0 2>&1 || true';
  log.debug(' Starting dev server with npm...');

  const devResult = await sandbox.process.executeCommand(devCommand, workDir, undefined, 30);
  log.debug(` Dev server initial output: exit=${devResult.exitCode}, output=${devResult.result?.slice(0, 1000)}`);

  // Check for build/config errors
  const output = devResult.result || '';
  const serverStarted = output.includes('ready in') && (output.includes('localhost:') || output.includes('Network'));

  const hasFatalError =
    !serverStarted &&
    (output.includes('SyntaxError') ||
      output.includes('Cannot find module') ||
      (output.includes('[ERROR]') && !output.includes('Failed to scan for dependencies')));

  if (hasFatalError) {
    return { success: false, error: `Dev server failed to start: ${output.slice(0, 200)}` };
  }

  // Start background process
  log.debug(' Starting background dev server (npm)...');
  await sandbox.process.executeCommand(
    'nohup npm run dev -- --host 0.0.0.0 > /tmp/dev.log 2>&1 &',
    workDir,
    undefined,
    5,
  );

  // Wait for dev server to be ready
  const previewLink = await sandbox.getPreviewLink(4321);
  const previewUrl = previewLink.url;
  log.debug(' Waiting for dev server to be ready...');

  const serverReady = await waitForDevServer(previewUrl, 90000);

  if (!serverReady) {
    return { success: false, error: 'The preview server is taking too long to start (npm fallback).' };
  }

  setCachedSandbox(projectId, { sandboxId: sandbox.id, previewUrl });

  return { success: true, previewUrl, sandboxId: sandbox.id };
}

