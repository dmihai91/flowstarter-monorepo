import { z } from 'zod';

/**
 * Business info schema for AI generation.
 */
export const BusinessInfoSchema = z.object({
  description: z.string().min(1),
  industry: z.string().optional(),
  businessType: z.string().optional(),
  targetAudience: z.string().optional(),
  uniqueSellingPoint: z.string().optional(),
  name: z.string().optional(),
  services: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional(),
});

export type BusinessInfo = z.infer<typeof BusinessInfoSchema>;

/**
 * AI project suggestions request schema.
 */
export const ProjectSuggestionsRequestSchema = z.object({
  businessInfo: BusinessInfoSchema,
  chipAction: z
    .enum(['alternatives', 'makeItCatchy', 'makeItShorter'])
    .optional(),
  previousValue: z.string().optional(),
  customPrompt: z.string().optional(),
});

export type ProjectSuggestionsRequest = z.infer<
  typeof ProjectSuggestionsRequestSchema
>;

/**
 * AI project suggestions response schema.
 */
export const ProjectSuggestionsResponseSchema = z.object({
  names: z.array(z.string()),
  description: z.string(),
  targetUsers: z.string().optional(),
  businessGoals: z.string().optional(),
  USP: z.string().optional(),
  brandTone: z.string().optional(),
  keyServices: z.string().optional(),
});

export type ProjectSuggestionsResponse = z.infer<
  typeof ProjectSuggestionsResponseSchema
>;

/**
 * Content moderation request schema.
 */
export const ModerationRequestSchema = z.object({
  content: z.string().min(1),
  context: z.enum(['business_name', 'description', 'content']).optional(),
});

export type ModerationRequest = z.infer<typeof ModerationRequestSchema>;

/**
 * Content moderation response schema.
 */
export const ModerationResponseSchema = z.object({
  safe: z.boolean(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  recommendation: z.enum(['APPROVED', 'REVIEW_REQUIRED', 'REQUEST_REJECTED']),
  reason: z.string().optional(),
  categories: z
    .array(
      z.object({
        name: z.string(),
        score: z.number(),
      })
    )
    .optional(),
});

export type ModerationResponse = z.infer<typeof ModerationResponseSchema>;

/**
 * Project classification request schema.
 */
export const ClassifyProjectRequestSchema = z.object({
  businessInfo: BusinessInfoSchema,
});

export type ClassifyProjectRequest = z.infer<
  typeof ClassifyProjectRequestSchema
>;

/**
 * Project classification response schema.
 */
export const ClassifyProjectResponseSchema = z.object({
  success: z.literal(true),
  industry: z.string(),
  confidence: z.number(),
  suggestedTemplates: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
});

export type ClassifyProjectResponse = z.infer<
  typeof ClassifyProjectResponseSchema
>;

/**
 * Website generation request schema.
 */
export const GenerateWebsiteRequestSchema = z.object({
  projectDetails: z.object({
    name: z.string(),
    description: z.string(),
    industry: z.string().optional(),
    targetUsers: z.string().optional(),
    businessGoals: z.string().optional(),
    USP: z.string().optional(),
    brandTone: z.string().optional(),
    keyServices: z.string().optional(),
    designConfig: z.record(z.unknown()).optional(),
  }),
  templateInfo: z.object({
    id: z.string(),
    name: z.string(),
    type: z.string().optional(),
    features: z.array(z.string()).optional(),
  }),
  templateCode: z.string().optional(),
});

export type GenerateWebsiteRequest = z.infer<
  typeof GenerateWebsiteRequestSchema
>;

/**
 * Website generation event schema (for streaming).
 */
export const GenerationEventSchema = z.discriminatedUnion('stage', [
  z.object({
    stage: z.literal('step_start'),
    step: z.number(),
    name: z.string(),
    message: z.string().optional(),
  }),
  z.object({
    stage: z.literal('step_progress'),
    step: z.number(),
    message: z.string(),
  }),
  z.object({
    stage: z.literal('step_complete'),
    step: z.number(),
    name: z.string().optional(),
    data: z.record(z.unknown()).optional(),
  }),
  z.object({
    stage: z.literal('step_error'),
    step: z.number(),
    error: z.string(),
  }),
  z.object({
    stage: z.literal('completed'),
    message: z.string().optional(),
  }),
  z.object({
    stage: z.literal('error'),
    message: z.string(),
  }),
]);

export type GenerationEvent = z.infer<typeof GenerationEventSchema>;

/**
 * Website generation result schema.
 */
export const GenerationResultSchema = z.object({
  siteId: z.string(),
  generatedCode: z.string(),
  files: z.array(
    z.object({
      path: z.string(),
      content: z.string(),
    })
  ),
  architecture: z.string().optional(),
  tested: z.boolean(),
  orchestrated: z.boolean(),
  qualityMetrics: z.record(z.unknown()).optional(),
  daytonaWorkspace: z.string().optional(),
  timestamp: z.string().optional(),
});

export type GenerationResult = z.infer<typeof GenerationResultSchema>;
