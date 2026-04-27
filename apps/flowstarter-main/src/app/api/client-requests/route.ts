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
  const claimRole = (
    sessionClaims?.metadata as { role?: string } | undefined
  )?.role?.toLowerCase();
  if (claimRole) return claimRole;

  const user = await currentUser();
  return (
    user?.publicMetadata as { role?: string } | undefined
  )?.role?.toLowerCase();
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
  // Omit original_prompt + editor_context — they can be large JSON; load via GET /api/client-requests/:id when needed.
  // NOTE: do not rely on FK joins here; some environments don't have `client_requests -> projects` relation.
  let query = db.from('client_requests').select(
    `
      id,
      project_id,
      client_user_id,
      title,
      description,
      status,
      priority,
      assigned_to,
      rejection_reason,
      created_at,
      accepted_at,
      resolved_at,
      workspace_session_id
      `
  );

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

  // Limit to 100 rows — no need to load everything
  query = query.limit(100);

  const { data, error } = await query;

  if (error) {
    console.error('[client-requests] list error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const projectIds = Array.from(
    new Set((data ?? []).map((row) => row.project_id).filter(Boolean))
  );

  let projectMap: Record<
    string,
    {
      name?: string | null;
      client_name?: string | null;
      client_email?: string | null;
    }
  > = {};

  if (projectIds.length > 0) {
    const { data: projectRows, error: projectError } = await db
      .from('projects')
      .select('id, name, client_name, client_email')
      .in('id', projectIds);

    if (projectError) {
      console.warn(
        '[client-requests] project hydration warning:',
        projectError
      );
    } else {
      // `client_name` / `client_email` may not be present in the generated
      // Supabase types in every environment; fall back through a runtime cast.
      type HydratedProjectRow = {
        id: string;
        name: string | null;
        client_name: string | null;
        client_email: string | null;
      };
      const typedRows = (projectRows ?? []) as unknown as HydratedProjectRow[];
      projectMap = Object.fromEntries(
        typedRows.map((project) => [
          project.id,
          {
            name: project.name,
            client_name: project.client_name,
            client_email: project.client_email,
          },
        ])
      );
    }
  }

  const hydrated = (data ?? []).map((request) => ({
    ...request,
    projects: projectMap[request.project_id] ?? null,
  }));

  return NextResponse.json(
    { requests: hydrated },
    {
      headers: {
        // Allow CDN/browser to cache for 10s, revalidate in background
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    }
  );
}
