import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/workspace/[id]
 *
 * Returns workspace status and connection info.
 *
 * TODO: Query Supabase editor_workspaces table (Task #12)
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;

  // TODO: Look up workspace in Supabase by project ID
  // TODO: Return { status, sandboxUrl, t3AuthToken }

  return NextResponse.json(
    {
      status: 'not_found',
      projectId: id,
      message: 'Workspace lookup not yet implemented',
    },
    { status: 404 },
  );
}
