import { type ActionFunctionArgs, type LoaderFunctionArgs, json } from '@remix-run/cloudflare';
import { experimental_createMCPClient } from 'ai';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createScopedLogger } from '~/utils/logger';

// Get MCP URL from environment (works on both server and client)
function getMCPUrl(context?: unknown): string {
  // Try Cloudflare context first (server-side)
  const env = (context as { cloudflare?: { env: Record<string, string> } })?.cloudflare?.env || {};
  return env.VITE_FLOWSTARTER_MCP_URL || process.env.VITE_FLOWSTARTER_MCP_URL || 'http://localhost:3001';
}

function getFlowstarterMCPEndpoint(context?: unknown): string {
  return `${getMCPUrl(context)}/mcp`;
}

function getFlowstarterHTTPEndpoint(context?: unknown): string {
  return getMCPUrl(context);
}

const logger = createScopedLogger('api.templates');

// ─── Server-Side Template Cache ─────────────────────────────────────────────
// Cache templates for 5 minutes to avoid repeated MCP calls
interface TemplateCache {
  data: unknown;
  timestamp: number;
}

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes
let templateCache: TemplateCache | null = null;

function getCachedTemplates(): unknown | null {
  if (!templateCache) return null;
  
  const age = Date.now() - templateCache.timestamp;
  if (age > CACHE_TTL_MS) {
    logger.info(`Template cache expired (age: ${Math.round(age / 1000)}s)`);
    templateCache = null;
    return null;
  }
  
  logger.info(`Template cache HIT (age: ${Math.round(age / 1000)}s)`);
  return templateCache.data;
}

function setCachedTemplates(data: unknown): void {
  templateCache = {
    data,
    timestamp: Date.now(),
  };
  logger.info('Template cache updated');
}

// ─── MCP Client ─────────────────────────────────────────────────────────────
// MCP client singleton
let mcpClient: Awaited<ReturnType<typeof experimental_createMCPClient>> | null = null;

async function getMCPClient() {
  if (mcpClient) {
    return mcpClient;
  }

  const mcpUrl = getFlowstarterMCPEndpoint();
  logger.info(`Connecting to Flowstarter MCP server at ${mcpUrl}`);

  try {
    mcpClient = await experimental_createMCPClient({
      transport: new StreamableHTTPClientTransport(new URL(mcpUrl)),
    });
    logger.info('Connected to Flowstarter MCP server');

    return mcpClient;
  } catch (error) {
    logger.error('Failed to connect to Flowstarter MCP server:', error);
    throw error;
  }
}

// Helper to call MCP tools with timeout
async function callMCPTool(toolName: string, args: Record<string, unknown> = {}, timeoutMs = 60000) {
  const client = await getMCPClient();
  const tools = await client.tools();

  const tool = tools[toolName];

  if (!tool) {
    throw new Error(`Tool ${toolName} not found in MCP server`);
  }

  if (!tool.execute) {
    throw new Error(`Tool ${toolName} does not have an execute function`);
  }

  // Create a timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`MCP tool '${toolName}' timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);
  });

  // Race between the tool execution and timeout
  const executePromise = tool.execute(args, {
    messages: [],
    toolCallId: `${toolName}-${Date.now()}`,
  });

  const result = await Promise.race([executePromise, timeoutPromise]);

  return result;
}

/**
 * Fetch templates via direct HTTP endpoint (more reliable than MCP)
 */
async function fetchTemplatesHTTP(context?: unknown): Promise<unknown> {
  const httpUrl = getFlowstarterHTTPEndpoint(context);
  const templatesUrl = `${httpUrl}/api/templates`;
  
  logger.info(`Fetching templates from HTTP endpoint: ${templatesUrl}`);
  
  const response = await fetch(templatesUrl, {
    headers: { 'Accept': 'application/json' },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP request failed: ${response.status} ${response.statusText}`);
  }
  
  const templates = await response.json();
  
  // Wrap in MCP-like response format for compatibility
  return { templates };
}

/**
 * GET /api/templates - List all templates (cached)
 * GET /api/templates?search=query - Search templates
 * GET /api/templates?refresh=1 - Force cache refresh
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search');
  const forceRefresh = url.searchParams.get('refresh') === '1';

  try {
    if (search) {
      // Search templates - try HTTP first, fall back to MCP
      const httpUrl = getFlowstarterHTTPEndpoint(context);
      try {
        const response = await fetch(`${httpUrl}/api/templates/search?q=${encodeURIComponent(search)}`);
        if (response.ok) {
          const templates = await response.json();
          return json({ success: true, data: { templates } });
        }
      } catch {
        // Fall back to MCP
      }
      const result = await callMCPTool('search_templates', { query: search });
      return json({ success: true, data: result });
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getCachedTemplates();
      if (cached) {
        return json({ success: true, data: cached, cached: true });
      }
    }

    // Try direct HTTP endpoint first (more reliable)
    try {
      const result = await fetchTemplatesHTTP(context);
      setCachedTemplates(result);
      return json({ success: true, data: result });
    } catch (httpError) {
      logger.warn('Direct HTTP failed, trying MCP:', httpError);
    }

    // Fall back to MCP server
    logger.info('Fetching templates from MCP server...');
    const result = await callMCPTool('list_templates', {});
    
    // Update cache
    setCachedTemplates(result);

    return json({ success: true, data: result });
  } catch (error) {
    logger.error('Failed to fetch templates:', error);

    // On error, return stale cache if available
    if (templateCache?.data) {
      logger.warn('Returning stale cache due to error');
      return json({ success: true, data: templateCache.data, stale: true });
    }

    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to template server',
      },
      { status: 503 },
    );
  }
}

/**
 * POST /api/templates - Perform template operations
 *
 * Actions:
 * - { action: 'details', slug: string } - Get template details
 * - { action: 'scaffold', slug: string } - Get template files for scaffolding
 * - { action: 'scaffold-stream', slug: string } - Stream template files (NDJSON)
 * - { action: 'clone', slug: string, projectName: string, ... } - Clone template
 */
export async function action({ request, context }: ActionFunctionArgs) {
  const body = await request.json<{
    action: 'details' | 'scaffold' | 'scaffold-stream' | 'clone' | 'search' | 'theme';
    slug?: string;
    query?: string;
    projectName?: string;
    projectDescription?: string;
    customizations?: Record<string, unknown>;
  }>();

  try {
    switch (body.action) {
      case 'details': {
        if (!body.slug) {
          return json({ success: false, error: 'Missing slug parameter' }, { status: 400 });
        }

        // Try HTTP first
        const httpUrl = getFlowstarterHTTPEndpoint(context);
        try {
          const response = await fetch(`${httpUrl}/api/templates/${body.slug}`);
          if (response.ok) {
            const data = await response.json();
            return json({ success: true, data });
          }
        } catch {
          // Fall back to MCP
        }

        const result = await callMCPTool('get_template_details', { slug: body.slug });

        return json({ success: true, data: result });
      }

      case 'theme': {
        if (!body.slug) {
          return json({ success: false, error: 'Missing slug parameter' }, { status: 400 });
        }

        // Try to get theme from template details or a dedicated theme tool
        try {
          const result = await callMCPTool('get_template_theme', { slug: body.slug });
          return json({ success: true, data: result });
        } catch {
          // If theme tool doesn't exist, try to extract from details
          try {
            const details = (await callMCPTool('get_template_details', { slug: body.slug })) as Record<string, unknown>;

            // Parse theme from details if available
            let themeData = details;

            const detailsContent = (details as { content?: Array<{ text?: string }> })?.content;

            if (detailsContent?.[0]?.text) {
              try {
                themeData = JSON.parse(detailsContent[0].text);
              } catch {
                // Keep as-is
              }
            }

            return json({
              success: true,
              data: {
                theme:
                  (themeData as Record<string, unknown>)?.theme ||
                  (themeData as Record<string, unknown>)?.colors ||
                  null,
              },
            });
          } catch {
            return json({ success: true, data: { theme: null } });
          }
        }
      }

      case 'scaffold-stream': {
        // Streaming scaffold - proxy to MCP HTTP server's streaming endpoint
        if (!body.slug) {
          return json({ success: false, error: 'Missing slug parameter' }, { status: 400 });
        }

        const httpUrl = getFlowstarterHTTPEndpoint(context);
        const streamUrl = `${httpUrl}/api/templates/${body.slug}/scaffold/stream`;

        logger.info(`Proxying streaming scaffold request to: ${streamUrl}`);

        try {
          const response = await fetch(streamUrl);

          if (!response.ok) {
            throw new Error(`Streaming scaffold failed: ${response.statusText}`);
          }

          // Return the stream directly
          return new Response(response.body, {
            headers: {
              'Content-Type': 'application/x-ndjson',
              'Transfer-Encoding': 'chunked',
              'Cache-Control': 'no-cache',
            },
          });
        } catch (streamError) {
          logger.warn('Streaming scaffold failed, falling back to MCP:', streamError);

          // Fall back to MCP tool if streaming fails
          const result = await callMCPTool('scaffold_template', { slug: body.slug });

          return json({ success: true, data: result });
        }
      }

      case 'scaffold': {
        // Try direct HTTP endpoint first (faster than MCP), fall back to MCP
        if (!body.slug) {
          return json({ success: false, error: 'Missing slug parameter' }, { status: 400 });
        }

        const httpUrl = getFlowstarterHTTPEndpoint(context);
        const scaffoldUrl = `${httpUrl}/api/templates/${body.slug}/scaffold`;

        // Try HTTP with short timeout
        const httpController = new AbortController();
        const httpTimeout = setTimeout(() => httpController.abort(), 5000);

        try {
          const response = await fetch(scaffoldUrl, { signal: httpController.signal });
          clearTimeout(httpTimeout);

          if (response.ok) {
            const data = await response.json();
            return json({ success: true, data });
          }
        } catch (httpError) {
          clearTimeout(httpTimeout);
          logger.warn('Direct HTTP scaffold failed, using MCP:', httpError);
        }

        // Fall back to MCP tool
        const result = await callMCPTool('scaffold_template', { slug: body.slug });

        return json({ success: true, data: result });
      }

      case 'clone': {
        if (!body.slug || !body.projectName) {
          return json({ success: false, error: 'Missing slug or projectName parameter' }, { status: 400 });
        }

        const result = await callMCPTool('clone_template', {
          slug: body.slug,
          projectName: body.projectName,
          projectDescription: body.projectDescription,
          customizations: body.customizations,
        });

        return json({ success: true, data: result });
      }

      case 'search': {
        if (!body.query) {
          return json({ success: false, error: 'Missing query parameter' }, { status: 400 });
        }

        const result = await callMCPTool('search_templates', { query: body.query });

        return json({ success: true, data: result });
      }

      default:
        return json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Template action failed:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Operation failed',
      },
      { status: 500 },
    );
  }
}

