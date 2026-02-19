import { useServerSupabaseWithAuth } from '@/hooks/useServerSupabase';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// GET all integrations for the current user
export async function GET() {
  try {
    const session = await auth();
    const userId = session.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await useServerSupabaseWithAuth();

    const { data, error } = await supabase
      .from('user_integrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Integrations] GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to a map of integration_id -> config
    const integrationsMap: Record<string, Record<string, string>> = {};
    for (const integration of data || []) {
      integrationsMap[integration.integration_id] =
        (integration.config as Record<string, string>) || {};
    }

    return NextResponse.json({ integrations: integrationsMap });
  } catch (error) {
    console.error('[Integrations] GET error', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

// POST/UPDATE an integration for the current user
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await useServerSupabaseWithAuth();

    const body = await request.json();
    const { integrationId, config } = body;

    if (!integrationId || !config) {
      return NextResponse.json(
        { error: 'integrationId and config are required' },
        { status: 400 }
      );
    }

    // Upsert the integration
    const { data, error } = await supabase
      .from('user_integrations')
      .upsert(
        {
          user_id: userId,
          integration_id: integrationId,
          config: config,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,integration_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[Integrations] POST error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, integration: data });
  } catch (error) {
    console.error('[Integrations] POST error', error);
    return NextResponse.json(
      { error: 'Failed to save integration' },
      { status: 500 }
    );
  }
}

// DELETE an integration for the current user
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await useServerSupabaseWithAuth();

    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('integrationId');

    if (!integrationId) {
      return NextResponse.json(
        { error: 'integrationId is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('user_integrations')
      .delete()
      .eq('user_id', userId)
      .eq('integration_id', integrationId);

    if (error) {
      console.error('[Integrations] DELETE error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Integrations] DELETE error', error);
    return NextResponse.json(
      { error: 'Failed to delete integration' },
      { status: 500 }
    );
  }
}
