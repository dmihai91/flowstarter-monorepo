/**
 * GET    /api/admin/custom-inquiries/[id]  – fetch one inquiry, full body.
 * PATCH  /api/admin/custom-inquiries/[id]  – admin notes / status update.
 *
 * Admin-only. Service role behind Clerk team auth.
 */
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveUserRole } from '@/lib/api-auth';

function adminStore() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function assertTeam() {
  const { userId } = await auth();
  if (!userId) return { error: 'Unauthorized', status: 401 } as const;
  const role = await resolveUserRole(userId);
  if (role !== 'team' && role !== 'admin') {
    return { error: 'Not a team member', status: 403 } as const;
  }
  return { userId } as const;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await assertTeam();
    if ('error' in guard) {
      return NextResponse.json(
        { error: guard.error },
        { status: guard.status }
      );
    }

    const { id } = await params;
    const supabase = adminStore();
    if (!supabase) {
      return NextResponse.json({ error: 'Not configured' }, { status: 500 });
    }

    const { data, error } = await supabase
      .from('custom_inquiries')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ inquiry: data });
  } catch (err) {
    console.error('[admin/custom-inquiries/:id] GET', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

const PatchSchema = z.object({
  admin_notes: z.string().max(5000).optional(),
  status: z
    .enum([
      'pending_review',
      'approved',
      'rejected',
      'scheduled',
      'completed',
      'archived',
    ])
    .optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await assertTeam();
    if ('error' in guard) {
      return NextResponse.json(
        { error: guard.error },
        { status: guard.status }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid' },
        { status: 400 }
      );
    }
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ ok: true });
    }

    const supabase = adminStore();
    if (!supabase) {
      return NextResponse.json({ error: 'Not configured' }, { status: 500 });
    }

    const { error } = await supabase
      .from('custom_inquiries')
      .update(parsed.data)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/custom-inquiries/:id] PATCH', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
