/**
 * GET /api/calendly/events?projectId=xxx&days=30
 * Fetches upcoming Calendly meetings using Vault-encrypted API key.
 */
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import { readCalendlyAccessTokenForProject } from '@/lib/calendly-project-sync';
import { fetchUpcomingEvents } from '@/lib/calendly-events';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) return authResult.response;

  const { userId } = authResult;
  const projectId = request.nextUrl.searchParams.get('projectId');
  const days = parseInt(request.nextUrl.searchParams.get('days') || '30');

  if (!projectId)
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const supabase = createSupabaseServiceRoleClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (project.user_id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const apiKey = await readCalendlyAccessTokenForProject({
    supabase,
    projectId,
    userId,
  });

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Calendly not configured' },
      { status: 400 }
    );
  }

  try {
    const events = await fetchUpcomingEvents(apiKey, days);
    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch events',
      },
      { status: 500 }
    );
  }
}
