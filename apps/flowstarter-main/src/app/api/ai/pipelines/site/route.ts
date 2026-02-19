import { auditAiEvent } from '@/lib/ai/audit';
import { runSiteGeneration } from '@/lib/ai/pipelines/site-generation';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  if (process.env.ENABLE_MULTI_AGENT_PILOT !== '1') {
    return NextResponse.json({ error: 'Pilot disabled' }, { status: 404 });
  }

  const { userId, sessionClaims } = await auth();
  if (!userId) {
    try {
      await auditAiEvent({
        req,
        userId: null,
        route: '/api/ai/pipelines/site',
        agent: 'site-generator',
        action: 'unauthorized',
        status: 'error',
        meta: { reason: 'Unauthorized' },
      });
    } catch {
      // Audit logging failed, but continue with error response
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { businessInfo, templateId, projectId } = await req.json();
  const pipelineId = `site-${Date.now()}`;

  const result = await runSiteGeneration({
    userId,
    pipelineId,
    projectId,
    businessInfo,
    templateId,
  });

  try {
    await auditAiEvent({
      req,
      userId,
      sessionClaims,
      route: '/api/ai/pipelines/site',
      agent: 'site-generator',
      action: 'run-site-generation',
      projectId: projectId || null,
      pipelineId,
      context: { businessInfo, templateId },
      result,
      status: 'ok',
    });
  } catch (e) {
    // Swallow audit errors so generation response still succeeds
    console.error('Failed to save audit log for site generation:', e);
  }

  return NextResponse.json({ pipelineId, projectId, result });
}
