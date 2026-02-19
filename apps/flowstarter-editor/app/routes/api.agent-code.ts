/**
 * Claude Agent SDK Code Generation API
 *
 * This endpoint uses the Claude Agent SDK for autonomous code generation
 * and file editing tasks. Now supports image attachments!
 */

import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { createScopedLogger } from '~/utils/logger';
import { generateCode, fixBuildError, applyChanges, type StreamCallbacks, type ImageInput } from '~/lib/services/claudeAgentSDK.server';

const logger = createScopedLogger('api.agent-code');

interface GenerateRequest {
  action: 'generate';
  projectId: string;
  prompt: string;
  workingDirectory: string;
  existingFiles?: Record<string, string>;
  systemPrompt?: string;
  images?: ImageInput[];
}

interface FixErrorRequest {
  action: 'fix-error';
  errorLog: string;
  filePath: string;
  fileContent: string;
  workingDirectory: string;
}

interface ApplyChangesRequest {
  action: 'apply-changes';
  instruction: string;
  targetFiles: string[];
  workingDirectory: string;
  images?: ImageInput[];
}

type RequestBody = GenerateRequest | FixErrorRequest | ApplyChangesRequest;

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Check for Anthropic API key (required for Claude Agent SDK)
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicApiKey) {
    logger.error('ANTHROPIC_API_KEY not configured');
    return new Response(
      JSON.stringify({
        error: 'ANTHROPIC_API_KEY not configured',
        details: 'The Claude Agent SDK requires an Anthropic API key',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  try {
    const body = (await request.json()) as RequestBody;

    // Create SSE stream for real-time updates
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Helper to send SSE events
    const sendEvent = async (event: string, data: unknown) => {
      await writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    };

    // Stream callbacks
    const callbacks: StreamCallbacks = {
      onMessage: async (message) => {
        await sendEvent('message', { text: message });
      },
      onFileChange: async (file) => {
        await sendEvent('file-change', file);
      },
      onProgress: async (progress) => {
        await sendEvent('progress', progress);
      },
      onError: async (error) => {
        await sendEvent('error', { error });
      },
    };

    // Process in background
    (async () => {
      try {
        let result;

        switch (body.action) {
          case 'generate':
            logger.info(`Generating code for project: ${body.projectId}`);
            result = await generateCode(
              {
                projectId: body.projectId,
                prompt: body.prompt,
                workingDirectory: body.workingDirectory,
                existingFiles: body.existingFiles,
                systemPrompt: body.systemPrompt,
                images: body.images,
              },
              callbacks,
            );
            break;

          case 'fix-error':
            logger.info(`Fixing build error in: ${body.filePath}`);
            result = await fixBuildError(body.errorLog, body.filePath, body.fileContent, body.workingDirectory);
            break;

          case 'apply-changes':
            logger.info(`Applying changes with ${body.images?.length || 0} image(s)`);
            result = await applyChanges(body.instruction, body.targetFiles, body.workingDirectory, body.images);
            break;

          default:
            throw new Error(`Unknown action: ${(body as any).action}`);
        }

        await sendEvent('result', result);
        await writer.close();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Agent error:', error);
        await sendEvent('error', { error: errorMessage });
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Request error:', error);

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

