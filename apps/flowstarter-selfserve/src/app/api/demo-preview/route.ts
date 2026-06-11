// POST /api/demo-preview — the anonymous landing-page sneak peek. No account
// needed; hard IP rate limits. Returns a SiteSpec draft only (nothing is
// persisted — the project is created when the visitor signs up to build).
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getStore } from '@/lib/store';
import { generateDemoSite, peekDemoCache } from '@/lib/demo';
import { DEMO } from '@/lib/config';
import { clientIp } from '@/lib/auth';

const Body = z.object({
  businessDescription: z.string().trim().min(10).max(2000),
});

export async function POST(req: Request) {
  try {
    const body = Body.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: 'Tell us a bit more about your business (10+ characters).' }, { status: 400 });
    }
    // Cache hits don't call the model — they're free, so they don't burn the
    // visitor's daily quota (repeat prompts and double-clicks stay harmless).
    const isCacheHit = Boolean(peekDemoCache(body.data.businessDescription));
    const ip = await clientIp();
    const day = new Date().toISOString().slice(0, 10);
    if (ip && !isCacheHit) {
      const count = await getStore().bumpRateLimit(`ip-peek:${ip}:${day}`);
      if (count > DEMO.maxDemosPerIpPerDay) {
        return NextResponse.json({ error: 'Too many previews from this network today.' }, { status: 429 });
      }
    }
    const globalCount = isCacheHit ? 0 : await getStore().bumpRateLimit(`global:gen:${day}`);
    if (globalCount > DEMO.globalGenPerDay) {
      return NextResponse.json(
        { error: 'The crew is at capacity today — please try again tomorrow.' },
        { status: 429 },
      );
    }
    // ?stream=1 → SSE: real agent stages as they happen, then the result.
    if (new URL(req.url).searchParams.get('stream') === '1') {
      const enc = new TextEncoder();
      const description = body.data.businessDescription;
      const sse = new ReadableStream({
        async start(controller) {
          const send = (obj: unknown) => controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
          try {
            const out = await generateDemoSite(description, (stage, detail) => send({ type: 'stage', stage, detail }));
            send({ type: 'done', spec: out.spec, html: out.html, agentBuilt: out.agentBuilt, cached: out.cached ?? false });
          } catch (e) {
            console.error('[selfserve demo-preview stream]', e);
            send({ type: 'error', message: 'Something went wrong.' });
          } finally {
            controller.close();
          }
        },
      });
      return new Response(sse, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' },
      });
    }
    const { spec, html, agentBuilt } = await generateDemoSite(body.data.businessDescription);
    return NextResponse.json({ spec, html, agentBuilt });
  } catch (e) {
    console.error('[selfserve demo-preview]', e);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
