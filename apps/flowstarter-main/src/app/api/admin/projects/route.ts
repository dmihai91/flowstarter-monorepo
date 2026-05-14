import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { resolveUserRole } from '@/lib/api-auth';
import { PROJECT_LIST_SELECT } from '@/lib/projects/project-list-columns';
import { deriveProjectStatus } from '@/lib/team-dashboard/team-project-status';

/**
 * GET /api/admin/projects
 *
 * Fetches ALL workspaces for team members, with a UI-friendly derived status.
 * Requires team/admin role.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = await resolveUserRole(userId);
    if (role !== 'team' && role !== 'admin') {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: workspaces, error } = await supabaseAdmin
      .from('workspaces')
      .select(PROJECT_LIST_SELECT)
      .order('created_at', { ascending: false })
      .limit(150);

    if (error) {
      console.error('[Team Projects] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    type WorkspaceRow = {
      concierge_stage: string | null;
      deploy_status: string | null;
      [key: string]: unknown;
    };
    const enrichedProjects = (
      (workspaces ?? []) as unknown as WorkspaceRow[]
    ).map((p) => ({
      ...p,
      status: deriveProjectStatus({
        concierge_stage: p.concierge_stage,
        deploy_status: p.deploy_status,
      }),
    }));

    return NextResponse.json(
      { projects: enrichedProjects },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error('[Team Projects] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
