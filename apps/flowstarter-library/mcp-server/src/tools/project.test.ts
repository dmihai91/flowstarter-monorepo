import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getProjectDetails, getUserProjects, GetProjectSchema, GetUserProjectsSchema } from './project.js';

// Mock the supabase module
vi.mock('../utils/supabase.js', () => ({
  getProjectById: vi.fn(),
  getProjectsByUserId: vi.fn()
}));

import { getProjectById, getProjectsByUserId } from '../utils/supabase.js';

describe('project tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GetProjectSchema', () => {
    it('should be a valid Zod schema', () => {
      expect(GetProjectSchema).toBeDefined();
      expect(GetProjectSchema.parse).toBeDefined();
    });

    it('should require projectId field', () => {
      const result = GetProjectSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept valid projectId', () => {
      const result = GetProjectSchema.safeParse({ projectId: 'proj_123' });
      expect(result.success).toBe(true);
    });

    it('should reject non-string projectId', () => {
      const result = GetProjectSchema.safeParse({ projectId: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe('GetUserProjectsSchema', () => {
    it('should be a valid Zod schema', () => {
      expect(GetUserProjectsSchema).toBeDefined();
      expect(GetUserProjectsSchema.parse).toBeDefined();
    });

    it('should require userId field', () => {
      const result = GetUserProjectsSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should accept valid userId', () => {
      const result = GetUserProjectsSchema.safeParse({ userId: 'user_123' });
      expect(result.success).toBe(true);
    });
  });

  describe('getProjectDetails', () => {
    it('should return project when found', async () => {
      const mockProject = {
        id: 'proj_123',
        user_id: 'user_456',
        name: 'Test Project',
        description: 'A test project',
        template_slug: 'local-business-pro',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      vi.mocked(getProjectById).mockResolvedValue(mockProject);

      const result = await getProjectDetails({ projectId: 'proj_123' });

      expect(result.success).toBe(true);
      expect(result.project).toEqual(mockProject);
      expect(result.error).toBeUndefined();
      expect(getProjectById).toHaveBeenCalledWith('proj_123');
    });

    it('should return error when project not found', async () => {
      vi.mocked(getProjectById).mockResolvedValue(null);

      const result = await getProjectDetails({ projectId: 'non_existent' });

      expect(result.success).toBe(false);
      expect(result.project).toBeUndefined();
      expect(result.error).toContain('not found');
    });

    it('should handle database errors', async () => {
      vi.mocked(getProjectById).mockRejectedValue(new Error('Database connection failed'));

      const result = await getProjectDetails({ projectId: 'proj_123' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to retrieve project');
    });

    it('should include project with all fields', async () => {
      const mockProject = {
        id: 'proj_123',
        user_id: 'user_456',
        name: 'Full Project',
        description: 'Complete project data',
        template_slug: 'saas-product-pro',
        git_url: 'https://github.com/user/repo',
        git_branch: 'main',
        netlify_site_id: 'site_abc',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
        metadata: { custom: 'data' }
      };

      vi.mocked(getProjectById).mockResolvedValue(mockProject);

      const result = await getProjectDetails({ projectId: 'proj_123' });

      expect(result.success).toBe(true);
      expect(result.project?.git_url).toBe('https://github.com/user/repo');
      expect(result.project?.git_branch).toBe('main');
      expect(result.project?.netlify_site_id).toBe('site_abc');
      expect(result.project?.metadata).toEqual({ custom: 'data' });
    });
  });

  describe('getUserProjects', () => {
    it('should return projects for user', async () => {
      const mockProjects = [
        {
          id: 'proj_1',
          user_id: 'user_123',
          name: 'Project 1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'proj_2',
          user_id: 'user_123',
          name: 'Project 2',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z'
        }
      ];

      vi.mocked(getProjectsByUserId).mockResolvedValue(mockProjects);

      const result = await getUserProjects({ userId: 'user_123' });

      expect(result.success).toBe(true);
      expect(result.projects).toEqual(mockProjects);
      expect(result.count).toBe(2);
      expect(getProjectsByUserId).toHaveBeenCalledWith('user_123');
    });

    it('should return empty array when user has no projects', async () => {
      vi.mocked(getProjectsByUserId).mockResolvedValue([]);

      const result = await getUserProjects({ userId: 'user_no_projects' });

      expect(result.success).toBe(true);
      expect(result.projects).toEqual([]);
      expect(result.count).toBe(0);
    });

    it('should handle database errors', async () => {
      vi.mocked(getProjectsByUserId).mockRejectedValue(new Error('Database error'));

      const result = await getUserProjects({ userId: 'user_123' });

      expect(result.success).toBe(false);
      expect(result.projects).toEqual([]);
      expect(result.count).toBe(0);
      expect(result.error).toContain('Failed to retrieve projects');
    });

    it('should return correct count for multiple projects', async () => {
      const mockProjects = Array.from({ length: 5 }, (_, i) => ({
        id: `proj_${i}`,
        user_id: 'user_123',
        name: `Project ${i}`,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }));

      vi.mocked(getProjectsByUserId).mockResolvedValue(mockProjects);

      const result = await getUserProjects({ userId: 'user_123' });

      expect(result.success).toBe(true);
      expect(result.count).toBe(5);
      expect(result.projects.length).toBe(5);
    });
  });
});
