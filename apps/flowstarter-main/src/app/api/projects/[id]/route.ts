import { deleteProjectAction } from '@/data/user/projects';
import { useServerSupabaseWithAuthStrict } from '@/hooks/useServerSupabase';
import { requireAuth } from '@/lib/api-auth';
import { validateUUID } from '@/lib/path-validation';
import { logSecurityEvent, resourceAuditContext } from '@/lib/security-audit';
import { NextRequest, NextResponse } from 'next/server';

// Coding agent URL for cleanup operations
const CODING_AGENT_URL =
  process.env.NEXT_PUBLIC_CODING_AGENT_URL || 'http://localhost:8000';

/**
 * Clean up all project-related data from Convex and Python workspace
 * This is called before deleting the project from Supabase
 */
async function cleanupProjectData(
  projectId: string,
  authToken: string | null,
  projectName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Call Python cleanup endpoint which handles both Convex and workspace cleanup
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(
      `${CODING_AGENT_URL}/projects/${projectId}/cleanup`,
      {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ projectName }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(
        `[Project Cleanup] Python cleanup failed (${response.status}): ${errorText}`
      );
      // Don't fail the deletion if cleanup fails - log and continue
      return { success: false, error: errorText };
    }

    const result = await response.json();
    console.log('[Project Cleanup] Cleanup result:', result);
    return { success: true };
  } catch (error) {
    // Don't fail the deletion if cleanup endpoint is unavailable
    console.warn('[Project Cleanup] Cleanup endpoint error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate project ID parameter
 * Returns 400 if invalid, null if valid
 */
function validateProjectId(id: string): NextResponse | null {
  const validation = validateUUID(id);
  if (!validation.valid) {
    console.warn('[Projects] Invalid project ID format:', id);
    return NextResponse.json(
      { error: 'Invalid project ID format', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }
  return null;
}

/**
 * DELETE /api/projects/[id]
 *
 * Delete a project by ID.
 * Requires authentication and ownership (enforced by RLS).
 */
export async function DELETE(
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

    // Validate project ID format
    const idError = validateProjectId(id);
    if (idError) return idError;

    // Get auth token for cleanup API calls
    const authToken = await authResult.getToken();

    // First, get project details for cleanup (including name for workspace lookup)
    const supabase = await useServerSupabaseWithAuthStrict();
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('name, user_id')
      .eq('id', id)
      .single();

    // If project not found or user doesn't own it (RLS will return null)
    if (fetchError || !project) {
      console.warn('[Projects] DELETE - Project not found or access denied:', {
        id,
        userId: authResult.userId,
        error: fetchError?.message,
      });
      return NextResponse.json(
        { error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Clean up Convex data and Python workspace
    // This is done first, before deleting from Supabase
    const cleanupResult = await cleanupProjectData(id, authToken, project.name);

    if (!cleanupResult.success) {
      console.warn(
        `[Project Deletion] Cleanup incomplete for ${id}: ${cleanupResult.error}`
      );
      // Continue with deletion even if cleanup fails
    }

    // Now delete from Supabase
    const result = await deleteProjectAction({ id });

    if (result?.validationErrors) {
      return NextResponse.json(
        { error: 'Validation error', details: result.validationErrors },
        { status: 400 }
      );
    }

    if (result?.serverError) {
      return NextResponse.json({ error: result.serverError }, { status: 500 });
    }

    // Log successful project deletion
    await logSecurityEvent(
      'project.deleted',
      authResult.userId,
      resourceAuditContext('project', '/api/projects/[id]')
    );

    console.info('[Projects] DELETE success', {
      id,
      userId: authResult.userId,
    });

    return NextResponse.json({
      success: true,
      cleanup: cleanupResult.success ? 'complete' : 'partial',
    });
  } catch (error) {
    console.error('[Projects] DELETE error:', error);

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
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]
 *
 * Update a project by ID.
 * Requires authentication and ownership (enforced by RLS).
 */
export async function PATCH(
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

    // Validate project ID format
    const idError = validateProjectId(id);
    if (idError) return idError;

    const formData = await request.formData();

    const updateData: Record<string, unknown> = {};

    if (formData.has('name')) updateData.name = formData.get('name') as string;
    if (formData.has('description'))
      updateData.description = formData.get('description') as string;
    if (formData.has('data')) updateData.data = formData.get('data') as string;
    if (formData.has('domain_type'))
      updateData.domain_type = formData.get('domain_type') as string;
    if (formData.has('domain_name'))
      updateData.domain_name = formData.get('domain_name') as string;
    if (formData.has('domain_provider'))
      updateData.domain_provider = formData.get('domain_provider') as string;
    if (formData.has('status'))
      updateData.status = formData.get('status') as string;
    if (formData.has('is_draft'))
      updateData.is_draft = formData.get('is_draft') === 'true';
    if (formData.has('template_id'))
      updateData.template_id = formData.get('template_id') as string;

    const supabase = await useServerSupabaseWithAuthStrict();
    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      // PostgreSQL error for no rows affected (RLS blocked or not found)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Project not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.info('[Projects] PATCH success', {
      id,
      userId: authResult.userId,
    });

    return NextResponse.json({ success: true, project: data });
  } catch (error) {
    console.error('[Projects] PATCH error:', error);

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
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects/[id]
 *
 * Get a project by ID.
 * Requires authentication and ownership (enforced by RLS).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify authentication first
  const authResult = await requireAuth();
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { id } = await params;

    // Validate project ID format
    const idError = validateProjectId(id);
    if (idError) return idError;

    const supabase = await useServerSupabaseWithAuthStrict();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // PostgreSQL error for no rows found
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Project not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Project not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    console.info('[Projects] GET success', {
      id,
      userId: authResult.userId,
    });

    return NextResponse.json({ project: data });
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
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}
