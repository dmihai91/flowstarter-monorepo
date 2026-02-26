import { useServerSupabaseWithAuthStrict } from '@/hooks/useServerSupabase';
import { requireAuth } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/projects/[id]
 *
 * Fetch a single project by ID.
 * Requires authentication - returns 401 if not authenticated.
 * RLS policies ensure users only see their own projects.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify authentication first
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    console.info('[Projects] GET by ID starting:', { userId: authResult.userId, projectId: id });

    // Use strict auth client that throws if no JWT
    const supabase = await useServerSupabaseWithAuthStrict();

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[Projects] GET by ID database error:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.info('[Projects] GET by ID success', {
      userId: authResult.userId,
      projectId: data.id,
      projectName: data.name,
    });

    return NextResponse.json({ project: data });
  } catch (error) {
    console.error('[Projects] GET by ID error:', error);

    // Check if it's an authentication error from strict client
    if (
      error instanceof Error &&
      error.message.includes('Authentication required')
    ) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}
