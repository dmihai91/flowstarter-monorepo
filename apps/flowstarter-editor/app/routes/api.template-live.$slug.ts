import { type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/cloudflare';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Cross-Origin-Resource-Policy': 'cross-origin',
  'Cross-Origin-Embedder-Policy': 'unsafe-none',
};

// Handle OPTIONS preflight requests
export async function action({ request }: ActionFunctionArgs) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  return new Response('Method not allowed', { status: 405 });
}

/**
 * Proxy endpoint for template live previews
 * This avoids X-Frame-Options and CORS issues when loading templates in an iframe
 *
 * GET /api/template-live/:slug?mode=dark|light&theme=palette-id
 */
export async function loader({ params, request, context }: LoaderFunctionArgs) {
  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const { slug } = params;

  if (!slug) {
    return new Response('Missing slug', { status: 400 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') || 'dark';
  const theme = url.searchParams.get('theme');

  // Get MCP URL from environment (Cloudflare context or fallback)
  const env = (context as unknown as { cloudflare?: { env: Record<string, string> } })?.cloudflare?.env || {};
  const mcpUrl = env.VITE_FLOWSTARTER_MCP_URL || process.env.VITE_FLOWSTARTER_MCP_URL || 'http://localhost:3001';

  const queryParams = new URLSearchParams();
  queryParams.set('mode', mode);

  if (theme) {
    queryParams.set('theme', theme);
  }

  // The library server serves live templates at /api/templates/:slug/live
  const liveUrl = `${mcpUrl}/api/templates/${slug}/live?${queryParams.toString()}`;

  console.log('[api.template-live] Proxying:', { slug, mcpUrl, liveUrl, mode, theme });

  try {
    console.log('[api.template-live] Fetching from:', liveUrl);

    const response = await fetch(liveUrl, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      return new Response('Template not found', { status: 404 });
    }

    const contentType = response.headers.get('content-type') || 'text/html';
    let html = await response.text();

    /*
     * Remove any existing <base> tag - we'll handle all URLs explicitly
     * The base tag causes issues with history.replaceState() due to origin mismatch
     */
    html = html.replace(/<base\b[^>]*>/gi, '');

    // Get the current origin from the request URL
    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;

    // Rewrite /api/templates/:slug/assets/* URLs to go through our proxy
    html = html.replace(/\/api\/templates\/([^/]+)\/assets\//g, `${origin}/api/templates/$1/assets/`);

    // Rewrite /assets/* URLs to go through our proxy
    html = html.replace(/(src|href)="\/assets\//g, `$1="${origin}/api/templates/${slug}/assets/`);

    // Rewrite other root-relative URLs (favicon, etc.) to MCP server
    html = html.replace(/(src|href)="\/(?!api\/|assets\/)/g, `$1="${mcpUrl}/`);

    // Remove crossorigin attribute - it can cause issues in iframe context
    html = html.replace(/\s+crossorigin/g, '');

    // Remove any CSP meta tags from the HTML that might block resources
    html = html.replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');

    /*
     * Fix the basepath for the template's router - it expects the MCP server path format
     * but we're serving at /api/template-live/:slug, so we need to update __BASEPATH__
     * First try to replace existing __BASEPATH__
     */
    const basepathScript = `window.__BASEPATH__ = '/api/template-live/${slug}'`;

    if (html.includes('__BASEPATH__')) {
      // Replace existing value (handles both single and double quotes)
      html = html.replace(/window\.__BASEPATH__\s*=\s*['"][^'"]*['"]/, basepathScript);
    } else {
      // Inject the basepath script at the start of <head>
      html = html.replace(/<head([^>]*)>/i, `<head$1><script>${basepathScript};</script>`);
    }

    console.log('[api.template-live] HTML length:', html.length, 'First 200 chars:', html.substring(0, 200));

    return new Response(html, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',

        // CORS headers
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',

        // Cross-origin isolation headers for iframe embedding
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',

        // Allow iframe embedding from localhost
        'Content-Security-Policy': 'frame-ancestors *',
      },
    });
  } catch (error) {
    console.error('Failed to fetch live preview:', error);
    return new Response('Failed to fetch live preview', { status: 500 });
  }
}

