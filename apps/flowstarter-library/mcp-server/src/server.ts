import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { TemplateFetcher } from './utils/template-fetcher.js';
import { listTemplates } from './tools/list.js';
import { getTemplateDetails, GetTemplateDetailsSchema } from './tools/details.js';
import { scaffoldTemplate, ScaffoldTemplateSchema } from './tools/scaffold.js';
import { searchTemplates, SearchTemplatesSchema } from './tools/search.js';
import { cloneTemplate, CloneTemplateSchema } from './tools/clone.js';
import { getProjectDetails, GetProjectSchema, getUserProjects, GetUserProjectsSchema } from './tools/project.js';
import { scaffoldToConvex, ScaffoldToConvexSchema } from './tools/scaffold-to-convex.js';
import { getCodingGuide, GetCodingGuideSchema } from './tools/coding-guide.js';
import { verifyAuth, checkUserPermissions, AuthContext } from './utils/auth.js';

// Pre-defined tool schemas using .shape to get raw shape objects
// This avoids deep type inference that causes TS2589 with MCP SDK
const ListTemplatesInputSchema = z.object({
  _sessionToken: z.string().optional()
}).shape;

const GetTemplateDetailsInputSchema = z.object({
  slug: z.string().describe('The template slug (e.g., local-business-pro)'),
  _sessionToken: z.string().optional()
}).shape;

const ScaffoldTemplateInputSchema = z.object({
  slug: z.string().describe('The template slug to scaffold (e.g., local-business-pro)'),
  _sessionToken: z.string().optional()
}).shape;

const SearchTemplatesInputSchema = z.object({
  query: z.string().describe('Search query to match against template names, descriptions, and use cases'),
  _sessionToken: z.string().optional()
}).shape;

const CloneTemplateInputSchema = z.object({
  slug: z.string().describe('The template slug to clone (e.g., local-business-pro)'),
  projectName: z.string().describe('Name for the new project'),
  projectDescription: z.string().optional().describe('Optional description for the project'),
  customizations: z.record(z.unknown()).optional().describe('Optional customization parameters'),
  _sessionToken: z.string().optional()
}).shape;

const GetProjectInputSchema = z.object({
  projectId: z.string().describe('The unique ID of the project to retrieve'),
  _sessionToken: z.string().optional()
}).shape;

const GetUserProjectsInputSchema = z.object({
  userId: z.string().describe('The user ID to retrieve projects for'),
  _sessionToken: z.string().optional()
}).shape;

// New: Get coding guide for AI agents
const GetCodingGuideInputSchema = z.object({
  templateSlug: z.string().optional().describe('Optional: Get guidance specific to a template slug'),
  topic: z.enum(['content', 'components', 'themes', 'icons', 'structure', 'all']).optional().describe('Specific topic to get guidance on'),
  _sessionToken: z.string().optional()
}).shape;

// New: Scaffold directly to Convex (faster template cloning)
const ScaffoldToConvexInputSchema = z.object({
  slug: z.string().describe('The template slug to scaffold'),
  projectName: z.string().describe('Name for the new project'),
  projectDescription: z.string().optional().describe('Optional project description'),
  palette: z.object({
    id: z.string(),
    name: z.string(),
    colors: z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
      background: z.string(),
      text: z.string(),
    }),
  }).optional().describe('Color palette for customization'),
  fonts: z.object({
    id: z.string(),
    name: z.string(),
    heading: z.object({ family: z.string(), weight: z.number() }),
    body: z.object({ family: z.string(), weight: z.number() }),
    googleFonts: z.string(),
  }).optional().describe('Font pairing for customization'),
  _sessionToken: z.string().optional()
}).shape;

// Standardized error response structure
interface ErrorResponse {
  error: string;
  statusCode: number;
  code: string;
}

// Helper to create consistent MCP error responses
function createErrorResponse(error: string, statusCode: number, code: string) {
  const errorData: ErrorResponse = { error, statusCode, code };
  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify(errorData),
    }],
    isError: true,
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Templates directory: flowstarter-library/templates (actual templates at root; example/ has deprecated ones)
const TEMPLATES_DIR = path.resolve(__dirname, '..', '..', 'templates');

// Helper function to verify auth for each tool call
async function verifyToolAuth(args: any, toolName: string): Promise<{ success: true; authContext: AuthContext } | { success: false; error: any }> {
  // Skip authentication if disabled
  if (process.env.DISABLE_AUTH === 'true') {
    return {
      success: true,
      authContext: {
        userId: 'dev-user',
        sessionId: 'dev-session',
        isAuthenticated: true,
        user: { id: 'dev-user', email: 'dev@local.test' }
      }
    };
  }

  // Extract session token from request metadata or arguments
  const sessionToken = (args as any)?._sessionToken;

  if (!sessionToken) {
    return {
      success: false,
      error: createErrorResponse(
        'Unauthorized: Authentication required. Please provide a valid Clerk session token.',
        401,
        'UNAUTHORIZED'
      )
    };
  }

  // Verify authentication
  const authContext = await verifyAuth(sessionToken);

  if (!authContext.isAuthenticated) {
    return {
      success: false,
      error: createErrorResponse(
        'Unauthorized: Invalid or expired session token.',
        401,
        'INVALID_TOKEN'
      )
    };
  }

  // Check user permissions (skip if auth is disabled)
  if (process.env.DISABLE_AUTH !== 'true') {
    const permissionCheck = await checkUserPermissions(authContext.userId!);

    if (!permissionCheck.hasPermission) {
      return {
        success: false,
        error: createErrorResponse(
          `Forbidden: ${permissionCheck.error || 'You do not have permission to access this resource.'}`,
          403,
          'FORBIDDEN'
        )
      };
    }
  }

  console.error(`✓ Authenticated request from user: ${authContext.userId}`);
  console.error(`  Email: ${authContext.user?.email}`);
  console.error(`  Tool: ${toolName}`);

  return { success: true, authContext };
}

export async function createMcpServer(): Promise<{ server: McpServer; fetcher: TemplateFetcher }> {
  console.error('Starting Flowstarter MCP Server...');
  console.error(`Templates directory: ${TEMPLATES_DIR}`);

  // Initialize template fetcher
  const fetcher = new TemplateFetcher(TEMPLATES_DIR);
  await fetcher.initialize();

  // Create MCP server
  const server = new McpServer({
    name: 'flowstarter-templates',
    version: '1.0.0',
  });

  // Register tools using the new API
  // Note: We need to accept _sessionToken in each tool's schema

  // list_templates tool
  const listTemplatesHandler = async (args: any) => {
    const authResult = await verifyToolAuth(args, 'list_templates');
    if (!authResult.success) return authResult.error;

    const result = await listTemplates(fetcher);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  };
  (server.tool as any)('list_templates', 'List all available Flowstarter Library with metadata', ListTemplatesInputSchema, listTemplatesHandler);

  // get_template_details tool
  const getTemplateDetailsHandler = async (args: any) => {
    const authResult = await verifyToolAuth(args, 'get_template_details');
    if (!authResult.success) return authResult.error;
    const validated = GetTemplateDetailsSchema.parse(args);
    const result = await getTemplateDetails(validated, fetcher);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  };
  (server.tool as any)('get_template_details', 'Get comprehensive details about a specific template', GetTemplateDetailsInputSchema, getTemplateDetailsHandler);

  // scaffold_template tool
  const scaffoldTemplateHandler = async (args: any) => {
    const authResult = await verifyToolAuth(args, 'scaffold_template');
    if (!authResult.success) return authResult.error;
    const validated = ScaffoldTemplateSchema.parse(args);
    const result = await scaffoldTemplate(validated, fetcher, TEMPLATES_DIR);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  };
  (server.tool as any)('scaffold_template', 'Get complete file structure and contents for scaffolding a template in the editor', ScaffoldTemplateInputSchema, scaffoldTemplateHandler);

  // search_templates tool
  const searchTemplatesHandler = async (args: any) => {
    const authResult = await verifyToolAuth(args, 'search_templates');
    if (!authResult.success) return authResult.error;
    const validated = SearchTemplatesSchema.parse(args);
    const result = await searchTemplates(validated, fetcher);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  };
  (server.tool as any)('search_templates', 'Search templates by keywords, category, or use case', SearchTemplatesInputSchema, searchTemplatesHandler);

  // clone_template tool
  const cloneTemplateHandler = async (args: any) => {
    const authResult = await verifyToolAuth(args, 'clone_template');
    if (!authResult.success) return authResult.error;
    const validated = CloneTemplateSchema.parse(args);
    const result = await cloneTemplate(validated, fetcher, TEMPLATES_DIR);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  };
  (server.tool as any)('clone_template', 'Clone a template with customizations and prepare it for the coding agent', CloneTemplateInputSchema, cloneTemplateHandler);

  // get_project tool
  const getProjectHandler = async (args: any) => {
    const authResult = await verifyToolAuth(args, 'get_project');
    if (!authResult.success) return authResult.error;
    const validated = GetProjectSchema.parse(args);
    const result = await getProjectDetails(validated);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  };
  (server.tool as any)('get_project', 'Get detailed information about a specific project from Supabase', GetProjectInputSchema, getProjectHandler);

  // get_user_projects tool
  const getUserProjectsHandler = async (args: any) => {
    const authResult = await verifyToolAuth(args, 'get_user_projects');
    if (!authResult.success) return authResult.error;
    const validated = GetUserProjectsSchema.parse(args);
    const result = await getUserProjects(validated);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  };
  (server.tool as any)('get_user_projects', 'Get all projects for a specific user', GetUserProjectsInputSchema, getUserProjectsHandler);

  // scaffold_to_convex tool - NEW: Direct template to Convex scaffolding
  const scaffoldToConvexHandler = async (args: any) => {
    const authResult = await verifyToolAuth(args, 'scaffold_to_convex');
    if (!authResult.success) return authResult.error;
    const validated = ScaffoldToConvexSchema.parse(args);
    const result = await scaffoldToConvex(validated, fetcher, TEMPLATES_DIR);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  };
  (server.tool as any)(
    'scaffold_to_convex',
    'Scaffold a template directly to Convex. Creates project, writes files, and returns project info. The editor can then subscribe to Convex for real-time file updates.',
    ScaffoldToConvexInputSchema,
    scaffoldToConvexHandler
  );

  // get_coding_guide tool - NEW: Provides AI coding agent guidance
  const getCodingGuideHandler = async (args: any) => {
    const authResult = await verifyToolAuth(args, 'get_coding_guide');
    if (!authResult.success) return authResult.error;
    const validated = GetCodingGuideSchema.parse(args);
    const result = getCodingGuide(validated);
    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  };
  (server.tool as any)(
    'get_coding_guide',
    'Get comprehensive coding guidance for AI agents working with Flowstarter templates. Includes content architecture, component patterns, theme system, icon handling, and modification rules.',
    GetCodingGuideInputSchema,
    getCodingGuideHandler
  );

  return { server, fetcher };
}
