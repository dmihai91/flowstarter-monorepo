/**
 * Daytona Workspace Exec API Route
 *
 * POST /api/daytona/workspace/:workspaceId/exec - Execute command in workspace
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

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { command, cwd, background } = body as {
      command: string;
      cwd?: string;
      background?: boolean;
    };

    if (!command) {
      return json({ error: 'Command is required' }, { status: 400 });
    }

    console.log(`[Daytona] Executing command in workspace ${workspaceId}: ${command}`);

    const response = await fetch(`${config.apiUrl}/workspace/${workspaceId}/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        command,
        cwd: cwd || '/workspace',
        background: background || false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Daytona] Failed to execute command:', error);

      return json({ error: `Failed to execute command: ${error}` }, { status: response.status });
    }

    const result = (await response.json()) as { stdout?: string; stderr?: string; exitCode?: number };

    return json({
      success: true,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.exitCode ?? 0,
    });
  } catch (error) {
    console.error('[Daytona] Error executing command:', error);
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

