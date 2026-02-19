/**
 * Preview Proxy Core
 *
 * Shared helpers for resolving preview URLs, used by:
 * - /preview/{projectId}/ (internal iframe proxy)
 * - /live/{slug}/ (public-facing slug-based proxy)
 */

import { getCachedPreviewUrl, clearCachedPreview, fetchPreviewUrl } from '~/lib/services/daytonaService.server';
import { setCachedSandbox } from '~/lib/services/daytona/client';
import { getConvexClient } from '~/lib/services/daytona/convexClient';

/**
 * Resolve the Daytona preview URL for a project.
 * Checks memory cache first, then falls back to Convex.
 */
export async function resolvePreviewUrl(projectId: string): Promise<string | null> {
  let daytonaUrl = getCachedPreviewUrl(projectId);

  if (!daytonaUrl) {
    try {
      const convexResult = await fetchPreviewUrl(projectId);
      if (convexResult?.workspaceUrl) {
        daytonaUrl = convexResult.workspaceUrl;
        setCachedSandbox(projectId, {
          sandboxId: convexResult.sandboxId,
          previewUrl: daytonaUrl,
        });
        console.log(`[Preview Proxy] Restored preview URL from Convex for ${projectId}`);
      }
    } catch (e) {
      console.error('[Preview Proxy] Failed to fetch from Convex:', e);
    }
  }

  return daytonaUrl;
}

/**
 * Look up a project ID from a URL slug using the ConvexHttpClient.
 */
export async function resolveSlugToProjectId(slug: string): Promise<string | null> {
  try {
    const client = getConvexClient();
    if (!client) {
      console.error('[Preview Proxy] No Convex client for slug lookup');
      return null;
    }

    const project = await client.query('projects:getByUrlId' as any, { urlId: slug });
    if (project?._id) {
      console.log(`[Preview Proxy] Resolved slug "${slug}" → ${project._id}`);
      return project._id;
    }

    console.log(`[Preview Proxy] No project found for slug "${slug}"`);
    return null;
  } catch (e) {
    console.error('[Preview Proxy] Failed to resolve slug:', e);
    return null;
  }
}

export { clearCachedPreview };

