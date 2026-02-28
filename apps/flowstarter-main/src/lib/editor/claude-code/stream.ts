export function sseHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  };
}

export function encodeSSE(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export function encodeSSEDone(): string {
  return `data: [DONE]\n\n`;
}

export function streamOutput(output: string, controller: ReadableStreamDefaultController): void {
  const encoder = new TextEncoder();
  const chunkSize = 100;
  for (let i = 0; i < output.length; i += chunkSize) {
    const chunk = output.slice(i, i + chunkSize);
    controller.enqueue(encoder.encode(encodeSSE({ type: 'content', content: chunk })));
  }
}
