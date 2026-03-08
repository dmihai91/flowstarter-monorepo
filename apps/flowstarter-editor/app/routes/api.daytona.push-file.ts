/**
 * Daytona Push File API
 *
 * POST /api/daytona/push-file
 *
 * Writes a single file to the active Daytona sandbox for the given project.
 * Called on each file-change event during streaming generation for live preview.
 */

import { json, type ActionFunctionArgs } from '@remix-run/node';
import { getClient, getCachedSandbox } from '~/lib/services/daytona/client';
import type { DaytonaEnv } from '~/lib/services/daytona/types';
import { createScopedLogger } from '~/utils/logger';

const log = createScopedLogger('api.daytona.push-file');

interface PushFileBody {
  projectId: string;
  sandboxId?: string;
  path: string;
  content: string;
}

function normalizePath(filePath: string, workDir: string): string {
  let p = filePath;
  if (!p.startsWith('/')) p = `/${p}`;
  if (!p.startsWith(workDir)) p = `${workDir}${p}`;
  return p;
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  let body: PushFileBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { projectId, path: filePath, content } = body;

  if (!projectId || !filePath || content === undefined) {
    return json({ error: 'projectId, path, and content are required' }, { status: 400 });
  }

  // Look up active sandbox for this project
  const cached = getCachedSandbox(projectId);
  if (!cached?.sandboxId) {
    // No active sandbox yet — file will be included in full upload when preview starts
    return json({ success: true, skipped: true, reason: 'no-active-sandbox' });
  }

  try {
    const env = context.cloudflare?.env as DaytonaEnv;
    const client = getClient(env);

    const sandbox = await client.get(cached.sandboxId);
    if (!sandbox) {
      return json({ success: false, error: 'Sandbox not found' }, { status: 404 });
    }

    const workDir = (await sandbox.getWorkDir()) || '/home/daytona';
    const normalizedPath = normalizePath(filePath, workDir);

    // Ensure parent directory exists
    const dir = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
    if (dir && dir !== workDir) {
      await sandbox.process.executeCommand(`mkdir -p "${dir}"`, workDir).catch(() => {});
    }

    await sandbox.fs.uploadFile(Buffer.from(content, 'utf-8'), normalizedPath);

    log.debug(`Pushed ${filePath} to sandbox ${cached.sandboxId}`);
    return json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    log.error(`Failed to push file ${filePath}:`, message);
    return json({ success: false, error: message }, { status: 500 });
  }
}
