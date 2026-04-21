import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DatabaseExtended } from '@/lib/database-extensions.types';

const sessionSchema = z.string().min(8).max(120);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const parsed = sessionSchema.safeParse(sessionId);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
  }

  const email = `support+${parsed.data}@flowstarter.app`;
  const db =
    createSupabaseServiceRoleClient() as unknown as SupabaseClient<DatabaseExtended>;

  const { data, error } = await db
    .from('contact_submissions')
    .select('id, responded_at, notes')
    .eq('subject', 'Operator request')
    .eq('email', email)
    .not('responded_at', 'is', null)
    .order('responded_at', { ascending: true })
    .limit(30);

  if (error) {
    console.error('[support-operator-requests] session fetch error', error);
    return NextResponse.json(
      { error: 'Failed to fetch updates' },
      { status: 500 }
    );
  }

  const handled = (data ?? [])
    .filter((row) => Boolean(row.notes))
    .map((row) => ({
      id: row.id,
      respondedAt: row.responded_at,
      response: row.notes,
    }));

  return NextResponse.json({ handled });
}
