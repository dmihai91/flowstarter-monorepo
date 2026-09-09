// GET /api/export/[buildId] — code export download. Gated on a paid delivery
// payment (code-only or launch). Walk-away users do NOT get the site code.
import { NextResponse } from 'next/server';
import { requireIdentity } from '@/lib/auth';
import { getStore } from '@/lib/store';

export async function GET(_req: Request, ctx: { params: Promise<{ buildId: string }> }) {
  try {
    const { userId } = await requireIdentity();
    const { buildId } = await ctx.params;
    const store = getStore();
    const build = await store.getBuild(buildId);
    if (!build?.outputs) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const project = await store.getProject(build.project_id);
    if (project?.clerk_user_id !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const payments = await store.listPaymentsForProject(build.project_id);
    const deliveryPaid = payments.some(
      (p) => (p.kind === 'final_code' || p.kind === 'final_subscription') && p.status === 'paid',
    );
    if (!deliveryPaid) {
      return NextResponse.json({ error: 'Delivery payment required for code export.' }, { status: 402 });
    }

    const name = build.outputs.spec.brand.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'site';
    return new Response(build.outputs.siteHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${name}.html"`,
      },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
