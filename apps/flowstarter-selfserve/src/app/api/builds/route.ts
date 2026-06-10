// Build engine contract endpoint:
//   POST /api/builds { businessDescription, refinements[], projectId? } → { buildId }
// Note: builds normally start via the paid checkout webhook. This endpoint is
// the documented engine contract — it requires the project's build fee to be
// paid (or creates a project when given just a description, still requiring
// payment before it will run).
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireIdentity, clientIp } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { startBuildRun } from '@/lib/runner';

const Body = z.object({
  projectId: z.string().uuid().optional(),
  businessDescription: z.string().trim().min(10).max(2000).optional(),
  refinements: z.array(z.string()).max(10).default([]),
});

export async function POST(req: Request) {
  try {
    const { userId, email } = await requireIdentity();
    const body = Body.safeParse(await req.json());
    if (!body.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    const store = getStore();
    let project = body.data.projectId ? await store.getProject(body.data.projectId) : null;
    if (project && project.clerk_user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!project) {
      if (!body.data.businessDescription) {
        return NextResponse.json({ error: 'projectId or businessDescription required' }, { status: 400 });
      }
      project = await store.createProject({
        clerkUserId: userId,
        email,
        businessDescription: body.data.businessDescription,
        clientIp: await clientIp(),
      });
    }

    const payments = await store.listPaymentsForProject(project.id);
    const feePaid = payments.some((p) => p.kind === 'build_fee' && p.status === 'paid');
    if (!feePaid) {
      return NextResponse.json(
        { error: 'Build fee not paid for this project', projectId: project.id },
        { status: 402 },
      );
    }

    const existing = await store.latestBuildForProject(project.id);
    if (existing && existing.status !== 'terminal_failed') {
      startBuildRun(existing.id);
      return NextResponse.json({ buildId: existing.id });
    }
    const build = await store.createBuild(project.id);
    startBuildRun(build.id);
    return NextResponse.json({ buildId: build.id });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error(e);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
