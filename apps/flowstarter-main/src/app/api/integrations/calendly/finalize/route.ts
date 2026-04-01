import { useServerSupabaseWithAuth } from '@/hooks/useServerSupabase';
import { syncCalendlySelectionToProject } from '@/lib/calendly-project-sync';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await useServerSupabaseWithAuth();

    const body = await req.json().catch(() => ({}));
    // Calendly finalize might receive config directly or via selection
    const config = body.config || body.selection || body;
    const eventUrl =
      typeof config?.url === 'string'
        ? config.url
        : typeof config?.eventUrl === 'string'
        ? config.eventUrl
        : typeof config?.event_url === 'string'
        ? config.event_url
        : undefined;

    // Save integration configuration to database
    const { error } = await supabase.from('user_integrations').upsert(
      {
        user_id: userId,
        integration_id: 'calendly',
        config: config,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,integration_id',
      }
    );

    if (error) {
      console.error('[Calendly Finalize] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const syncedProjectId = await syncCalendlySelectionToProject({
      supabase,
      userId,
      eventUrl,
    });

    return NextResponse.json({ success: true, syncedProjectId });
  } catch (error) {
    console.error('[Calendly Finalize] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}
