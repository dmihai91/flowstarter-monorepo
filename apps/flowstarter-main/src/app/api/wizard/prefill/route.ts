import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';

// POST — store QuickScaffold prefill as a draft project row
export async function POST(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    clientInfo:  { name: string; email: string; phone: string };
    userInput:   string;
    aiResponse?: Record<string, unknown>;
  };

  const { clientInfo, userInput, aiResponse } = body;
  if (!userInput?.trim()) {
    return NextResponse.json({ error: 'userInput required' }, { status: 400 });
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name:        clientInfo.name ? clientInfo.name + ' — Draft' : 'Quick Draft',
      description: userInput.slice(0, 500),
      status:      'prefill',
      is_draft:    true,
      user_id:     userId,
      data: JSON.stringify({
        prefill: {
          clientInfo,
          userInput,
          aiResponse: aiResponse ?? null,
          createdAt:  new Date().toISOString(),
        },
      }),
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[wizard/prefill] Insert error:', error);
    return NextResponse.json({ error: 'Failed to save prefill' }, { status: 500 });
  }

  return NextResponse.json({ prefillId: data.id });
}

// GET — load prefill by project id
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from('projects')
    .select('id, data, status')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (data.status !== 'prefill') return NextResponse.json({ error: 'Not a prefill draft' }, { status: 410 });

  const parsed = typeof data.data === 'string' ? JSON.parse(data.data as string) : data.data;
  return NextResponse.json({ prefill: (parsed as Record<string, unknown>)?.prefill ?? null });
}
