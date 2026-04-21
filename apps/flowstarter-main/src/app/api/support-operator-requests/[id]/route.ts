import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DatabaseExtended } from '@/lib/database-extensions.types';

const handleSchema = z.object({
  response: z.string().min(1).max(3000),
});

async function resolveRole(): Promise<string | undefined> {
  const { sessionClaims } = await auth();
  return (
    sessionClaims?.metadata as { role?: string } | undefined
  )?.role?.toLowerCase();
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await resolveRole();
  if (role !== 'team' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = handleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { id } = await params;
  const db =
    createSupabaseServiceRoleClient() as unknown as SupabaseClient<DatabaseExtended>;

  const { data, error } = await db
    .from('contact_submissions')
    .update({
      responded_at: new Date().toISOString(),
      notes: parsed.data.response,
      read_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('subject', 'Operator request')
    .select('id, responded_at, notes')
    .single();

  if (error) {
    console.error('[support-operator-requests] handle error', error);
    return NextResponse.json(
      { error: 'Failed to handle request' },
      { status: 500 }
    );
  }

  return NextResponse.json({ request: data });
}
