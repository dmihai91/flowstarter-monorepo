import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/supabase-clients/server';
import { verifyHandoffToken } from '@/app/api/editor/handoff/route';

function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length).trim();
}

function parseProjectData(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed && typeof parsed === 'object'
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

async function authenticate(request: NextRequest) {
  const token = getBearerToken(request);
  if (!token) {
    return {
      error: NextResponse.json(
        { error: 'Missing bearer token' },
        { status: 401 }
      ),
    };
  }

  const payload = verifyHandoffToken(token);
  if (!payload) {
    return {
      error: NextResponse.json(
        { error: 'Invalid or expired handoff token' },
        { status: 401 }
      ),
    };
  }

  return { payload };
}

export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if ('error' in auth) {
    return auth.error;
  }

  const projectId =
    request.nextUrl.searchParams.get('projectId') || auth.payload.projectId;
  if (projectId !== auth.payload.projectId) {
    return NextResponse.json({ error: 'Project mismatch' }, { status: 403 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: project, error } = await supabase
    .from('projects')
    .select(
      'id, name, description, data, template_id, template_slug, updated_at'
    )
    .eq('id', projectId)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      templateId: project.template_id,
      templateSlug: project.template_slug,
      updatedAt: project.updated_at,
      data: parseProjectData(project.data),
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request);
  if ('error' in auth) {
    return auth.error;
  }

  const body = (await request.json().catch(() => null)) as {
    projectId?: string;
    data?: Record<string, unknown>;
  } | null;

  if (!body?.projectId || !body?.data) {
    return NextResponse.json(
      { error: 'projectId and data are required' },
      { status: 400 }
    );
  }

  if (body.projectId !== auth.payload.projectId) {
    return NextResponse.json({ error: 'Project mismatch' }, { status: 403 });
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, data')
    .eq('id', body.projectId)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const existingData = parseProjectData(project.data);
  const mergedData = {
    ...existingData,
    ...body.data,
    syncVersion: Date.now(),
  };

  const { error: updateError } = await supabase
    .from('projects')
    .update({
      data: JSON.stringify(mergedData),
    })
    .eq('id', body.projectId);

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to sync project' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
