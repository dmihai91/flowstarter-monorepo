/**
 * Daytona Workspace Sync API Route
 *
 * PUT /api/daytona/workspace/:workspaceId/sync - Sync files to workspace
 */

import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';

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

  if (request.method !== 'PUT') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { files } = body as { files: Record<string, string> };

    if (!files || typeof files !== 'object') {
      return json({ error: 'Files object is required' }, { status: 400 });
    }

    console.log(`[Daytona] Syncing ${Object.keys(files).length} files to workspace ${workspaceId}`);

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
      console.error('[Daytona] Failed to sync files:', error);

      return json({ error: `Failed to sync files: ${error}` }, { status: response.status });
    }

    return json({
      success: true,
      fileCount: Object.keys(files).length,
    });
  } catch (error) {
    console.error('[Daytona] Error syncing files:', error);
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

