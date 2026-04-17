/**
 * Team Workspace API
 *
 * Authenticated via Clerk — requires internal team access.
 * Team members open existing projects (created from dashboard) and can
 * open multiple conversation threads per project.
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';
import { hasInternalTeamAccess } from '@/lib/teamAccess';
import { getConvexClient, convexApi } from '@/lib/convex';
import { createSupabaseServiceRoleClient } from '@flowstarter/supabase-utils';
import { bootstrapWorkspace } from '@flowstarter/daytona-utils';

function unauthorized(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * POST /api/workspaces — Open/bootstrap workspace for an existing project
 *
 * Body: { projectId: string, threadId?: string }
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session.userId) {
    return unauthorized(401, 'Authentication required');
  }

  if (!hasInternalTeamAccess(session.sessionClaims)) {
    return unauthorized(403, 'Internal team access required');
  }

  const body = await request.json() as { projectId?: string; threadId?: string };
  const { projectId, threadId } = body;

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  const convex = getConvexClient();
  if (!convex) {
    return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
  }

  try {
    // Verify project exists in Convex
    const project = await convex.query(convexApi.projects.getByUrlId, {
      urlId: projectId,
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Read project files from Convex
    const fileRecords = await convex.query(convexApi.files.getProjectFiles, {
      projectId: project._id,
    });

    const files: Record<string, string> = {};
    for (const f of fileRecords) {
      if (f.type === 'file' && !f.isBinary) {
        files[f.path] = f.content;
      }
    }

    // Insert workspace row in Supabase
    const supabase = createSupabaseServiceRoleClient();
    const { data: workspace, error: insertError } = await supabase
      .from('editor_workspaces')
      .insert({
        user_id: session.userId,
        user_type: 'team',
        project_id: projectId,
        access_level: 'full',
        status: 'provisioning',
        metadata: threadId ? { threadId } : {},
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[Workspaces] Supabase insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create workspace record' },
        { status: 500 },
      );
    }

    // Create/update Convex editor session
    const sessionId = await convex.mutation(
      convexApi.editorSessions.createOrUpdate,
      {
        projectId: project._id,
        conversationId: threadId || undefined,
        status: 'active' as const,
      },
    );

    // Bootstrap the Daytona sandbox
    const result = await bootstrapWorkspace({
      projectId,
      files,
      onProgress: (step, message) => {
        console.log(`[Workspaces] Step ${step}: ${message}`);
      },
    });

    // Update Supabase with result
    if (result.success) {
      await supabase
        .from('editor_workspaces')
        .update({
          sandbox_id: result.sandboxId,
          workspace_url: result.previewUrl,
          status: 'ready',
        })
        .eq('id', workspace.id);

      // Update Convex session with workspace info
      if (sessionId) {
        await convex.mutation(convexApi.editorSessions.updateWorkspaceInfo, {
          sessionId,
          sandboxId: result.sandboxId,
          previewUrl: result.previewUrl,
        });
      }
    } else {
      await supabase
        .from('editor_workspaces')
        .update({
          status: 'error',
          error_message: result.error,
          metadata: { failedAtStep: result.failedAtStep },
        })
        .eq('id', workspace.id);
    }

    return NextResponse.json({
      workspaceId: workspace.id,
      sandboxId: result.sandboxId,
      previewUrl: result.previewUrl,
      status: result.success ? 'ready' : 'error',
      error: result.error,
    });
  } catch (error) {
    console.error('[Workspaces] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/workspaces — List team workspaces
 */
export async function GET() {
  const session = await auth();

  if (!session.userId) {
    return unauthorized(401, 'Authentication required');
  }

  if (!hasInternalTeamAccess(session.sessionClaims)) {
    return unauthorized(403, 'Internal team access required');
  }

  try {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from('editor_workspaces')
      .select('*')
      .eq('user_type', 'team')
      .eq('user_id', session.userId)
      .order('last_active_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ workspaces: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/workspaces — Update workspace state (heartbeat / status)
 */
export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session.userId) {
    return unauthorized(401, 'Authentication required');
  }

  if (!hasInternalTeamAccess(session.sessionClaims)) {
    return unauthorized(403, 'Internal team access required');
  }

  const body = await request.json() as {
    workspaceId?: string;
    status?: string;
  };

  if (!body.workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  try {
    const supabase = createSupabaseServiceRoleClient();
    const update: Record<string, unknown> = {
      last_active_at: new Date().toISOString(),
    };

    if (body.status) {
      update.status = body.status;
    }

    const { error } = await supabase
      .from('editor_workspaces')
      .update(update)
      .eq('id', body.workspaceId)
      .eq('user_id', session.userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
