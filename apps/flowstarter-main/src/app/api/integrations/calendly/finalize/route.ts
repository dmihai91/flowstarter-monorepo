import { useServerSupabaseWithAuth } from '@/hooks/useServerSupabase';
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Calendly Finalize] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}
