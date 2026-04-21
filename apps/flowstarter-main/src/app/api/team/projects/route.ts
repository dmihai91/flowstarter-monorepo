import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { PROJECT_LIST_SELECT } from '@/lib/projects/project-list-columns';
import type { Table } from '@/types';

/**
 * GET /api/team/projects
 *
 * Fetches ALL projects for team members with owner info.
 * Requires team/admin role.
 */
export async function GET() {
  try {
    // Check auth
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check role from sessionClaims.metadata OR publicMetadata
    let role = (
      sessionClaims?.metadata as { role?: string }
    )?.role?.toLowerCase();

    // Fallback to publicMetadata if not in session claims
    if (!role) {
      const user = await currentUser();
      role = (user?.publicMetadata as { role?: string })?.role?.toLowerCase();
    }

    if (role !== 'team' && role !== 'admin') {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
    }

    // Use service role client to bypass RLS and fetch all projects
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select(PROJECT_LIST_SELECT)
      .order('created_at', { ascending: false })
      .limit(150);

    if (error) {
      console.error('[Team Projects] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const projectRows = (projects ?? []) as unknown as Array<Table<'projects'>>;

    // Get unique user IDs and fetch their info from Clerk
    const userIds = Array.from(
      new Set(projectRows.map((p) => p.user_id).filter(Boolean))
    );
    const userMap: Record<string, { email: string; name: string }> = {};

    if (userIds.length > 0) {
      try {
        const clerk = await clerkClient();
        const chunkSize = 100;
        for (let i = 0; i < userIds.length; i += chunkSize) {
          const chunk = userIds.slice(i, i + chunkSize);
          const users = await clerk.users.getUserList({
            userId: chunk,
            limit: chunkSize,
          });
          for (const u of users.data) {
            userMap[u.id] = {
              email: u.emailAddresses?.[0]?.emailAddress || '',
              name: u.firstName
                ? `${u.firstName} ${u.lastName || ''}`.trim()
                : '',
            };
          }
        }
      } catch (e) {
        console.warn('[Team Projects] Failed to fetch user info:', e);
      }
    }

    // Enrich projects with owner info
    const enrichedProjects = projectRows.map((p) => ({
      ...p,
      owner_email: userMap[p.user_id]?.email || null,
      owner_name: userMap[p.user_id]?.name || null,
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
