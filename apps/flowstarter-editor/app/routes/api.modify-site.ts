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
import { generateCompletion } from '~/lib/services/llm';

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

interface ImageData {
  base64: string;
  mediaType: string;
  filename?: string;
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

/**
 * Use Claude to generate file modifications
 */
async function generateModifications(
  files: Record<string, string>,
  instruction: string,
  images?: ImageData[]
): Promise<{ changes: FileChange[]; response: string }> {
  // Build file context
  const fileList = Object.keys(files)
    .filter(f => !f.includes('node_modules') && !f.startsWith('.'))
    .slice(0, 50); // Limit to 50 files for context

  const fileContext = fileList
    .map(path => {
      const content = files[path];
      // Truncate very large files
      const truncated = content.length > 10000
        ? content.slice(0, 10000) + '\n... (truncated)'
        : content;
      return `=== ${path} ===\n${truncated}`;
    })
    .join('\n\n');

  const systemPrompt = `You are a website modification assistant. Given a set of files and a user instruction, generate the necessary file changes.

IMPORTANT: You must respond in valid JSON format only. No other text.

Response format:
{
  "changes": [
    {
      "path": "path/to/file.tsx",
      "content": "full file content here",
      "operation": "update"
    }
  ],
  "response": "Brief description of what was changed"
}

Rules:
1. Only modify files that need to change
2. Include the FULL file content for modified files, not just the changes
3. Use "create" for new files, "update" for existing files, "delete" to remove
4. Keep the same code style and formatting as existing files
5. For React/TypeScript files, maintain proper imports and types
6. If the instruction is unclear, make reasonable assumptions based on context`;

  let userPrompt = `Here are the current project files:\n\n${fileContext}\n\n---\n\nUser instruction: ${instruction}`;

  // Add image context if provided
  if (images && images.length > 0) {
    userPrompt += `\n\n[User has attached ${images.length} image(s) for reference]`;
  }

  try {
    const messages: Array<{ role: 'user' | 'assistant'; content: string | Array<Record<string, unknown>> }> = [];

    // Build message with images if provided
    if (images && images.length > 0) {
      const content: Array<Record<string, unknown>> = [];

      // Add images first
      for (const img of images) {
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: img.mediaType,
            data: img.base64,
          },
        });
      }

      // Add text
      content.push({
        type: 'text',
        text: userPrompt,
      });

      messages.push({ role: 'user', content });
    } else {
      messages.push({ role: 'user', content: userPrompt });
    }

    const allMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map(m => ({ role: m.role as 'system' | 'user' | 'assistant', content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) })),
    ];
    const response = await generateCompletion(allMessages, {
      maxTokens: 16000,
    });

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);
    return {
      changes: result.changes || [],
      response: result.response || 'Changes applied successfully',
    };
  } catch (error) {
    console.error('Modification generation error:', error);
    throw error;
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
        const files = await getProjectFiles(body.projectId);

        if (Object.keys(files).length === 0) {
          return json({
            success: false,
            error: 'No files found for this project in Convex',
          }, { status: 400 });
        }

        // 2. Generate modifications using Claude
        const { changes, response } = await generateModifications(
          files,
          body.instruction,
          body.images
        );

        if (changes.length === 0) {
          return json({
            success: true,
            message: response,
            changes: [],
          });
        }

        // 3. Save changes to Convex
        await saveFileChanges(body.projectId, changes);

        return json({
          success: true,
          message: response,
          changes: changes.map(c => ({
            path: c.path,
            operation: c.operation,
          })),
        });
      }

      case 'sync-preview': {
        // TODO: Implement Daytona sync
        // This would push Convex files to Daytona for preview
        return json({
          success: true,
          message: 'Preview sync not yet implemented',
        });
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

