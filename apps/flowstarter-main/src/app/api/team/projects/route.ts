import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * GET /api/team/projects
 * 
 * Fetches ALL projects for team members.
 * Requires team/admin role.
 */
export async function GET() {
  try {
    // Check auth
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check role
    const user = await currentUser();
    const metadata = user?.publicMetadata as { role?: string } | undefined;
    const role = metadata?.role?.toLowerCase();
    
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
      .select(`
        *,
        user:user_id (
          id,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Team Projects] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.info('[Team Projects] Fetched', {
      count: projects?.length ?? 0,
      byUser: userId,
    });

    return NextResponse.json({ projects: projects ?? [] });
  } catch (error) {
    console.error('[Team Projects] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
