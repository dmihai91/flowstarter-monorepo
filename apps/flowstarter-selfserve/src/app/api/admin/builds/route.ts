// GET /api/admin/builds — internal builds list (team only).
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { getStore } from '@/lib/store';

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const builds = await getStore().listBuilds(200);
  return NextResponse.json({
    builds: builds.map((b) => ({
      id: b.id,
      projectId: b.project_id,
      status: b.status,
      attempt: b.attempt,
      progress: b.progress,
      error: b.error,
      createdAt: b.created_at,
      completedAt: b.completed_at,
      email: b.project?.email ?? null,
      business: b.project?.business_description?.slice(0, 120) ?? null,
      outcome: b.project?.outcome ?? null,
    })),
  });
}
