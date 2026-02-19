/* eslint-disable @typescript-eslint/no-explicit-any */
import { auditAiEvent } from '@/lib/ai/audit';
import { evaluateDescriptionSufficiency } from '@/lib/ai/description-sufficiency';
import { moderateBusinessInfo } from '@/lib/ai/project-details';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const BodySchema = z.object({
  businessInfo: z
    .object({
      description: z.string().optional(),
      industry: z.string().optional(),
      businessType: z.string().optional(),
    })
    .strict(),
});

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  let userId: string | null = null;
  let sessionClaims: Record<string, any> | undefined;

  try {
    const authRes = await auth();
    userId = authRes.userId ?? null;
    sessionClaims = (authRes as any).sessionClaims;
  } catch {
    // Auth failed, continue with null userId
  }

  try {
    const json = await request.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      await auditAiEvent({
        req: request,
        userId,
        sessionClaims,
        route: '/api/ai/evaluate-description',
        agent: 'project-suggestions',
        action: 'validation-error',
        status: 'error',
        context: json,
        meta: { zodErrors: parsed.error.flatten() },
      });
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const businessInfo = parsed.data.businessInfo;
    const description = (businessInfo.description || '').trim();

    // Run safety check; if prohibited, short-circuit
    const moderation = await moderateBusinessInfo({
      description,
      industry: businessInfo.industry || 'general',
      businessType: businessInfo.businessType || 'business',
    });

    if ((moderation as any)?.isProhibited) {
      await auditAiEvent({
        req: request,
        userId,
        sessionClaims,
        route: '/api/ai/evaluate-description',
        agent: 'project-suggestions',
        action: 'moderation-rejected',
        status: 'error',
        context: { businessInfo },
        meta: { reasons: (moderation as any)?.reasons },
      });
      return NextResponse.json(
        {
          error: 'Content Policy Violation',
          message:
            'We cannot process your request as it appears to involve prohibited activities or content.',
          details: (moderation as any)?.reasons || [],
          code: 'CONTENT_REJECTED',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Evaluate sufficiency using AI
    const result = await evaluateDescriptionSufficiency({
      description,
      industry: businessInfo.industry,
      businessType: businessInfo.businessType,
    });

    await auditAiEvent({
      req: request,
      userId,
      sessionClaims,
      route: '/api/ai/evaluate-description',
      agent: 'project-suggestions',
      action: 'sufficiency-evaluated',
      status: 'ok',
      context: { length: description.length },
      meta: { durationMs: Date.now() - startedAt, result },
    });

    return NextResponse.json({ result });
  } catch (error) {
    await auditAiEvent({
      req: request,
      userId,
      sessionClaims,
      route: '/api/ai/evaluate-description',
      agent: 'project-suggestions',
      action: 'internal-error',
      status: 'error',
      meta: { error: error instanceof Error ? error.message : 'Unknown error' },
    });
    return NextResponse.json(
      { error: 'Failed to evaluate description' },
      { status: 500 }
    );
  }
}
