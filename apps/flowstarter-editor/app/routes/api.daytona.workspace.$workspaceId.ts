/**
 * Daytona Workspace Operations API Route
 *
 * Handles operations on a specific workspace:
 * - GET: Get workspace status
 * - PUT: Sync files to workspace
 * - DELETE: Destroy workspace
 */

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/cloudflare';

interface DaytonaEnv {
  DAYTONA_API_URL?: string;
  DAYTONA_API_KEY?: string;
}

function getConfig(env: DaytonaEnv) {
  return {
    apiUrl: env.DAYTONA_API_URL || 'https://api.daytona.io',
    apiKey: env.DAYTONA_API_KEY || '',
  };
}

// GET /api/daytona/workspace/:workspaceId - Get workspace status
export async function loader({ params, context }: LoaderFunctionArgs) {
  const env = context.cloudflare?.env as DaytonaEnv;
  const config = getConfig(env);
  const { workspaceId } = params;

  if (!config.apiKey) {
    return json({ error: 'Daytona API key not configured' }, { status: 500 });
  }

  if (!workspaceId) {
    return json({ error: 'Workspace ID is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${config.apiUrl}/workspace/${workspaceId}`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    if (!response.ok) {
      return json({ error: 'Workspace not found' }, { status: 404 });
    }

    const data = (await response.json()) as { id: string; state: string };

    return json({
      workspaceId: data.id,
      status: data.state,
      url: `https://${data.id}.daytona.io`,
    });
  } catch (error) {
    console.error('[Daytona] Error getting workspace:', error);
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

// PUT/DELETE /api/daytona/workspace/:workspaceId - Sync files or destroy
export async function action({ request, params, context }: ActionFunctionArgs) {
  const env = context.cloudflare?.env as DaytonaEnv;
  const config = getConfig(env);
  const { workspaceId } = params;

  if (!config.apiKey) {
    return json({ error: 'Daytona API key not configured' }, { status: 500 });
  }

  if (!workspaceId) {
    return json({ error: 'Workspace ID is required' }, { status: 400 });
  }

  const method = request.method.toUpperCase();

  try {
    // DELETE - Destroy workspace
    if (method === 'DELETE') {
      const response = await fetch(`${config.apiUrl}/workspace/${workspaceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        return json({ error: `Failed to destroy workspace: ${error}` }, { status: response.status });
      }

      return json({ success: true });
    }

    // PUT - Sync files to workspace
    if (method === 'PUT') {
      const body = await request.json();
      const { files } = body as { files: Record<string, string> };

      if (!files) {
        return json({ error: 'Files are required' }, { status: 400 });
      }

      const response = await fetch(`${config.apiUrl}/workspace/${workspaceId}/files`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({ files }),
      });

      if (!response.ok) {
        const error = await response.text();
        return json({ error: `Failed to sync files: ${error}` }, { status: response.status });
      }

      return json({ success: true, fileCount: Object.keys(files).length });
    }

    return json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('[Daytona] Error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

