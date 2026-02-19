import { type LoaderFunctionArgs } from '@remix-run/cloudflare';

/**
 * Proxy endpoint for template thumbnails
 * This avoids CORS issues when loading images from the MCP server
 *
 * GET /api/template-thumbnail/:slug?theme=light|dark
 */
export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const { slug } = params;

  if (!slug) {
    return new Response('Missing slug', { status: 400 });
  }

  const url = new URL(request.url);
  const theme = url.searchParams.get('theme') || 'dark';

  // Get MCP URL from environment (Cloudflare context or fallback)
  const env = (context as unknown as { cloudflare?: { env: Record<string, string> } })?.cloudflare?.env || {};
  const mcpUrl = env.VITE_FLOWSTARTER_MCP_URL || process.env.VITE_FLOWSTARTER_MCP_URL || 'http://localhost:3001';
  const thumbnailUrl = `${mcpUrl}/api/templates/${slug}/thumbnail?theme=${theme}`;

  try {
    const response = await fetch(thumbnailUrl, {
      headers: {
        Accept: 'image/*',
      },
    });

    if (!response.ok) {
      return new Response('Thumbnail not found', { status: 404 });
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const imageBuffer = await response.arrayBuffer();

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Failed to fetch thumbnail:', error);
    return new Response('Failed to fetch thumbnail', { status: 500 });
  }
}

