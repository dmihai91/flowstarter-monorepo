import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DatabaseExtended } from '@/lib/database-extensions.types';

const createSchema = z.object({
  sessionId: z.string().min(8).max(120),
  message: z.string().min(1).max(5000),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        text: z.string().min(1).max(1200),
      })
    )
    .max(12)
    .optional(),
});

async function resolveRole(): Promise<string | undefined> {
  const { sessionClaims } = await auth();
  return (
    sessionClaims?.metadata as { role?: string } | undefined
  )?.role?.toLowerCase();
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { sessionId, message, history = [] } = parsed.data;
  const db =
    createSupabaseServiceRoleClient() as unknown as SupabaseClient<DatabaseExtended>;

  const transcript = history
    .slice(-8)
    .map(
      (entry) =>
        `${entry.role === 'user' ? 'User' : 'Assistant'}: ${entry.text}`
    )
    .join('\n');

  const composedMessage = transcript
    ? `${message}\n\n--- Context ---\n${transcript}`
    : message;

  const { data, error } = await db
    .from('contact_submissions')
    .insert({
      name: 'Landing Support Visitor',
      email: `support+${sessionId}@flowstarter.app`,
      subject: 'Operator request',
      message: composedMessage,
      notes: null,
    })
    .select('id, created_at')
    .single();

  if (error) {
    console.error('[support-operator-requests] create error', error);
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { id: data.id, created_at: data.created_at },
    { status: 201 }
  );
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await resolveRole();
  if (role !== 'team' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db =
    createSupabaseServiceRoleClient() as unknown as SupabaseClient<DatabaseExtended>;

  const { data, error } = await db
    .from('contact_submissions')
    .select('id, email, message, created_at, responded_at, notes')
    .eq('subject', 'Operator request')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[support-operator-requests] list error', error);
    return NextResponse.json(
      { error: 'Failed to load requests' },
      { status: 500 }
    );
  }

  return NextResponse.json({ requests: data ?? [] });
}
