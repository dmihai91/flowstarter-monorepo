// GET /api/projects/[id]/brand-kit — download the Brand Kit PDF (owner only).
import { NextResponse } from 'next/server';
import { requireIdentity } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { generateBrandKitPdf } from '@/lib/brand-kit';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireIdentity();
    const { id } = await ctx.params;
    const store = getStore();
    const project = await store.getProject(id);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (project.clerk_user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const build = await store.latestBuildForProject(id);
    const spec = build?.outputs?.spec ?? project.demo_spec;
    if (!spec) return NextResponse.json({ error: 'No brand kit yet.' }, { status: 409 });

    const pdf = await generateBrandKitPdf(spec);
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${spec.brand.name.replace(/\s+/g, '-').toLowerCase()}-brand-kit.pdf"`,
      },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
