// POST /api/projects/[id]/refine — one of the (max 3) demo refinement prompts.
// Uses the cheap demo model, never the build model.
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireIdentity } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { refineDemoSpec } from '@/lib/demo';
import { DEMO } from '@/lib/config';

const Body = z.object({ prompt: z.string().trim().min(3).max(500) });

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireIdentity();
    const { id } = await ctx.params;
    const store = getStore();
    const project = await store.getProject(id);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (project.clerk_user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!project.demo_spec) return NextResponse.json({ error: 'No demo to refine yet.' }, { status: 409 });
    if (project.refinement_count >= DEMO.maxRefinements) {
      return NextResponse.json(
        { error: `You've used all ${DEMO.maxRefinements} refinements. Start the build to keep shaping it with the full crew.` },
        { status: 429 },
      );
    }
    const body = Body.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: 'Tell us what to change.' }, { status: 400 });

    const spec = await refineDemoSpec(project.business_description, project.demo_spec, body.data.prompt);
    const updated = await store.updateProject(id, {
      demo_spec: spec,
      refinement_count: project.refinement_count + 1,
    });
    return NextResponse.json({
      project: updated,
      refinementsLeft: DEMO.maxRefinements - (updated?.refinement_count ?? 0),
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
