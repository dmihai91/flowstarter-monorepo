/**
 * SSE Stream Utilities
 *
 * Helpers for creating Server-Sent Event streams from Claude Code output.
 */

export type SSEEvent =
  | { type: 'text'; content: string }
  | { type: 'files_changed'; files: string[] }
  | { type: 'status'; status: string }
  | { type: 'error'; message: string };

/**
 * Encode an SSE event as a string.
 */
export function encodeSSE(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Encode the SSE done signal.
 */
export function encodeSSEDone(): string {
  return `data: [DONE]\n\n`;
}

/**
 * Create SSE response headers.
 */
export function sseHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  };
}

/**
 * Stream Claude Code output as SSE events.
 * Splits output into chunks for a streaming-like experience.
 */
export function streamOutput(
  output: string,
  controller: ReadableStreamDefaultController,
): void {
  const encoder = new TextEncoder();
  const chunkSize = 80;

  for (let i = 0; i < output.length; i += chunkSize) {
    const chunk = output.slice(i, i + chunkSize);
    controller.enqueue(encoder.encode(encodeSSE({ type: 'text', content: chunk })));
  }
}
