/**
 * Convex Client for flowstarter-code
 *
 * Server-side HTTP client that connects to the shared Convex deployment
 * (same deployment as flowstarter-editor). Used by API routes to read
 * project files and manage editor sessions.
 */

import { ConvexHttpClient } from 'convex/browser';

let httpClient: ConvexHttpClient | null = null;

/**
 * Get the server-side Convex HTTP client (singleton).
 * Used in API routes — not for client-side React components.
 */
export function getConvexClient(): ConvexHttpClient | null {
  const url = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!url) {
    console.warn('[Convex] No CONVEX_URL configured');
    return null;
  }

  if (!httpClient) {
    httpClient = new ConvexHttpClient(url);
  }

  return httpClient;
}

/**
 * Convex API references for the shared editor deployment.
 * These match the function paths in flowstarter-editor/convex/.
 */
export const convexApi = {
  files: {
    list: 'files:list' as const,
    getProjectFiles: 'files:getProjectFiles' as const,
    save: 'files:save' as const,
    saveBatch: 'files:saveBatch' as const,
    syncFiles: 'files:syncFiles' as const,
    updateContent: 'files:updateContent' as const,
  },
  editorSessions: {
    getByProject: 'editorSessions:getByProject' as const,
    createOrUpdate: 'editorSessions:createOrUpdate' as const,
    markActive: 'editorSessions:markActive' as const,
    markExpired: 'editorSessions:markExpired' as const,
    updateWorkspaceInfo: 'editorSessions:updateWorkspaceInfo' as const,
  },
  projects: {
    getByUrlId: 'projects:getByUrlId' as const,
    getPreviewUrl: 'projects:getPreviewUrl' as const,
    updateWorkspace: 'projects:updateWorkspace' as const,
  },
  conversations: {
    getByProject: 'conversations:getByProject' as const,
  },
  clientSessions: {
    getByToken: 'clientSessions:getByToken' as const,
  },
} as const;
