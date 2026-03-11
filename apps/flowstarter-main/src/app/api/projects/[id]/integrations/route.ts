/**
 * GET  /api/projects/:id/integrations  — read integration status (no secrets)
 * POST /api/projects/:id/integrations  — save keys (encrypted via Vault)
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { storeSecret, deleteSecret } from '@/lib/vault';

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  await requireAuth();
  const { id } = await context.params;
  const supabase = createSupabaseServiceRoleClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, ga_property_id, ga_refresh_token_id, ga_connected_at, calendly_url, calendly_api_key_id, published_url, custom_domain, domain_status')
    .eq('id', id)
    .single();

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Return status without exposing secrets
  return NextResponse.json({
    analytics: {
      connected: !!project.ga_refresh_token_id,
      propertyId: project.ga_property_id || null,
      connectedAt: project.ga_connected_at || null,
    },
    calendly: {
      url: project.calendly_url || null,
      hasApiKey: !!project.calendly_api_key_id,
    },
    domain: {
      publishedUrl: project.published_url || null,
      customDomain: project.custom_domain || null,
      status: project.domain_status || 'none',
    },
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  await requireAuth();
  const { id: projectId } = await context.params;
  const body = (await request.json()) as {
    integration: 'calendly' | 'analytics';
    calendlyUrl?: string;
    calendlyApiKey?: string;
    gaPropertyId?: string;
    action?: 'connect' | 'disconnect';
  };

  const supabase = createSupabaseServiceRoleClient();

  // Verify project exists
  const { data: project } = await supabase
    .from('projects')
    .select('id, calendly_api_key_id, ga_refresh_token_id')
    .eq('id', projectId)
    .single();

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (body.integration === 'calendly') {
    if (body.action === 'disconnect') {
      // Delete vault secret + clear columns
      if (project.calendly_api_key_id) {
        await deleteSecret(supabase, project.calendly_api_key_id);
      }
      await supabase.from('projects').update({
        calendly_url: null,
        calendly_api_key_id: null,
      }).eq('id', projectId);

      return NextResponse.json({ success: true, message: 'Calendly disconnected' });
    }

    const update: Record<string, unknown> = {};
    if (body.calendlyUrl) update.calendly_url = body.calendlyUrl;

    // Encrypt API key in Vault
    if (body.calendlyApiKey) {
      const secretId = await storeSecret(
        supabase, projectId, 'calendly_api_key', body.calendlyApiKey,
        'Calendly Personal Access Token',
      );
      update.calendly_api_key_id = secretId;
    }

    if (Object.keys(update).length > 0) {
      await supabase.from('projects').update(update).eq('id', projectId);
    }

    return NextResponse.json({ success: true, message: 'Calendly settings saved' });
  }

  if (body.integration === 'analytics') {
    if (body.action === 'disconnect') {
      if (project.ga_refresh_token_id) {
        await deleteSecret(supabase, project.ga_refresh_token_id);
      }
      await supabase.from('projects').update({
        ga_property_id: null,
        ga_refresh_token_id: null,
        ga_connected_at: null,
      }).eq('id', projectId);

      return NextResponse.json({ success: true, message: 'Analytics disconnected' });
    }

    if (body.gaPropertyId) {
      await supabase.from('projects').update({
        ga_property_id: body.gaPropertyId,
      }).eq('id', projectId);
    }

    return NextResponse.json({ success: true, message: 'Analytics settings saved' });
  }

  return NextResponse.json({ error: 'Unknown integration' }, { status: 400 });
}
