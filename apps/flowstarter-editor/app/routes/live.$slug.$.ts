/**
 * Live Preview Route (Slug-based)
 *
 * Proxies requests via the project's URL slug: /live/fitpro-academy/
 * Maps clean slugs → Convex project → Daytona sandbox → proxy.
 *
 * This enables the display URL (e.g., fitpro-academy.flowstarter.app)
 * to actually work when opened in a new tab via /live/fitpro-academy/.
 */

import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';
import { resolveSlugToProjectId, resolvePreviewUrl, clearCachedPreview } from '~/lib/services/previewProxy.server';

// In-memory slug → projectId cache
const slugCache = new Map<string, { projectId: string; timestamp: number }>();
const SLUG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getProjectIdFromSlug(slug: string): Promise<string | null> {
  const cached = slugCache.get(slug);
  if (cached && Date.now() - cached.timestamp < SLUG_CACHE_TTL) {
    return cached.projectId;
  }

  const projectId = await resolveSlugToProjectId(slug);
  if (projectId) {
    slugCache.set(slug, { projectId, timestamp: Date.now() });
  }

  return projectId;
}

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const RETRY_BACKOFF = 1.5;

async function handleLiveProxy(request: Request, slug: string, path: string) {
  // Step 1: Resolve slug → projectId
  const projectId = await getProjectIdFromSlug(slug);

  if (!projectId) {
    return new Response(
      `<html>
        <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f0f17; color: #eee;">
          <div style="text-align: center; max-width: 400px; padding: 24px;">
            <h1 style="font-size: 24px; margin-bottom: 12px;">Site Not Found</h1>
            <p style="color: #9ca3af; font-size: 16px;">No project found for <strong>${slug}</strong>.flowstarter.app</p>
            <a href="/" style="color: #818cf8; margin-top: 16px; display: inline-block;">Create a new project →</a>
          </div>
        </body>
      </html>`,
      { status: 404, headers: { 'Content-Type': 'text/html' } },
    );
  }

  // Step 2: Resolve projectId → Daytona sandbox URL
  const daytonaUrl = await resolvePreviewUrl(projectId);

  if (!daytonaUrl) {
    return new Response(
      `<html>
        <head><meta http-equiv="refresh" content="3"></head>
        <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f0f17; color: #eee;">
          <div style="text-align: center; max-width: 400px; padding: 24px;">
            <h1 style="font-size: 20px; margin-bottom: 12px;">Starting Preview...</h1>
            <p style="color: #9ca3af;">The preview for <strong>${slug}</strong> is being prepared. This page will refresh automatically.</p>
          </div>
        </body>
      </html>`,
      { status: 202, headers: { 'Content-Type': 'text/html', 'Retry-After': '3' } },
    );
  }

  // Step 3: Proxy to Daytona
  const targetUrl = new URL(path || '/', daytonaUrl);
  const originalUrl = new URL(request.url);
  originalUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  try {
    let proxyResponse: Response | null = null;
    let lastError: Error | null = null;
    const requestBody =
      request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        proxyResponse = await fetch(targetUrl.toString(), {
          method: request.method,
          headers: {
            Accept: request.headers.get('Accept') || '*/*',
            'Accept-Language': request.headers.get('Accept-Language') || 'en-US,en;q=0.9',
            'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0',
            'Content-Type': request.headers.get('Content-Type') || '',
            'X-Daytona-Skip-Preview-Warning': 'true',
          },
          body: requestBody,
        });

        if ([502, 503, 504].includes(proxyResponse.status)) {
          if (attempt < MAX_RETRIES) {
            const delay = INITIAL_RETRY_DELAY * Math.pow(RETRY_BACKOFF, attempt);
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
          clearCachedPreview(projectId);
          return new Response('Preview server starting...', {
            status: 503,
            headers: { 'Retry-After': '5' },
          });
        }
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(RETRY_BACKOFF, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    if (!proxyResponse) {
      throw lastError || new Error('Failed to fetch preview after retries');
    }

    const contentType = proxyResponse.headers.get('Content-Type') || 'application/octet-stream';
    let body: string | ArrayBuffer;
    const basePath = `/live/${slug}`;

    if (contentType.includes('text/html')) {
      let html = await proxyResponse.text();
      const baseUrl = new URL(daytonaUrl);

      // Inject client-side routing script
      const proxyScript = `
        <script>
          (function() {
            var BASE_PATH = '${basePath}';
            var DAYTONA_ORIGIN = '${baseUrl.origin}';
            var originalFetch = window.fetch;
            window.fetch = function(input, init) {
              var url = input;
              if (typeof input === 'string') {
                if (input.startsWith('/') && !input.startsWith(BASE_PATH)) {
                  url = BASE_PATH + input;
                } else if (!input.startsWith('http') && !input.startsWith('data:') && !input.startsWith('blob:')) {
                  url = BASE_PATH + '/' + input;
                }
              }
              return originalFetch.call(this, url, init);
            };
            var OriginalWebSocket = window.WebSocket;
            window.WebSocket = function(url, protocols) {
              if (typeof url === 'string') {
                try {
                  var wsUrl = new URL(url, window.location.origin);
                  if (wsUrl.pathname.indexOf('__vite') !== -1 || wsUrl.pathname.indexOf('hmr') !== -1) {
                    var daytonaWs = DAYTONA_ORIGIN.replace('https://', 'wss://').replace('http://', 'ws://');
                    url = daytonaWs + wsUrl.pathname + wsUrl.search;
                  }
                } catch (e) {}
              }
              return new OriginalWebSocket(url, protocols);
            };
            Object.assign(window.WebSocket, OriginalWebSocket);
            window.WebSocket.prototype = OriginalWebSocket.prototype;
          })();
        </script>
      `;

      // Rewrite src and href attributes
      html = html.replace(
        /(src|href)=["'](?!data:|blob:|javascript:|#|mailto:|tel:|https?:\/\/(?!.*daytona))([^"']+)["']/gi,
        (match: string, attr: string, p: string) => {
          if (p.startsWith('/')) return `${attr}="${basePath}${p}"`;
          if (!p.startsWith('http')) return `${attr}="${basePath}/${p}"`;
          return match;
        },
      );

      // Rewrite absolute Daytona URLs
      const escapedOrigin = baseUrl.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp(escapedOrigin, 'g'), basePath);

      // Inject script after <head>
      if (html.includes('<head>')) {
        html = html.replace('<head>', '<head>' + proxyScript);
      } else {
        html = proxyScript + html;
      }

      body = html;
    } else if (contentType.includes('javascript') || contentType.includes('css')) {
      let text = await proxyResponse.text();
      const baseUrl = new URL(daytonaUrl);
      const escapedOrigin = baseUrl.origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      text = text.replace(new RegExp(escapedOrigin, 'g'), basePath);
      body = text;
    } else {
      body = await proxyResponse.arrayBuffer();
    }

    // Build response headers
    const headers = new Headers();
    for (const header of ['Content-Type', 'Cache-Control', 'ETag', 'Last-Modified', 'Content-Encoding']) {
      const value = proxyResponse.headers.get(header);
      if (value) headers.set(header, value);
    }
    headers.set('Access-Control-Allow-Origin', '*');
    headers.delete('X-Frame-Options');
    headers.delete('Content-Security-Policy');

    return new Response(body, { status: proxyResponse.status, headers });
  } catch (error) {
    console.error('[Live Proxy] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to load preview';
    const isConnectionError =
      errorMessage.includes('ECONNREFUSED') || errorMessage.includes('refused') || errorMessage.includes('ETIMEDOUT');

    if (isConnectionError) {
      clearCachedPreview(projectId);
    }

    return new Response(
      `<html>
        <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f0f17; color: #eee;">
          <div style="text-align: center; max-width: 400px; padding: 24px;">
            <h1 style="font-size: 20px; margin-bottom: 12px;">${isConnectionError ? 'Connection Lost' : 'Preview Error'}</h1>
            <p style="color: #9ca3af;">${errorMessage}</p>
          </div>
        </body>
      </html>`,
      {
        status: 502,
        headers: { 'Content-Type': 'text/html' },
      },
    );
  }
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const slug = params.slug || '';
  const path = params['*'] || '';
  return handleLiveProxy(request, slug, '/' + path);
}

export async function action({ request, params }: ActionFunctionArgs) {
  const slug = params.slug || '';
  const path = params['*'] || '';
  return handleLiveProxy(request, slug, '/' + path);
}

