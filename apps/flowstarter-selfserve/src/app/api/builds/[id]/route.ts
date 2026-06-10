// GET /api/builds/[id] — status + feed snapshot (polling fallback when Convex
// is not configured). Owner or admin only.
import { NextResponse } from 'next/server';
import { requireIdentity, isAdmin } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { watchdogSweep } from '@/lib/runner';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireIdentity();
    const { id } = await ctx.params;
    const store = getStore();
    const build = await store.getBuild(id);
    if (!build) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const project = await store.getProject(build.project_id);
    if (project?.clerk_user_id !== userId && !(await isAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Opportunistic stuck-build detection on status reads.
    void watchdogSweep().catch(() => {});
    const startedAt = build.started_at ? new Date(build.started_at).getTime() : null;
    return NextResponse.json({
      id: build.id,
      projectId: build.project_id,
      status: build.status,
      attempt: build.attempt,
      progress: build.progress,
      feed: build.feed,
      error: build.error,
      previewUrl: build.outputs?.previewUrl ?? null,
      startedAt,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
