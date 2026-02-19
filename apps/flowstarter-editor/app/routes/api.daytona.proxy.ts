/**
 * Daytona Preview Proxy
 *
 * Proxies requests to Daytona preview URLs, stripping X-Frame-Options
 * headers to allow embedding in iframes.
 *
 * Usage: /api/daytona/proxy?url=https://5173-xxx.proxy.daytona.works/path
 */

import type { LoaderFunctionArgs } from '@remix-run/cloudflare';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  // Validate the URL is a Daytona preview URL
  try {
    const parsed = new URL(targetUrl);

    if (!parsed.hostname.includes('daytona')) {
      return new Response('Invalid proxy target - must be a Daytona URL', { status: 403 });
    }
  } catch {
    return new Response('Invalid URL', { status: 400 });
  }

  try {
    // Forward the request to Daytona
    const proxyResponse = await fetch(targetUrl, {
      method: request.method,
      headers: {
        // Forward some headers but not all
        Accept: request.headers.get('Accept') || '*/*',
        'Accept-Language': request.headers.get('Accept-Language') || 'en-US,en;q=0.9',
        'User-Agent': request.headers.get('User-Agent') || 'Mozilla/5.0',
      },
    });

    // Get the response body
    const contentType = proxyResponse.headers.get('Content-Type') || 'text/html';
    let body: string | ArrayBuffer;

    if (contentType.includes('text/html')) {
      // For HTML, we need to rewrite asset URLs to go through our proxy
      let html = await proxyResponse.text();

      // Get the base URL for rewriting relative URLs
      const baseUrl = new URL(targetUrl);
      const proxyBase = `/api/daytona/proxy?url=${encodeURIComponent(baseUrl.origin)}`;

      /*
       * Rewrite src and href attributes to use our proxy
       * This handles scripts, stylesheets, images, etc.
       */
      html = html.replace(
        /(src|href)=["'](?!data:|blob:|javascript:|#|mailto:|tel:)([^"']+)["']/gi,
        (match, attr, path) => {
          // Skip absolute URLs to other domains
          if (path.startsWith('http') && !path.includes('daytona')) {
            return match;
          }

          // Convert relative URLs to absolute and proxy them
          let absoluteUrl: string;

          if (path.startsWith('http')) {
            absoluteUrl = path;
          } else if (path.startsWith('//')) {
            absoluteUrl = `https:${path}`;
          } else if (path.startsWith('/')) {
            absoluteUrl = `${baseUrl.origin}${path}`;
          } else {
            absoluteUrl = `${baseUrl.origin}/${path}`;
          }

          return `${attr}="/api/daytona/proxy?url=${encodeURIComponent(absoluteUrl)}"`;
        },
      );

      // Also rewrite url() in inline styles
      html = html.replace(/url\(["']?(?!data:|blob:)([^)"']+)["']?\)/gi, (match, path) => {
        if (path.startsWith('http') && !path.includes('daytona')) {
          return match;
        }

        let absoluteUrl: string;

        if (path.startsWith('http')) {
          absoluteUrl = path;
        } else if (path.startsWith('//')) {
          absoluteUrl = `https:${path}`;
        } else if (path.startsWith('/')) {
          absoluteUrl = `${baseUrl.origin}${path}`;
        } else {
          absoluteUrl = `${baseUrl.origin}/${path}`;
        }

        return `url("/api/daytona/proxy?url=${encodeURIComponent(absoluteUrl)}")`;
      });

      // Inject a base tag and script to handle dynamic requests
      const baseTag = `<base href="${proxyBase}/">`;
      const proxyScript = `
        <script>
          // Override fetch to proxy requests
          const originalFetch = window.fetch;
          window.fetch = function(url, options) {
            if (typeof url === 'string' && !url.startsWith('http') && !url.startsWith('data:') && !url.startsWith('blob:')) {
              url = '/api/daytona/proxy?url=' + encodeURIComponent('${baseUrl.origin}' + (url.startsWith('/') ? url : '/' + url));
            } else if (typeof url === 'string' && url.includes('daytona')) {
              url = '/api/daytona/proxy?url=' + encodeURIComponent(url);
            }
            return originalFetch.call(this, url, options);
          };

          // Override WebSocket for HMR
          const OriginalWebSocket = window.WebSocket;
          window.WebSocket = function(url, protocols) {
            // Allow WebSocket connections directly to Daytona for HMR
            return new OriginalWebSocket(url, protocols);
          };
          window.WebSocket.prototype = OriginalWebSocket.prototype;
        </script>
      `;

      // Insert the script after <head> or at the beginning
      if (html.includes('<head>')) {
        html = html.replace('<head>', '<head>' + proxyScript);
      } else if (html.includes('<html>')) {
        html = html.replace('<html>', '<html><head>' + proxyScript + '</head>');
      } else {
        html = proxyScript + html;
      }

      body = html;
    } else {
      // For non-HTML content, just pass through
      body = await proxyResponse.arrayBuffer();
    }

    // Create response headers, stripping frame-blocking headers
    const headers = new Headers();

    // Copy safe headers from the original response
    const safeHeaders = ['Content-Type', 'Content-Length', 'Cache-Control', 'ETag', 'Last-Modified'];

    for (const header of safeHeaders) {
      const value = proxyResponse.headers.get(header);

      if (value) {
        headers.set(header, value);
      }
    }

    // Set permissive CORS and frame headers
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', '*');

    // Explicitly NOT setting X-Frame-Options or CSP frame-ancestors

    return new Response(body, {
      status: proxyResponse.status,
      headers,
    });
  } catch (error) {
    console.error('[Daytona Proxy] Error:', error);
    return new Response(`Proxy error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 502 });
  }
}

// Handle OPTIONS for CORS preflight
export async function action({ request }: LoaderFunctionArgs) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }

  // For POST requests, proxy them too
  return loader({ request } as LoaderFunctionArgs);
}

