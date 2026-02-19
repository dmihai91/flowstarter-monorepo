import type { LoaderFunctionArgs } from '@remix-run/cloudflare';

/*
 * This route proxies template asset requests (JS, CSS) to the MCP server
 * The template HTML references /api/templates/:slug/assets/* which needs to be proxied
 */

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const { slug } = params;
  const assetPath = params['*'] || '';

  // Add unique marker to verify code is running (remove after testing)
  if (assetPath.includes('.css')) {
    console.error('[ASSET-ROUTE] CSS request received:', assetPath);
  }

  console.log('[api.templates.assets] Request:', { slug, assetPath, url: request.url });

  if (!slug) {
    return new Response('Missing slug', { status: 400 });
  }

  // Get MCP URL from environment (Cloudflare context or fallback)
  const env = (context as unknown as { cloudflare?: { env: Record<string, string> } })?.cloudflare?.env || {};
  const mcpUrl = env.VITE_FLOWSTARTER_MCP_URL || process.env.VITE_FLOWSTARTER_MCP_URL || 'http://localhost:3001';
  const targetUrl = `${mcpUrl}/assets/${assetPath}`;

  console.log('[api.templates.assets] Proxying to:', targetUrl);

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        Accept: request.headers.get('Accept') || '*/*',
        'User-Agent': request.headers.get('User-Agent') || 'Flowstarter-Editor',
      },
    });

    if (!response.ok) {
      return new Response(`Asset not found: ${assetPath}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const body = await response.arrayBuffer();

    console.log('[api.templates.assets] Success:', { assetPath, contentType, size: body.byteLength });

    // For CSS files, rewrite root-relative URLs to point to MCP server
    if (contentType.includes('css')) {
      let cssText = new TextDecoder().decode(body);

      // Rewrite url(/...) to url(http://localhost:3001/...)
      cssText = cssText.replace(/url\(\s*\/([^)]+)\)/g, `url(${mcpUrl}/$1)`);

      console.log('[api.templates.assets] CSS rewritten for:', assetPath);

      return new Response(cssText, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*',
          'Cross-Origin-Resource-Policy': 'cross-origin',
        },
      });
    }

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });
  } catch (error) {
    console.error('[api.templates.assets] Error proxying asset:', error);
    return new Response('Failed to fetch asset', { status: 502 });
  }
}

