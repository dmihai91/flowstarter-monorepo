// POST /api/projects — submit a business description, create the project and
// generate the limited demo (email/account required via Clerk; hard rate limits).
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireIdentity, clientIp } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { generateDemoSpec, SpecSchema } from '@/lib/demo';
import { DEMO } from '@/lib/config';
import type { SiteSpec } from '@flowstarter/build-engine';

const Body = z.object({
  businessDescription: z.string().trim().min(10).max(2000),
  // Sneak-peek handoff: the spec already generated anonymously on the landing
  // page, so sign-up doesn't regenerate (or change) what the visitor saw.
  demoSpec: SpecSchema.optional(),
  demoHtml: z.string().max(300_000).optional(),
});

export async function POST(req: Request) {
  try {
    const { userId, email } = await requireIdentity();
    const body = Body.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: 'Tell us a bit more about your business (10+ characters).' }, { status: 400 });
    }

    const store = getStore();
    const ip = await clientIp();
    const day = new Date().toISOString().slice(0, 10);

    const emailCount = await store.bumpRateLimit(`email:${email}:${day}`);
    if (emailCount > DEMO.maxDemosPerEmailPerDay) {
      return NextResponse.json(
        { error: 'Demo limit reached for today — your existing demos are still available.' },
        { status: 429 },
      );
    }
    if (ip) {
      const ipCount = await store.bumpRateLimit(`ip:${ip}:${day}`);
      if (ipCount > DEMO.maxDemosPerIpPerDay) {
        return NextResponse.json({ error: 'Too many demos from this network today.' }, { status: 429 });
      }
    }

    const project = await store.createProject({
      clerkUserId: userId,
      email,
      businessDescription: body.data.businessDescription,
      clientIp: ip,
    });

    if (body.data.demoSpec) {
      await store.updateProject(project.id, {
        demo_spec: body.data.demoSpec as SiteSpec,
        demo_html: body.data.demoHtml ?? null,
        demo_status: 'ready',
      });
    } else {
      await store.updateProject(project.id, { demo_status: 'generating' });
      try {
        const spec = await generateDemoSpec(body.data.businessDescription);
        await store.updateProject(project.id, { demo_spec: spec, demo_status: 'ready' });
      } catch (e) {
        console.error('[selfserve] demo generation failed', e);
        await store.updateProject(project.id, { demo_status: 'failed' });
      }
    }

    return NextResponse.json({ projectId: project.id });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
