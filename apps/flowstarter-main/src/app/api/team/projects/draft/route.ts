import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * POST /api/team/projects/draft
 * 
 * Creates a draft project for the team wizard
 */
export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: 'Untitled Project',
        description: '',
        user_id: userId,
        status: 'draft',
        is_draft: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Draft API] Error creating draft:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[Draft API] Draft project created:', data.id);
    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error('[Draft API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create draft project' },
      { status: 500 }
    );
  }
}
