import { useServerSupabaseWithAuthStrict } from '@/hooks/useServerSupabase';
import { requireAuth } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PATCH /api/projects/[id]
 *
 * Update a project by ID.
 * Requires authentication - returns 401 if not authenticated.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID required' },
        { status: 400 }
      );
    }

    console.info('[Projects] PATCH starting:', {
      userId: authResult.userId,
      projectId: id,
      fields: Object.keys(body),
    });

    const supabase = await useServerSupabaseWithAuthStrict();

    // Only allow updating certain fields
    const allowedFields = ['name', 'description', 'chat', 'is_draft', 'status'];
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Projects] PATCH database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.info('[Projects] PATCH success', {
      userId: authResult.userId,
      projectId: data.id,
    });

    return NextResponse.json({ project: data });
  } catch (error) {
    console.error('[Projects] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

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
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Project ID required' },
        { status: 400 }
      );
    }

    console.info('[Projects] GET by ID starting:', {
      userId: authResult.userId,
      projectId: id,
    });

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
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) return authResult.response;

  const { id } = await params;
  const { createSupabaseServiceRoleClient } = await import('@/supabase-clients/server');
  const supabase = createSupabaseServiceRoleClient();

  // 1. Delete from Supabase (source of truth)
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', authResult.userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2. Cascade to Convex — delete project, conversations, files, snapshots
  //    Fire-and-forget: Supabase delete already succeeded; log failures but don't block
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const convexAdminKey = process.env.CONVEX_ADMIN_KEY;

  if (convexUrl && convexAdminKey) {
    try {
      // Call Convex HTTP API directly (no cross-package import needed)
      const convexResp = await fetch(`${convexUrl}/api/mutation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Convex ${convexAdminKey}`,
        },
        body: JSON.stringify({
          path: 'projects:deleteBySupabaseId',
          args: { supabaseProjectId: id },
          format: 'json',
        }),
      });

      const result = (await convexResp.json()) as { status: string; value?: { deleted: boolean; daytonaWorkspaceIds: string[] } };
      const data = result.value;

      // 3. Delete Daytona sandbox(es) using workspace IDs returned from Convex
      if (data?.daytonaWorkspaceIds?.length) {
        const editorUrl = process.env.NEXT_PUBLIC_EDITOR_URL || 'https://editor.flowstarter.dev';
        await fetch(`${editorUrl}/api/daytona/cleanup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceIds: data!.daytonaWorkspaceIds }),
        }).catch(err => console.error('[DELETE project] Daytona cleanup failed:', err));
      }
    } catch (err) {
      // Log but don't fail — Supabase delete succeeded; Convex/Daytona can be retried
      console.error('[DELETE project] Convex cascade failed:', err);
    }
  } else {
    console.warn('[DELETE project] CONVEX_ADMIN_KEY or NEXT_PUBLIC_CONVEX_URL not set — skipping Convex cascade');
  }

  return NextResponse.json({ success: true });
}
