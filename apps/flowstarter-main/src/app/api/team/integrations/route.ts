import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

async function requireTeamAuth() {
  const { userId } = await auth();
  if (!userId) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const user = await currentUser();
  const metadata = user?.publicMetadata as { role?: string } | undefined;
  const role = metadata?.role?.toLowerCase();

  if (role !== 'team' && role !== 'admin') {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Not a team member' },
        { status: 403 }
      ),
    };
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
 * GET /api/team/integrations
 * List all integrations (optionally filtered by project)
 */
export async function GET(request: NextRequest) {
  const authCheck = await requireTeamAuth();
  if (!authCheck.authorized) return authCheck.response;

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('team_integrations')
      .select(
        'id, project_id, integration_type, name, config, is_active, created_at, updated_at, created_by'
      )
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Team Integrations] List error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ integrations: data ?? [] });
  } catch (error) {
    console.error('[Team Integrations] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/team/integrations
 * Create a new integration with encrypted API key
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireTeamAuth();
  if (!authCheck.authorized) return authCheck.response;

  try {
    const body = await request.json();
    const { projectId, integrationType, name, apiKey, config } = body;

    // Validate required fields
    if (!projectId || !integrationType || !apiKey) {
      return NextResponse.json(
        {
          error: 'Missing required fields: projectId, integrationType, apiKey',
        },
        { status: 400 }
      );
    }

    // Validate integration type
    if (!['calendly', 'mailchimp'].includes(integrationType)) {
      return NextResponse.json(
        { error: 'Invalid integration type. Supported: calendly, mailchimp' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // First, create the integration record
    const { data: integration, error: insertError } = await supabase
      .from('team_integrations')
      .insert({
        project_id: projectId,
        integration_type: integrationType,
        name: name || `${integrationType} integration`,
        config: config || {},
        created_by: authCheck.userId,
      })
      .select()
      .single();

    if (insertError) {
      // Check for duplicate
      if (insertError.code === '23505') {
        return NextResponse.json(
          {
            error: `${integrationType} integration already exists for this project`,
          },
          { status: 409 }
        );
      }
      console.error('[Team Integrations] Insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Store the API key in Vault (encrypted)
    const { error: vaultError } = await supabase.rpc(
      'store_integration_secret',
      {
        p_integration_id: integration.id,
        p_api_key: apiKey,
        p_key_name: 'api_key',
      }
    );

    if (vaultError) {
      // Rollback - delete the integration if vault storage fails
      await supabase
        .from('team_integrations')
        .delete()
        .eq('id', integration.id);
      console.error('[Team Integrations] Vault error:', vaultError);
      return NextResponse.json(
        { error: 'Failed to store API key securely' },
        { status: 500 }
      );
    }

    console.info('[Team Integrations] Created integration', {
      id: integration.id,
      type: integrationType,
      projectId,
      createdBy: authCheck.userId,
    });

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        project_id: integration.project_id,
        integration_type: integration.integration_type,
        name: integration.name,
        config: integration.config,
        is_active: integration.is_active,
        created_at: integration.created_at,
      },
    });
  } catch (error) {
    console.error('[Team Integrations] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create integration' },
      { status: 500 }
    );
  }
}
