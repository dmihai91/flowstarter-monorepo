import { RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderToPipeableStream } from 'react-dom/server';
import { PassThrough } from 'node:stream';
import { renderHeadToString } from 'remix-island';
import { Head } from './root';

const ABORT_DELAY = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,

  remixContext: any,
) {
  const prohibitOutOfOrderStreaming = isbot(request.headers.get('user-agent') || '');

  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const head = renderHeadToString({ request, remixContext, Head });

    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} abortDelay={ABORT_DELAY} />,
      {
        onShellReady() {
          shellRendered = true;

          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set('Content-Type', 'text/html');
          responseHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
          responseHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          // Write the HTML shell
          body.write(`<!DOCTYPE html><html lang="en"><head>${head}</head><body><div id="root" class="w-full h-full">`);
          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;

          if (shellRendered) {
            console.error(error);
          }
        },
        onAllReady() {
          // For bots, we want to wait for all content before responding
          if (prohibitOutOfOrderStreaming) {
            // Streaming already started in onShellReady, this is just for reference
          }
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}

// Helper to convert Node.js Readable to Web ReadableStream
function createReadableStreamFromReadable(readable: PassThrough): ReadableStream {
  return new ReadableStream({
    start(controller) {
      readable.on('data', (chunk) => {
        controller.enqueue(typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk);
      });
      readable.on('end', () => {
        // Write closing tags before closing
        controller.enqueue(new TextEncoder().encode('</div></body></html>'));
        controller.close();
      });
      readable.on('error', (err) => {
        controller.error(err);
      });
    },
    cancel() {
      readable.destroy();
    },
  });
}
