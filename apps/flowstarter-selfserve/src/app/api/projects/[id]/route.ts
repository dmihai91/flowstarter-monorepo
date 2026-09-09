// GET /api/projects/[id] — project + demo + latest build + payment state (owner only).
import { NextResponse } from 'next/server';
import { requireIdentity, isAdmin } from '@/lib/auth';
import { getStore } from '@/lib/store';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireIdentity();
    const { id } = await ctx.params;
    const store = getStore();
    const project = await store.getProject(id);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (project.clerk_user_id !== userId && !(await isAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const [build, payments] = await Promise.all([
      store.latestBuildForProject(id),
      store.listPaymentsForProject(id),
    ]);
    return NextResponse.json({ project, build, payments });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
