import { enrichProject } from '@/lib/ai/enrich-project';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RequestSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const parsed = RequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const result = await enrichProject(parsed.data.description);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[Enrich API] Error:', error);
    return NextResponse.json(
      { error: 'Enrichment failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}
