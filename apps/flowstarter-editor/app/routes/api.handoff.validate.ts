/**
 * Handoff Validation API
 * 
 * Proxies token validation to the main platform's /api/editor/handoff endpoint.
 * GET: validates token and returns project ID + userId
 * POST: validates token and returns full project data
 */

import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node';

const MAIN_PLATFORM_URL = process.env.MAIN_PLATFORM_URL || 
  (process.env.NODE_ENV === 'production' ? 'https://flowstarter.app' : 'https://flowstarter.dev');

/**
 * GET /api/handoff/validate?token=xxx
 * Returns { valid, projectId, userId }
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return json({ valid: false, error: 'Token required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${MAIN_PLATFORM_URL}/api/editor/handoff?token=${encodeURIComponent(token)}`);
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Validation failed' })) as { error?: string };
      return json({ valid: false, error: err.error }, { status: res.status });
    }

    const data = await res.json() as { project?: { id: string }; userId?: string };
    
    return json({
      valid: true,
      projectId: data.project?.id,
      userId: data.userId,
    });
  } catch (error) {
    console.error('[Handoff Validate] Error:', error);
    return json({ valid: false, error: 'Internal error' }, { status: 500 });
  }
}

/**
 * POST /api/handoff/validate
 * Body: { token }
 * Returns full project data
 */
export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json() as { token?: string };
  const token = body.token;

  if (!token) {
    return json({ valid: false, error: 'Token required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${MAIN_PLATFORM_URL}/api/editor/handoff?token=${encodeURIComponent(token)}`);
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Validation failed' })) as { error?: string };
      return json({ valid: false, error: err.error }, { status: res.status });
    }

    const data = await res.json() as { project?: unknown; userId?: string };
    
    return json({
      valid: true,
      project: data.project,
      userId: data.userId,
    });
  } catch (error) {
    console.error('[Handoff Validate] Error:', error);
    return json({ valid: false, error: 'Internal error' }, { status: 500 });
  }
}
