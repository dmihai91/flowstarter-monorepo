/**
 * Sandbox Helpers
 *
 * Helper functions for sandbox lifecycle management used by preview service.
 */

import { SandboxState, type Sandbox, type Daytona } from '@daytonaio/sdk';
import { getCachedSandbox, deleteCachedSandbox, log } from './client';
import { findReusableSandbox, createSandbox } from './sandboxService';

/**
 * Get or create a sandbox for the project
 */
export async function getOrCreateSandbox(client: Daytona, projectId: string): Promise<Sandbox | null> {
  let sandbox: Sandbox | null = null;
  const cached = getCachedSandbox(projectId);
  log.debug(` Cached sandboxId: ${cached?.sandboxId || 'none'}`);

  // If we have a cached sandbox, verify it's still valid
  if (cached?.sandboxId) {
    sandbox = await verifyCachedSandbox(client, cached.sandboxId, projectId);
  }

  // If no cached sandbox, try to find a reusable one
  if (!sandbox) {
    sandbox = await findAndStartReusableSandbox(client, projectId);
  }

  // If still no sandbox, create a new one
  if (!sandbox) {
    sandbox = await createNewSandbox(client, projectId);
  }

  return sandbox;
}

/**
 * Verify cached sandbox is still valid and running
 */
async function verifyCachedSandbox(client: Daytona, sandboxId: string, projectId: string): Promise<Sandbox | null> {
  try {
    const sandbox = await client.get(sandboxId);
    await sandbox.refreshData();

    if (sandbox.state === SandboxState.STARTED) {
      log.debug(` Cached sandbox ${sandbox.id} is still running`);
      return sandbox;
    }

    if (sandbox.state === SandboxState.STOPPED || sandbox.state === SandboxState.ARCHIVED) {
      log.debug(` Cached sandbox ${sandbox.id} is ${sandbox.state}, starting it...`);
      await sandbox.start(60);
      log.debug(` Sandbox started`);

      return sandbox;
    }

    log.debug(` Cached sandbox ${sandbox.id} is in ${sandbox.state} state, finding another`);
    deleteCachedSandbox(projectId);

    return null;
  } catch {
    log.debug(` Cached sandbox ${sandboxId} not found, clearing cache`);
    deleteCachedSandbox(projectId);

    return null;
  }
}

/**
 * Find and start a reusable sandbox
 */
async function findAndStartReusableSandbox(client: Daytona, projectId: string): Promise<Sandbox | null> {
  const reusable = await findReusableSandbox(client, projectId);

  if (!reusable) {
    return null;
  }

  const sandbox = reusable.sandbox;
  log.debug(` Reusing existing sandbox: ${sandbox.id}`);

  if (reusable.needsStart) {
    log.debug(' Starting stopped/archived sandbox...');
    await sandbox.start(60);
    log.debug(' Sandbox started');
  }

  return sandbox;
}

/**
 * Create a new sandbox for the project
 */
async function createNewSandbox(client: Daytona, projectId: string): Promise<Sandbox> {
  log.debug(' Creating new sandbox...');

  const sandbox = await createSandbox(client, projectId);
  log.debug(` Sandbox created with ID: ${sandbox.id}`);

  // Wait a bit for sandbox runtime to fully initialize
  log.debug(' Waiting for sandbox runtime to initialize...');
  await new Promise((r) => setTimeout(r, 5000));

  return sandbox;
}

/**
 * Verify sandbox is working with a simple command
 */
export async function verifySandbox(sandbox: Sandbox, workDir: string): Promise<boolean> {
  log.debug(' Testing sandbox with simple command...');

  const echoTest = await sandbox.process.executeCommand('echo "sandbox test" && pwd && ls -la', workDir);
  log.debug(` Echo test: exit=${echoTest.exitCode}, output=${echoTest.result?.slice(0, 300)}`);

  if (echoTest.exitCode !== 0) {
    log.error(' Basic sandbox commands failing, sandbox may not be ready');
    await new Promise((r) => setTimeout(r, 5000));

    const retryEcho = await sandbox.process.executeCommand('echo "retry test"', workDir);
    log.debug(` Retry echo test: exit=${retryEcho.exitCode}, output=${retryEcho.result?.slice(0, 100)}`);

    return retryEcho.exitCode === 0;
  }

  return true;
}

