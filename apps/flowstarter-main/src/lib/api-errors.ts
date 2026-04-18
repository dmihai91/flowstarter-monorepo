import { NextResponse } from 'next/server';

/**
 * Standard API error response shape.
 * All API routes should return errors in this format.
 */
interface ApiErrorBody {
  error: string;
  code: string;
  details?: unknown;
}

type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'BAD_GATEWAY';

const STATUS_MAP: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  INTERNAL_ERROR: 500,
  BAD_GATEWAY: 502,
};

/**
 * Returns a standardized JSON error response.
 *
 * Usage:
 *   return apiError('Not authenticated', 'UNAUTHORIZED');
 *   return apiError('Invalid input', 'VALIDATION_ERROR', parsed.error.flatten());
 */
export function apiError(
  message: string,
  code: ErrorCode,
  details?: unknown
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = { error: message, code };
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, { status: STATUS_MAP[code] });
}
