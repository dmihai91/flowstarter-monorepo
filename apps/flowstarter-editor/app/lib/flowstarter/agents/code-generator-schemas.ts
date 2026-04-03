import { z } from 'zod';

export const GenerateRequestSchema = z.object({
  type: z.enum(['generate', 'refine', 'fix-apply']),
  projectId: z.string(),
  businessInfo: z.object({
    name: z.string(),
    description: z.string().optional(),
    tagline: z.string().optional(),
    services: z.array(z.string()).optional(),
    targetAudience: z.string().optional(),
    brandTone: z.string().optional(),
  }),
  templateFiles: z.record(z.string()),
  modifications: z.array(
    z.object({
      path: z.string(),
      instructions: z.string(),
      priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    }),
  ),
  contentGuidelines: z
    .object({
      tone: z.string().optional(),
      keyMessages: z.array(z.string()).optional(),
      ctaText: z.string().optional(),
    })
    .optional(),
  design: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      accentColor: z.string().optional(),
      fontFamily: z.string().optional(),
    })
    .optional(),
  previousFiles: z.record(z.string()).optional(),
  feedback: z
    .array(
      z.object({
        file: z.string(),
        instruction: z.string(),
        priority: z.enum(['must-fix', 'should-fix', 'nice-to-have']),
      }),
    )
    .optional(),
  fixApplication: z
    .object({
      file: z.string(),
      fixedContent: z.string(),
    })
    .optional(),
});

export type GenerateRequestDTO = z.infer<typeof GenerateRequestSchema>;

export const GenerateResultSchema = z.object({
  success: z.boolean(),
  files: z.record(z.string()),
  summary: z.string().optional(),
  modifiedFiles: z.array(z.string()).optional(),
  error: z.string().optional(),
});

export type GenerateResultDTO = z.infer<typeof GenerateResultSchema>;
