import { auditAiEvent } from '@/lib/ai/audit';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, projectName, primaryColor } = await request.json();

    if (!prompt) {
      try {
        const { userId, sessionClaims } = await auth();
        await auditAiEvent({
          req: request,
          userId: userId ?? null,
          sessionClaims,
          route: '/api/ai/generate-logo',
          agent: 'logo-generator',
          action: 'validation-error',
          status: 'error',
          context: { hasPrompt: !!prompt },
        });
      } catch {
        // Audit logging failed, but continue with error response
      }
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    // Enhanced prompt specifically for logo generation
    const enhancedPrompt = `LOGO DESIGN REQUEST: Create a professional business logo for "${
      projectName || 'a business'
    }". 
    
    Logo Requirements: ${prompt}
    
    SPECIFIC LOGO CONSTRAINTS:
    - This must be a LOGO ONLY, not a full image or scene
    - Clean, minimalist design suitable for business branding
    - Simple geometric shapes and typography
    - Scalable design that works at small and large sizes
    - Primary color: ${primaryColor || '#3b82f6'} with complementary accents
    - White or transparent background
    - No complex illustrations, photographs, or detailed artwork
    - Focus on symbol/icon + text combination OR stylized text only
    - Professional, memorable, and versatile for multiple uses
    - Avoid gradients, shadows, or effects that don't scale well
    
    OUTPUT: A clean business logo that could be used on business cards, websites, and signage.`;

    console.log('Generating logo with enhanced prompt:', enhancedPrompt);

    // Generate the logo using DALL-E 3
    const openai = getOpenAIClient();
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: enhancedPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'auto',
    });

    const imageUrl = response?.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI');
    }

    const { userId, sessionClaims } = await auth();
    if (userId) {
      await auditAiEvent({
        req: request,
        userId,
        sessionClaims,
        route: '/api/ai/generate-logo',
        agent: 'logo-generator',
        action: 'generate',
        context: { prompt, projectName, primaryColor },
        result: { imageUrl },
        status: 'ok',
      });
    }

    return NextResponse.json({
      imageUrl,
      style: 'Professional minimalist logo',
      colors: primaryColor || 'Professional color palette',
      prompt: enhancedPrompt,
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    try {
      const { userId, sessionClaims } = await auth();
      await auditAiEvent({
        req: request,
        userId: userId ?? null,
        sessionClaims,
        route: '/api/ai/generate-logo',
        agent: 'logo-generator',
        action: 'exception',
        status: 'error',
        meta: {
          message: error instanceof Error ? error.message : String(error),
        },
      });
    } catch {
      // Audit logging failed, but continue with error response
    }
    return NextResponse.json(
      {
        error: `Failed to generate logo: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      },
      { status: 500 }
    );
  }
}
