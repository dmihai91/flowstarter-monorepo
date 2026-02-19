/**
 * Sandbox Service
 *
 * Handles sandbox creation, discovery, and lifecycle management.
 */

import { Daytona, Sandbox, SandboxState } from '@daytonaio/sdk';
import { log } from './client';
import type { ReusableSandboxResult } from './types';

/**
 * Find a reusable sandbox (started, stopped, or archived) for the given project
 * Prioritizes: 1) started sandboxes, 2) stopped sandboxes, 3) archived sandboxes
 */
export async function findReusableSandbox(client: Daytona, projectId: string): Promise<ReusableSandboxResult | null> {
  try {
    log.debug(` Looking for existing sandbox for project ${projectId}`);

    // Get all flowstarter sandboxes
    const { items: sandboxes } = await client.list({ source: 'flowstarter' });

    log.debug(` Found ${sandboxes.length} flowstarter sandboxes`);

    // Filter by project and categorize by state
    const projectSandboxes = sandboxes.filter((s) => s.labels?.project === projectId);
    log.debug(` Found ${projectSandboxes.length} sandboxes for project ${projectId}`);

    // Find started sandbox first (can reuse immediately)
    const startedSandbox = projectSandboxes.find((s) => s.state === SandboxState.STARTED);

    if (startedSandbox) {
      log.debug(` Found started sandbox: ${startedSandbox.id}`);
      return { sandbox: startedSandbox, needsStart: false };
    }

    // Find stopped sandbox (needs to be started)
    const stoppedSandbox = projectSandboxes.find((s) => s.state === SandboxState.STOPPED);

    if (stoppedSandbox) {
      log.debug(` Found stopped sandbox: ${stoppedSandbox.id}`);
      return { sandbox: stoppedSandbox, needsStart: true };
    }

    // Find archived sandbox (needs to be started/unarchived)
    const archivedSandbox = projectSandboxes.find((s) => s.state === SandboxState.ARCHIVED);

    if (archivedSandbox) {
      log.debug(` Found archived sandbox: ${archivedSandbox.id}`);
      return { sandbox: archivedSandbox, needsStart: true };
    }

    // Also check for any sandbox without a specific project label that's available
    const anyAvailableSandbox = sandboxes.find(
      (s) =>
        !s.labels?.project &&
        (s.state === SandboxState.STARTED || s.state === SandboxState.STOPPED || s.state === SandboxState.ARCHIVED),
    );

    if (anyAvailableSandbox) {
      log.debug(` Found available sandbox without project: ${anyAvailableSandbox.id}`);
      return {
        sandbox: anyAvailableSandbox,
        needsStart: anyAvailableSandbox.state !== SandboxState.STARTED,
      };
    }

    log.debug(` No reusable sandbox found`);

    return null;
  } catch (e) {
    log.error(' Error finding reusable sandbox:', e);
    return null;
  }
}

/**
 * Create a new sandbox for the project
 */
export async function createSandbox(client: Daytona, projectId: string): Promise<Sandbox> {
  log.debug(` Creating sandbox for project ${projectId}`);

  const baseConfig = {
    envVars: {
      PROJECT_ID: projectId,
      NODE_ENV: 'development',
    },
    autoStopInterval: 30, // 30 mins
    public: true, // Make preview accessible
    labels: {
      project: projectId,
      source: 'flowstarter',
    },
  };

  // Try creating with bun image first (use specific version tag, not 'latest')
  const bunImages = ['oven/bun:1.1', 'oven/bun:1.1-debian', 'oven/bun:1', 'oven/bun:1-debian', 'oven/bun:1.0'];

  for (const bunImage of bunImages) {
    try {
      log.debug(` Trying to create sandbox with image: ${bunImage}...`);

      const sandbox = await client.create(
        {
          ...baseConfig,
          image: bunImage,
        },
        { timeout: 120 },
      );
      log.debug(` Sandbox created with bun image ${bunImage}: ${sandbox.id}`);

      return sandbox;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.debug(` Image ${bunImage} failed: ${errorMsg}`);

      // Try next image
    }
  }

  // Fallback to node language - we'll install bun manually
  log.debug(' All bun images failed, falling back to node language');

  const sandbox = await client.create(
    {
      ...baseConfig,
      language: 'javascript',
    },
    { timeout: 120 },
  );
  log.debug(` Sandbox created with node language: ${sandbox.id}`);

  return sandbox;
}

/**
 * Ensure sandbox is running, restart if needed
 */
export async function ensureSandboxRunning(_client: Daytona, sandbox: Sandbox): Promise<boolean> {
  try {
    // Refresh sandbox state
    await sandbox.refreshData();

    if (sandbox.state === SandboxState.STARTED) {
      return true;
    }

    if (sandbox.state === SandboxState.STOPPED || sandbox.state === SandboxState.ARCHIVED) {
      log.debug(` Sandbox ${sandbox.id} is ${sandbox.state}, starting it...`);
      await sandbox.start(60); // 60 second timeout
      log.debug(` Sandbox ${sandbox.id} started successfully`);

      // Give it a moment to fully initialize
      await new Promise((r) => setTimeout(r, 3000));

      return true;
    }

    log.error(` Sandbox ${sandbox.id} is in unexpected state: ${sandbox.state}`);

    return false;
  } catch (e) {
    log.error(` Error ensuring sandbox is running:`, e);
    return false;
  }
}

