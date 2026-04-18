import 'server-only';
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import type { Json } from '@/lib/database.types';

const bodySchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  originalPrompt: z.string().max(10000).optional(),
  editorContext: z
    .object({
      activeFile: z.string().optional(),
      selection: z.object({ start: z.number(), end: z.number() }).optional(),
      componentTree: z.record(z.unknown()).optional(),
      capabilityReason: z.string(),
    })
    .optional(),
  priority: z
    .enum(['low', 'normal', 'high', 'urgent'])
    .optional()
    .default('normal'),
});

async function resolveRole(): Promise<string | undefined> {
  const { sessionClaims } = await auth();
  let role = (
    sessionClaims?.metadata as { role?: string } | undefined
  )?.role?.toLowerCase();
  if (!role) {
    const user = await currentUser();
    role = (
      user?.publicMetadata as { role?: string } | undefined
    )?.role?.toLowerCase();
  }
  return role;
}

// POST — called by the constrained client editor when a request is out of scope.
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    projectId,
    title,
    description,
    originalPrompt,
    editorContext,
    priority,
  } = parsed.data;

  const db = createSupabaseServiceRoleClient();

  // Verify the client owns this project.
  const { data: project, error: projectError } = await db
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (projectError || !project) {
    return NextResponse.json(
      { error: 'Project not found or access denied' },
      { status: 403 }
    );
  }

  const { data, error } = await db
    .from('client_requests')
    .insert({
      project_id: projectId,
      client_user_id: userId,
      title,
      description,
      original_prompt: originalPrompt ?? null,
      editor_context: (editorContext ?? null) as Json | null,
      priority,
      status: 'pending',
    })
    .select('id, created_at')
    .single();

  if (error) {
    console.error('[client-requests] insert error:', error);
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

// GET — team dashboard fetches the request list.
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await resolveRole();
  if (role !== 'team' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';
  const sort = searchParams.get('sort') || 'newest';
  const search = searchParams.get('search') || '';

  const db = createSupabaseServiceRoleClient();
  let query = db
    .from('client_requests')
    .select('*, projects(name, client_name, client_email)');

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  if (search) {
    const escaped = search.replace(/[,()]/g, ' ').trim();
    if (escaped) {
      query = query.or(
        `title.ilike.%${escaped}%,description.ilike.%${escaped}%`
      );
    }
  }

  if (sort === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else if (sort === 'priority') {
    query = query
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error('[client-requests] list error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data ?? [] });
}
