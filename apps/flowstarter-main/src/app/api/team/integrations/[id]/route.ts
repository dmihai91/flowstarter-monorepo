import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

async function requireTeamAuth() {
  const { userId } = await auth();
  if (!userId) {
    return { authorized: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const user = await currentUser();
  const metadata = user?.publicMetadata as { role?: string } | undefined;
  const role = metadata?.role?.toLowerCase();
  
  if (role !== 'team' && role !== 'admin') {
    return { authorized: false, response: NextResponse.json({ error: 'Not a team member' }, { status: 403 }) };
  }

  return { authorized: true, userId, role };
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * GET /api/team/integrations/[id]
 * Get a single integration (without the raw API key)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireTeamAuth();
  if (!authCheck.authorized) return authCheck.response;

  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('team_integrations')
      .select('id, project_id, integration_type, name, config, is_active, created_at, updated_at, created_by')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    return NextResponse.json({ integration: data });
  } catch (error) {
    console.error('[Team Integrations] Get error:', error);
    return NextResponse.json({ error: 'Failed to fetch integration' }, { status: 500 });
  }
}

/**
 * PATCH /api/team/integrations/[id]
 * Update integration config or API key
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireTeamAuth();
  if (!authCheck.authorized) return authCheck.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, config, apiKey, isActive } = body;

    const supabase = getSupabaseAdmin();

    // Build update object
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (config !== undefined) updates.config = config;
    if (isActive !== undefined) updates.is_active = isActive;

    // Update the integration record if there are changes
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('team_integrations')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        console.error('[Team Integrations] Update error:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    // If a new API key is provided, update it in the vault
    if (apiKey) {
      // First delete the old secret, then create a new one
      const { error: vaultError } = await supabase.rpc('store_integration_secret', {
        p_integration_id: id,
        p_api_key: apiKey,
        p_key_name: 'api_key',
      });

      if (vaultError) {
        console.error('[Team Integrations] Vault update error:', vaultError);
        return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 });
      }
    }

    console.info('[Team Integrations] Updated integration', {
      id,
      updatedBy: authCheck.userId,
      hasNewApiKey: !!apiKey,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Team Integrations] Error:', error);
    return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 });
  }
}

/**
 * DELETE /api/team/integrations/[id]
 * Delete integration and its encrypted key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireTeamAuth();
  if (!authCheck.authorized) return authCheck.response;

  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // Use the function that deletes both integration and vault secret
    const { error } = await supabase.rpc('delete_integration_with_secret', {
      p_integration_id: id,
    });

    if (error) {
      console.error('[Team Integrations] Delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.info('[Team Integrations] Deleted integration', {
      id,
      deletedBy: authCheck.userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Team Integrations] Error:', error);
    return NextResponse.json({ error: 'Failed to delete integration' }, { status: 500 });
  }
}
