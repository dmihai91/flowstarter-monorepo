import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getOrCreateSandbox, ensureSandboxRunning } from '@/lib/editor/daytona/sandbox';

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const path = searchParams.get('path');

  if (!projectId) {
    return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
  }

  try {
    const { sandbox } = await getOrCreateSandbox(projectId);
    await ensureSandboxRunning(sandbox);

    // If path is provided, return file content
    if (path) {
      const buffer = await sandbox.fs.downloadFile(path);
      const content = buffer.toString('utf-8');
      return NextResponse.json({ content, path });
    }

    // Otherwise, list files recursively from /workspace
    const files = await listFilesRecursive(sandbox, '/workspace', 3);
    return NextResponse.json({ files });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to access files';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileNode[];
}

async function listFilesRecursive(
  sandbox: Parameters<typeof ensureSandboxRunning>[0],
  dirPath: string,
  maxDepth: number,
  currentDepth = 0
): Promise<FileNode[]> {
  if (currentDepth >= maxDepth) return [];

  try {
    const entries = await sandbox.fs.listFiles(dirPath);
    const nodes: FileNode[] = [];

    // Sort: directories first, then alphabetically
    const sorted = entries.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of sorted) {
      // Skip hidden dirs and node_modules
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

      const fullPath = `${dirPath}/${entry.name}`;
      const node: FileNode = {
        name: entry.name,
        path: fullPath,
        isDir: entry.isDir,
      };

      if (entry.isDir) {
        node.children = await listFilesRecursive(sandbox, fullPath, maxDepth, currentDepth + 1);
      }

      nodes.push(node);
    }

    return nodes;
  } catch {
    return [];
  }
}
