/**
 * Project Sync API (Editor-side)
 * 
 * Creates/updates Supabase projects from the editor.
 * Called when projects are created or updated in the editor without handoff.
 */

import { json, type ActionFunctionArgs } from '@remix-run/node';
import { getAuth } from '@clerk/remix/ssr.server';

const MAIN_PLATFORM_URL = process.env.MAIN_PLATFORM_URL || (process.env.NODE_ENV === 'production' ? 'https://flowstarter.app' : 'https://flowstarter.dev');

/**
 * POST /api/project/sync
 * 
 * Body: { action: 'create' | 'update', projectData: {...} }
 */
export async function action(args: ActionFunctionArgs) {
  const { request } = args;
  const { userId } = await getAuth(args);
  
  if (!userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json() as { action?: string; projectData?: Record<string, unknown> };
  const { action: syncAction, projectData } = body;

  if (!projectData) {
    return json({ error: 'Missing projectData' }, { status: 400 });
  }

  if (syncAction === 'create') {
    try {
      // Create project in Supabase via main platform API
      const res = await fetch(`${MAIN_PLATFORM_URL}/api/editor/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: (projectData.name as string) || 'Untitled Project',
          description: (projectData.description as string) || '',
          convexProjectId: projectData.convexProjectId,
          templateId: projectData.templateId,
          businessInfo: projectData.businessInfo,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return json({ error: (err as Record<string, unknown>).error || 'Create failed' }, { status: res.status });
      }

      const data = await res.json() as { projectId?: string };
      return json({ success: true, supabaseProjectId: data.projectId });
    } catch (e) {
      console.error('[ProjectSync] Create error:', e);
      return json({ error: 'Internal error' }, { status: 500 });
    }
  }

  if (syncAction === 'update') {
    try {
      const res = await fetch(`${MAIN_PLATFORM_URL}/api/editor/link`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          supabaseProjectId: projectData?.supabaseProjectId,
          name: projectData?.name,
          description: projectData?.description,
          status: projectData?.status,
          templateId: projectData?.templateId,
          businessInfo: projectData?.businessInfo,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return json({ error: (err as Record<string, unknown>).error || 'Update failed' }, { status: res.status });
      }

      return json({ success: true });
    } catch (e) {
      console.error('[ProjectSync] Update error:', e);
      return json({ error: 'Internal error' }, { status: 500 });
    }
  }

  return json({ error: 'Invalid action' }, { status: 400 });
}
