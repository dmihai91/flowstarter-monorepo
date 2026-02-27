/**
 * Claude Code Generate API
 *
 * POST /api/claude-code/generate - Trigger Claude Code generation in a workspace
 *
 * This endpoint:
 * 1. Creates a Daytona workspace if needed
 * 2. Writes project context to CONTEXT.md
 * 3. Runs Claude Code with the provided prompt
 * 4. Returns streamed or complete response
 */

import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import {
  createWorkspace,
  runClaudeCode,
  writeContextFile,
  findWorkspaceByProject,
  ensureWorkspaceRunning,
  buildContextFromConvex,
  CONTEXT_FILE_PATH,
  type ContextData,
  type GenerationProgressEvent,
} from '~/lib/services/claude-code';

/**
 * Request body for generation
 */
interface GenerateRequest {
  projectId: string;
  prompt: string;
  templateId?: string;

  // Context data (from Convex)
  context?: {
    project?: {
      _id: string;
      name?: string;
      templateId?: string;
      templateName?: string;
    };
    business?: {
      name?: string;
      type?: string;
      description?: string;
      industry?: string;
      targetAudience?: string;
    };
    client?: {
      name?: string;
      email?: string;
      phone?: string;
      website?: string;
    };
    messages?: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
      createdAt?: number;
    }>;
    preferences?: {
      colorScheme?: string;
      style?: string;
      mood?: string;
      inspirationUrls?: string[];
    };
  };

  // Generation options
  options?: {
    stream?: boolean;
    model?: string;
    maxTurns?: number;
  };
}

/**
 * Environment variables from Cloudflare
 */
interface CloudflareEnv {
  DAYTONA_API_KEY?: string;
  DAYTONA_API_URL?: string;
  ANTHROPIC_API_KEY?: string;
}

/**
 * POST /api/claude-code/generate
 *
 * Main generation endpoint
 */
export async function action({ request, context }: ActionFunctionArgs) {
  // Get environment variables from context (Cloudflare Workers or Node.js)
  const cfContext = context as { cloudflare?: { env?: CloudflareEnv }; env?: CloudflareEnv } | undefined;
  const env = (cfContext?.cloudflare?.env || cfContext?.env || {}) as CloudflareEnv;

  try {
    const body = (await request.json()) as GenerateRequest;
    const { projectId, prompt, templateId, context: contextData, options } = body;

    // Validate required fields
    if (!projectId) {
      return json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!prompt) {
      return json({ error: 'Prompt is required' }, { status: 400 });
    }

    console.log(`[ClaudeCode] Starting generation for project ${projectId}`);
    console.log(`[ClaudeCode] Prompt: ${prompt.slice(0, 100)}...`);

    // Check for existing workspace
    let workspace = findWorkspaceByProject(projectId);

    if (workspace) {
      console.log(`[ClaudeCode] Found existing workspace: ${workspace.workspaceId}`);
      const isRunning = await ensureWorkspaceRunning(workspace.workspaceId, env);
      if (!isRunning) {
        console.log(`[ClaudeCode] Workspace not running, creating new one`);
        workspace = undefined;
      }
    }

    // Create workspace if needed
    if (!workspace) {
      console.log(`[ClaudeCode] Creating new workspace for project ${projectId}`);
      const createResult = await createWorkspace({ projectId, templateId }, env);

      if (!createResult.success || !createResult.workspace) {
        return json(
          { error: `Failed to create workspace: ${createResult.error}` },
          { status: 500 }
        );
      }

      workspace = createResult.workspace;
      console.log(`[ClaudeCode] Workspace created: ${workspace.workspaceId}`);
    }

    // Build and write context file if context data provided
    if (contextData) {
      console.log(`[ClaudeCode] Writing context file...`);
      const fullContext = buildContextFromConvex({
        ...contextData,
        project: contextData.project || { _id: projectId },
      });

      await writeContextFile(workspace.workspaceId, fullContext, env);
      console.log(`[ClaudeCode] Context file written`);
    }

    // Check if streaming is requested
    if (options?.stream) {
      return handleStreamingGeneration(workspace.workspaceId, prompt, options, env);
    }

    // Non-streaming generation
    console.log(`[ClaudeCode] Running Claude Code...`);

    const progressEvents: GenerationProgressEvent[] = [];

    const result = await runClaudeCode(
      {
        workspaceId: workspace.workspaceId,
        prompt,
        contextFile: CONTEXT_FILE_PATH,
        model: options?.model,
        maxTurns: options?.maxTurns,
      },
      env,
      (event) => {
        progressEvents.push(event);
        console.log(`[ClaudeCode] Progress: ${event.type} - ${event.message || ''}`);
      }
    );

    console.log(`[ClaudeCode] Generation complete:`, {
      success: result.success,
      filesChanged: result.filesChanged?.length || 0,
      duration: result.duration,
    });

    if (result.success) {
      return json({
        success: true,
        workspaceId: workspace.workspaceId,
        previewUrl: workspace.previewUrl,
        output: result.output,
        filesChanged: result.filesChanged,
        duration: result.duration,
        progress: progressEvents,
      });
    } else {
      return json(
        {
          success: false,
          workspaceId: workspace.workspaceId,
          error: result.error,
          duration: result.duration,
          progress: progressEvents,
        },
        { status: 500 }
      );
    }
  } catch (e) {
    console.error('[ClaudeCode] Generation error:', e);
    return json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Handle streaming generation (returns Server-Sent Events)
 */
function handleStreamingGeneration(
  workspaceId: string,
  prompt: string,
  options: GenerateRequest['options'],
  env: CloudflareEnv
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send('start', { workspaceId, prompt: prompt.slice(0, 100) });

        await runClaudeCode(
          {
            workspaceId,
            prompt,
            contextFile: CONTEXT_FILE_PATH,
            model: options?.model,
            maxTurns: options?.maxTurns,
          },
          env,
          (event) => {
            send(event.type, event);
          }
        );

        send('done', { workspaceId });
      } catch (error) {
        send('error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

/**
 * GET /api/claude-code/generate
 *
 * Check generation status for a project
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');

  if (!projectId) {
    return json({ error: 'Project ID is required' }, { status: 400 });
  }

  const workspace = findWorkspaceByProject(projectId);

  if (!workspace) {
    return json({
      hasWorkspace: false,
      status: 'none',
    });
  }

  return json({
    hasWorkspace: true,
    workspaceId: workspace.workspaceId,
    status: workspace.state,
    previewUrl: workspace.previewUrl,
    createdAt: workspace.createdAt.toISOString(),
  });
}
