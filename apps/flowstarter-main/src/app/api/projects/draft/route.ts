/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Coding agent URL for cleanup operations
const CODING_AGENT_URL =
  process.env.NEXT_PUBLIC_CODING_AGENT_URL || 'http://localhost:8000';

/**
 * Clean up all draft-related data from Convex and Python workspace
 * This is called before deleting the draft from Supabase
 */
async function cleanupDraftData(
  projectId: string,
  authToken: string | null,
  projectName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
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
        `[Draft Cleanup] Python cleanup failed (${response.status}): ${errorText}`
      );
      return { success: false, error: errorText };
    }

    const result = await response.json();
    console.log('[Draft Cleanup] Cleanup result:', result);
    return { success: true };
  } catch (error) {
    console.warn('[Draft Cleanup] Cleanup endpoint error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Store wizard drafts as regular projects with is_draft=true
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // If projectId is provided, fetch that specific draft
    if (projectId) {
      const { data, error } = await supabase
        .from('projects')
        .select(
          'id, name, description, data, template_id, domain_type, domain_name, domain_provider, updated_at'
        )
        .eq('id', projectId)
        .eq('user_id', userId)
        .eq('is_draft', true)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      if (!data) {
        return NextResponse.json({ draft: null });
      }

      // Parse chat field to extract additional metadata
      let projectConfig: any = {};
      if (data.data) {
        try {
          projectConfig = JSON.parse(data.data);
        } catch {
          // If parsing fails, use empty object
        }
      }

      // Return normalized draft response
      const normalized = {
        id: data.id,
        data: data.data, // Use 'data' field to match client expectations
        template_id: data.template_id,
        domain_type: data.domain_type,
        domain_name: data.domain_name,
        domain_provider: data.domain_provider,
        current_step: projectConfig?.currentStep || null,
        entry_mode: projectConfig?.entry_mode || null,
        updated_at: data.updated_at,
      };

      return NextResponse.json({ draft: normalized });
    }

    // If no projectId, fetch the most recent draft for the user
    const { data: latestDraft, error: latestError } = await supabase
      .from('projects')
      .select(
        'id, name, description, data, template_id, domain_type, domain_name, domain_provider, updated_at'
      )
      .eq('user_id', userId)
      .eq('is_draft', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) {
      return NextResponse.json({ error: latestError.message }, { status: 500 });
    }

    if (!latestDraft) {
      return NextResponse.json({ draft: null });
    }

    // Parse data field to extract additional metadata
    let projectConfig: any = {};
    if (latestDraft.data) {
      try {
        projectConfig = JSON.parse(latestDraft.data);
      } catch {
        // If parsing fails, use empty object
      }
    }

    // Return normalized draft response
    const normalized = {
      id: latestDraft.id,
      data: latestDraft.data,
      template_id: latestDraft.template_id,
      domain_type: latestDraft.domain_type,
      domain_name: latestDraft.domain_name,
      domain_provider: latestDraft.domain_provider,
      current_step: projectConfig?.currentStep || null,
      entry_mode: projectConfig?.entry_mode || null,
      updated_at: latestDraft.updated_at,
    };

    return NextResponse.json({ draft: normalized });
  } catch (e) {
    console.error('Error fetching draft:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Draft API] POST request received');
    const { userId } = await auth();
    if (!userId) {
      console.log('[Draft API] Unauthorized - no userId');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[Draft API] User authenticated:', userId);

    const body = await request.json();
    const projectConfig = body?.projectConfig;
    const projectId = body?.projectId; // Optional project ID for updating existing project

    if (!projectConfig || typeof projectConfig !== 'object') {
      console.log('[Draft API] Invalid payload');
      return NextResponse.json(
        { error: 'Invalid payload: projectConfig required' },
        { status: 400 }
      );
    }

    console.log('[Draft API] Project config received:', {
      projectId,
      name: projectConfig.name,
      description: projectConfig.description?.substring(0, 50),
      currentStep: projectConfig.currentStep,
      templateId: projectConfig.template?.id,
    });

    // Check if user has selected anything meaningful
    const hasTemplate = Boolean(projectConfig.template?.id);
    const hasName = Boolean(
      projectConfig.name &&
        projectConfig.name.trim() &&
        projectConfig.name !== 'Untitled Project'
    );
    const hasDescription = Boolean(
      projectConfig.description && projectConfig.description.trim()
    );
    const hasPlatformType = Boolean(projectConfig.platformType);
    const hasAnySelection =
      hasTemplate || hasName || hasDescription || hasPlatformType;

    // If creating a new draft (not updating) and nothing is selected, don't save
    if (!projectId && !hasAnySelection) {
      console.log('[Draft API] No selection made, skipping draft save');
      return NextResponse.json({ success: false, skipped: true });
    }

    const supabase = createSupabaseServiceRoleClient();

    const payload = {
      name: projectConfig.name || 'Untitled Project',
      description: projectConfig.description || '',
      data: JSON.stringify(projectConfig),
      template_id: projectConfig.template?.id || null,
      domain_type: projectConfig.domainConfig?.domainType || 'hosted',
      domain_name: projectConfig.domainConfig?.domain || null,
      domain_provider: projectConfig.domainConfig?.provider || 'platform',
      status: 'draft' as const,
      is_draft: true,
      user_id: userId,
    } as const;

    console.log('[Draft API] Saving with user_id:', userId);

    // If projectId is provided, update that specific project
    if (projectId) {
      console.log('[Draft API] Updating project draft:', projectId);

      // First check if the project exists and belongs to the user
      const existing = await supabase
        .from('projects')
        .select('id')
        .eq('id', projectId)
        .eq('user_id', userId)
        .eq('is_draft', true)
        .maybeSingle();

      if (existing.error) {
        console.error(
          '[Draft API] Error checking existing project:',
          existing.error
        );
        return NextResponse.json(
          { error: existing.error.message },
          { status: 500 }
        );
      }

      if (!existing.data) {
        console.log('[Draft API] Project not found, creating new one instead');
        // Project doesn't exist, create a new one
        const insert = await supabase
          .from('projects')
          .insert(payload)
          .select('id')
          .single();

        if (insert.error) {
          console.error('[Draft API] Insert failed:', insert.error);
          return NextResponse.json(
            { error: insert.error.message },
            { status: 500 }
          );
        }
        console.log('[Draft API] ✅ New draft created:', insert.data.id);
        return NextResponse.json({ success: true, projectId: insert.data.id });
      }

      // Update the existing project
      const update = await supabase
        .from('projects')
        .update(payload)
        .eq('id', projectId)
        .eq('user_id', userId)
        .select('id')
        .single();

      if (update.error) {
        console.error('[Draft API] Update failed:', update.error);
        return NextResponse.json(
          { error: update.error.message },
          { status: 500 }
        );
      }
      console.log('[Draft API] ✅ Project draft updated successfully');
      return NextResponse.json({ success: true, projectId: update.data.id });
    }

    // Create new draft project
    console.log('[Draft API] Creating new draft project');
    const insert = await supabase
      .from('projects')
      .insert(payload)
      .select('id')
      .single();

    if (insert.error) {
      console.error('[Draft API] Insert failed:', insert.error);
      return NextResponse.json(
        { error: insert.error.message },
        { status: 500 }
      );
    }
    console.log(
      '[Draft API] ✅ Draft project created successfully:',
      insert.data.id
    );
    return NextResponse.json({ success: true, projectId: insert.data.id });
  } catch (e) {
    console.error('[Draft API] Unexpected error:', e);
    return NextResponse.json(
      { error: 'Internal server error', details: e },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get auth token for cleanup API calls
    const authToken = await getToken();

    const supabase = createSupabaseServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    // If projectId is provided, delete that specific draft
    if (projectId) {
      // First get the draft details for cleanup
      const { data: draft } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .eq('user_id', userId)
        .eq('is_draft', true)
        .maybeSingle();

      // Clean up Convex data and Python workspace before deleting
      const cleanupResult = await cleanupDraftData(
        projectId,
        authToken,
        draft?.name
      );

      if (!cleanupResult.success) {
        console.warn(
          `[Draft Discard] Cleanup incomplete for ${projectId}: ${cleanupResult.error}`
        );
        // Continue with deletion even if cleanup fails
      }

      const del = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', userId)
        .eq('is_draft', true);

      if (del.error) {
        return NextResponse.json({ error: del.error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        cleanup: cleanupResult.success ? 'complete' : 'partial',
      });
    }

    // If no projectId, delete all user drafts (legacy behavior)
    // First get all draft IDs for cleanup
    const { data: drafts } = await supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', userId)
      .eq('is_draft', true);

    // Clean up each draft
    const cleanupResults: { projectId: string; success: boolean }[] = [];
    if (drafts && drafts.length > 0) {
      for (const draft of drafts) {
        const result = await cleanupDraftData(draft.id, authToken, draft.name);
        cleanupResults.push({ projectId: draft.id, success: result.success });
      }
    }

    const del = await supabase
      .from('projects')
      .delete()
      .eq('user_id', userId)
      .eq('is_draft', true);

    if (del.error) {
      return NextResponse.json({ error: del.error.message }, { status: 500 });
    }

    const allCleanedUp = cleanupResults.every((r) => r.success);
    return NextResponse.json({
      success: true,
      cleanup: allCleanedUp ? 'complete' : 'partial',
      cleanupResults,
    });
  } catch (e) {
    console.error('[Draft Discard] Error:', e);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
