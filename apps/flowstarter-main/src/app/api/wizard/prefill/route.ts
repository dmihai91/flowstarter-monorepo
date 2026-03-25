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

  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name:        clientInfo.name ? clientInfo.name + ' — Draft' : 'Quick Draft',
      description: userInput?.slice(0, 500) ?? '',
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

  return NextResponse.json({ id: data.id, prefillId: data.id });
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

// PATCH — update existing draft (client info, userInput, aiResponse)
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const body = await request.json() as {
    clientInfo?:  { name: string; email: string; phone: string };
    userInput?:   string;
    aiResponse?:  Record<string, unknown>;
  };

  const supabase = createSupabaseServiceRoleClient();

  // Load existing data
  const { data: existing, error: fetchError } = await supabase
    .from('projects')
    .select('id, data, user_id, status')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const prevData = typeof existing.data === 'string'
    ? JSON.parse(existing.data as string)
    : (existing.data ?? {}) as Record<string, unknown>;

  const prevPrefill = (prevData?.prefill ?? {}) as Record<string, unknown>;

  const merged = {
    ...prevData,
    prefill: {
      ...prevPrefill,
      ...(body.clientInfo  && { clientInfo:  body.clientInfo }),
      ...(body.userInput   && { userInput:   body.userInput  }),
      ...(body.aiResponse  && { aiResponse:  body.aiResponse }),
      updatedAt: new Date().toISOString(),
    },
  };

  const nameFromClient = body.clientInfo?.name;
  const updatePayload: Record<string, unknown> = { data: JSON.stringify(merged) };
  if (nameFromClient) updatePayload.name = nameFromClient + ' — Draft';

  const { error: updateError } = await supabase
    .from('projects')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', userId);

  if (updateError) {
    console.error('[wizard/prefill] Update error:', updateError);
    return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
  }

  return NextResponse.json({ id });
}
