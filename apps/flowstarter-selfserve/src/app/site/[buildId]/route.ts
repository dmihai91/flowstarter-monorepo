// GET /site/[buildId] — serves the built static site (preview iframe target
// and, post-launch, the v1 serving location until the Hetzner deploy hook).
import { getStore } from '@/lib/store';

export async function GET(_req: Request, ctx: { params: Promise<{ buildId: string }> }) {
  const { buildId } = await ctx.params;
  const build = await getStore().getBuild(buildId);
  if (!build?.outputs?.siteHtml) return new Response('Not found', { status: 404 });
  return new Response(build.outputs.siteHtml, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
