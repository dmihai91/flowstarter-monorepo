// GET /api/builds/[id]/stream — SSE build feed (engine contract). Streams new
// feed events as they land; Convex subscription is the richer alternative on
// the client, this is the portable fallback.
import { requireIdentity, isAdmin } from '@/lib/auth';
import { getStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireIdentity();
    const { id } = await ctx.params;
    const store = getStore();
    const build = await store.getBuild(id);
    if (!build) return new Response('not found', { status: 404 });
    const project = await store.getProject(build.project_id);
    if (project?.clerk_user_id !== userId && !(await isAdmin())) {
      return new Response('forbidden', { status: 403 });
    }

    const encoder = new TextEncoder();
    let cancelled = false;
    req.signal.addEventListener('abort', () => {
      cancelled = true;
    });

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) =>
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        let sent = 0;
        try {
          while (!cancelled) {
            const b = await store.getBuild(id);
            if (!b) break;
            for (; sent < b.feed.length; sent++) {
              send('build', b.feed[sent]);
            }
            send('status', { status: b.status, progress: b.progress, error: b.error });
            if (b.status === 'completed' || b.status === 'terminal_failed') break;
            await new Promise((r) => setTimeout(r, 1200));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return new Response('error', { status: 500 });
  }
}
