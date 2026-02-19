/**
 * Daytona Workspace API Route
 *
 * Handles workspace creation, file syncing, and command execution
 * for Daytona-based preview rendering.
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

// POST /api/daytona/workspace - Create a new workspace
export async function action({ request, context }: ActionFunctionArgs) {
  const env = context.cloudflare?.env as DaytonaEnv;
  const config = getConfig(env);

  if (!config.apiKey) {
    return json({ error: 'Daytona API key not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { projectId, name } = body as { projectId: string; name: string };

    if (!projectId) {
      return json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Create workspace via Daytona API
    const response = await fetch(`${config.apiUrl}/workspace`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        name: name || `flowstarter-${projectId}-${Date.now()}`,
        target: 'local',
        repositories: [],
        image: 'flowstarter/agent-workspace:latest',
        env: {
          WORKSPACE_DIR: '/workspace',
          PROJECT_ID: projectId,
        },
        resources: {
          cpu: 2,
          memory: '4Gi',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Daytona] Failed to create workspace:', error);

      return json({ error: `Failed to create workspace: ${error}` }, { status: response.status });
    }

    const data = (await response.json()) as { id: string };

    return json({
      workspaceId: data.id,
      url: `https://${data.id}.daytona.io`,
      status: 'created',
    });
  } catch (error) {
    console.error('[Daytona] Error creating workspace:', error);
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

