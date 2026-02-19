import { z } from 'zod';

/**
 * Project status enum.
 */
export const ProjectStatusSchema = z.enum([
  'draft',
  'generating',
  'ready',
  'published',
  'archived',
]);

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

/**
 * Design configuration schema.
 */
export const DesignConfigSchema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  logoOption: z.enum(['none', 'text', 'custom']).optional(),
  logoUrl: z.string().url().optional(),
  generatedPalettes: z.array(z.record(z.string())).optional(),
  selectedPalette: z.number().optional(),
});

export type DesignConfig = z.infer<typeof DesignConfigSchema>;

/**
 * Domain configuration schema.
 */
export const DomainConfigSchema = z.object({
  domain: z.string().optional(),
  provider: z.string().optional(),
  domainType: z.enum(['hosted', 'custom']).optional(),
  verified: z.boolean().optional(),
});

export type DomainConfig = z.infer<typeof DomainConfigSchema>;

/**
 * Template information schema.
 */
export const TemplateInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  features: z.array(z.string()).optional(),
  complexity: z.enum(['simple', 'moderate', 'complex']).optional(),
});

export type TemplateInfo = z.infer<typeof TemplateInfoSchema>;

/**
 * Project schema matching Supabase table structure.
 */
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional().nullable(),
  usp: z.string().optional().nullable(),
  target_users: z.string().optional().nullable(),
  business_goals: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  status: ProjectStatusSchema,
  template_id: z.string().optional().nullable(),
  template_name: z.string().optional().nullable(),
  design_config: DesignConfigSchema.optional().nullable(),
  domain_config: DomainConfigSchema.optional().nullable(),
  generated_code: z.string().optional().nullable(),
  site_id: z.string().optional().nullable(),
  user_id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Project = z.infer<typeof ProjectSchema>;

/**
 * Create project request schema.
 */
export const CreateProjectRequestSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().optional(),
  usp: z.string().optional(),
  targetUsers: z.string().optional(),
  businessGoals: z.string().optional(),
  industry: z.string().optional(),
  templateId: z.string().optional(),
  templateName: z.string().optional(),
  designConfig: DesignConfigSchema.optional(),
  domainConfig: DomainConfigSchema.optional(),
});

export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;

/**
 * Create project response schema.
 */
export const CreateProjectResponseSchema = z.object({
  success: z.literal(true),
  projectId: z.string().uuid(),
});

export type CreateProjectResponse = z.infer<typeof CreateProjectResponseSchema>;

/**
 * Update project request schema.
 */
export const UpdateProjectRequestSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80).optional(),
  description: z.string().optional(),
  usp: z.string().optional(),
  targetUsers: z.string().optional(),
  businessGoals: z.string().optional(),
  status: ProjectStatusSchema.optional(),
  designConfig: DesignConfigSchema.optional(),
  domainConfig: DomainConfigSchema.optional(),
  generatedCode: z.string().optional(),
  siteId: z.string().optional(),
});

export type UpdateProjectRequest = z.infer<typeof UpdateProjectRequestSchema>;

/**
 * Update project response schema.
 */
export const UpdateProjectResponseSchema = z.object({
  success: z.literal(true),
  project: ProjectSchema,
});

export type UpdateProjectResponse = z.infer<typeof UpdateProjectResponseSchema>;

/**
 * Get projects response schema.
 */
export const GetProjectsResponseSchema = z.object({
  projects: z.array(ProjectSchema),
});

export type GetProjectsResponse = z.infer<typeof GetProjectsResponseSchema>;

/**
 * Get project by ID response schema.
 */
export const GetProjectResponseSchema = z.object({
  project: ProjectSchema,
});

export type GetProjectResponse = z.infer<typeof GetProjectResponseSchema>;

/**
 * Delete project response schema.
 */
export const DeleteProjectResponseSchema = z.object({
  success: z.literal(true),
});

export type DeleteProjectResponse = z.infer<typeof DeleteProjectResponseSchema>;
