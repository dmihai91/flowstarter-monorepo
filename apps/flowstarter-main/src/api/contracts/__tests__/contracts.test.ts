import { describe, expect, it } from 'vitest';
import {
  ApiErrorSchema,
  CreateProjectRequestSchema,
  CreateProjectResponseSchema,
  DashboardStatsResponseSchema,
  DomainAvailabilityRequestSchema,
  DomainAvailabilityResponseSchema,
  ProjectSchema,
  ProjectSuggestionsRequestSchema,
  ProjectSuggestionsResponseSchema,
  errorResponse,
  successResponse,
} from '../index';

describe('API Contracts', () => {
  describe('Common Types', () => {
    it('should validate API error schema', () => {
      const validError = { error: 'Something went wrong', code: 'ERR_001' };
      expect(ApiErrorSchema.safeParse(validError).success).toBe(true);

      const minimalError = { error: 'Error message' };
      expect(ApiErrorSchema.safeParse(minimalError).success).toBe(true);

      const invalidError = { message: 'wrong field' };
      expect(ApiErrorSchema.safeParse(invalidError).success).toBe(false);
    });

    it('should create success response', () => {
      const response = successResponse({ id: '123', name: 'Test' });
      expect(response).toEqual({
        success: true,
        data: { id: '123', name: 'Test' },
      });
    });

    it('should create error response', () => {
      const response = errorResponse('Not found', 'ERR_NOT_FOUND');
      expect(response).toEqual({
        success: false,
        error: 'Not found',
        code: 'ERR_NOT_FOUND',
      });
    });
  });

  describe('Project Contracts', () => {
    it('should validate project schema', () => {
      const validProject = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Project',
        description: 'A test project',
        status: 'draft',
        user_id: 'user_123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = ProjectSchema.safeParse(validProject);
      expect(result.success).toBe(true);
    });

    it('should reject invalid project status', () => {
      const invalidProject = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Project',
        status: 'invalid_status',
        user_id: 'user_123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = ProjectSchema.safeParse(invalidProject);
      expect(result.success).toBe(false);
    });

    it('should validate create project request', () => {
      const validRequest = {
        name: 'My New Project',
        description: 'A great project',
        industry: 'technology',
      };

      const result = CreateProjectRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject create request with empty name', () => {
      const invalidRequest = {
        name: '',
        description: 'A project without a name',
      };

      const result = CreateProjectRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject name exceeding max length', () => {
      const invalidRequest = {
        name: 'A'.repeat(81), // 81 characters, max is 80
      };

      const result = CreateProjectRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should validate create project response', () => {
      const validResponse = {
        success: true,
        projectId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const result = CreateProjectResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });
  });

  describe('Domain Contracts', () => {
    it('should validate domain availability request', () => {
      const validRequest = { domain: 'example.com' };
      expect(
        DomainAvailabilityRequestSchema.safeParse(validRequest).success
      ).toBe(true);

      const emptyDomain = { domain: '' };
      expect(
        DomainAvailabilityRequestSchema.safeParse(emptyDomain).success
      ).toBe(false);
    });

    it('should validate domain availability response', () => {
      const availableResponse = {
        isAvailable: true,
        domain: 'example.com',
        suggestions: ['example.io', 'example.net'],
      };

      expect(
        DomainAvailabilityResponseSchema.safeParse(availableResponse).success
      ).toBe(true);

      const unavailableResponse = {
        isAvailable: false,
        domain: 'google.com',
      };

      expect(
        DomainAvailabilityResponseSchema.safeParse(unavailableResponse).success
      ).toBe(true);
    });
  });

  describe('Dashboard Contracts', () => {
    it('should validate dashboard stats response', () => {
      const validStats = {
        projects: {
          total: 10,
          published: 5,
          draft: 3,
          generating: 2,
        },
      };

      const result = DashboardStatsResponseSchema.safeParse(validStats);
      expect(result.success).toBe(true);
    });

    it('should validate dashboard stats with optional fields', () => {
      const fullStats = {
        projects: {
          total: 10,
          published: 5,
          draft: 3,
          generating: 2,
        },
        analytics: {
          totalViews: 1000,
          totalVisitors: 500,
          viewsThisMonth: 200,
          visitorsThisMonth: 100,
        },
        usage: {
          aiGenerationsThisMonth: 50,
          aiGenerationsLimit: 100,
          storageUsedMB: 500,
          storageLimitMB: 1000,
        },
      };

      const result = DashboardStatsResponseSchema.safeParse(fullStats);
      expect(result.success).toBe(true);
    });

    it('should reject invalid projects stats', () => {
      const invalidStats = {
        projects: {
          total: 'ten', // should be number
          published: 5,
          draft: 3,
          generating: 2,
        },
      };

      const result = DashboardStatsResponseSchema.safeParse(invalidStats);
      expect(result.success).toBe(false);
    });
  });

  describe('AI Contracts', () => {
    it('should validate project suggestions request', () => {
      const validRequest = {
        businessInfo: {
          description: 'A sustainable fashion e-commerce platform',
          industry: 'E-commerce',
        },
      };

      const result = ProjectSuggestionsRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should validate request with chip action', () => {
      const requestWithChip = {
        businessInfo: {
          description: 'Tech startup building AI tools',
        },
        chipAction: 'makeItCatchy',
        previousValue: 'OldName',
      };

      const result = ProjectSuggestionsRequestSchema.safeParse(requestWithChip);
      expect(result.success).toBe(true);
    });

    it('should reject invalid chip action', () => {
      const invalidRequest = {
        businessInfo: {
          description: 'A business',
        },
        chipAction: 'invalidAction',
      };

      const result = ProjectSuggestionsRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should validate project suggestions response', () => {
      const validResponse = {
        names: ['TechFlow', 'InnovateTech', 'SmartSolutions'],
        description: 'A cutting-edge technology company',
        targetUsers: 'Enterprise clients and startups',
        USP: 'AI-powered automation that saves 50% of time',
      };

      const result = ProjectSuggestionsResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should require names array in response', () => {
      const invalidResponse = {
        description: 'A business description',
      };

      const result =
        ProjectSuggestionsResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });
});
