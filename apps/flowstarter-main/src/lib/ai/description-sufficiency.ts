import { models } from '@/lib/ai/openrouter-client';
import { generateObject } from 'ai';
import { z } from 'zod';

export const sufficiencySchema = z
  .object({
    isSufficient: z.boolean(),
    confidence: z.number().min(0).max(1).optional(),
    missingInfo: z.array(z.string()).optional(),
    followUpQuestions: z.array(z.string()).optional(),
    reason: z.string().optional(),
  })
  .partial();

export type SufficiencyResult = z.infer<typeof sufficiencySchema> & {
  isSufficient: boolean;
};

export async function evaluateDescriptionSufficiency(input: {
  description: string;
  industry?: string;
  businessType?: string;
}): Promise<SufficiencyResult> {
  // Note: We intentionally removed heuristic short-circuiting.
  // Sufficiency is determined solely by the model with clear policy instructions below.

  const systemPrompt = [
    'You are an assistant that checks if a brief business description is sufficient to generate website project details (name, description, target users, USP, goals).',
    'Return a compact JSON verdict. If insufficient, list the most important missing info only.',
    'Sufficiency policy: (1) <= 500 characters. (2) 1–4 sentences or phrases. (3) Should clearly state what is being offered (service/product) AND who it is for (audience). Including a differentiator, goal, or constraint (e.g., location, niche, style) is helpful but NOT required.',
    'If the text is generic (e.g., purely "want a website"), incoherent, or lacks both offering and audience, set isSufficient=false and include the top 1–3 missingInfo items.',
    'Do NOT request a project name. Do NOT include follow-up questions. Always set followUpQuestions to an empty array.',
  ].join('\n');

  const userContent = [
    `Description: ${input.description || ''}`,
    `Industry: ${input.industry || ''}`,
    `BusinessType: ${input.businessType || ''}`,
  ].join('\n');

  // @ts-ignore
  const { object } = await generateObject({
    model: models.gpt4,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    schema: sufficiencySchema as z.ZodType<SufficiencyResult>,
    temperature: 0,
  });

  const result = object as SufficiencyResult | null;
  return {
    isSufficient: Boolean(result?.isSufficient),
    confidence:
      typeof result?.confidence === 'number' ? result?.confidence : undefined,
    missingInfo: Array.isArray(result?.missingInfo)
      ? (result?.missingInfo || []).slice(0, 3)
      : [],
    followUpQuestions: Array.isArray(result?.followUpQuestions)
      ? (result?.followUpQuestions || []).slice(0, 3)
      : [],
    reason: result?.reason,
  };
}
