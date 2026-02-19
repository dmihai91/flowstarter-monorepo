/**
 * Editor Sync API
 *
 * Allows the editor to sync project data back to Supabase.
 * This is called when users complete onboarding steps in the editor.
 */

import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import { createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// Get the handoff secret for token validation
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
 * Verify a handoff token and extract payload
 */
function verifyHandoffToken(
  token: string
): { projectId: string; userId: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [dataB64, signature] = parts;

    // Verify signature
    const expectedSignature = createHmac('sha256', getHandoffSecret())
      .update(dataB64)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    // Decode payload
    const payload = JSON.parse(
      Buffer.from(dataB64, 'base64url').toString('utf8')
    );

    // Check expiration (allow longer expiry for sync - 24 hours)
    const syncExpiry = payload.exp + 24 * 60 * 60; // Add 24 hours to original expiry
    if (syncExpiry < Math.floor(Date.now() / 1000)) return null;

    return { projectId: payload.projectId, userId: payload.userId };
  } catch {
    return null;
  }
}

/**
 * Project data that can be synced from the editor
 */
interface ProjectSyncData {
  // Basic info
  name?: string;
  description?: string;

  // Business info (from onboarding)
  businessInfo?: {
    uvp?: string; // Unique value proposition
    targetAudience?: string;
    businessGoals?: string[];
    brandTone?: string;
    pricingOffers?: string;
    industry?: string;
  };

  // Design choices
  template?: {
    id: string;
    name: string;
    slug?: string;
  };
  palette?: {
    id: string;
    name: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
  };
  fonts?: {
    id: string;
    name: string;
    heading: { family: string; weight: number };
    body: { family: string; weight: number };
  };

  // Status
  onboardingStep?: string;
  onboardingComplete?: boolean;
}

/**
 * POST /api/editor/sync
 *
 * Syncs project data from the editor to Supabase.
 *
 * Headers:
 * - Authorization: Bearer <handoff_token>
 *
 * Body:
 * - projectId: string (required)
 * - data: ProjectSyncData
 */
export async function POST(request: NextRequest) {
  try {
    // Get authorization token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const tokenPayload = verifyHandoffToken(token);

    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectId, data } = body as {
      projectId: string;
      data: ProjectSyncData;
    };

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Verify projectId matches token
    if (projectId !== tokenPayload.projectId) {
      return NextResponse.json(
        { error: 'Project ID mismatch' },
        { status: 403 }
      );
    }

    const supabase = createSupabaseServiceRoleClient();

    // Fetch existing project to merge data
    const { data: existingProject, error: fetchError } = await supabase
      .from('projects')
      .select('id, data, user_id')
      .eq('id', projectId)
      .eq('user_id', tokenPayload.userId)
      .single();

    if (fetchError || !existingProject) {
      console.error('[Editor Sync] Project not found:', fetchError);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Parse existing project config
    let existingConfig: Record<string, unknown> = {};
    if (existingProject.data) {
      try {
        existingConfig = JSON.parse(existingProject.data as string);
      } catch {
        existingConfig = {};
      }
    }

    // Merge new data into existing config
    const updatedConfig = {
      ...existingConfig,
      // Basic info
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),

      // Business info
      ...(data.businessInfo && {
        businessInfo: {
          ...((existingConfig.businessInfo as Record<string, unknown>) || {}),
          ...data.businessInfo,
        },
        // Also store at top level for compatibility with wizard
        targetUsers: data.businessInfo.targetAudience,
        businessGoals: data.businessInfo.businessGoals?.join(', '),
        USP: data.businessInfo.uvp,
      }),

      // Design choices
      ...(data.template && {
        template: data.template,
      }),
      ...(data.palette && {
        designConfig: {
          ...((existingConfig.designConfig as Record<string, unknown>) || {}),
          selectedPalette: data.palette,
        },
      }),
      ...(data.fonts && {
        designConfig: {
          ...((existingConfig.designConfig as Record<string, unknown>) || {}),
          selectedFonts: data.fonts,
        },
      }),

      // Status
      ...(data.onboardingStep && { currentStep: data.onboardingStep }),
      ...(data.onboardingComplete !== undefined && {
        onboardingComplete: data.onboardingComplete,
      }),

      // Metadata
      lastSyncedAt: new Date().toISOString(),
      syncedFromEditor: true,
    };

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      data: JSON.stringify(updatedConfig),
      updated_at: new Date().toISOString(),
    };

    // Update top-level fields if provided
    if (data.name) {
      updatePayload.name = data.name;
    }
    if (data.description) {
      updatePayload.description = data.description;
    }
    if (data.template?.id) {
      updatePayload.template_id = data.template.id;
    }
    if (data.businessInfo?.targetAudience) {
      updatePayload.target_users = data.businessInfo.targetAudience;
    }
    if (data.businessInfo?.businessGoals) {
      updatePayload.business_goals = data.businessInfo.businessGoals.join(', ');
    }

    // Mark as no longer draft if onboarding is complete
    if (data.onboardingComplete) {
      updatePayload.is_draft = false;
      updatePayload.status = 'active';
    }

    // Update project
    const { error: updateError } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', projectId)
      .eq('user_id', tokenPayload.userId);

    if (updateError) {
      console.error('[Editor Sync] Update failed:', updateError);
      return NextResponse.json(
        { error: 'Failed to sync project' },
        { status: 500 }
      );
    }

    console.log('[Editor Sync] Project synced successfully:', projectId);

    return NextResponse.json({
      success: true,
      projectId,
      syncedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[Editor Sync] Error:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/editor/sync?projectId=xxx
 *
 * Fetches project data for the editor.
 * Requires Authorization header with handoff token.
 */
export async function GET(request: NextRequest) {
  try {
    // Get authorization token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const tokenPayload = verifyHandoffToken(token);

    if (!tokenPayload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || tokenPayload.projectId;

    // Verify projectId matches token
    if (projectId !== tokenPayload.projectId) {
      return NextResponse.json(
        { error: 'Project ID mismatch' },
        { status: 403 }
      );
    }

    const supabase = createSupabaseServiceRoleClient();

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', tokenPayload.userId)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Parse the data field
    let config = null;
    if (project.data) {
      try {
        config = JSON.parse(project.data);
      } catch {
        config = project.data;
      }
    }

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        templateId: project.template_id,
        isDraft: project.is_draft,
        status: project.status,
        config,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      },
    });
  } catch (e) {
    console.error('[Editor Sync] GET Error:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
