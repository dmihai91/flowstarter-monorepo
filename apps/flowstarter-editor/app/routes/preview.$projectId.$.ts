/**
 * Preview Proxy Route
 *
 * Proxies requests to Daytona preview URLs under a friendly path.
 * This allows the preview to appear as /preview/{projectId}/ instead of the Daytona URL.
 *
 * The actual Daytona URL is fetched from the preview cache.
 */

import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';
import { getCachedPreviewUrl, clearCachedPreview, fetchPreviewUrl } from '~/lib/services/daytonaService.server';
import { setCachedSandbox } from '~/lib/services/daytona/client';

// Retry configuration for 502/503/504 errors
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const RETRY_BACKOFF = 1.5;

async function handleProxy(request: Request, projectId: string, path: string) {
  // Get the cached Daytona preview URL for this project (memory first, then Convex)
  let daytonaUrl = getCachedPreviewUrl(projectId);
  
  // Fallback to Convex if memory cache is empty (handles worker restarts)
  if (!daytonaUrl) {
    try {
      const convexResult = await fetchPreviewUrl(projectId);
      if (convexResult?.workspaceUrl) {
        daytonaUrl = convexResult.workspaceUrl;
        // Restore to memory cache for subsequent requests
        setCachedSandbox(projectId, { 
          sandboxId: convexResult.sandboxId, 
          previewUrl: daytonaUrl 
        });
        console.log(`[Preview Proxy] Restored preview URL from Convex for ${projectId}`);
      }
    } catch (e) {
      console.error('[Preview Proxy] Failed to fetch from Convex:', e);
    }
  }

  if (!daytonaUrl) {
    return new Response(
      `<html>
        <head>
          <title>Preview Loading</title>
          <meta http-equiv="refresh" content="3">
        </head>
        <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f0f17; color: #eee;">
          <div style="text-align: center; max-width: 400px; padding: 24px;">
            <div style="margin-bottom: 24px;">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="1.5" style="animation: spin 2s linear infinite;">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
                <path d="M21 3v6h-6"/>
              </svg>
            </div>
            <h1 style="font-size: 20px; margin-bottom: 12px; font-weight: 500;">Initializing Preview</h1>
            <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
              The preview environment is being prepared. This page will automatically refresh.
            </p>
            <p style="color: #6b7280; font-size: 12px;">
              If this takes too long, click "Try Again" in the preview panel.
            </p>
          </div>
          <style>
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </body>
      </html>`,
      {
        status: 202, // Accepted - processing
        headers: {
          'Content-Type': 'text/html',
          'Retry-After': '3',
        },
      },
    );
  }

  // Build the full target URL
  const targetUrl = new URL(path || '/', daytonaUrl);

  // Copy query params from the original request
  const originalUrl = new URL(request.url);
  originalUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  try {
    // Forward the request to Daytona with retry logic for 502/503/504 errors
    let proxyResponse: Response | null = null;
    let lastError: Error | null = null;
    const requestBody = request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        proxyResponse = await fetch(targetUrl.toString(), {
          method: request.method,
          headers: {
            Accept: request.headers.get('Accept') || '*/*',
            'Accept-Language': request.headers.get('Accept-Language') || 'en-US,en;q=0.9',
            // 'Accept-Encoding': removed to avoid compression issues
            'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0',
            'Content-Type': request.headers.get('Content-Type') || '',
            'X-Daytona-Skip-Preview-Warning': 'true',
          },
          body: requestBody,
        });

        // If we get a 502/503/504, the dev server might still be starting
        if ([502, 503, 504].includes(proxyResponse.status)) {
          if (attempt < MAX_RETRIES) {
            const delay = INITIAL_RETRY_DELAY * Math.pow(RETRY_BACKOFF, attempt);
            console.log(
              `[Preview Proxy] Got ${proxyResponse.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          // After all retries, clear cache and return helpful error
          clearCachedPreview(projectId);

          return new Response(
            `<html>
              <head><title>Preview Starting</title></head>
              <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #1a1a2e; color: #eee;">
                <div style="text-align: center; max-width: 400px; padding: 24px;">
                  <h1 style="font-size: 24px; margin-bottom: 8px;">Preview Server Starting</h1>
                  <p style="color: #888; margin-bottom: 16px;">The preview server is still initializing. This usually happens when the workspace has been idle for a while.</p>
                  <p style="color: #666; font-size: 14px;">Click "Try Again" in the preview panel to restart the workspace.</p>
                </div>
              </body>
            </html>`,
            {
              status: 503,
              headers: { 'Content-Type': 'text/html', 'Retry-After': '5' },
            },
          );
        }

        // Detect Astro/Vite dev server error pages (500 with minimal HTML)
        if (proxyResponse.status === 500) {
          const contentType = proxyResponse.headers.get('Content-Type') || '';
          if (contentType.includes('text/html')) {
            const errorBody = await proxyResponse.text();
            // Astro error pages have <title>ErrorType</title> pattern
            const errorMatch = errorBody.match(/<title>([^<]+)<\/title>/);
            const errorType = errorMatch?.[1] || 'Unknown Error';
            
            // Extract any error details from the body
            const stackMatch = errorBody.match(/class="message"[^>]*>([^<]+)/);
            const errorDetail = stackMatch?.[1] || '';
            
            console.error(`[Preview Proxy] Dev server error: ${errorType}${errorDetail ? ' - ' + errorDetail : ''}`);
            
            return new Response(
              `<html>
                <head><title>Build Error</title></head>
                <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #1a1a2e; color: #eee;">
                  <div style="text-align: center; max-width: 500px; padding: 24px;">
                    <div style="margin-bottom: 20px;">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="1.5">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </div>
                    <h1 style="font-size: 22px; margin-bottom: 8px; color: #f97316;">Build Error</h1>
                    <p style="color: #aaa; margin-bottom: 12px; font-size: 15px;">The generated site has a <strong>${errorType}</strong> that prevents it from rendering.</p>
                    ${errorDetail ? `<p style="color: #888; font-size: 13px; margin-bottom: 16px; font-family: monospace; background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 6px;">${errorDetail}</p>` : ''}
                    <p style="color: #666; font-size: 13px;">Try asking the AI to fix the error, or rebuild the site.</p>
                  </div>
                </body>
              </html>`,
              {
                status: 500,
                headers: { 'Content-Type': 'text/html' },
              },
            );
          }
        }

        // Success - break out of retry loop
        console.log('[Preview Proxy] Got response:', proxyResponse.status, proxyResponse.headers.get('Content-Type'));
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(RETRY_BACKOFF, attempt);
          console.log(
            `[Preview Proxy] Fetch error, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES}):`,
            lastError.message,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    // If we exhausted retries without a response, throw the last error
    if (!proxyResponse) {
      throw lastError || new Error('Failed to fetch preview after retries');
    }

    const contentType = proxyResponse.headers.get('Content-Type') || 'application/octet-stream';
    let body: string | ArrayBuffer;

    if (contentType.includes('text/html')) {
      let html = await proxyResponse.text();

      // Get base path for this project's preview
      const basePath = `/preview/${projectId}`;
      const baseUrl = new URL(daytonaUrl);

      // Inject script to handle client-side routing and HMR
      const proxyScript = `
        <script>
          (function() {
            const BASE_PATH = '${basePath}';
            const DAYTONA_ORIGIN = '${baseUrl.origin}';

            // Override fetch to route through our proxy
            const originalFetch = window.fetch;
            window.fetch = function(input, init) {
              let url = input;
              if (typeof input === 'string') {
                if (input.startsWith('/') && !input.startsWith(BASE_PATH)) {
                  url = BASE_PATH + input;
                } else if (!input.startsWith('http') && !input.startsWith('data:') && !input.startsWith('blob:')) {
                  url = BASE_PATH + '/' + input;
                }
              } else if (input instanceof Request) {
                const reqUrl = new URL(input.url);
                if (reqUrl.origin === DAYTONA_ORIGIN) {
                  url = new Request(BASE_PATH + reqUrl.pathname + reqUrl.search, input);
                }
              }
              return originalFetch.call(this, url, init);
            };

            // Handle Vite HMR WebSocket - connect directly to Daytona
            const OriginalWebSocket = window.WebSocket;
            window.WebSocket = function(url, protocols) {
              // Rewrite HMR WebSocket URL to connect to Daytona directly
              if (typeof url === 'string') {
                try {
                  const wsUrl = new URL(url, window.location.origin);
                  if (wsUrl.pathname.includes('__vite') || wsUrl.pathname.includes('hmr')) {
                    // Connect to Daytona's WebSocket for HMR
                    const daytonaWs = DAYTONA_ORIGIN.replace('https://', 'wss://').replace('http://', 'ws://');
                    url = daytonaWs + wsUrl.pathname + wsUrl.search;
                  }
                } catch (e) {}
              }
              return new OriginalWebSocket(url, protocols);
            };
            Object.assign(window.WebSocket, OriginalWebSocket);
            window.WebSocket.prototype = OriginalWebSocket.prototype;

            // Handle dynamic imports
            const originalImport = window.__vite_import__ || function(url) { return import(url); };
            window.__vite_import__ = function(url) {
              if (typeof url === 'string' && url.startsWith('/') && !url.startsWith(BASE_PATH)) {
                url = BASE_PATH + url;
              }
              return originalImport(url);
            };
          })();
        </script>
      `;

      // Rewrite src and href attributes
      html = html.replace(
        /(src|href)=["'](?!data:|blob:|javascript:|#|mailto:|tel:|https?:\/\/(?!.*daytona))([^"']+)["']/gi,
        (match, attr, path) => {
          if (path.startsWith('/')) {
            return `${attr}="${basePath}${path}"`;
          } else if (!path.startsWith('http')) {
            return `${attr}="${basePath}/${path}"`;
          }

          return match;
        },
      );

      // Rewrite absolute Daytona URLs
      html = html.replace(new RegExp(baseUrl.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), basePath);

      // Insert script after opening head tag
      if (html.includes('<head>')) {
        html = html.replace('<head>', '<head>' + proxyScript);
      } else if (html.includes('<HEAD>')) {
        html = html.replace('<HEAD>', '<HEAD>' + proxyScript);
      } else {
        html = proxyScript + html;
      }

      body = html;
    } else if (contentType.includes('javascript') || contentType.includes('css')) {
      // Rewrite URLs in JS and CSS files too
      let text = await proxyResponse.text();
      const basePath = `/preview/${projectId}`;
      const baseUrl = new URL(daytonaUrl);

      // Replace absolute Daytona URLs
      text = text.replace(new RegExp(baseUrl.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), basePath);

      body = text;
    } else {
      body = await proxyResponse.arrayBuffer();
    }

    // Build response headers
    const headers = new Headers();
    const copyHeaders = ['Content-Type', 'Cache-Control', 'ETag', 'Last-Modified', 'Content-Encoding'];

    for (const header of copyHeaders) {
      const value = proxyResponse.headers.get(header);

      if (value) {
        headers.set(header, value);
      }
    }

    // Allow iframe embedding
    headers.set('Access-Control-Allow-Origin', '*');
    headers.delete('X-Frame-Options');
    headers.delete('Content-Security-Policy');

    return new Response(body, {
      status: proxyResponse.status,
      headers,
    });
  } catch (error) {
    console.error('[Preview Proxy] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to load preview';
    const isConnectionError =
      errorMessage.includes('ECONNREFUSED') || errorMessage.includes('refused') || errorMessage.includes('ETIMEDOUT');

    // Clear cache on connection errors so retry can start fresh
    if (isConnectionError) {
      clearCachedPreview(projectId);
    }

    return new Response(
      `<html>
        <head>
          <title>Preview Error</title>
          ${isConnectionError ? '<meta http-equiv="refresh" content="5">' : ''}
        </head>
        <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f0f17; color: #eee;">
          <div style="text-align: center; max-width: 400px; padding: 24px;">
            <div style="margin-bottom: 24px;">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="7" x2="12" y2="13"/>
                <circle cx="12" cy="16" r="0.75" fill="#ef4444"/>
              </svg>
            </div>
            <h1 style="font-size: 20px; margin-bottom: 12px; font-weight: 500;">${isConnectionError ? 'Connection Lost' : 'Preview Error'}</h1>
            <p style="color: #9ca3af; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
              ${
                isConnectionError
                  ? 'The preview server is not responding. The workspace may have stopped due to inactivity.'
                  : errorMessage
              }
            </p>
            <p style="color: #6b7280; font-size: 12px;">
              ${
                isConnectionError
                  ? 'The page will refresh automatically, or click "Try Again" in the preview panel.'
                  : 'Click "Try Again" in the preview panel to restart.'
              }
            </p>
          </div>
        </body>
      </html>`,
      {
        status: 502,
        headers: {
          'Content-Type': 'text/html',
          ...(isConnectionError && { 'Retry-After': '5' }),
        },
      },
    );
  }
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const projectId = params.projectId || '';
  const path = params['*'] || '';

  return handleProxy(request, projectId, '/' + path);
}

export async function action({ request, params }: ActionFunctionArgs) {
  const projectId = params.projectId || '';
  const path = params['*'] || '';

  return handleProxy(request, projectId, '/' + path);
}

