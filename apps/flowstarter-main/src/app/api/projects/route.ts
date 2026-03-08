import { insertProjectAction } from '@/data/user/projects';
import { useServerSupabaseWithAuthStrict } from '@/hooks/useServerSupabase';
import { requireAuth } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/projects
 *
 * Create a new project for the authenticated user.
 * Requires authentication.
 */
export async function POST(request: NextRequest) {
  // Verify authentication first
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const formData = await request.formData();

    const projectData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      chat: formData.get('data') as string,
      domain_type: formData.get('domain_type') as 'custom' | 'hosted',
      domain_name: formData.get('domain_name') as string,
      domain_provider: formData.get('domain_provider') as string,
    };

    const result = await insertProjectAction(projectData);

    if (result?.validationErrors) {
      return NextResponse.json(
        { error: 'Validation error', details: result.validationErrors },
        { status: 400 }
      );
    }

    if (result?.serverError) {
      return NextResponse.json({ error: result.serverError }, { status: 500 });
    }

    console.info('[Projects] POST success', {
      userId: authResult.userId,
      projectId: result?.data,
    });

    return NextResponse.json({ success: true, projectId: result?.data });
  } catch (error) {
    console.error('[Projects] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects
 *
 * List all projects for the authenticated user.
 * Requires authentication - returns 401 if not authenticated.
 * Explicitly filters by user_id for clients (RLS as backup).
 */
export async function GET() {
  // Verify authentication first
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    console.info('[Projects] GET starting for user:', authResult.userId);

    // Use strict auth client that throws if no JWT
    const supabase = await useServerSupabaseWithAuthStrict();

    // Explicitly filter by user_id to show only projects owned by this user
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', authResult.userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Projects] GET database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.info('[Projects] GET success', {
      userId: authResult.userId,
      count: data?.length ?? 0,
      projects: data?.map((p) => ({
        id: p.id,
        name: p.name,
        is_draft: p.is_draft,
        status: p.status,
      })),
    });

    return NextResponse.json({ projects: data ?? [] });
  } catch (error) {
    console.error('[Projects] GET error:', error);

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
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
