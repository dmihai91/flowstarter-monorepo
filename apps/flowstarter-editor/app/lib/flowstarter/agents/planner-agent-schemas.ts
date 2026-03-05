import { z } from 'zod';

export const PlanRequestSchema = z.object({
  type: z.enum(['plan', 'review', 'escalate']),
  projectId: z.string(),
  businessInfo: z.object({
    name: z.string(),
    description: z.string().optional(),
    tagline: z.string().optional(),
    services: z.array(z.string()).optional(),
    targetAudience: z.string().optional(),
    businessGoals: z.array(z.string()).optional(),
    brandTone: z.string().optional(),
  }),
  template: z.object({
    slug: z.string(),
    name: z.string(),
    files: z.record(z.string()).optional(),
  }),
  design: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      fontFamily: z.string().optional(),
    })
    .optional(),
  generatedFiles: z.record(z.string()).optional(),
  errorHistory: z
    .array(
      z.object({
        file: z.string(),
        error: z.string(),
        fixAttempts: z.number(),
        lastFixSummary: z.string().optional(),
      }),
    )
    .optional(),
});

export type PlanRequestDTO = z.infer<typeof PlanRequestSchema>;

export const PlanResultSchema = z.object({
  success: z.boolean(),
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
  error: z.string().optional(),
});

export type PlanResultDTO = z.infer<typeof PlanResultSchema>;

export const ReviewResultSchema = z.object({
  approved: z.boolean(),
  score: z.number().min(1).max(10),
  confidence: z.number().min(0).max(1),
  summary: z.string(),
  categoryScores: z.object({
    requirementMatching: z.number().min(1).max(10),
    completeness: z.number().min(1).max(10),
    brandAlignment: z.number().min(1).max(10),
    technicalQuality: z.number().min(1).max(10),
    uxDesign: z.number().min(1).max(10),
  }),
  issues: z.array(
    z.object({
      severity: z.enum(['critical', 'major', 'minor', 'suggestion']),
      category: z.string(),
      file: z.string().optional(),
      description: z.string(),
      suggestedFix: z.string().optional(),
    }),
  ),
  improvements: z.array(
    z.object({
      file: z.string(),
      instruction: z.string(),
      priority: z.enum(['must-fix', 'should-fix', 'nice-to-have']),
    }),
  ),
});

export type ReviewResultDTO = z.infer<typeof ReviewResultSchema>;

export const EscalateResultSchema = z.object({
  escalationType: z.enum(['user-intervention', 'manual-fix', 'skip-file', 'abort']),
  explanation: z.string(),
  suggestedActions: z.array(z.string()),
  affectedFiles: z.array(z.string()),
  successfulFiles: z.array(z.string()).optional(),
});

export type EscalateResultDTO = z.infer<typeof EscalateResultSchema>;

export type PlannerResponseDTO =
  | { type: 'plan'; result: PlanResultDTO }
  | { type: 'review'; result: ReviewResultDTO }
  | { type: 'escalate'; result: EscalateResultDTO };
