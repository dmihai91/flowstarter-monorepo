import { requireAuth } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

const RequestSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  description: z.string().optional().default(''),
});

function getOpenRouterClient() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  });
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) return authResult.response;

    const json = await request.json();
    const parsed = RequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { clientName, description } = parsed.data;
    if (!description.trim()) {
      return NextResponse.json({ name: clientName });
    }

    const openrouter = getOpenRouterClient();
    const response = await openrouter.chat.completions.create({
      model: 'moonshotai/kimi-k2',
      max_tokens: 30,
      messages: [
        {
          role: 'system',
          content: 'You are a creative brand naming assistant. Given a client name and business description, suggest ONE short, memorable project name (2-3 words max). Just the name, nothing else. The name should work as a website/brand name.',
        },
        {
          role: 'user',
          content: `Client: ${clientName}\nDescription: ${description || 'General business website'}`,
        },
      ],
    });

    const name = response.choices[0]?.message?.content?.trim();
    if (!name) {
      throw new Error('No name returned from model');
    }

    return NextResponse.json({ name });
  } catch (error) {
    console.error('[Generate Name API] Error:', error);
    return NextResponse.json(
      { error: 'Name generation failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}
