/**
 * Convex Client Helper for Daytona Service
 *
 * Provides server-side Convex access for persisting preview URLs.
 */

import { ConvexHttpClient } from 'convex/browser';

let convexClient: ConvexHttpClient | null = null;

/**
 * Get the Convex HTTP client (singleton)
 */
export function getConvexClient(): ConvexHttpClient | null {
  if (convexClient) return convexClient;

  const convexUrl = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;
  if (!convexUrl) {
    console.warn('[ConvexClient] CONVEX_URL not configured');
    return null;
  }

  convexClient = new ConvexHttpClient(convexUrl);
  return convexClient;
}

/**
 * Persist preview URL to Convex for durability across worker restarts
 */
export async function persistPreviewUrl(
  projectId: string,
  workspaceUrl: string,
  sandboxId: string
): Promise<boolean> {
  try {
    const client = getConvexClient();
    if (!client) return false;

    await client.mutation('projects:updateWorkspace' as any, {
      projectId,
      workspaceUrl,
      daytonaWorkspaceId: sandboxId,
      workspaceStatus: 'running',
    });

    console.log(`[ConvexClient] Persisted preview URL for ${projectId}`);
    return true;
  } catch (e) {
    console.error('[ConvexClient] Failed to persist preview URL:', e);
    return false;
  }
}

/**
 * Fetch preview URL from Convex (fallback when memory cache is empty)
 */
export async function fetchPreviewUrl(
  projectId: string
): Promise<{ workspaceUrl: string; sandboxId: string } | null> {
  try {
    const client = getConvexClient();
    if (!client) return null;

    const result = await client.query('projects:getPreviewUrl' as any, { projectId });

    if (result?.workspaceUrl) {
      console.log(`[ConvexClient] Fetched preview URL from Convex for ${projectId}`);
      return {
        workspaceUrl: result.workspaceUrl,
        sandboxId: result.sandboxId || '',
      };
    }

    return null;
  } catch (e) {
    console.error('[ConvexClient] Failed to fetch preview URL:', e);
    return null;
  }
}

/**
 * Clear preview URL from Convex
 */
export async function clearPersistedPreviewUrl(projectId: string): Promise<boolean> {
  try {
    const client = getConvexClient();
    if (!client) return false;

    await client.mutation('projects:updateWorkspace' as any, {
      projectId,
      workspaceUrl: undefined,
      daytonaWorkspaceId: undefined,
      workspaceStatus: 'stopped',
    });

    return true;
  } catch (e) {
    console.error('[ConvexClient] Failed to clear preview URL:', e);
    return false;
  }
}

