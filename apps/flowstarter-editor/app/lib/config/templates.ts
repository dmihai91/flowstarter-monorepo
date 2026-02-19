/**
 * Flowstarter Library MCP Server Configuration
 *
 * Templates are served from the flowstarter-library MCP server.
 * The server exposes tools for listing, searching, and scaffolding templates.
 *
 * Available MCP Tools:
 * - list_templates: List all available templates
 * - get_template_details: Get detailed info about a specific template
 * - scaffold_template: Get complete file structure for scaffolding
 * - search_templates: Search templates by keywords
 * - clone_template: Clone a template with customizations
 * - get_project: Get project details from Supabase
 * - get_user_projects: Get all projects for a user
 */

export const FLOWSTARTER_MCP_CONFIG = {
  name: 'flowstarter-templates',
  type: 'streamable-http' as const,
  url: import.meta.env.VITE_FLOWSTARTER_MCP_URL || 'http://localhost:3001',
  mcpEndpoint: '/mcp',
};

// API endpoints for non-MCP access (images, previews)
export const FLOWSTARTER_API = {
  baseUrl: import.meta.env.VITE_FLOWSTARTER_MCP_URL || 'http://localhost:3001',
  endpoints: {
    thumbnail: (slug: string, theme?: 'light' | 'dark') =>
      `/api/templates/${slug}/thumbnail${theme ? `?theme=${theme}` : ''}`,
    preview: (slug: string, theme?: 'light' | 'dark') =>
      `/api/templates/${slug}/preview${theme ? `?theme=${theme}` : ''}`,
    live: (slug: string, mode?: 'dark' | 'light') => `/api/templates/${slug}/live${mode ? `?mode=${mode}` : ''}`,
  },
};

export function getFlowstarterMCPUrl(): string {
  return FLOWSTARTER_MCP_CONFIG.url;
}

export function getFlowstarterMCPEndpoint(): string {
  return `${FLOWSTARTER_MCP_CONFIG.url}${FLOWSTARTER_MCP_CONFIG.mcpEndpoint}`;
}

export function getFlowstarterHTTPEndpoint(): string {
  return FLOWSTARTER_MCP_CONFIG.url;
}

export function getStreamingScaffoldUrl(slug: string): string {
  return `${FLOWSTARTER_MCP_CONFIG.url}/api/templates/${slug}/scaffold/stream`;
}

export function getScaffoldUrl(slug: string): string {
  return `${FLOWSTARTER_MCP_CONFIG.url}/api/templates/${slug}/scaffold`;
}

export function getTemplateThumbnailUrl(slug: string, theme?: 'light' | 'dark'): string {
  // Use local proxy to avoid CORS issues
  return `/api/template-thumbnail/${slug}${theme ? `?theme=${theme}` : ''}`;
}

export function getTemplatePreviewImageUrl(slug: string, theme?: 'light' | 'dark'): string {
  // Full-page preview image (1400x900) - use local proxy
  return `/api/template-preview/${slug}${theme ? `?theme=${theme}` : ''}`;
}

export function getTemplatePreviewUrl(slug: string, theme?: 'light' | 'dark'): string {
  return `${FLOWSTARTER_API.baseUrl}${FLOWSTARTER_API.endpoints.preview(slug, theme)}`;
}

export function getTemplateLiveUrl(slug: string, theme?: string, mode?: 'dark' | 'light'): string {
  /*
   * Use Vite's /mcp-live proxy to avoid CORS / X-Frame-Options issues and avoid requiring the browser
   * to reach the MCP server directly (e.g. when MCP is on a different host/port).
   *
   * NOTE: We use full origin URL to prevent browser locale prefixes (e.g., /ro/) being added
   * to relative paths in iframes.
   */
  const params = new URLSearchParams();

  if (theme) {
    params.set('theme', theme);
  }

  if (mode) {
    params.set('mode', mode);
  }

  // Add cache-busting parameter to ensure fresh content
  params.set('_t', Date.now().toString());

  // Use full origin to prevent browser locale prefixes in iframes
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return `${origin}/mcp-live/api/templates/${slug}/live?${params.toString()}`;
}

export function getTemplateLiveUrlDirect(slug: string, theme?: string, mode?: 'dark' | 'light'): string {
  /*
   * Direct live template URL served by the library server (port 3001)
   * Use this for opening in new tab, not for iframe embedding
   */
  const params = new URLSearchParams();

  if (theme) {
    params.set('theme', theme);
  }

  if (mode) {
    params.set('mode', mode);
  }

  return `${FLOWSTARTER_API.baseUrl}/api/templates/${slug}/live${params.toString() ? `?${params.toString()}` : ''}`;
}

// Legacy export for backward compatibility
export const TEMPLATE_MCP_CONFIG = FLOWSTARTER_MCP_CONFIG;

export function getTemplateMCPUrl(): string {
  return getFlowstarterMCPUrl();
}

