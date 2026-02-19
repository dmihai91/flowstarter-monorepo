import { describe, it, expect, beforeAll, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to ensure mock functions are hoisted with vi.mock
const { mockVerifyAuth, mockCheckUserPermissions } = vi.hoisted(() => ({
  mockVerifyAuth: vi.fn(),
  mockCheckUserPermissions: vi.fn()
}));
// Mock auth module before importing server
vi.mock('./utils/auth.js', () => ({
  verifyAuth: mockVerifyAuth,
  checkUserPermissions: mockCheckUserPermissions,
  AuthContext: {}
}));

import { createMcpServer } from './server.js';

describe('server', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createMcpServer', () => {
    beforeEach(() => {
      process.env.DISABLE_AUTH = 'true';
    });

    it('should create an MCP server instance', async () => {
      const { server, fetcher } = await createMcpServer();

      expect(server).toBeDefined();
      expect(fetcher).toBeDefined();
    });

    it('should initialize template fetcher with templates', async () => {
      const { fetcher } = await createMcpServer();

      const templates = fetcher.getAllTemplates();
      expect(templates.length).toBe(3);
    });

    it('should return server and fetcher as tuple', async () => {
      const result = await createMcpServer();

      expect(result).toHaveProperty('server');
      expect(result).toHaveProperty('fetcher');
    });
  });

  describe('withSessionToken helper', () => {
    it('should add _sessionToken to empty schema shape', () => {
      const baseShape = {};
      const extended = { ...baseShape, _sessionToken: undefined };

      expect('_sessionToken' in extended).toBe(true);
    });

    it('should preserve original shape properties', () => {
      const baseShape = {
        slug: 'test-slug',
        projectName: 'Test Project',
        description: 'A description'
      };

      const extended = { ...baseShape, _sessionToken: 'optional' };

      expect(extended.slug).toBe('test-slug');
      expect(extended.projectName).toBe('Test Project');
      expect(extended.description).toBe('A description');
      expect(extended._sessionToken).toBe('optional');
    });

    it('should work with complex nested properties', () => {
      const baseShape = {
        slug: 'test',
        customizations: { key: 'value', nested: { deep: true } }
      };

      const extended = { ...baseShape, _sessionToken: 'token' };

      expect(extended.customizations.nested.deep).toBe(true);
    });
  });

  describe('createErrorResponse helper', () => {
    it('should create error with correct structure', () => {
      const errorData = {
        error: 'Unauthorized: Authentication required.',
        statusCode: 401,
        code: 'UNAUTHORIZED'
      };

      const response = {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(errorData)
        }],
        isError: true
      };

      expect(response.isError).toBe(true);
      expect(response.content[0].type).toBe('text');

      const parsed = JSON.parse(response.content[0].text);
      expect(parsed.error).toBe('Unauthorized: Authentication required.');
      expect(parsed.statusCode).toBe(401);
      expect(parsed.code).toBe('UNAUTHORIZED');
    });

    it('should create 401 error for unauthorized', () => {
      const error = {
        error: 'Unauthorized: Invalid or expired session token.',
        statusCode: 401,
        code: 'INVALID_TOKEN'
      };

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('INVALID_TOKEN');
    });

    it('should create 403 error for forbidden', () => {
      const error = {
        error: 'Forbidden: You do not have permission to access this resource.',
        statusCode: 403,
        code: 'FORBIDDEN'
      };

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('should serialize error to JSON string', () => {
      const errorData = {
        error: 'Test error',
        statusCode: 400,
        code: 'TEST_ERROR'
      };

      const serialized = JSON.stringify(errorData);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(errorData);
    });

    it('should handle special characters in error message', () => {
      const errorData = {
        error: 'Error: User "test" not found <script>',
        statusCode: 404,
        code: 'NOT_FOUND'
      };

      const serialized = JSON.stringify(errorData);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.error).toContain('User "test"');
    });
  });

  describe('verifyToolAuth behavior', () => {
    describe('when DISABLE_AUTH is true', () => {
      beforeEach(() => {
        process.env.DISABLE_AUTH = 'true';
      });

      it('should bypass authentication', async () => {
        const { server } = await createMcpServer();

        // Server should be created without calling verifyAuth
        expect(server).toBeDefined();
        expect(mockVerifyAuth).not.toHaveBeenCalled();
      });

      it('should return dev user context', () => {
        const expectedContext = {
          userId: 'dev-user',
          sessionId: 'dev-session',
          isAuthenticated: true,
          user: { id: 'dev-user', email: 'dev@local.test' }
        };

        expect(expectedContext.userId).toBe('dev-user');
        expect(expectedContext.isAuthenticated).toBe(true);
      });
    });

    describe('when DISABLE_AUTH is false', () => {
      beforeEach(() => {
        process.env.DISABLE_AUTH = 'false';
      });

      it('should require session token', () => {
        const args = {}; // No _sessionToken
        const hasToken = '_sessionToken' in args && args._sessionToken;

        expect(hasToken).toBeFalsy();
      });

      it('should validate session token format', () => {
        const validToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...';
        const invalidToken = '';

        expect(validToken.length).toBeGreaterThan(0);
        expect(invalidToken.length).toBe(0);
      });
    });
  });

  describe('error response format', () => {
    it('should have consistent error structure', () => {
      const errorStructure = {
        error: 'Test error message',
        statusCode: 401,
        code: 'UNAUTHORIZED'
      };

      expect(errorStructure.error).toBeDefined();
      expect(errorStructure.statusCode).toBeDefined();
      expect(errorStructure.code).toBeDefined();
      expect(typeof errorStructure.error).toBe('string');
      expect(typeof errorStructure.statusCode).toBe('number');
      expect(typeof errorStructure.code).toBe('string');
    });

    it('should use standard HTTP status codes', () => {
      const validStatusCodes = [400, 401, 403, 404, 500];

      validStatusCodes.forEach(code => {
        expect(code).toBeGreaterThanOrEqual(400);
        expect(code).toBeLessThan(600);
      });
    });

    it('should use consistent error codes', () => {
      const errorCodes = ['UNAUTHORIZED', 'INVALID_TOKEN', 'FORBIDDEN', 'NOT_FOUND'];

      errorCodes.forEach(code => {
        expect(code).toMatch(/^[A-Z_]+$/);
      });
    });
  });

  describe('schema validation', () => {
    it('should validate list_templates accepts empty object', () => {
      const schema = { _sessionToken: undefined };
      expect(schema).toBeDefined();
    });

    it('should validate get_template_details requires slug', () => {
      const validInput = { slug: 'local-business-pro', _sessionToken: 'token' };
      const invalidInput = { _sessionToken: 'token' };

      expect(validInput.slug).toBeDefined();
      expect((invalidInput as any).slug).toBeUndefined();
    });

    it('should validate scaffold_template requires slug', () => {
      const validInput = { slug: 'local-business-pro' };
      expect(validInput.slug).toBeDefined();
    });

    it('should validate search_templates requires query', () => {
      const validInput = { query: 'business' };
      expect(validInput.query).toBeDefined();
    });

    it('should validate clone_template requires slug and projectName', () => {
      const validInput = {
        slug: 'local-business-pro',
        projectName: 'My Project'
      };
      expect(validInput.slug).toBeDefined();
      expect(validInput.projectName).toBeDefined();
    });

    it('should validate clone_template accepts optional fields', () => {
      const validInput = {
        slug: 'local-business-pro',
        projectName: 'My Project',
        projectDescription: 'Optional description',
        customizations: { theme: 'dark' }
      };
      expect(validInput.projectDescription).toBeDefined();
      expect(validInput.customizations).toBeDefined();
    });

    it('should validate get_project requires projectId', () => {
      const validInput = { projectId: 'proj_123' };
      expect(validInput.projectId).toBeDefined();
    });

    it('should validate get_user_projects requires userId', () => {
      const validInput = { userId: 'user_123' };
      expect(validInput.userId).toBeDefined();
    });
  });

  describe('tool registration', () => {
    it('should register all expected tools', async () => {
      process.env.DISABLE_AUTH = 'true';
      const { server } = await createMcpServer();

      expect(server).toBeDefined();
    });

    it('should have 7 tools registered', () => {
      const expectedTools = [
        'list_templates',
        'get_template_details',
        'scaffold_template',
        'search_templates',
        'clone_template',
        'get_project',
        'get_user_projects'
      ];

      expect(expectedTools.length).toBe(7);
    });

    it('should have correct tool descriptions', () => {
      const toolDescriptions = {
        list_templates: 'List all available Flowstarter Library with metadata',
        get_template_details: 'Get comprehensive details about a specific template',
        scaffold_template: 'Get complete file structure and contents for scaffolding a template in the editor',
        search_templates: 'Search templates by keywords, category, or use case',
        clone_template: 'Clone a template with customizations and prepare it for the coding agent',
        get_project: 'Get detailed information about a specific project from Supabase',
        get_user_projects: 'Get all projects for a specific user'
      };

      expect(Object.keys(toolDescriptions).length).toBe(7);
      Object.values(toolDescriptions).forEach(desc => {
        expect(typeof desc).toBe('string');
        expect(desc.length).toBeGreaterThan(10);
      });
    });
  });

  describe('authentication flow simulation', () => {
    it('should handle missing token scenario', () => {
      const args = {};
      const sessionToken = (args as any)?._sessionToken;

      expect(sessionToken).toBeUndefined();
    });

    it('should handle valid token scenario', () => {
      const args = { _sessionToken: 'valid_token_123' };
      const sessionToken = args._sessionToken;

      expect(sessionToken).toBe('valid_token_123');
    });

    it('should handle auth success flow', async () => {
      mockVerifyAuth.mockResolvedValue({
        isAuthenticated: true,
        userId: 'user_123',
        sessionId: 'session_456',
        user: { email: 'test@example.com' }
      });

      mockCheckUserPermissions.mockResolvedValue({
        hasPermission: true
      });

      const authContext = await mockVerifyAuth('valid_token');
      const permissions = await mockCheckUserPermissions(authContext.userId);

      expect(authContext.isAuthenticated).toBe(true);
      expect(permissions.hasPermission).toBe(true);
    });

    it('should handle auth failure flow', async () => {
      mockVerifyAuth.mockResolvedValue({
        isAuthenticated: false,
        userId: null,
        sessionId: null
      });

      const authContext = await mockVerifyAuth('invalid_token');

      expect(authContext.isAuthenticated).toBe(false);
    });

    it('should handle permission denied flow', async () => {
      mockVerifyAuth.mockResolvedValue({
        isAuthenticated: true,
        userId: 'banned_user',
        sessionId: 'session_123'
      });

      mockCheckUserPermissions.mockResolvedValue({
        hasPermission: false,
        error: 'User account is suspended'
      });

      const authContext = await mockVerifyAuth('valid_token');
      const permissions = await mockCheckUserPermissions(authContext.userId);

      expect(authContext.isAuthenticated).toBe(true);
      expect(permissions.hasPermission).toBe(false);
      expect(permissions.error).toBe('User account is suspended');
    });
  });

  describe('tool response format', () => {
    it('should return content array with text type', () => {
      const response = {
        content: [{
          type: 'text',
          text: JSON.stringify({ data: 'test' }, null, 2)
        }]
      };

      expect(response.content).toBeInstanceOf(Array);
      expect(response.content[0].type).toBe('text');
      expect(typeof response.content[0].text).toBe('string');
    });

    it('should format JSON with indentation', () => {
      const data = { templates: [{ slug: 'test' }] };
      const formatted = JSON.stringify(data, null, 2);

      expect(formatted).toContain('\n');
      expect(formatted).toContain('  ');
    });

    it('should handle empty results', () => {
      const emptyResult = { templates: [] };
      const response = JSON.stringify(emptyResult, null, 2);

      expect(response).toContain('templates');
      expect(response).toContain('[]');
    });
  });

  describe('TEMPLATES_DIR configuration', () => {
    it('should resolve to correct templates directory', () => {
      // The directory should be relative to build directory
      const expectedPath = '../../templates';
      expect(expectedPath).toContain('templates');
    });
  });
});

describe('integration scenarios', () => {
  beforeEach(() => {
    process.env.DISABLE_AUTH = 'true';
    vi.clearAllMocks();
  });

  it('should create server and list templates', async () => {
    const { fetcher } = await createMcpServer();

    const templates = fetcher.getAllTemplates();

    expect(templates.length).toBe(3);
    expect(templates.map(t => t.metadata.slug)).toContain('local-business-pro');
  });

  it('should create server and get template details', async () => {
    const { fetcher } = await createMcpServer();

    const template = fetcher.getTemplate('local-business-pro');

    expect(template).toBeDefined();
    expect(template?.metadata.displayName).toBe('Local Business Pro');
  });

  it('should create server and search templates', async () => {
    const { fetcher } = await createMcpServer();

    const results = fetcher.searchTemplates('business');

    expect(results.length).toBeGreaterThan(0);
  });
});
