import { auditAiEvent } from '@/lib/ai/audit';
import { classifyProject } from '@/lib/ai/classify-project';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RequestSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
});

export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const parsed = RequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { prompt } = parsed.data;

    console.log(
      `[${requestId}] Classifying project from prompt (${prompt.length} chars)`
    );
    const startTime = Date.now();

    const result = await classifyProject(prompt);

    const duration = Date.now() - startTime;
    console.log(
      `[${requestId}] Classification completed in ${duration}ms:`,
      result
    );

    // Audit the classification
    await auditAiEvent({
      req: request,
      userId,
      sessionClaims,
      route: '/api/ai/classify-project',
      agent: 'project-classifier',
      action: 'classify',
      context: { prompt: prompt.substring(0, 200) },
      result,
      status: 'ok',
      meta: { duration },
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(`[${requestId}] Classification error:`, error);

    try {
      const { userId, sessionClaims } = await auth();
      if (userId) {
        await auditAiEvent({
          req: request,
          userId,
          sessionClaims,
          route: '/api/ai/classify-project',
          agent: 'project-classifier',
          action: 'classify',
          status: 'error',
          meta: { error: (error as Error).message },
        });
      }
    } catch {
      // Audit logging failed, continue
    }

    return NextResponse.json(
      {
        error: 'Classification failed',
        message: (error as Error).message,
        requestId,
      },
      { status: 500 }
    );
  }
}
