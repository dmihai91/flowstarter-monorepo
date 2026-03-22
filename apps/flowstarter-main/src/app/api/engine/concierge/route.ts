import { requireAuth } from '@/lib/api-auth';
import { IntakeInputSchema } from '@/lib/engine/contracts';
import { runConciergePipeline } from '@/lib/engine/pipeline';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const parsed = IntakeInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await runConciergePipeline(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Engine Concierge] Error:', error);
    return NextResponse.json(
      { error: 'Engine pipeline failed' },
      { status: 500 }
    );
  }
}
