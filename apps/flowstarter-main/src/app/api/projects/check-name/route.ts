import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/projects/check-name?name=xxx&excludeId=xxx
 * 
 * Checks if a project name already exists for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');
    const excludeId = searchParams.get('excludeId'); // Exclude current project when editing

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    let query = supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', userId)
      .ilike('name', name);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Check Name] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const exists = data && data.length > 0;
    
    return NextResponse.json({ 
      available: !exists,
      exists,
      existingProject: exists ? data[0] : null 
    });
  } catch (error) {
    console.error('[Check Name] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check name' },
      { status: 500 }
    );
  }
}
