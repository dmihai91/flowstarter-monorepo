/**
 * Editor → Dashboard Project Linking API
 *
 * Creates a Supabase project record when a project is created in the editor,
 * establishing bidirectional linking between Convex and Supabase.
 */

import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/editor/link
 *
 * Body:
 * - convexProjectId: string - The Convex project ID
 * - projectName: string - Project name
 * - projectDescription?: string - Project description
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { convexProjectId, projectName, projectDescription } = body;

    if (!convexProjectId) {
      return NextResponse.json(
        { error: 'convexProjectId is required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServiceRoleClient();

    // Check if a project already exists with this convex_session_id
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('convex_session_id', convexProjectId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        supabaseProjectId: existing.id,
        alreadyLinked: true,
      });
    }

    // Create new Supabase project linked to the Convex project
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name: projectName || 'Untitled Project',
        description: projectDescription || '',
        convex_session_id: convexProjectId,
        status: 'draft',
        is_draft: true,
        user_id: userId,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Link API] Failed to create project:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      supabaseProjectId: project.id,
      alreadyLinked: false,
    });
  } catch (e) {
    console.error('[Link API] Error:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
