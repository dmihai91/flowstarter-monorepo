import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Check if the current user is a team member
 */
async function requireTeamAuth() {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return {
        authorized: false,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      };
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
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Not a team member' },
          { status: 403 }
        ),
      };
    }

    return { authorized: true, userId, role };
  } catch (error) {
    console.error('[Team Auth] Error:', error);
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Auth failed' }, { status: 500 }),
    };
  }
}

/**
 * DELETE /api/team/projects/[id]
 *
 * Delete any project (team members bypass RLS)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireTeamAuth();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const { id } = await params;

    // Use service role client to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // First check if project exists
    const { data: project, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select('id, name')
      .eq('id', id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Delete the project
    const { error: deleteError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('[Team Projects] Delete error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    console.info('[Team Projects] Deleted project', {
      projectId: id,
      projectName: project.name,
      deletedBy: authCheck.userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Team Projects] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/team/projects/[id]
 *
 * Update project (rename, pricing, status, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireTeamAuth();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, project_type, setup_fee, monthly_fee, is_paid, status } =
      body;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (project_type !== undefined) {
      updateData.project_type = project_type;
    }

    if (setup_fee !== undefined) {
      updateData.setup_fee = Number(setup_fee) || 0;
    }

    if (monthly_fee !== undefined) {
      updateData.monthly_fee = Number(monthly_fee) || 0;
    }

    if (is_paid !== undefined) {
      updateData.is_paid = Boolean(is_paid);
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Team Projects] Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('[Team Projects] Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/team/projects/[id]
 *
 * Get any project details (team members bypass RLS)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireTeamAuth();
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  try {
    const { id } = await params;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('[Team Projects] Get error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}
