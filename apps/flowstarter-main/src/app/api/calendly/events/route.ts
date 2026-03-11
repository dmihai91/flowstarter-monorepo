/**
 * GET /api/calendly/events?projectId=xxx&days=30
 * Fetches upcoming Calendly meetings using Vault-encrypted API key.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { readSecret } from '@/lib/vault';
import { fetchUpcomingEvents } from '@/lib/calendly-events';

export async function GET(request: NextRequest) {
  await requireAuth();
  const projectId = request.nextUrl.searchParams.get('projectId');
  const days = parseInt(request.nextUrl.searchParams.get('days') || '30');

  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const supabase = createSupabaseServiceRoleClient();

  const { data: project } = await supabase
    .from('projects')
    .select('calendly_api_key_id, calendly_url')
    .eq('id', projectId)
    .single();

  if (!project?.calendly_api_key_id) {
    return NextResponse.json({ error: 'Calendly not configured with API key' }, { status: 400 });
  }

  const apiKey = await readSecret(supabase, project.calendly_api_key_id);
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not found in vault' }, { status: 500 });
  }

  try {
    const events = await fetchUpcomingEvents(apiKey, days);
    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch events',
    }, { status: 500 });
  }
}
