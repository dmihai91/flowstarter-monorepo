import { z } from 'zod';

/**
 * Domain availability check request schema.
 */
export const DomainAvailabilityRequestSchema = z.object({
  domain: z.string().min(1).max(253),
});

export type DomainAvailabilityRequest = z.infer<
  typeof DomainAvailabilityRequestSchema
>;

/**
 * Domain availability check response schema.
 */
export const DomainAvailabilityResponseSchema = z.object({
  isAvailable: z.boolean(),
  domain: z.string(),
  suggestions: z.array(z.string()).optional(),
  error: z.string().optional(),
});

export type DomainAvailabilityResponse = z.infer<
  typeof DomainAvailabilityResponseSchema
>;

/**
 * Domain registration request schema.
 */
export const DomainRegistrationRequestSchema = z.object({
  domain: z.string().min(1).max(253),
  projectId: z.string().uuid(),
  registrar: z.enum(['vercel', 'cloudflare', 'namecheap']).optional(),
});

export type DomainRegistrationRequest = z.infer<
  typeof DomainRegistrationRequestSchema
>;

/**
 * Domain registration response schema.
 */
export const DomainRegistrationResponseSchema = z.object({
  success: z.literal(true),
  domain: z.string(),
  status: z.enum(['pending', 'verified', 'active']),
  verificationRecords: z
    .array(
      z.object({
        type: z.enum(['TXT', 'CNAME', 'A', 'AAAA']),
        name: z.string(),
        value: z.string(),
      })
    )
    .optional(),
});

export type DomainRegistrationResponse = z.infer<
  typeof DomainRegistrationResponseSchema
>;

/**
 * Domain verification request schema.
 */
export const DomainVerificationRequestSchema = z.object({
  domain: z.string().min(1),
  projectId: z.string().uuid(),
});

export type DomainVerificationRequest = z.infer<
  typeof DomainVerificationRequestSchema
>;

/**
 * Domain verification response schema.
 */
export const DomainVerificationResponseSchema = z.object({
  verified: z.boolean(),
  domain: z.string(),
  records: z
    .array(
      z.object({
        type: z.string(),
        valid: z.boolean(),
        expected: z.string().optional(),
        actual: z.string().optional(),
      })
    )
    .optional(),
});

export type DomainVerificationResponse = z.infer<
  typeof DomainVerificationResponseSchema
>;
