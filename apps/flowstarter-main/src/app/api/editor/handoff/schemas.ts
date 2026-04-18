import { z } from 'zod';

export const paletteSchema = z.object({
  id: z.string(),
  name: z.string(),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    text: z.string(),
  }),
});

export const fontSchema = z.object({
  id: z.string(),
  name: z.string(),
  heading: z.object({
    family: z.string(),
    weight: z.number().optional(),
  }),
  body: z.object({
    family: z.string(),
    weight: z.number().optional(),
  }),
});

export const brandProfileSchema = z.object({
  brandTone: z.object({
    primary: z.string(),
    secondary: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }),
  valueProposition: z.string().optional(),
  primaryGoal: z.string().optional(),
  desiredCustomerAction: z.string().optional(),
  differentiators: z.array(z.string()).optional(),
  trustSignals: z.array(z.string()).optional(),
  contentStylePreference: z.string().optional(),
  operatorNotes: z.string().optional(),
});

export const handoffBodySchema = z
  .object({
    projectId: z.string().uuid().optional(),
    projectConfig: z
      .object({
        name: z.string().optional().default(''),
        projectName: z.string().optional(),
        description: z.string().optional().default(''),
        userDescription: z.string().optional(),
        industry: z.string().optional(),
        platformType: z.string().optional(),
        template: z
          .object({
            id: z.string(),
            name: z.string().optional(),
          })
          .optional(),
        clientName: z.string().optional(),
        clientEmail: z.string().email().optional(),
        clientPhone: z.string().optional(),
        businessInfo: z
          .object({
            description: z.string().optional(),
            summary: z.string().optional(),
            uvp: z.string().optional(),
            valueProposition: z.string().optional(),
            targetAudience: z.string().optional(),
            industry: z.string().optional(),
            goal: z.string().optional(),
            goals: z.array(z.string()).optional(),
            offerType: z.string().optional(),
            brandTone: z.string().optional(),
            offerings: z.union([z.string(), z.array(z.string())]).optional(),
            desiredCustomerAction: z.string().optional(),
            differentiators: z.array(z.string()).optional(),
            trustSignals: z.array(z.string()).optional(),
            contentStylePreference: z.string().optional(),
            contactEmail: z.string().optional(),
            contactPhone: z.string().optional(),
            contactAddress: z.string().optional(),
          })
          .optional(),
        brandProfile: brandProfileSchema.optional(),
        siteInfo: z
          .object({
            pagePreference: z.enum(['single-page', 'multi-page']).optional(),
            integrations: z.array(z.string()).optional(),
          })
          .optional(),
        flowstarterEngine: z
          .object({
            projectBrief: z.record(z.unknown()),
            templateSelection: z.record(z.unknown()),
            assemblySpec: z.record(z.unknown()),
            contentMap: z.record(z.unknown()),
            validationReport: z.record(z.unknown()),
          })
          .optional(),
        palette: paletteSchema.optional(),
        font: fontSchema.optional(),
        contactInfo: z
          .object({
            email: z.string().optional(),
            phone: z.string().optional(),
            address: z.string().optional(),
          })
          .optional(),
        integrations: z
          .object({
            calendly: z
              .object({
                enabled: z.boolean().optional(),
                url: z.string().optional(),
              })
              .optional(),
            googleAnalytics: z
              .object({
                enabled: z.boolean().optional(),
                measurementId: z.string().optional(),
              })
              .optional(),
            mailchimp: z
              .object({
                enabled: z.boolean().optional(),
                apiKey: z.string().optional(),
                audienceId: z.string().optional(),
              })
              .optional(),
            stripe: z
              .object({
                enabled: z.boolean().optional(),
                publishableKey: z.string().optional(),
                priceId: z.string().optional(),
              })
              .optional(),
          })
          .optional(),
        planName: z.string().optional(),
        totalFee: z.number().optional(),
        depositAmount: z.number().optional(),
        finalAmount: z.number().optional(),
        templateId: z.string().optional(),
      })
      .optional(),
    mode: z
      .enum(['interactive', 'generate', 'concierge'])
      .optional()
      .default('concierge'),
  })
  .refine((d) => d.projectId || d.projectConfig, {
    message: 'Either projectId or projectConfig is required',
  });
