import { NextResponse } from 'next/server';
import { classifyProject } from '@/lib/ai/classify-project';

/**
 * POST /api/ai/classify-project
 * Body: { description: string }
 * Returns: { industry, template, confidence } for legacy hooks (`useAIClassify`).
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    description?: unknown;
  };
  const description =
    typeof body.description === 'string' ? body.description.trim() : '';
  if (!description) {
    return NextResponse.json(
      { error: 'description is required' },
      { status: 400 }
    );
  }

  try {
    const r = await classifyProject(description);
    const confidence = (r.confidence.platformType + r.confidence.industry) / 2;
    return NextResponse.json({
      industry: r.industry,
      template: r.platformType,
      confidence,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Classification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
