/**
 * Client Workspace API
 *
 * Authenticated via magic link token (validated against Convex clientSessions).
 * Clients can only open/edit existing projects assigned to them.
 * Clients can open multiple conversation threads per project.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { getConvexClient, convexApi } from '@/lib/convex';
import { createSupabaseServiceRoleClient } from '@flowstarter/supabase-utils';
import { bootstrapWorkspace } from '@flowstarter/daytona-utils';

type ConvexClientLike = {
  query: (fn: string, args?: Record<string, unknown>) => Promise<unknown>;
  mutation: (fn: string, args?: Record<string, unknown>) => Promise<unknown>;
};

interface ClientSessionRecord {
  clientId: string;
  projectId: string;
  accessLevel: string;
  expiresAt: number;
}

interface ConvexProjectRecord {
  _id: string;
  clientId: string;
}

interface ConvexFileRecord {
  type: string;
  isBinary?: boolean;
  path: string;
  content: string;
}

/** Paths clients with 'customize' access are allowed to write to. */
const CUSTOMIZE_ALLOWED_PATHS = [
  /^src\/content\//,
  /^src\/data\//,
  /^public\/images\//,
  /^public\/assets\//,
  /^src\/styles\/theme/,
  /^src\/styles\/custom/,
  /^src\/config\/theme/,
  /^src\/config\/site/,
];

/** Paths that are always protected (even for 'full' client access). */
const PROTECTED_PATHS = [
  /^package\.json$/,
  /^package-lock\.json$/,
  /^bun\.lockb$/,
  /^tsconfig/,
  /^astro\.config/,
  /^vite\.config/,
  /^next\.config/,
  /^\.env/,
  /^convex\//,
  /^node_modules\//,
];

export function isPathAllowed(
  path: string,
  accessLevel: string,
): boolean {
  // View access cannot write any files
  if (accessLevel === 'view') return false;

  // Protected paths are blocked for all client access levels
  if (PROTECTED_PATHS.some((p) => p.test(path))) return false;

  // Full access can write anything except protected paths
  if (accessLevel === 'full') return true;

  // Customize access only allowed on specific paths
  return CUSTOMIZE_ALLOWED_PATHS.some((p) => p.test(path));
}

/**
 * Extract and validate the client session token from the request.
 */
async function validateClientToken(request: NextRequest): Promise<{
  valid: boolean;
  clientId?: string;
  projectId?: string;
  accessLevel?: string;
  error?: string;
}> {
  const token =
    request.headers.get('authorization')?.replace('Bearer ', '') ||
    request.cookies.get('fs-client-session')?.value;

  if (!token) {
    return { valid: false, error: 'No client session token provided' };
  }

  const convex = getConvexClient() as ConvexClientLike | null;
  if (!convex) {
    return { valid: false, error: 'Convex not configured' };
  }

  try {
    const session = (await convex.query(convexApi.clientSessions.getByToken, {
      token,
    })) as ClientSessionRecord | null;

    if (!session) {
      return { valid: false, error: 'Invalid or expired session' };
    }

    // Check expiry
    if (session.expiresAt < Date.now()) {
      return { valid: false, error: 'Session expired' };
    }

    return {
      valid: true,
      clientId: session.clientId,
      projectId: session.projectId,
      accessLevel: session.accessLevel,
    };
  } catch {
    return { valid: false, error: 'Failed to validate session' };
  }
}

/**
 * POST /api/workspaces/client — Client opens an existing project workspace
 *
 * Body: { projectId: string, threadId?: string }
 * Auth: Bearer <magic-link-token> or fs-client-session cookie
 */
export async function POST(request: NextRequest) {
  const auth = await validateClientToken(request);

  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const body = await request.json() as { projectId?: string; threadId?: string };
  const { projectId, threadId } = body;

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  // Verify the client is authorized for this project
  if (auth.projectId !== projectId) {
    return NextResponse.json(
      { error: 'Access denied — session is not authorized for this project' },
      { status: 403 },
    );
  }

  // Clients need at least 'customize' to get a workspace
  if (auth.accessLevel === 'view') {
    return NextResponse.json(
      { error: 'View-only access does not include workspace provisioning' },
      { status: 403 },
    );
  }

    const convex = getConvexClient() as ConvexClientLike | null;
  if (!convex) {
    return NextResponse.json({ error: 'Convex not configured' }, { status: 500 });
  }

  try {
    // Verify project exists and belongs to this client
    const project = (await convex.query(convexApi.projects.getByUrlId, {
      urlId: projectId,
    })) as ConvexProjectRecord | null;

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.clientId !== auth.clientId) {
      return NextResponse.json(
        { error: 'Project is not assigned to this client' },
        { status: 403 },
      );
    }

    // Check for existing running workspace (fast path)
    const supabase = createSupabaseServiceRoleClient();
    const { data: existing } = await supabase
      .from('editor_workspaces')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', auth.clientId!)
      .eq('user_type', 'client')
      .in('status', ['ready', 'running', 'building'])
      .order('last_active_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      // Update heartbeat
      await supabase
        .from('editor_workspaces')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', existing.id);

      return NextResponse.json({
        workspaceId: existing.id,
        sandboxId: existing.sandbox_id,
        previewUrl: existing.workspace_url,
        accessLevel: existing.access_level,
        status: existing.status,
      });
    }

    // Read project files from Convex
    const fileRecords = (await convex.query(convexApi.files.getProjectFiles, {
      projectId: project._id,
    })) as ConvexFileRecord[];

    const files: Record<string, string> = {};
    for (const f of fileRecords) {
      if (f.type === 'file' && !f.isBinary) {
        files[f.path] = f.content;
      }
    }

    // Create workspace row
    const { data: workspace, error: insertError } = await supabase
      .from('editor_workspaces')
      .insert({
        user_id: auth.clientId!,
        user_type: 'client',
        project_id: projectId,
        access_level: auth.accessLevel!,
        status: 'provisioning',
        metadata: threadId ? { threadId } : {},
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[Workspaces/Client] Supabase insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create workspace record' },
        { status: 500 },
      );
    }

    // Create/update Convex editor session
    await convex.mutation(convexApi.editorSessions.createOrUpdate, {
      projectId: project._id,
      conversationId: threadId || undefined,
      status: 'active' as const,
    });

    // Bootstrap the Daytona sandbox
    const result = await bootstrapWorkspace({
      projectId,
      files,
      onProgress: (step: number, message: string) => {
        console.log(`[Workspaces/Client] Step ${step}: ${message}`);
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
      accessLevel: auth.accessLevel,
      status: result.success ? 'ready' : 'error',
      error: result.error,
    });
  } catch (error) {
    console.error('[Workspaces/Client] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/workspaces/client — List client's workspaces
 */
export async function GET(request: NextRequest) {
  const auth = await validateClientToken(request);

  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase
      .from('editor_workspaces')
      .select('*')
      .eq('user_type', 'client')
      .eq('user_id', auth.clientId!)
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
