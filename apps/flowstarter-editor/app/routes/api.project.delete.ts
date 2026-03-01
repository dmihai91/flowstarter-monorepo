/**
 * Delete project from Supabase (called after Convex deletion)
 */
import type { ActionFunctionArgs } from '@remix-run/node';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { supabaseProjectId } = await request.json();
    if (!supabaseProjectId) {
      return Response.json({ error: 'Missing supabaseProjectId' }, { status: 400 });
    }

    const mainPlatformUrl = process.env.MAIN_PLATFORM_URL || process.env.VITE_MAIN_PLATFORM_URL || 'http://localhost:3000';

    // Call the main platform API to delete the project
    const res = await fetch(`${mainPlatformUrl}/api/editor/link`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: supabaseProjectId }),
    });

    if (!res.ok) {
      console.error('[project.delete] Failed to delete from Supabase:', await res.text());
      return Response.json({ error: 'Failed to delete from Supabase' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[project.delete] Error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
