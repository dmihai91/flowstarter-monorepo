import { NextRequest, NextResponse } from 'next/server';
import { requireTeamAuth } from '@/lib/api-auth';
import { enrichProject } from '@/lib/ai/enrich-project';

/**
 * POST /api/team/ai/extract-brief
 *
 * Admin-only AI helper. Takes raw discovery-call notes (or any free-form
 * text describing a client's business) and returns a structured project
 * brief: business name, description, industry, audience, UVP, goal,
 * brand tone, offerings, contact details.
 *
 * Used from the team admin "New project" form to pre-fill fields after a
 * discovery call. Saves 5-10 minutes per project setup.
 *
 * Body: { text: string }
 *
 * Response (status complete):
 *   { status: 'complete', siteName, description, industry, ... }
 * Response (needs more info):
 *   { status: 'needsMoreInfo', followUpQuestions: string[] }
 */
export async function POST(req: NextRequest) {
  const auth = await requireTeamAuth();
  if (!auth.authorized) return auth.response;

  const body = (await req.json().catch(() => ({}))) as { text?: unknown };

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (text.length < 10) {
    return NextResponse.json(
      { error: 'text is required (min 10 chars)' },
      { status: 400 }
    );
  }
  if (text.length > 8000) {
    return NextResponse.json(
      { error: 'text is too long (max 8000 chars)' },
      { status: 400 }
    );
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: 'OPENROUTER_API_KEY is not configured' },
      { status: 500 }
    );
  }

  try {
    const result = await enrichProject(text);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'AI extraction failed' },
      { status: 502 }
    );
  }
}
