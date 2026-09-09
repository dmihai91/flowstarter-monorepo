import { z } from 'zod';

/**
 * The info-agent conversation as the wizard submits it, one schema for every
 * door it can come through (the signed-in claim and the guest deposit). It
 * becomes corpus evidence the generator may cite, never authorization and
 * never price, and every field is bounded because all of it is typed by a
 * visitor.
 */
export const IntakeChatSchema = z.object({
  transcript: z
    .array(
      z.object({
        role: z.enum(['agent', 'client']),
        text: z.string().max(1000),
      })
    )
    .max(24)
    .optional()
    .default([]),
  documents: z
    .array(
      z.object({
        topic: z.string().max(60),
        text: z.string().max(1200),
      })
    )
    .max(8)
    .optional()
    .default([]),
  answers: z.array(z.string().max(1000)).max(24).optional().default([]),
  services: z.array(z.string().max(120)).max(20).optional().default([]),
  phone: z.string().max(40).optional().default(''),
});

export type IntakeChatInput = z.infer<typeof IntakeChatSchema>;
