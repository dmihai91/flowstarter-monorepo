/**
 * Editor Handoff API
 *
 * Creates a secure handoff token for redirecting users to the editor
 * with their project data pre-populated.
 */

import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import { auth } from '@clerk/nextjs/server';
import { createHmac, randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// Editor URL - configure in environment
const EDITOR_URL =
  process.env.NEXT_PUBLIC_EDITOR_URL || 'http://localhost:5173';

// Handoff secret - used to sign tokens
function getHandoffSecret(): string {
  const secret = process.env.HANDOFF_SECRET || process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      'HANDOFF_SECRET or TOKEN_ENCRYPTION_KEY environment variable is required'
    );
  }
  return secret;
}

/**
 * Create a signed handoff token
 */
function createHandoffToken(payload: {
  projectId: string;
  userId: string;
  exp: number;
}): string {
  const data = JSON.stringify(payload);
  const dataB64 = Buffer.from(data).toString('base64url');

  const signature = createHmac('sha256', getHandoffSecret())
    .update(dataB64)
    .digest('base64url');

  return `${dataB64}.${signature}`;
}

/**
 * POST /api/editor/handoff
 *
 * Creates a draft project (if needed) and generates a handoff token
 * for redirecting to the editor.
 *
 * Body:
 * - projectId?: string - Existing project ID to hand off
 * - projectConfig?: object - Project configuration for new draft
 * - mode: 'interactive' | 'continue' - Handoff mode
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, projectConfig, mode = 'interactive' } = body;

    const supabase = createSupabaseServiceRoleClient();
    let finalProjectId = projectId;

    // If projectConfig provided, create/update a draft
    if (projectConfig && !projectId) {
      // Create new draft project
      const payload = {
        name: projectConfig.clientName || projectConfig.name || 'Untitled Project',
        description: projectConfig.description || '',
        data: JSON.stringify({
          ...projectConfig,
          handoffMode: mode,
          handoffTimestamp: Date.now(),
        }),
        template_id: projectConfig.template?.id || null,
        domain_type: projectConfig.domainConfig?.domainType || 'hosted',
        domain_name: projectConfig.domainConfig?.domain || null,
        domain_provider: projectConfig.domainConfig?.provider || 'platform',
        status: 'draft',
        is_draft: true,
        user_id: userId,
      };

      const { data: draft, error } = await supabase
        .from('projects')
        .insert(payload)
        .select('id')
        .single();

      if (error) {
        console.error('[Handoff API] Failed to create draft:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      finalProjectId = draft.id;
    } else if (projectId) {
      // Verify project belongs to user
      const { data: project, error } = await supabase
        .from('projects')
        .select('id, user_id')
        .eq('id', projectId)
        .single();

      if (error || !project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }

      if (project.user_id !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // If no projectId yet, create an empty draft
    if (!finalProjectId) {
      const payload = {
        name: 'Untitled Project',
        description: '',
        data: JSON.stringify({
          handoffMode: mode,
          handoffTimestamp: Date.now(),
        }),
        status: 'draft',
        is_draft: true,
        user_id: userId,
      };

      const { data: draft, error } = await supabase
        .from('projects')
        .insert(payload)
        .select('id')
        .single();

      if (error) {
        console.error('[Handoff API] Failed to create draft:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      finalProjectId = draft.id;
    }

    // Create handoff token (15 min expiry)
    const token = createHandoffToken({
      projectId: finalProjectId,
      userId,
      exp: Math.floor(Date.now() / 1000) + 60 * 15,
    });

    // Build editor URL
    const editorUrl = new URL(EDITOR_URL);
    editorUrl.searchParams.set('handoff', token);

    return NextResponse.json({
      success: true,
      projectId: finalProjectId,
      token,
      editorUrl: editorUrl.toString(),
    });
  } catch (e) {
    console.error('[Handoff API] Error:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/editor/handoff?token=xxx
 *
 * Validates a handoff token and returns the project data.
 * This endpoint is called by the editor to fetch project details.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Parse and verify token
    const parts = token.split('.');
    if (parts.length !== 2) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      );
    }

    const [dataB64, signature] = parts;

    // Verify signature
    const expectedSignature = createHmac('sha256', getHandoffSecret())
      .update(dataB64)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { error: 'Invalid token signature' },
        { status: 401 }
      );
    }

    // Decode payload
    const payload = JSON.parse(
      Buffer.from(dataB64, 'base64url').toString('utf8')
    );

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }

    const { projectId, userId } = payload;

    // Fetch project data
    const supabase = createSupabaseServiceRoleClient();
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Parse the data field if it's JSON
    let projectConfig = null;
    if (project.data) {
      try {
        projectConfig = JSON.parse(project.data);
      } catch {
        // If parsing fails, use raw data
        projectConfig = project.data;
      }
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        config: projectConfig,
        templateId: project.template_id,
        isDraft: project.is_draft,
        status: project.status,
        domainName: project.domain_name,
        projectType: project.project_type,
      },
      userId,
    });
  } catch (e) {
    console.error('[Handoff API] Validate error:', e);
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }
}
