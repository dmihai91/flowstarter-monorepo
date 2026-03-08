import { models } from '@/lib/ai/openrouter-client';
import { auth } from '@clerk/nextjs/server';
import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ACTION_PROMPTS: Record<string, string> = {
  regenerate: 'Rewrite this text with a fresh take, keeping the same meaning.',
  shorter: 'Make this text shorter and more concise. Keep the core message.',
  punchy: 'Make this text punchier and more compelling. Use active voice.',
  alternatives: 'Suggest 1 alternative version of this text with a different angle.',
  benefits: 'Rewrite to focus on concrete client benefits.',
};

const RequestSchema = z.object({
  value: z.string().min(1),
  action: z.string(),
  fieldName: z.string(),
  businessContext: z.string().optional(),
  customPrompt: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json();
    const parsed = RequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { value, action, fieldName, businessContext, customPrompt } =
      parsed.data;

    const instruction =
      action === 'custom' && customPrompt
        ? customPrompt
        : ACTION_PROMPTS[action] || ACTION_PROMPTS.regenerate;

    const { text } = await generateText({
      model: models.projectDetails,
      messages: [
        {
          role: 'system',
          content: `You rewrite business website copy. Return ONLY the rewritten text, no quotes, no explanation. Match the language of the input. Write naturally like a human copywriter. Never use em dashes, semicolons, or AI-typical words like leverage, elevate, unlock, empower.${businessContext ? ` Business context: ${businessContext}` : ''}`,
        },
        {
          role: 'user',
          content: `Field: ${fieldName}\nCurrent value: "${value}"\n\nInstruction: ${instruction}`,
        },
      ],
      temperature: 0.6,
      maxOutputTokens: 300,
    });

    const cleaned = text
      ?.replace(/^["']|["']$/g, '')
      .trim();

    return NextResponse.json({ rewritten: cleaned || value });
  } catch (error) {
    console.error('[Rewrite API] Error:', error);
    return NextResponse.json(
      { error: 'Rewrite failed' },
      { status: 500 }
    );
  }
}
