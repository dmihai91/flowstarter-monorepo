import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApiClient, handleResult, unwrapResult } from '../api-client';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createApiClient', () => {
    it('should create client with default config', () => {
      const client = createApiClient();
      expect(client).toBeDefined();
      expect(client.projects).toBeDefined();
      expect(client.domains).toBeDefined();
      expect(client.dashboard).toBeDefined();
      expect(client.ai).toBeDefined();
    });

    it('should create client with custom base URL', () => {
      const client = createApiClient({ baseUrl: 'https://api.example.com' });
      expect(client).toBeDefined();
    });
  });

  describe('projects.list', () => {
    it('should return projects on success', async () => {
      const mockProjects = {
        projects: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Test Project',
            status: 'draft',
            user_id: 'user_123',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockProjects),
      });

      const client = createApiClient();
      const result = await client.projects.list();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.projects).toHaveLength(1);
        expect(result.data.projects[0].name).toBe('Test Project');
      }
    });

    it('should return error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      const client = createApiClient();
      const result = await client.projects.list();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.error).toBe('Unauthorized');
        expect(result.status).toBe(401);
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const client = createApiClient();
      const result = await client.projects.list();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.error).toBe('Network error');
        expect(result.status).toBe(0);
      }
    });
  });

  describe('projects.create', () => {
    it('should create project successfully', async () => {
      const mockResponse = {
        success: true,
        projectId: '550e8400-e29b-41d4-a716-446655440000',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });

      const client = createApiClient();
      const result = await client.projects.create({
        name: 'New Project',
        description: 'A new project',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.projectId).toBe(
          '550e8400-e29b-41d4-a716-446655440000'
        );
      }

      expect(mockFetch).toHaveBeenCalledWith('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Project',
          description: 'A new project',
        }),
      });
    });
  });

  describe('domains.checkAvailability', () => {
    it('should check domain availability', async () => {
      const mockResponse = {
        isAvailable: true,
        domain: 'example.com',
        suggestions: ['example.io'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const client = createApiClient();
      const result = await client.domains.checkAvailability({
        domain: 'example.com',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.isAvailable).toBe(true);
        expect(result.data.domain).toBe('example.com');
      }
    });
  });

  describe('dashboard.getStats', () => {
    it('should get dashboard stats', async () => {
      const mockStats = {
        projects: {
          total: 10,
          published: 5,
          draft: 3,
          generating: 2,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockStats),
      });

      const client = createApiClient();
      const result = await client.dashboard.getStats();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.projects.total).toBe(10);
      }
    });
  });

  describe('ai.getSuggestions', () => {
    it('should get AI suggestions', async () => {
      const mockSuggestions = {
        names: ['TechFlow', 'InnovateTech'],
        description: 'A tech company description',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockSuggestions),
      });

      const client = createApiClient();
      const result = await client.ai.getSuggestions({
        businessInfo: {
          description: 'A tech startup',
        },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.names).toEqual(['TechFlow', 'InnovateTech']);
      }
    });
  });

  describe('Response validation', () => {
    it('should return error for invalid response format', async () => {
      // Response that doesn't match schema
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ invalid: 'response' }),
      });

      const client = createApiClient();
      const result = await client.projects.list();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.error).toBe('Invalid response format');
      }
    });
  });

  describe('unwrapResult', () => {
    it('should return data for successful result', () => {
      const result = { ok: true as const, data: { name: 'Test' } };
      const data = unwrapResult(result);
      expect(data).toEqual({ name: 'Test' });
    });

    it('should throw for error result', () => {
      const result = {
        ok: false as const,
        error: { error: 'Failed' },
        status: 500,
      };
      expect(() => unwrapResult(result)).toThrow('Failed');
    });
  });

  describe('handleResult', () => {
    it('should call onSuccess for successful result', () => {
      const result = { ok: true as const, data: { count: 5 } };
      const value = handleResult(result, {
        onSuccess: (data) => data.count * 2,
        onError: () => 0,
      });
      expect(value).toBe(10);
    });

    it('should call onError for failed result', () => {
      const result = {
        ok: false as const,
        error: { error: 'Not found' },
        status: 404,
      };
      const value = handleResult(result, {
        onSuccess: () => 'success',
        onError: (error, status) => `Error ${status}: ${error.error}`,
      });
      expect(value).toBe('Error 404: Not found');
    });
  });
});
