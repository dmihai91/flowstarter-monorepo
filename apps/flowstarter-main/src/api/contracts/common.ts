import { z } from 'zod';

/**
 * Standard error response schema for all API endpoints.
 */
export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * Standard success response wrapper.
 */
export const ApiSuccessSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

/**
 * Standard failure response wrapper.
 */
export const ApiFailureSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
});

export type ApiFailure = z.infer<typeof ApiFailureSchema>;

/**
 * Pagination request schema.
 */
export const PaginationRequestSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type PaginationRequest = z.infer<typeof PaginationRequestSchema>;

/**
 * Pagination response schema.
 */
export const PaginationResponseSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export type PaginationResponse = z.infer<typeof PaginationResponseSchema>;

/**
 * Helper to create a paginated response schema.
 */
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  z.object({
    items: z.array(itemSchema),
    pagination: PaginationResponseSchema,
  });

/**
 * Standard API response type helper.
 */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

/**
 * Helper function to create a success response.
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

/**
 * Helper function to create an error response.
 */
export function errorResponse(
  error: string,
  code?: string
): ApiResponse<never> {
  return { success: false, error, code };
}
