/**
 * DELETE /api/project/delete - Delete a project and all associated data
 *
 * This endpoint handles comprehensive project cleanup:
 * 1. Deletes all Convex data (files, snapshots, conversations, orchestrations, etc.)
 * 2. Cleans up Daytona workspaces/sandboxes
 * 3. Returns deletion summary
 */

import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { stopPreview } from '~/lib/services/daytonaService.server';

interface DeleteProjectRequest {
  projectId: string;
  urlId?: string;
}

interface CloudflareEnv {
  DAYTONA_API_KEY?: string;
  DAYTONA_API_URL?: string;
  CONVEX_URL?: string;
}

interface DeletionSummary {
  projectName: string;
  messages: number;
  files: number;
  snapshots: number;
  snapshotBlobs: number;
  conversations: number;
  conversationMessages: number;
  orchestrations: number;
  orchestrationTasks: number;
  agentEvents: number;
  chatSessions: number;
  daytonaWorkspaceIds: string[];
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== 'DELETE' && request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const env = (context?.cloudflare?.env || context?.env || {}) as CloudflareEnv;

  try {
    const body = (await request.json()) as DeleteProjectRequest;
    const { projectId, urlId } = body;

    if (!projectId) {
      return json({ error: 'Project ID is required' }, { status: 400 });
    }

    console.log(`[API] Deleting project ${projectId}${urlId ? ` (${urlId})` : ''}`);

    /*
     * Step 1: Call Convex mutation to delete all database records
     * The mutation returns a summary including Daytona workspace IDs to cleanup
     */
    const convexUrl = env.CONVEX_URL || process.env.CONVEX_URL;

    if (!convexUrl) {
      return json({ error: 'Convex URL not configured' }, { status: 500 });
    }

    // Call the Convex mutation via HTTP
    const mutationResponse = await fetch(`${convexUrl}/api/mutation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: 'projects:remove',
        args: { projectId },
      }),
    });

    if (!mutationResponse.ok) {
      const errorText = await mutationResponse.text();
      console.error('[API] Convex mutation failed:', errorText);

      return json({ error: 'Failed to delete project from database', details: errorText }, { status: 500 });
    }

    const deletionSummary = (await mutationResponse.json()) as { value: DeletionSummary };
    const summary = deletionSummary.value;

    console.log(`[API] Convex cleanup complete:`, summary);

    // Step 2: Cleanup Daytona preview sandbox (using projectId as key)
    try {
      await stopPreview(projectId, env);
      console.log(`[API] Stopped Daytona preview sandbox for project ${projectId}`);
    } catch (e) {
      console.warn(`[API] Could not stop Daytona preview sandbox:`, e);

      // Continue - sandbox might not exist or already be stopped
    }

    // Step 3: Cleanup Daytona workspaces from orchestration tasks
    const workspaceCleanupResults: { id: string; success: boolean; error?: string }[] = [];

    if (summary.daytonaWorkspaceIds && summary.daytonaWorkspaceIds.length > 0) {
      const uniqueWorkspaceIds = [...new Set(summary.daytonaWorkspaceIds)];
      console.log(`[API] Cleaning up ${uniqueWorkspaceIds.length} Daytona workspaces`);

      for (const workspaceId of uniqueWorkspaceIds) {
        try {
          await cleanupDaytonaWorkspace(workspaceId, env);
          workspaceCleanupResults.push({ id: workspaceId, success: true });
        } catch (e) {
          console.warn(`[API] Failed to cleanup workspace ${workspaceId}:`, e);
          workspaceCleanupResults.push({
            id: workspaceId,
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error',
          });
        }
      }
    }

    return json({
      success: true,
      summary: {
        ...summary,
        workspaceCleanupResults,
      },
    });
  } catch (e) {
    console.error('[API] Project deletion failed:', e);
    return json(
      {
        error: 'Failed to delete project',
        details: e instanceof Error ? e.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * Cleanup a Daytona workspace by ID
 */
async function cleanupDaytonaWorkspace(workspaceId: string, env: CloudflareEnv): Promise<void> {
  const apiKey = env.DAYTONA_API_KEY || process.env.DAYTONA_API_KEY;
  const apiUrl = env.DAYTONA_API_URL || process.env.DAYTONA_API_URL || 'https://app.daytona.io/api';

  if (!apiKey) {
    console.warn('[Daytona] No API key configured, skipping workspace cleanup');
    return;
  }

  const response = await fetch(`${apiUrl}/workspace/${workspaceId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete workspace: ${response.status} ${response.statusText}`);
  }
}

