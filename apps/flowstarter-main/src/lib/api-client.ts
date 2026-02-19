import { z } from 'zod';
import {
  ApiError,
  ApiErrorSchema,
  CreateProjectRequest,
  CreateProjectResponse,
  CreateProjectResponseSchema,
  DashboardStatsResponse,
  DashboardStatsResponseSchema,
  DeleteProjectResponse,
  DeleteProjectResponseSchema,
  DomainAvailabilityRequest,
  DomainAvailabilityResponse,
  DomainAvailabilityResponseSchema,
  GetProjectResponse,
  GetProjectResponseSchema,
  GetProjectsResponse,
  GetProjectsResponseSchema,
  ProjectSuggestionsRequest,
  ProjectSuggestionsResponse,
  ProjectSuggestionsResponseSchema,
  UpdateProjectRequest,
  UpdateProjectResponse,
  UpdateProjectResponseSchema,
} from '@/api/contracts';

/**
 * API client configuration.
 */
interface ApiClientConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
}

/**
 * API response wrapper for type-safe error handling.
 */
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError; status: number };

/**
 * Create an API client instance.
 */
export function createApiClient(config: ApiClientConfig = {}) {
  const baseUrl = config.baseUrl || '';
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...config.headers,
  };

  /**
   * Make a typed API request with response validation.
   */
  async function request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    schema: z.ZodType<T>,
    body?: unknown
  ): Promise<ApiResult<T>> {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: defaultHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const json = await response.json();

      if (!response.ok) {
        const error = ApiErrorSchema.safeParse(json);
        return {
          ok: false,
          error: error.success
            ? error.data
            : { error: 'Unknown error occurred' },
          status: response.status,
        };
      }

      const result = schema.safeParse(json);
      if (!result.success) {
        console.error('API response validation failed:', result.error);
        return {
          ok: false,
          error: { error: 'Invalid response format', details: result.error },
          status: response.status,
        };
      }

      return { ok: true, data: result.data };
    } catch (err) {
      return {
        ok: false,
        error: {
          error: err instanceof Error ? err.message : 'Network error',
        },
        status: 0,
      };
    }
  }

  return {
    // Projects API
    projects: {
      list: (): Promise<ApiResult<GetProjectsResponse>> =>
        request('GET', '/api/projects', GetProjectsResponseSchema),

      get: (id: string): Promise<ApiResult<GetProjectResponse>> =>
        request('GET', `/api/projects/${id}`, GetProjectResponseSchema),

      create: (
        data: CreateProjectRequest
      ): Promise<ApiResult<CreateProjectResponse>> =>
        request('POST', '/api/projects', CreateProjectResponseSchema, data),

      update: (
        data: UpdateProjectRequest
      ): Promise<ApiResult<UpdateProjectResponse>> =>
        request(
          'PATCH',
          `/api/projects/${data.id}`,
          UpdateProjectResponseSchema,
          data
        ),

      delete: (id: string): Promise<ApiResult<DeleteProjectResponse>> =>
        request('DELETE', `/api/projects/${id}`, DeleteProjectResponseSchema),
    },

    // Domains API
    domains: {
      checkAvailability: (
        data: DomainAvailabilityRequest
      ): Promise<ApiResult<DomainAvailabilityResponse>> =>
        request(
          'POST',
          '/api/domains/availability',
          DomainAvailabilityResponseSchema,
          data
        ),
    },

    // Dashboard API
    dashboard: {
      getStats: (): Promise<ApiResult<DashboardStatsResponse>> =>
        request('GET', '/api/dashboard/stats', DashboardStatsResponseSchema),
    },

    // AI API
    ai: {
      getSuggestions: (
        data: ProjectSuggestionsRequest
      ): Promise<ApiResult<ProjectSuggestionsResponse>> =>
        request(
          'POST',
          '/api/suggestions',
          ProjectSuggestionsResponseSchema,
          data
        ),
    },
  };
}

/**
 * Default API client instance.
 */
export const apiClient = createApiClient();

/**
 * Type-safe helper for extracting successful response data.
 * Throws if the response was an error.
 */
export function unwrapResult<T>(result: ApiResult<T>): T {
  if (!result.ok) {
    throw new Error(result.error.error);
  }
  return result.data;
}

/**
 * Type-safe helper for handling API results.
 */
export function handleResult<T, R>(
  result: ApiResult<T>,
  handlers: {
    onSuccess: (data: T) => R;
    onError: (error: ApiError, status: number) => R;
  }
): R {
  if (result.ok) {
    return handlers.onSuccess(result.data);
  }
  return handlers.onError(result.error, result.status);
}
