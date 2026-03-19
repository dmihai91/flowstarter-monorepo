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

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };
type JsonObject = Record<string, JsonValue>;
type CodingAgentErrorResponse = { detail?: string };
type BusinessInfoLike = {
  industry?: string;
  businessType?: string;
  targetAudience?: string;
  goals?: string;
  description?: string;
  projectId?: string;
};

function getErrorMessage(error: unknown, fallback = 'Internal server error') {
  return error instanceof Error ? error.message : fallback;
}

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toBusinessInfo(value: unknown): BusinessInfoLike {
  if (!isJsonObject(value)) {
    return {};
  }

  const getString = (key: keyof BusinessInfoLike) =>
    typeof value[key] === 'string' ? value[key] : undefined;

  return {
    industry: getString('industry'),
    businessType: getString('businessType'),
    targetAudience: getString('targetAudience'),
    goals: getString('goals'),
    description: getString('description'),
    projectId: getString('projectId'),
  };
}

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
  context: z.record(z.string(), z.unknown()),
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
    const { agent, action, context } = parsed.data as {
      agent?: 'project-suggestions';
      action: string;
      context: JsonObject;
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
          const errorData =
            (await codingAgentResponse.json()) as CodingAgentErrorResponse;
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
      } catch (error: unknown) {
        await auditAiEvent({
          req: request,
          userId,
          sessionClaims,
          route: '/api/ai/agent',
          agent: String(agent),
          action: 'coding-agent-error',
          status: 'error',
          context: { agent, action, context },
          meta: { error: getErrorMessage(error) },
        });
        return NextResponse.json(
          { error: `Coding agent error: ${getErrorMessage(error)}` },
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
    const rawBusinessInfo = isJsonObject(context) ? context.businessInfo : undefined;
    const businessInfo = toBusinessInfo(rawBusinessInfo ?? context);
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
      (typeof context.customPrompt === 'string' ? context.customPrompt : undefined) ||
      (typeof context.prompt === 'string' ? context.prompt : undefined) ||
      `Generate project details (name, description, target users, goals) for a ${
        businessInfo.industry || 'business'
      } website based on the provided business information.`;

    const customPrompt =
      typeof context.customPrompt === 'string' ? context.customPrompt : undefined;

    const userPrompt = customPrompt
      ? `${basePrompt}\n\nIMPORTANT: Follow this custom instruction: ${customPrompt}`
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
      projectId:
        (typeof context.projectId === 'string' ? context.projectId : undefined) ||
        businessInfo.projectId ||
        null,
      pipelineId:
        typeof context.pipelineId === 'string' ? context.pipelineId : null,
      context: {
        templateId:
          typeof context.templateId === 'string' ? context.templateId : undefined,
        industry: businessInfo.industry,
        businessType: businessInfo.businessType,
        targetAudience: businessInfo.targetAudience,
        goals: businessInfo.goals,
        description: businessInfo.description,
        regenerateField:
          typeof context.regenerateField === 'string'
            ? context.regenerateField
            : undefined,
        previousValue:
          typeof context.previousValue === 'string'
            ? context.previousValue
            : undefined,
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
  } catch (error: unknown) {
    console.error('Project Suggestions API error:', error);
    try {
      await auditAiEvent({
        req: request,
        userId: undefined,
        route: '/api/ai/agent',
        agent: 'project-suggestions',
        action: 'exception',
        status: 'error',
        meta: { message: getErrorMessage(error, String(error)) },
      });
    } catch {
      // Audit logging failed, but continue with error response
    }
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
