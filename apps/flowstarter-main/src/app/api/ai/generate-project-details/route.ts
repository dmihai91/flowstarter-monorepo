import { auditAiEvent } from '@/lib/ai/audit';
import {
  generateProjectDetails,
  moderateBusinessInfo,
} from '@/lib/ai/project-details';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let requestId = `req_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  try {
    // Generate unique request ID for tracking
    requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(
      `[${requestId}] Starting AI project details generation request`
    );

    const { prompt, businessInfo, regenerateField, variationIndex } =
      await request.json();

    if (!prompt || !businessInfo) {
      try {
        const { userId, sessionClaims } = await auth();
        await auditAiEvent({
          req: request,
          userId: userId ?? null,
          sessionClaims,
          route: '/api/ai/generate-project-details',
          agent: 'project-suggestions',
          action: 'validation-error',
          status: 'error',
          context: { prompt: !!prompt, businessInfo: !!businessInfo },
        });
      } catch {
        // Audit logging failed, but continue with error response
      }
      console.error(
        `[${requestId}] Missing required fields - prompt: ${Boolean(
          prompt
        )}, businessInfo: ${Boolean(businessInfo)}`
      );
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: 'Both prompt and businessInfo are required',
        },
        { status: 400 }
      );
    }

    // Validate businessInfo structure
    if (
      !businessInfo.description ||
      typeof businessInfo.description !== 'string' ||
      businessInfo.description.trim().length === 0
    ) {
      console.error(`[${requestId}] Invalid businessInfo.description`);
      return NextResponse.json(
        {
          error: 'Invalid business info',
          details:
            'Business description is required and must be a non-empty string',
        },
        { status: 400 }
      );
    }

    if (
      !businessInfo.industry ||
      typeof businessInfo.industry !== 'string' ||
      businessInfo.industry.trim().length === 0
    ) {
      console.error(`[${requestId}] Invalid businessInfo.industry`);
      return NextResponse.json(
        {
          error: 'Invalid business info',
          details: 'Industry is required and must be a non-empty string',
        },
        { status: 400 }
      );
    }

    // Check content safety before processing
    const safetyCheck = await moderateBusinessInfo(businessInfo);

    if (safetyCheck.isProhibited) {
      try {
        const { userId, sessionClaims } = await auth();
        await auditAiEvent({
          req: request,
          userId: userId ?? null,
          sessionClaims,
          route: '/api/ai/generate-project-details',
          agent: 'project-suggestions',
          action: 'moderation-rejected',
          status: 'error',
          context: { businessInfo },
          meta: { reasons: safetyCheck.reasons, risk: safetyCheck.riskLevel },
        });
      } catch {
        // ignore
      }
      console.log(
        `[${requestId}] Request rejected due to content policy violations: ${safetyCheck.reasons?.join(
          '; '
        )}`
      );

      return NextResponse.json(
        {
          error: 'Content Policy Violation',
          message:
            'We cannot process your request as it appears to involve prohibited activities or content.',
          details: safetyCheck.reasons || [],
          code: 'CONTENT_REJECTED',
          requestId,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    console.log(
      `[${requestId}] Content safety check passed: ${safetyCheck.riskLevel}`
    );

    console.log(`[${requestId}] Request data:`, {
      businessInfo: {
        industry: businessInfo.industry,
        businessType: businessInfo.businessType,
        targetAudience: businessInfo.targetAudience?.substring(0, 100) + '...',
        hasGoals: !!businessInfo.goals,
        hasDescription: !!businessInfo.description,
      },
      promptLength: prompt.length,
      regenerateField: regenerateField || 'all',
    });

    // Check if this is a field-specific regeneration request
    if (regenerateField) {
      console.log(
        `[${requestId}] Processing field-specific regeneration for: ${regenerateField}`
      );
      const result = await generateProjectDetails(prompt, businessInfo, {
        variationIndex: variationIndex || 0,
        randomSeed: Math.floor(Math.random() * 1000000),
        timestamp: Date.now(),
      });
      // Audit logging should not block the response
      try {
        const { userId, sessionClaims } = await auth();
        if (userId) {
          await auditAiEvent({
            req: request,
            userId,
            sessionClaims,
            route: '/api/ai/generate-project-details',
            agent: 'project-suggestions',
            action: regenerateField,
            context: { prompt, businessInfo },
            result,
            status: 'ok',
          });
        }
      } catch (auditError) {
        console.warn(`[${requestId}] Audit logging failed:`, auditError);
      }
      return NextResponse.json(result);
    }

    // Enhanced prompt for better domain-specific results (for full generation)
    const enhancedPrompt = `
You are an expert business consultant and copywriter specializing in ${
      businessInfo.industry || 'business'
    } domain. Based on the following business information, generate compelling project details for a website.

${prompt}

Domain Context:
- Industry: ${businessInfo.industry || 'Not specified'}
- Business Type: ${businessInfo.businessType || 'Not specified'}
- Target Audience: ${businessInfo.targetAudience || 'Not specified'}
- Unique Selling Point: ${businessInfo.uniqueSellingPoint || 'Not specified'}
- Goals: ${businessInfo.goals || 'Not specified'}

 Guidelines:
- Project name should be memorable, professional, and brandable within the ${
      businessInfo.industry || 'business'
    } domain
- Description MUST be detailed and compelling (300-700 characters). Include: what the business does, who it serves, unique approach/methodology, and the transformation or value clients receive
- Do NOT include or repeat the project name in the description
- Do NOT write generic one-liners. Elaborate with specific details about services, approach, and outcomes
- USP (Unique Value Proposition) MUST be detailed (150-400 characters). Explain what makes this business DIFFERENT from competitors with specific differentiators
- Target users should be specific and actionable, focusing on the industry's key decision-makers
- Business goals should be SMART (Specific, Measurable, Achievable, Relevant, Time-bound) and aligned with industry standards

🎯 CRITICAL TONE INSTRUCTIONS:
- Write in a natural, conversational, human voice - NOT robotic or corporate
- Use simple, everyday language that sounds like a real person talking
- Avoid buzzwords, jargon, and overused marketing phrases (e.g., "revolutionize", "cutting-edge", "leverage", "synergy", "empower")
- NO corporate speak or overly formal language
- Keep it authentic and genuine - write like you're explaining to a friend
- Use specific, concrete language instead of vague abstractions
- Be direct and honest about what the business actually does
- Avoid cliches and generic statements that could apply to any business
- Focus on real value and real problems being solved
- Sound confident but not salesy or exaggerated
- DO NOT use em dashes (—) in your text; use regular hyphens (-) or commas instead

CRITICAL: Return ONLY a valid JSON object with NO markdown formatting. Do not wrap the response in \`\`\`json or any other markdown. Return the raw JSON directly.

Use this exact structure:
{
  "name": "Project Name",
  "description": "MINIMUM 300 CHARACTERS REQUIRED. A detailed description (300-700 characters) explaining what the business does, who it serves, its unique approach, and the value/transformation clients receive. DO NOT submit under 300 characters.",
  "targetUsers": "Target users description", 
  "businessGoals": "Business goals description",
  "USP": "MINIMUM 150 CHARACTERS REQUIRED. A detailed unique value proposition (150-400 characters) explaining what makes this business DIFFERENT from competitors. Include specific differentiators, unique methods, or exclusive benefits. DO NOT submit under 150 characters."
}
    `;

    console.log(`[${requestId}] Calling AI API for full generation...`);
    const aiStartTime = Date.now();

    const result = await generateProjectDetails(enhancedPrompt, businessInfo, {
      variationIndex: variationIndex || 0,
      randomSeed: Math.floor(Math.random() * 1000000),
      timestamp: Date.now(),
    });

    const aiEndTime = Date.now();
    console.log(
      `[${requestId}] AI API completed in ${aiEndTime - aiStartTime}ms`
    );

    const endTime = Date.now();
    console.log(
      `[${requestId}] Request completed successfully in ${
        endTime - startTime
      }ms`,
      {
        hasNames: result.names.length > 0,
        hasDescription: Boolean(result.description),
        hasTargetUsers: Boolean(result.targetUsers),
        hasBusinessGoals: Boolean(result.businessGoals),
      }
    );

    // Audit logging should not block the response
    try {
      const { userId, sessionClaims } = await auth();
      if (userId) {
        await auditAiEvent({
          req: request,
          userId,
          sessionClaims,
          route: '/api/ai/generate-project-details',
          agent: 'project-suggestions',
          action: 'generate-full',
          context: { businessInfo },
          result,
          status: 'ok',
        });
      }
    } catch (auditError) {
      // Log audit failure but don't fail the request
      console.warn(`[${requestId}] Audit logging failed:`, auditError);
    }

    return NextResponse.json(result);
  } catch (error) {
    const endTime = Date.now();
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';

    console.error(
      `[${requestId}] Request failed after ${endTime - startTime}ms:`,
      {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      }
    );

    try {
      const { userId, sessionClaims } = await auth();
      await auditAiEvent({
        req: request,
        userId: userId ?? null,
        sessionClaims,
        route: '/api/ai/generate-project-details',
        agent: 'project-suggestions',
        action: 'exception',
        status: 'error',
        meta: { message: errorMessage },
      });
    } catch {
      // Audit logging failed, but continue with error response
    }

    return NextResponse.json(
      {
        error: errorMessage,
        requestId,
        details: 'An error occurred while generating project details',
      },
      { status: 500 }
    );
  }
}
