import 'server-only';
import { requireAuthWithSupabase } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CONVEX_SITE_URL =
  process.env.CONVEX_SITE_URL ||
  (process.env.NEXT_PUBLIC_CONVEX_URL || '').replace(
    '.convex.cloud',
    '.convex.site'
  );

const HANDOFF_SECRET =
  process.env.HANDOFF_SECRET || process.env.NEXT_PUBLIC_HANDOFF_SECRET || '';

const EDITOR_URL =
  process.env.NEXT_PUBLIC_EDITOR_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://editor.flowstarter.dev'
    : 'http://localhost:5173');

const bodySchema = z.object({
  clientEmail: z.string().email(),
  clientName: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithSupabase(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  const { supabase } = authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { clientEmail, clientName } = parsed.data;

    // Verify project exists and get its Convex conversation ID
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, data')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create magic link via Convex editor backend
    if (!CONVEX_SITE_URL) {
      return NextResponse.json(
        { error: 'Editor backend not configured' },
        { status: 502 }
      );
    }

    const convexRes = await fetch(`${CONVEX_SITE_URL}/magicLinks/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-handoff-secret': HANDOFF_SECRET || 'dev-secret',
      },
      body: JSON.stringify({
        projectId: project.id,
        clientEmail,
        clientName,
        accessLevel: 'customize',
      }),
    });

    if (!convexRes.ok) {
      console.error(
        '[send-to-client] Convex magic link creation failed:',
        convexRes.status
      );
      return NextResponse.json(
        { error: 'Failed to create client access link' },
        { status: 502 }
      );
    }

    const convexData = (await convexRes.json()) as { token?: string };
    const token = convexData.token;

    if (!token) {
      return NextResponse.json(
        { error: 'No token returned from editor backend' },
        { status: 502 }
      );
    }

    // Update project status to ready_for_review
    await supabase
      .from('projects')
      .update({ status: 'ready_for_review' })
      .eq('id', id);

    const editorUrl = `${EDITOR_URL}/access/${token}`;

    return NextResponse.json({
      success: true,
      magicLinkToken: token,
      editorUrl,
    });
  } catch (error) {
    console.error('[send-to-client] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send to client' },
      { status: 500 }
    );
  }
}
