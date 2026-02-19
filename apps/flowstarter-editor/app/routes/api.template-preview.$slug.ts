import { type LoaderFunctionArgs } from '@remix-run/cloudflare';

/**
 * Proxy endpoint for template full-page previews
 * Returns a high-resolution (1400x900) preview image of the template
 *
 * GET /api/template-preview/:slug?theme=light|dark
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
  const previewUrl = `${mcpUrl}/api/templates/${slug}/preview?theme=${theme}`;

  try {
    const response = await fetch(previewUrl, {
      headers: {
        Accept: 'image/*',
      },
    });

    if (!response.ok) {
      return new Response('Preview not found', { status: 404 });
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
    console.error('Failed to fetch preview:', error);
    return new Response('Failed to fetch preview', { status: 500 });
  }
}

