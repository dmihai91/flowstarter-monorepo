import { type ActionFunctionArgs } from '@remix-run/node';
import { ConvexHttpClient } from 'convex/browser';

type Id<T extends string> = string & { __tableName: T };

/**
 * Projects API (Simplified)
 *
 * Wraps Convex projectsSimple functions for project CRUD operations
 *
 * POST /api/projectsSimple
 * Actions:
 * - create: Create a new project
 * - get: Get project by ID
 * - getByUrlId: Get project by URL ID
 * - update: Update project
 * - updateWorkspace: Update workspace info
 * - list: List all projects
 * - remove: Delete a project
 */
export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = (await request.json()) as {
      action: 'create' | 'get' | 'getByUrlId' | 'update' | 'updateWorkspace' | 'list' | 'remove';
      projectId?: Id<'projects'>;
      urlId?: string;
      data?: any;
    };

    const { action } = body;

    // Get Convex URL from environment
    const convexUrl = process.env.CONVEX_URL || process.env.VITE_CONVEX_URL;

    if (!convexUrl) {
      console.error('[Projects API] Convex URL not configured');
      return new Response(JSON.stringify({ error: 'Convex URL not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize Convex HTTP client
    const convex = new ConvexHttpClient(convexUrl);

    // CREATE: Create a new project
    if (action === 'create') {
      const { urlId, name, description, businessDetails, tags, templateId } = body.data || {};

      if (!urlId || !name || !description) {
        return new Response(JSON.stringify({ error: 'Missing required fields: urlId, name, description' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.log(`Creating project: ${name}`);

      const projectId = await convex.mutation('projects:create' as any, {
        urlId,
        name,
        description,
        businessDetails,
        tags,
        templateId,
      });

      return Response.json({ projectId });
    }

    // GET: Get project by ID
    if (action === 'get') {
      const { projectId } = body;

      if (!projectId) {
        return new Response(JSON.stringify({ error: 'projectId required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.log(`Fetching project: ${projectId}`);

      const project = await convex.query('projects:get' as any, { projectId });

      if (!project) {
        return new Response(JSON.stringify({ error: 'Project not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return Response.json({ project });
    }

    // GET_BY_URL_ID: Get project by URL ID
    if (action === 'getByUrlId') {
      const { urlId } = body;

      if (!urlId) {
        return new Response(JSON.stringify({ error: 'urlId required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.log(`Fetching project by URL ID: ${urlId}`);

      const project = await convex.query('projects:getByUrlId' as any, { urlId });

      if (!project) {
        return new Response(JSON.stringify({ error: 'Project not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return Response.json({ project });
    }

    // UPDATE: Update project
    if (action === 'update') {
      const { projectId, data } = body;

      if (!projectId || !data) {
        return new Response(JSON.stringify({ error: 'projectId and data required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.log(`Updating project: ${projectId}`);

      await convex.mutation('projects:update' as any, {
        projectId,
        ...data,
      });

      return Response.json({ success: true });
    }

    // UPDATE_WORKSPACE: Update workspace information
    if (action === 'updateWorkspace') {
      const { projectId, data } = body;

      if (!projectId || !data) {
        return new Response(JSON.stringify({ error: 'projectId and data required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const { daytonaWorkspaceId, workspaceUrl, workspaceStatus } = data;

      console.log(`Updating workspace for project: ${projectId}`);

      await convex.mutation('projects:updateWorkspace' as any, {
        projectId,
        daytonaWorkspaceId,
        workspaceUrl,
        workspaceStatus,
      });

      return Response.json({ success: true });
    }

    // LIST: List all projects
    if (action === 'list') {
      console.log('Listing all projects');

      const projects = await convex.query('projects:list' as any, {});

      return Response.json({ projects });
    }

    // REMOVE: Delete a project
    if (action === 'remove') {
      const { projectId } = body;

      if (!projectId) {
        return new Response(JSON.stringify({ error: 'projectId required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.log(`Removing project: ${projectId}`);

      await convex.mutation('projects:remove' as any, { projectId });

      return Response.json({ success: true });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Projects API error:', error);

    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

