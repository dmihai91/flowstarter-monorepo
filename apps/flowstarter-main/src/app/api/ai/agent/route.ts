/* eslint-disable @typescript-eslint/no-explicit-any */
import { auditAiEvent } from '@/lib/ai/audit';
import {
  generateProjectDetails,
  moderateBusinessInfo,
} from '@/lib/ai/project-details';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CODING_AGENT_URL =
  process.env.NEXT_PUBLIC_CODING_AGENT_URL || 'http://localhost:8000';

const AgentBodySchema = z.object({
  agent: z
    .enum([
      'project-suggestions',
      'code-editor',
      'template-customizer',
      'file-analyzer',
      'website-generator',
    ])
    .optional(),
  action: z.string(),
  context: z.record(z.any()),
});

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      await auditAiEvent({
        req: request,
        userId: null,
        route: '/api/ai/agent',
        agent: 'project-suggestions',
        action: 'unauthorized',
        status: 'error',
        meta: { reason: 'Unauthorized' },
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const parsed = AgentBodySchema.safeParse(json);
    if (!parsed.success) {
      await auditAiEvent({
        req: request,
        userId,
        sessionClaims,
        route: '/api/ai/agent',
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
    const { agent, action, context } = parsed.data as unknown as {
      agent?: 'project-suggestions';
      action: string;
      context: Record<string, any>;
    };

    // Route code-editor, template-customizer, file-analyzer, and website-generator to coding agent service
    const codingAgents = [
      'code-editor',
      'template-customizer',
      'file-analyzer',
      'website-generator',
    ];
    if (agent && codingAgents.includes(agent)) {
      try {
        const codingAgentResponse = await fetch(`${CODING_AGENT_URL}/agent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent, action, context }),
        });

        if (!codingAgentResponse.ok) {
          const errorData = await codingAgentResponse.json();
          throw new Error(errorData.detail || 'Coding agent service error');
        }

        const result = await codingAgentResponse.json();

        await auditAiEvent({
          req: request,
          userId,
          sessionClaims,
          route: '/api/ai/agent',
          agent: String(agent),
          action,
          status: 'ok',
          context,
          result,
        });

        return NextResponse.json(result);
      } catch (error: any) {
        await auditAiEvent({
          req: request,
          userId,
          sessionClaims,
          route: '/api/ai/agent',
          agent: String(agent),
          action: 'coding-agent-error',
          status: 'error',
          context: { agent, action, context },
          meta: { error: error?.message },
        });
        return NextResponse.json(
          { error: `Coding agent error: ${error?.message}` },
          { status: 500 }
        );
      }
    }

    if (agent && agent !== 'project-suggestions') {
      await auditAiEvent({
        req: request,
        userId,
        sessionClaims,
        route: '/api/ai/agent',
        agent: String(agent),
        action: 'unsupported-agent',
        status: 'error',
        context: { agent, action, context },
      });
      return NextResponse.json(
        {
          error:
            'Unsupported agent. This endpoint only handles project-suggestions.',
        },
        { status: 400 }
      );
    }

    // AI moderation on user-entered description
    const businessInfo = context?.businessInfo ?? context;
    const safety = await moderateBusinessInfo(businessInfo);
    if (safety.isProhibited) {
      await auditAiEvent({
        req: request,
        userId,
        sessionClaims,
        route: '/api/ai/agent',
        agent: 'project-suggestions',
        action: 'moderation-rejected',
        status: 'error',
        context: { businessInfo },
        meta: { reasons: safety.reasons },
      });
      return NextResponse.json(
        {
          error: 'Content Policy Violation',
          message:
            'We cannot process your request as it appears to involve prohibited activities or content.',
          details: safety.reasons || [],
          code: 'CONTENT_REJECTED',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Build prompt and generate unified project details
    // Include customPrompt from UI if provided
    const basePrompt =
      context?.customPrompt ||
      context?.prompt ||
      `Generate project details (name, description, target users, goals) for a ${
        businessInfo.industry || 'business'
      } website based on the provided business information.`;

    const userPrompt = context?.customPrompt
      ? `${basePrompt}\n\nIMPORTANT: Follow this custom instruction: ${context.customPrompt}`
      : basePrompt;

    const result = await generateProjectDetails(
      userPrompt,
      businessInfo,
      context
    );

    // Persist encrypted audit log
    await auditAiEvent({
      req: request,
      userId,
      sessionClaims,
      route: '/api/ai/agent',
      agent: 'project-suggestions',
      action,
      projectId: context?.projectId || context?.businessInfo?.projectId || null,
      pipelineId: context?.pipelineId || null,
      context: {
        templateId: context?.templateId,
        industry: context?.businessInfo?.industry,
        businessType: context?.businessInfo?.businessType,
        targetAudience: context?.businessInfo?.targetAudience,
        goals: context?.businessInfo?.goals,
        description: context?.businessInfo?.description,
        regenerateField: context?.regenerateField,
        previousValue: context?.previousValue,
      },
      result,
      status: 'ok',
    });

    return NextResponse.json({
      agent: 'project-suggestions',
      action,
      response: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Project Suggestions API error:', error);
    try {
      await auditAiEvent({
        req: request,
        userId: undefined,
        route: '/api/ai/agent',
        agent: 'project-suggestions',
        action: 'exception',
        status: 'error',
        meta: { message: error?.message || String(error) },
      });
    } catch {
      // Audit logging failed, but continue with error response
    }
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
