// POST /api/admin/builds/[id]/retry — reset attempts and re-run (team only).
import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { retryBuild } from '@/lib/runner';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await ctx.params;
  const build = await getStore().getBuild(id);
  if (!build) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  retryBuild(id);
  return NextResponse.json({ ok: true });
}
