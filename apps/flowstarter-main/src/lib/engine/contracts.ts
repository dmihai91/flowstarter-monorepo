import { z } from 'zod';

export const GoalSchema = z.enum(['leads', 'sales', 'bookings']);
export const OfferTypeSchema = z.enum(['premium', 'accessible', 'free']);
export const BrandToneSchema = z.enum(['professional', 'bold', 'friendly']);
export const EngineStatusSchema = z.enum(['needsMoreInfo', 'complete']);

export const IntakeInputSchema = z.object({
  description: z.string().min(10),
  client: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    })
    .optional(),
});

export const ProjectBriefSchema = z.object({
  version: z.literal('1.0'),
  source: z.literal('project-brief'),
  generatedAt: z.string(),
  siteName: z.string(),
  summary: z.string(),
  industry: z.string(),
  archetype: z.string(),
  targetAudience: z.string(),
  usp: z.string(),
  goal: GoalSchema,
  offerType: OfferTypeSchema,
  brandTone: BrandToneSchema,
  offerings: z.array(z.string()),
  contact: z.object({
    email: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    clientName: z.string().optional(),
  }),
  sourceInput: z.object({
    userDescription: z.string(),
    normalizedDescription: z.string(),
  }),
});

export const TemplateCapabilitySchema = z.object({
  supportsBooking: z.boolean(),
  supportsNewsletter: z.boolean(),
  supportsContactForm: z.boolean(),
  multiPage: z.boolean(),
  darkMode: z.boolean(),
});

export const TemplateRegistryEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  features: z.array(z.string()),
  integrations: z.array(z.string()),
  capability: TemplateCapabilitySchema,
  registrySource: z.literal('flowstarter-library'),
});

export const RankedTemplateSchema = z.object({
  templateId: z.string(),
  score: z.number(),
  reasons: z.array(z.string()),
});

export const TemplateSelectionSchema = z.object({
  version: z.literal('1.0'),
  source: z.literal('template-selection'),
  selectedTemplateId: z.string(),
  selectedTemplateName: z.string(),
  score: z.number(),
  fallbackUsed: z.boolean(),
  reasons: z.array(z.string()),
  alternatives: z.array(RankedTemplateSchema),
});

export const BlockDefinitionSchema = z.object({
  blockId: z.string(),
  kind: z.enum([
    'hero',
    'proof',
    'services',
    'process',
    'faq',
    'cta',
    'contact',
    'booking',
    'newsletter',
    'portfolio',
    'pricing',
    'about',
  ]),
  editableFields: z.array(z.string()),
  constraints: z.array(z.string()),
});

export const AssemblyPageSchema = z.object({
  route: z.string(),
  purpose: z.string(),
  blocks: z.array(BlockDefinitionSchema),
});

export const AssemblyIntegrationSchema = z.object({
  key: z.string(),
  mode: z.enum(['required', 'optional', 'disabled']),
  providerOptions: z.array(z.string()),
  configFields: z.array(z.string()),
});

export const AssemblySpecSchema = z.object({
  version: z.literal('1.0'),
  source: z.literal('assembly-spec'),
  templateId: z.string(),
  projectArchetype: z.string(),
  pages: z.array(AssemblyPageSchema),
  integrations: z.array(AssemblyIntegrationSchema),
  builderInstructions: z.array(z.string()),
});

export const ContentMapEntrySchema = z.object({
  slotId: z.string(),
  value: z.string(),
  editable: z.boolean(),
});

export const ContentMapSchema = z.object({
  version: z.literal('1.0'),
  source: z.literal('content-map'),
  entries: z.array(ContentMapEntrySchema),
});

export const ValidationIssueSchema = z.object({
  level: z.enum(['error', 'warning']),
  code: z.string(),
  message: z.string(),
});

export const ValidationReportSchema = z.object({
  version: z.literal('1.0'),
  source: z.literal('validation-report'),
  valid: z.boolean(),
  issues: z.array(ValidationIssueSchema),
  summary: z.string(),
});

export const EngineArtifactsSchema = z.object({
  projectBrief: ProjectBriefSchema,
  templateSelection: TemplateSelectionSchema,
  assemblySpec: AssemblySpecSchema,
  contentMap: ContentMapSchema,
  validationReport: ValidationReportSchema,
});

export type IntakeInput = z.infer<typeof IntakeInputSchema>;
export type ProjectBrief = z.infer<typeof ProjectBriefSchema>;
export type TemplateRegistryEntry = z.infer<typeof TemplateRegistryEntrySchema>;
export type TemplateSelection = z.infer<typeof TemplateSelectionSchema>;
export type AssemblySpec = z.infer<typeof AssemblySpecSchema>;
export type ContentMap = z.infer<typeof ContentMapSchema>;
export type ValidationReport = z.infer<typeof ValidationReportSchema>;
export type EngineArtifacts = z.infer<typeof EngineArtifactsSchema>;
