// POST /api/demo-preview — the anonymous landing-page sneak peek. No account
// needed; hard IP rate limits. Returns a SiteSpec draft only (nothing is
// persisted — the project is created when the visitor signs up to build).
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getStore } from '@/lib/store';
import { generateDemoSpec } from '@/lib/demo';
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
    const ip = await clientIp();
    const day = new Date().toISOString().slice(0, 10);
    if (ip) {
      const count = await getStore().bumpRateLimit(`ip-peek:${ip}:${day}`);
      if (count > DEMO.maxDemosPerIpPerDay) {
        return NextResponse.json({ error: 'Too many previews from this network today.' }, { status: 429 });
      }
    }
    const spec = await generateDemoSpec(body.data.businessDescription);
    return NextResponse.json({ spec });
  } catch (e) {
    console.error('[selfserve demo-preview]', e);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
