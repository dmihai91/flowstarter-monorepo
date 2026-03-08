import { enrichProject } from '@/lib/ai/enrich-project';
import { requireAuth } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RequestSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) return authResult.response;

    const json = await request.json();
    const parsed = RequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const result = await enrichProject(parsed.data.description);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Enrich API] Error:', error);
    return NextResponse.json(
      { error: 'Enrichment failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}
