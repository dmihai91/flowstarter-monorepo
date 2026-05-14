import { NextResponse } from 'next/server';
import { aiModerateContent } from '@/lib/ai/moderate';

type ModerateBody = {
  content?: unknown;
  type?: unknown;
  businessInfo?: {
    description?: unknown;
    industry?: unknown;
    businessType?: unknown;
    goals?: unknown;
    services?: unknown;
  };
};

function pickDescription(body: ModerateBody): string {
  if (typeof body.content === 'string' && body.content.trim()) {
    return body.content.trim();
  }
  const d = body.businessInfo?.description;
  if (typeof d === 'string' && d.trim()) return d.trim();
  return '';
}

/**
 * POST /api/ai/moderate
 *
 * Accepts either `{ content }` (useAI hook) or `{ businessInfo: { description, ... } }` (assistant-api).
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as ModerateBody;
  const description = pickDescription(body);
  if (!description) {
    return NextResponse.json(
      { error: 'content or businessInfo.description is required' },
      { status: 400 }
    );
  }

  const bi = body.businessInfo;
  const result = await aiModerateContent({
    description,
    industry: typeof bi?.industry === 'string' ? bi.industry : undefined,
    businessType:
      typeof bi?.businessType === 'string' ? bi.businessType : undefined,
    goals: typeof bi?.goals === 'string' ? bi.goals : undefined,
    services: typeof bi?.services === 'string' ? bi.services : undefined,
  });

  const allowed = result.isProhibited !== true;

  return NextResponse.json({
    allowed,
    reason: result.reasons?.[0],
    flagged_categories: result.categories ?? [],
  });
}
