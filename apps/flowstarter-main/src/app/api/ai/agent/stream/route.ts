import { auditAiEvent } from '@/lib/ai/audit';
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const CODING_AGENT_URL =
  process.env.NEXT_PUBLIC_CODING_AGENT_URL || 'http://localhost:8000';

type StreamEvent = {
  status?: string;
  message?: string;
  data?: Record<string, unknown>;
  details?: unknown;
};
type CodingAgentErrorResponse = { detail?: string };

function getErrorMessage(error: unknown, fallback = 'Internal server error') {
  return error instanceof Error ? error.message : fallback;
}

const AgentBodySchema = z.object({
  agent: z
    .enum([
      'code-editor',
      'template-customizer',
      'file-analyzer',
      'website-generator',
    ])
    .optional(),
  action: z.string(),
  context: z.record(z.string(), z.unknown()),
});

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionClaims, getToken } = await auth();
    if (!userId) {
      await auditAiEvent({
        req: request,
        userId: null,
        route: '/api/ai/agent/stream',
        agent: 'coding-agent',
        action: 'unauthorized',
        status: 'error',
        meta: { reason: 'Unauthorized' },
      });

      // Return error as SSE event
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const errorEvent = {
            status: 'error',
            message: 'Unauthorized',
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
          );
          controller.close();
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

    const json = await request.json();
    const parsed = AgentBodySchema.safeParse(json);
    if (!parsed.success) {
      await auditAiEvent({
        req: request,
        userId,
        sessionClaims,
        route: '/api/ai/agent/stream',
        agent: 'coding-agent',
        action: 'validation-error',
        status: 'error',
        context: json,
        meta: { zodErrors: parsed.error.flatten() },
      });

      // Return validation error as SSE event
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const errorEvent = {
            status: 'error',
            message: 'Invalid request body',
            details: parsed.error.flatten(),
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
          );
          controller.close();
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

    const { agent, action, context } = parsed.data;

    // Get JWT token for backend authentication
    // Request a fresh token (not cached) to ensure it's valid for the duration of the stream
    const token = await getToken();
    if (!token) {
      throw new Error('No auth token available');
    }

    // Stream events from Python coding agent
    const codingAgentResponse = await fetch(
      `${CODING_AGENT_URL}/agent/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ agent, action, context }),
      }
    );

    if (!codingAgentResponse.ok) {
      const errorData =
        (await codingAgentResponse.json()) as CodingAgentErrorResponse;
      await auditAiEvent({
        req: request,
        userId,
        sessionClaims,
        route: '/api/ai/agent/stream',
        agent: String(agent),
        action: 'coding-agent-error',
        status: 'error',
        context: { agent, action, context },
        meta: { error: errorData.detail || 'Unknown error' },
      });

      // Return error as SSE event
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const errorEvent = {
            status: 'error',
            message: errorData.detail || 'Coding agent service error',
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
          );
          controller.close();
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

    // Create a readable stream that forwards events from the Python service
    const encoder = new TextEncoder();
    const reader = codingAgentResponse.body?.getReader();

    if (!reader) {
      throw new Error('No response body from coding agent');
    }

    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();
        let buffer = '';
        let finalResult: Record<string, unknown> | null = null;

        try {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            // Decode the chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE events
            const events = buffer.split('\n\n');
            buffer = events.pop() || ''; // Keep incomplete event in buffer

            for (const event of events) {
              if (!event.trim() || event.startsWith(':')) {
                // Skip empty lines and comments (keepalive)
                continue;
              }

              // Parse SSE event
              const lines = event.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  try {
                    const eventData = JSON.parse(data) as StreamEvent;

                    // Check if this is the final result
                    if (eventData.status === 'done' && eventData.data) {
                      finalResult = eventData.data;
                    }

                    // Forward the event
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                  } catch (e) {
                    console.error('Failed to parse SSE event:', e);
                  }
                }
              }
            }
          }

          // Audit the completion
          if (finalResult) {
            await auditAiEvent({
              req: request,
              userId,
              sessionClaims,
              route: '/api/ai/agent/stream',
              agent: String(agent),
              action,
              status: 'ok',
              context,
              result: finalResult,
            });
          }
        } catch (error: unknown) {
          console.error('Stream error:', error);
          const errorEvent = {
            status: 'error',
            message: getErrorMessage(error, 'Stream processing error'),
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
          );
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
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: unknown) {
    console.error('Stream endpoint error:', error);

    // Return error as SSE event
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const errorEvent = {
          status: 'error',
          message: getErrorMessage(error),
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`)
        );
        controller.close();
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
}
