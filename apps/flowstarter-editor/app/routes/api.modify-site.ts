/**
 * Site Modification API (Convex-based)
 *
 * Handles site modifications using Convex as the source of truth.
 * Daytona is treated as ephemeral/derived state.
 *
 * Flow:
 * 1. Read current files from Convex
 * 2. Send to Claude with modification instruction
 * 3. Claude returns file changes
 * 4. Write changes to Convex
 * 5. Optionally sync to Daytona for preview
 */

import { json, type ActionFunctionArgs } from '@remix-run/node';

const CONVEX_URL = process.env.CONVEX_URL || 'https://outstanding-otter-369.convex.cloud';

/**
 * Call a Convex query via HTTP
 */
async function convexQuery<T>(path: string, args: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, args }),
  });
  const data = await response.json() as { status: string; value?: T; errorMessage?: string };
  if (data.status === 'error') {
    throw new Error(data.errorMessage || 'Convex query failed');
  }
  return data.value as T;
}

/**
 * Call a Convex mutation via HTTP
 */
async function convexMutation<T>(path: string, args: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, args }),
  });
  const data = await response.json() as { status: string; value?: T; errorMessage?: string };
  if (data.status === 'error') {
    throw new Error(data.errorMessage || 'Convex mutation failed');
  }
  return data.value as T;
}

interface ModifyRequest {
  action: 'modify';
  projectId: string; // Convex project ID (not the urlId)
  instruction: string;
  images?: ImageData[];
}

interface GetFilesRequest {
  action: 'get-files';
  projectId: string;
}

interface SyncToPreviewRequest {
  action: 'sync-preview';
  projectId: string;
  sandboxUrl?: string;
}

type RequestBody = ModifyRequest | GetFilesRequest | SyncToPreviewRequest;

interface FileChange {
  path: string;
  content: string;
  operation: 'create' | 'update' | 'delete';
}

interface ConvexFile {
  _id: string;
  path: string;
  content: string;
  type: 'file' | 'folder';
  isBinary: boolean;
}

/**
 * Get all files for a project from Convex
 */
async function getProjectFiles(projectId: string): Promise<Record<string, string>> {
  const files = await convexQuery<ConvexFile[]>('files:list', { projectId });

  const fileMap: Record<string, string> = {};
  for (const file of files) {
    if (file.type === 'file' && !file.isBinary) {
      fileMap[file.path] = file.content;
    }
  }
  return fileMap;
}

/**
 * Save file changes to Convex
 */
async function saveFileChanges(
  projectId: string,
  changes: FileChange[]
): Promise<void> {
  for (const change of changes) {
    if (change.operation === 'delete') {
      await convexMutation('files:remove', {
        projectId,
        path: change.path,
      });
    } else {
      await convexMutation('files:save', {
        projectId,
        path: change.path,
        content: change.content,
        type: 'file',
        isBinary: false,
      });
    }
  }
}


export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = (await request.json()) as RequestBody;

    switch (body.action) {
      case 'get-files': {
        const files = await getProjectFiles(body.projectId);
        return json({
          success: true,
          files,
          count: Object.keys(files).length,
        });
      }

      case 'modify': {
        // 1. Get current files from Convex
        const fileMap = await getProjectFiles(body.projectId);
        const fileCount = Object.keys(fileMap).length;

        if (fileCount === 0) {
          return json({ success: false, error: 'No files found for this project in Convex' }, { status: 400 });
        }

        // 2. Run the Claude Agent SDK for editing
        const { runEditAgent } = await import('~/lib/services/editAgent.server');
        const currentFiles = Object.entries(fileMap).map(([path, content]) => ({ path, content }));

        // Get supabaseProjectId from the request or derive from Convex project
        const supabaseProjectId = (body as any).supabaseProjectId || body.projectId;

        const editResult = await runEditAgent(
          body.instruction,
          currentFiles,
          supabaseProjectId,
        );

        if (!editResult.success) {
          return json({ success: false, error: editResult.error }, { status: 500 });
        }

        // 3. Save modified files back to Convex
        const convexSiteUrl = (process.env.CONVEX_URL || 'https://outstanding-otter-369.convex.cloud').replace('.convex.cloud', '.convex.site');
        const handoffSecret = process.env.HANDOFF_SECRET || '';
        
        await fetch(\`\${convexSiteUrl}/files/save-batch\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-handoff-secret': handoffSecret },
          body: JSON.stringify({ supabaseProjectId, files: editResult.files }),
        });

        return json({
          success: true,
          message: \`Modified \${editResult.files.length} files in \${editResult.turns} turns\`,
          changes: editResult.files.map(f => ({ path: f.path, operation: 'update' })),
          cost: editResult.costUsd,
        });
      }

      case 'sync-preview': {
        const { projectId: syncProjectId } = body as SyncToPreviewRequest;
        
        // 1. Load files from Convex via HTTP Action
        const convexSiteUrl = (process.env.CONVEX_URL || 'https://outstanding-otter-369.convex.cloud').replace('.convex.cloud', '.convex.site');
        const handoffSecret = process.env.HANDOFF_SECRET;
        if (!handoffSecret) return json({ error: 'HANDOFF_SECRET not configured' }, { status: 500 });

        // Get files from Convex public query
        const convexUrl = process.env.CONVEX_URL || 'https://outstanding-otter-369.convex.cloud';
        const filesResp = await fetch(`${convexUrl}/api/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: 'files:list', args: { projectId: syncProjectId } }),
        });
        const filesData = await filesResp.json() as { status: string; value?: Array<{ path: string; content: string; type: string }> };
        if (filesData.status === 'error' || !filesData.value?.length) {
          return json({ error: 'No files found in Convex for this project' }, { status: 404 });
        }

        const files = filesData.value.filter(f => f.type === 'file').reduce((acc, f) => {
          acc[f.path] = f.content;
          return acc;
        }, {} as Record<string, string>);

        // 2. Push to Daytona
        const { startPreviewWithPrewarmedSandbox, prewarmSandbox } = await import('~/lib/services/daytonaService.server');
        const prewarmed = await prewarmSandbox(syncProjectId);
        const previewResult = await startPreviewWithPrewarmedSandbox(
          syncProjectId, files, prewarmed, undefined,
          (msg) => console.log(`[sync-preview] ${msg}`),
        );

        if (previewResult.success) {
          const previewUrl = previewResult.previewUrl || `https://4321-${previewResult.sandboxId}.daytonaproxy01.net`;
          return json({ success: true, previewUrl, sandboxId: previewResult.sandboxId, fileCount: Object.keys(files).length });
        }
        return json({ success: false, error: previewResult.error }, { status: 500 });
      }

      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Modify site error:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

