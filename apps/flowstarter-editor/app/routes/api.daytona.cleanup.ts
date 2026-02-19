/**
 * POST /api/daytona/cleanup - Cleanup Daytona workspaces
 *
 * This endpoint handles cleanup of Daytona workspaces/sandboxes
 * when projects or conversations are deleted.
 *
 * Actions:
 * - Default: Cleanup specific workspaceIds or projectId
 * - cleanupAll: true - Delete ALL flowstarter sandboxes (use when hitting quota limits)
 */

import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { stopPreview, cleanupAllSandboxes } from '~/lib/services/daytonaService.server';

interface CleanupRequest {
  workspaceIds?: string[];
  projectId?: string;
  cleanupAll?: boolean;
}

interface CloudflareEnv {
  DAYTONA_API_KEY?: string;
  DAYTONA_API_URL?: string;
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const env = (context?.cloudflare?.env || context?.env || {}) as CloudflareEnv;

  try {
    const body = (await request.json()) as CleanupRequest;
    const { workspaceIds, projectId, cleanupAll } = body;

    // Handle cleanup all sandboxes (for quota issues)
    if (cleanupAll) {
      console.log('[API] Cleaning up ALL flowstarter sandboxes');

      const result = await cleanupAllSandboxes(env);

      return json({
        success: result.failed === 0,
        message: `Deleted ${result.deleted} sandboxes${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
        deleted: result.deleted,
        failed: result.failed,
        errors: result.errors,
      });
    }

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    // Cleanup preview sandbox by project ID
    if (projectId) {
      try {
        await stopPreview(projectId, env);
        results.push({ id: `preview:${projectId}`, success: true });
      } catch (e) {
        results.push({
          id: `preview:${projectId}`,
          success: false,
          error: e instanceof Error ? e.message : 'Unknown error',
        });
      }
    }

    // Cleanup specific workspaces
    if (workspaceIds && workspaceIds.length > 0) {
      const uniqueIds = [...new Set(workspaceIds)];

      for (const workspaceId of uniqueIds) {
        try {
          await cleanupDaytonaWorkspace(workspaceId, env);
          results.push({ id: workspaceId, success: true });
        } catch (e) {
          results.push({
            id: workspaceId,
            success: false,
            error: e instanceof Error ? e.message : 'Unknown error',
          });
        }
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return json({
      success: failureCount === 0,
      message: `Cleaned up ${successCount} resources${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      results,
    });
  } catch (e) {
    console.error('[API] Daytona cleanup failed:', e);
    return json(
      {
        success: false,
        error: 'Failed to cleanup Daytona resources',
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

  // Try both workspace and sandbox endpoints (different Daytona versions)
  const endpoints = [`${apiUrl}/workspace/${workspaceId}`, `${apiUrl}/sandbox/${workspaceId}`];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok || response.status === 404) {
        // Success or already deleted
        return;
      }
    } catch {
      // Try next endpoint
      continue;
    }
  }

  throw new Error(`Failed to delete workspace ${workspaceId} from any endpoint`);
}

