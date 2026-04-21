/**
 * Convex HTTP client for the flowstarter-code Next.js wrapper.
 *
 * API routes use this singleton to read durable project state (project
 * record, sandbox pointer, thread registry) from the shared Convex
 * deployment. The T3 server still owns its own SQLite for per-session
 * runtime state; this client never touches that.
 */

import { ConvexHttpClient } from 'convex/browser';

let httpClient: ConvexHttpClient | null = null;

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
 * String-path references to the Convex function surface used by this app.
 * Kept as a loose map so we don't pull in the full _generated/api typegen
 * into the Next bundle. Keep these in lockstep with convex/*.ts exports.
 */
export const convexApi = {
  projects: {
    getByUrlId: 'projects:getByUrlId' as const,
    getById: 'projects:getById' as const,
    getBySupabaseId: 'projects:getBySupabaseId' as const,
    setActiveSandbox: 'projects:setActiveSandbox' as const,
    updateSandboxStatus: 'projects:updateSandboxStatus' as const,
    setPublished: 'projects:setPublished' as const,
    setStatus: 'projects:setStatus' as const,
  },
  threads: {
    listByProject: 'threads:listByProject' as const,
    registerThread: 'threads:registerThread' as const,
    touchThread: 'threads:touchThread' as const,
    archiveThread: 'threads:archiveThread' as const,
  },
  checkpoints: {
    listByProject: 'checkpoints:listByProject' as const,
    listByThread: 'checkpoints:listByThread' as const,
    registerCheckpoint: 'checkpoints:registerCheckpoint' as const,
  },
  files: {
    getProjectFiles: 'files:getProjectFiles' as const,
  },
  editorSessions: {
    createOrUpdate: 'editorSessions:createOrUpdate' as const,
    updateWorkspaceInfo: 'editorSessions:updateWorkspaceInfo' as const,
  },
  clientSessions: {
    getByToken: 'magicLinks:validateClientSessionToken' as const,
  },
  magicLinks: {
    validate: 'magicLinks:validate' as const,
    completeClientAccess: 'magicLinks:completeClientAccess' as const,
  },
} as const;
