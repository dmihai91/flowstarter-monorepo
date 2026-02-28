import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getOrCreateSandbox, ensureSandboxRunning } from '@/lib/editor/daytona/sandbox';
import { runClaudeCode } from '@/lib/editor/claude-code/cli';
import {
  encodeSSE,
  encodeSSEDone,
  sseHeaders,
  streamOutput,
} from '@/lib/editor/claude-code/stream';
import { buildPromptWithContext } from '@/lib/editor/claude-code/system-prompt';

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const { projectId, message, templateName, isFirstMessage } = await req.json();

  if (!projectId || !message) {
    return new Response('Missing projectId or message', { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        // Get or create sandbox
        controller.enqueue(
          encoder.encode(
            encodeSSE({ type: 'status', status: 'Setting up workspace...' })
          )
        );

        const { sandbox } = await getOrCreateSandbox(projectId);
        await ensureSandboxRunning(sandbox);

        controller.enqueue(
          encoder.encode(
            encodeSSE({ type: 'status', status: 'Running Claude Code...' })
          )
        );

        // Execute Claude Code with design skill context
        const enhancedPrompt = buildPromptWithContext(message, templateName, isFirstMessage);
        const result = await runClaudeCode(sandbox, { prompt: enhancedPrompt });

        if (result.success && result.output) {
          streamOutput(result.output, controller);
        } else if (result.error) {
          controller.enqueue(
            encoder.encode(
              encodeSSE({ type: 'error', message: result.error })
            )
          );
        }

        // Send files changed
        if (result.filesChanged.length > 0) {
          controller.enqueue(
            encoder.encode(
              encodeSSE({ type: 'files_changed', files: result.filesChanged })
            )
          );
        }

        controller.enqueue(encoder.encode(encodeSSEDone()));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Internal error';
        controller.enqueue(
          encoder.encode(encodeSSE({ type: 'error', message: msg }))
        );
        controller.enqueue(encoder.encode(encodeSSEDone()));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}
