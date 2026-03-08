/**
 * Proxy route for template thumbnails.
 * The MCP server runs on localhost:3001 (Mac mini) and is not publicly accessible.
 * This route proxies thumbnail requests from the browser to the local MCP server.
 */
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';

const MCP_BASE_URL = process.env.FLOWSTARTER_MCP_URL || 'http://localhost:3001';

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { id } = params;
  if (!id) return new Response('Not found', { status: 404 });

  const url = new URL(request.url);
  const theme = url.searchParams.get('theme') || 'light';

  try {
    const upstream = await fetch(
      `${MCP_BASE_URL}/api/templates/${id}/thumbnail?theme=${theme}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!upstream.ok) {
      return new Response(null, { status: upstream.status });
    }

    const body = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('content-type') || 'image/png';

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
