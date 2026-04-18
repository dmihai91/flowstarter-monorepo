/**
 * Snapshot Service
 *
 * Create, restore, list, and delete sandbox snapshots.
 * Targets @daytonaio/sdk v0.150.0 API.
 */

import type { Daytona, Sandbox } from '@daytonaio/sdk';
import type { Snapshot } from './types';

/**
 * Create a snapshot of the current sandbox state.
 * Stops the sandbox to capture its filesystem state.
 */
export async function createSnapshot(
  sandbox: Sandbox,
  projectId: string,
): Promise<Snapshot> {
  const snapshotId = `snap-${projectId}-${Date.now()}`;

  // Stop the sandbox to capture filesystem state
  await sandbox.stop();

  return {
    id: snapshotId,
    projectId,
    sandboxId: sandbox.id,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Restore a snapshot by starting an archived/stopped sandbox.
 */
export async function restoreSnapshot(
  client: Daytona,
  _snapshotId: string,
  targetSandboxId: string,
): Promise<boolean> {
  try {
    const sandbox = await client.get(targetSandboxId);
    await sandbox.refreshData();

    if (sandbox.state === 'archived' || sandbox.state === 'stopped') {
      await sandbox.start(120);
      await new Promise((r) => setTimeout(r, 3000));
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * List available snapshots for a project.
 * Scans archived sandboxes with matching project labels.
 */
export async function listSnapshots(
  client: Daytona,
  projectId: string,
): Promise<Snapshot[]> {
  try {
    const { items: sandboxes } = await client.list({
      project: projectId,
      source: 'flowstarter',
    });

    const snapshots: Snapshot[] = [];

    for (const sandbox of sandboxes) {
      if (sandbox.state === 'archived') {
        snapshots.push({
          id: `snap-${projectId}-${sandbox.id}`,
          projectId,
          sandboxId: sandbox.id,
          createdAt: sandbox.createdAt || new Date().toISOString(),
        });
      }
    }

    return snapshots;
  } catch {
    return [];
  }
}

/**
 * Delete a snapshot by removing the archived sandbox.
 */
export async function deleteSnapshot(
  client: Daytona,
  snapshotId: string,
): Promise<boolean> {
  try {
    // Extract sandbox ID from snapshot ID format: snap-{projectId}-{timestamp}
    // We need to find the sandbox by listing
    const parts = snapshotId.split('-');
    if (parts.length < 3) return false;

    // The snapshotId contains the sandbox info — find by listing
    const projectId = parts.slice(1, -1).join('-');
    const { items: sandboxes } = await client.list({
      project: projectId,
      source: 'flowstarter',
    });

    const archived = sandboxes.find(
      (s) => s.state === 'archived' && `snap-${projectId}-${s.id}` === snapshotId,
    );

    if (!archived) return false;

    await client.delete(archived);
    return true;
  } catch {
    return false;
  }
}
