import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/workspace/create
 *
 * Creates a Daytona sandbox for a project, bootstraps it with template files,
 * installs Claude Code, writes CLAUDE.md, and starts T3 Code.
 *
 * TODO: Implement full provisioning pipeline (Task #12)
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json();
  const { projectId, handoffToken, mode } = body;

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  // TODO: Validate handoff token
  // TODO: Create Daytona sandbox
  // TODO: Bootstrap (Claude Code install, template clone, CLAUDE.md, bun install, T3 start)
  // TODO: Store workspace in Supabase
  // TODO: Return workspace info

  return NextResponse.json(
    {
      status: 'provisioning',
      projectId,
      message: 'Workspace provisioning not yet implemented',
    },
    { status: 501 },
  );
}
