import { auditAiEvent } from '@/lib/ai/audit';
import { models } from '@/lib/ai/openrouter-client';
import { auth } from '@clerk/nextjs/server';
import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  try {
    const { templateId, projectData } = await request.json();

    if (!projectData?.name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    console.log(`[${requestId}] Enhancing preview for template: ${templateId}`);

    const prompt = `You are a professional copywriter adapting website content for a specific business.

Business Details:
- Name: ${projectData.name}
- Description: ${projectData.description || 'Not provided'}
- Target Users: ${projectData.targetUsers || 'Not provided'}
- Unique Value: ${projectData.usp || 'Not provided'}

Template Type: ${getTemplateCategory(templateId)}

Generate comprehensive, personalized content for this template preview that:
1. Feels authentic and specific to this business
2. Uses natural, human language (no corporate buzzwords)
3. Highlights what makes this business unique
4. Speaks directly to the target audience
5. Maintains professional tone appropriate for the industry
6. Includes realistic pricing appropriate for the business type
7. Creates relevant metrics and achievements

Return a JSON object with these fields:
{
  "heroTitle": "Main headline (5-8 words, powerful and specific to the business)",
  "heroSubtitle": "Supporting tagline (10-15 words, benefit-focused, authentic)",
  "aboutHeadline": "About section headline (3-5 words)",
  "aboutText": "About section paragraph (2-3 sentences, authentic story)",
  "features": [
    { "title": "Feature 1 title (3-5 words)", "description": "Benefit description (8-12 words)" },
    { "title": "Feature 2 title (3-5 words)", "description": "Benefit description (8-12 words)" },
    { "title": "Feature 3 title (3-5 words)", "description": "Benefit description (8-12 words)" },
    { "title": "Feature 4 title (3-5 words)", "description": "Benefit description (8-12 words)" }
  ],
  "services": [
    { "name": "Service 1 name", "description": "What this service provides (10-15 words)" },
    { "name": "Service 2 name", "description": "What this service provides (10-15 words)" },
    { "name": "Service 3 name", "description": "What this service provides (10-15 words)" }
  ],
  "pricing": {
    "plans": [
      {
        "name": "Starter/Basic plan name",
        "price": "$XX",
        "period": "per month/per session/one-time",
        "description": "Brief plan description (8-12 words)",
        "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"]
      },
      {
        "name": "Professional/Standard plan name",
        "price": "$XX",
        "period": "per month/per session/one-time",
        "description": "Brief plan description (8-12 words)",
        "features": ["All from previous", "Feature 1", "Feature 2", "Feature 3", "Feature 4"],
        "popular": true
      },
      {
        "name": "Premium/Enterprise plan name",
        "price": "$XX",
        "period": "per month/per session/one-time",
        "description": "Brief plan description (8-12 words)",
        "features": ["All from previous", "Feature 1", "Feature 2", "Feature 3", "Feature 4"]
      }
    ]
  },
  "ctaText": "Call-to-action button text (2-4 words)",
  "ctaSecondary": "Secondary CTA text (2-4 words)",
  "stats": [
    { "value": "Relevant number", "label": "Specific metric for this business" },
    { "value": "Rating/achievement", "label": "Related achievement" },
    { "value": "Experience/count", "label": "Another relevant metric" },
    { "value": "Success metric", "label": "Final metric" }
  ],
  "testimonials": [
    { "name": "Realistic customer name", "role": "Their role/title", "text": "Authentic testimonial (15-25 words)" },
    { "name": "Realistic customer name", "role": "Their role/title", "text": "Authentic testimonial (15-25 words)" }
  ],
  "contactInfo": {
    "email": "Professional email format",
    "phone": "Professional phone format if relevant",
    "location": "City/region if relevant to business"
  }
}

IMPORTANT:
- Make pricing realistic and appropriate for the business type and industry
- For local businesses, use per-service or per-session pricing
- For SaaS, use monthly subscription tiers
- For consultants, use hourly/project/retainer rates
- All content should feel like it's written FOR this specific business, not generic templates

CRITICAL: Return ONLY valid JSON, no markdown formatting or code blocks.`;

    const { text: content } = await generateText({
      model: models.gpt4,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert copywriter specializing in website content. Always return valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      maxTokens: 1000,
    });

    if (!content) {
      throw new Error('No content generated');
    }

    // Parse AI response
    let enhancedContent;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content
        .replace(/^```json\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim();
      enhancedContent = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error(`[${requestId}] Failed to parse AI response:`, content);
      throw new Error('Invalid AI response format');
    }

    // Audit the event
    try {
      const { userId, sessionClaims } = await auth();
      if (userId) {
        await auditAiEvent({
          req: request,
          userId,
          sessionClaims,
          route: '/api/ai/enhance-preview',
          agent: 'template-preview',
          action: 'enhance',
          context: { templateId, projectData },
          result: enhancedContent,
          status: 'ok',
        });
      }
    } catch {
      // Audit logging failed, continue
    }

    console.log(`[${requestId}] Successfully enhanced preview`);

    return NextResponse.json({
      success: true,
      content: enhancedContent,
    });
  } catch (error) {
    console.error(`[${requestId}] Error enhancing preview:`, error);

    try {
      const { userId, sessionClaims } = await auth();
      if (userId) {
        await auditAiEvent({
          req: request,
          userId,
          sessionClaims,
          route: '/api/ai/enhance-preview',
          agent: 'template-preview',
          action: 'enhance',
          status: 'error',
          context: { error: (error as Error).message },
        });
      }
    } catch {
      // Ignore audit errors
    }

    return NextResponse.json(
      {
        error: 'Failed to enhance preview',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

function getTemplateCategory(templateId: string): string {
  if (templateId.includes('personal-brand'))
    return 'Personal Brand / Professional Services';
  if (templateId.includes('local-business')) return 'Local Business / Retail';
  if (templateId.includes('saas')) return 'SaaS / Technology Product';
  if (templateId.includes('services')) return 'Professional Services / Agency';
  if (templateId.includes('education')) return 'Education / Course';
  if (templateId.includes('ecom')) return 'E-Commerce / Online Store';
  return 'General Business';
}
