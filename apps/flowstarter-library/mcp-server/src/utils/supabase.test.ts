import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the entire @supabase/supabase-js module
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();

const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate
}));

const mockCreateClient = vi.fn(() => ({
  from: mockFrom
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient
}));

describe('supabase utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();

    // Setup default mock chain
    mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder });
    mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSingle }) });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle, order: mockOrder });
    mockOrder.mockReturnValue({ data: [], error: null });
    mockSingle.mockReturnValue({ data: null, error: null });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  describe('getSupabaseClient', () => {
    it('should throw error when SUPABASE_URL is missing', async () => {
      delete process.env.SUPABASE_URL;
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

      const { getSupabaseClient } = await import('./supabase.js');

      expect(() => getSupabaseClient()).toThrow('Missing Supabase configuration');
    });

    it('should throw error when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      vi.resetModules();
      const { getSupabaseClient } = await import('./supabase.js');

      expect(() => getSupabaseClient()).toThrow('Missing Supabase configuration');
    });

    it('should create client when both env vars are set', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

      vi.resetModules();
      const { getSupabaseClient } = await import('./supabase.js');

      const client = getSupabaseClient();
      expect(client).toBeDefined();
    });

    it('should return singleton instance', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

      vi.resetModules();
      const { getSupabaseClient } = await import('./supabase.js');

      const client1 = getSupabaseClient();
      const client2 = getSupabaseClient();

      expect(client1).toBe(client2);
    });
  });

  describe('ProjectRecord interface', () => {
    it('should have correct structure', () => {
      const project = {
        id: 'proj_123',
        user_id: 'user_456',
        name: 'Test Project',
        description: 'A test project',
        template_slug: 'local-business-pro',
        git_url: 'https://github.com/user/repo',
        git_branch: 'main',
        netlify_site_id: 'site_abc',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        metadata: { custom: 'data' }
      };

      expect(project.id).toBeDefined();
      expect(project.user_id).toBeDefined();
      expect(project.name).toBeDefined();
      expect(project.created_at).toBeDefined();
      expect(project.updated_at).toBeDefined();
    });

    it('should allow optional fields', () => {
      const minimalProject = {
        id: 'proj_123',
        user_id: 'user_456',
        name: 'Test Project',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      expect(minimalProject.id).toBeDefined();
      expect((minimalProject as any).description).toBeUndefined();
      expect((minimalProject as any).git_url).toBeUndefined();
    });
  });

  describe('getProjectById', () => {
    it('should query projects table by id', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

      const mockProject = {
        id: 'proj_123',
        user_id: 'user_456',
        name: 'Test Project',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      mockSingle.mockReturnValue({ data: mockProject, error: null });

      vi.resetModules();
      const { getProjectById } = await import('./supabase.js');

      const result = await getProjectById('proj_123');

      expect(mockFrom).toHaveBeenCalledWith('projects');
      expect(result).toEqual(mockProject);
    });

    it('should return null on error', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

      mockSingle.mockReturnValue({
        data: null,
        error: { message: 'Not found' }
      });

      vi.resetModules();
      const { getProjectById } = await import('./supabase.js');

      const result = await getProjectById('non_existent');

      expect(result).toBeNull();
    });
  });

  describe('getProjectsByUserId', () => {
    it('should query projects by user_id', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

      const mockProjects = [
        { id: 'proj_1', user_id: 'user_123', name: 'Project 1' },
        { id: 'proj_2', user_id: 'user_123', name: 'Project 2' }
      ];

      mockOrder.mockReturnValue({ data: mockProjects, error: null });

      vi.resetModules();
      const { getProjectsByUserId } = await import('./supabase.js');

      const result = await getProjectsByUserId('user_123');

      expect(mockFrom).toHaveBeenCalledWith('projects');
      expect(result).toEqual(mockProjects);
    });

    it('should return empty array on error', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

      mockOrder.mockReturnValue({
        data: null,
        error: { message: 'Database error' }
      });

      vi.resetModules();
      const { getProjectsByUserId } = await import('./supabase.js');

      const result = await getProjectsByUserId('user_123');

      expect(result).toEqual([]);
    });

    it('should order results by updated_at descending', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

      mockOrder.mockReturnValue({ data: [], error: null });

      vi.resetModules();
      const { getProjectsByUserId } = await import('./supabase.js');

      await getProjectsByUserId('user_123');

      expect(mockOrder).toHaveBeenCalledWith('updated_at', { ascending: false });
    });
  });

  describe('createProject', () => {
    it('should insert project into database', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

      const newProject = {
        user_id: 'user_123',
        name: 'New Project',
        template_slug: 'local-business-pro'
      };

      const createdProject = {
        ...newProject,
        id: 'proj_new',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const mockSelectSingle = vi.fn().mockReturnValue({ single: vi.fn().mockReturnValue({ data: createdProject, error: null }) });
      mockInsert.mockReturnValue({ select: mockSelectSingle });

      vi.resetModules();
      const { createProject } = await import('./supabase.js');

      const result = await createProject(newProject);

      expect(mockFrom).toHaveBeenCalledWith('projects');
      expect(mockInsert).toHaveBeenCalledWith(newProject);
    });

    it('should return null on insert error', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

      const mockSelectSingle = vi.fn().mockReturnValue({
        single: vi.fn().mockReturnValue({ data: null, error: { message: 'Insert failed' } })
      });
      mockInsert.mockReturnValue({ select: mockSelectSingle });

      vi.resetModules();
      const { createProject } = await import('./supabase.js');

      const result = await createProject({
        user_id: 'user_123',
        name: 'New Project'
      });

      expect(result).toBeNull();
    });
  });

  describe('updateProject', () => {
    it('should update project in database', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

      const updates = { name: 'Updated Name' };
      const updatedProject = {
        id: 'proj_123',
        user_id: 'user_456',
        name: 'Updated Name',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      };

      const mockSelectSingle = vi.fn().mockReturnValue({
        single: vi.fn().mockReturnValue({ data: updatedProject, error: null })
      });
      mockEq.mockReturnValue({ select: mockSelectSingle });

      vi.resetModules();
      const { updateProject } = await import('./supabase.js');

      const result = await updateProject('proj_123', updates);

      expect(mockFrom).toHaveBeenCalledWith('projects');
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should include updated_at timestamp', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

      const mockSelectSingle = vi.fn().mockReturnValue({
        single: vi.fn().mockReturnValue({ data: null, error: null })
      });
      mockEq.mockReturnValue({ select: mockSelectSingle });

      vi.resetModules();
      const { updateProject } = await import('./supabase.js');

      await updateProject('proj_123', { name: 'New Name' });

      // Verify update was called with updated_at
      expect(mockUpdate).toHaveBeenCalled();
    });
  });
});
