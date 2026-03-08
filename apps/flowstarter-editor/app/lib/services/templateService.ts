/**
 * Template Service
 *
 * Fetches templates from the flowstarter-library MCP server
 */

const MCP_BASE_URL = process.env.VITE_FLOWSTARTER_MCP_URL || 'http://localhost:3001';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags?: string[];
  thumbnail?: string;
  githubRepo?: string;
}

export interface TemplateDetails extends Template {
  files?: Array<{
    path: string;
    content: string;
  }>;
  readme?: string;
  dependencies?: Record<string, string>;
}

/**
 * Fetch all available templates from MCP library
 */
export async function fetchTemplates(): Promise<Template[]> {
  try {
    console.log('[TemplateService] Fetching templates from MCP library');

    const response = await fetch(`${MCP_BASE_URL}/api/templates`);

    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.statusText}`);
    }

    const rawTemplates = await response.json() as Array<{ slug: string } & Omit<Template, "id">>;
    const templates = rawTemplates.map(t => ({ ...t, id: t.slug })) as Template[];

    console.log('[TemplateService] Fetched', templates.length, 'templates');

    return templates;
  } catch (error) {
    console.error('[TemplateService] Failed to fetch templates:', error);
    throw new Error(`Failed to fetch templates from MCP library: ${error}`);
  }
}

/**
 * Fetch detailed information about a specific template
 */
export async function fetchTemplateDetails(templateId: string): Promise<TemplateDetails> {
  try {
    console.log('[TemplateService] Fetching template details for', templateId);

    const response = await fetch(`${MCP_BASE_URL}/api/templates/${templateId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch template details: ${response.statusText}`);
    }

    const details = (await response.json()) as TemplateDetails;

    console.log('[TemplateService] Fetched template details for', templateId);

    return details;
  } catch (error) {
    console.error('[TemplateService] Failed to fetch template details:', error);
    throw new Error(`Failed to fetch template details: ${error}`);
  }
}

/**
 * Fetch template files (scaffold) for a specific template
 * This returns all the files needed to create a project from the template
 */
export async function fetchTemplateScaffold(templateId: string): Promise<
  Array<{
    path: string;
    content: string;
  }>
> {
  try {
    console.log('[TemplateService] Fetching scaffold for', templateId);

    const response = await fetch(`${MCP_BASE_URL}/api/templates/${templateId}/scaffold`);

    if (!response.ok) {
      throw new Error(`Failed to fetch template scaffold: ${response.statusText}`);
    }

    interface ScaffoldResponse {
      files?: Array<{ path: string; content: string }>;
      scaffold?: {
        files?: Array<{ path: string; content: string }>;
      };
    }

    const data = (await response.json()) as ScaffoldResponse;
    let files: Array<{ path: string; content: string }> = [];

    if (data.files) {
      files = data.files;
    } else if (data.scaffold?.files) {
      files = data.scaffold.files;
    }

    console.log('[TemplateService] Fetched', files.length, 'files for', templateId);

    return files;
  } catch (error) {
    console.error('[TemplateService] Failed to fetch template scaffold:', error);
    throw new Error(`Failed to fetch template scaffold: ${error}`);
  }
}

/**
 * Stream template scaffold (for large templates)
 * Returns an async iterator of file chunks
 */
export async function* streamTemplateScaffold(templateId: string): AsyncGenerator<{
  path: string;
  content: string;
}> {
  try {
    console.log('[TemplateService] Streaming scaffold for', templateId);

    const response = await fetch(`${MCP_BASE_URL}/api/templates/${templateId}/scaffold/stream`);

    if (!response.ok || !response.body) {
      throw new Error(`Failed to stream template scaffold: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process complete JSON objects from the stream
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const file = JSON.parse(line);
            yield file;
          } catch (parseError) {
            console.error('[TemplateService] Failed to parse file:', parseError);
          }
        }
      }
    }

    // Process any remaining data in buffer
    if (buffer.trim()) {
      try {
        const file = JSON.parse(buffer);
        yield file;
      } catch (parseError) {
        console.error('[TemplateService] Failed to parse final file:', parseError);
      }
    }
  } catch (error) {
    console.error('[TemplateService] Failed to stream template scaffold:', error);
    throw new Error(`Failed to stream template scaffold: ${error}`);
  }
}

/**
 * Get thumbnail URL for a template
 */
export function getTemplateThumbnailUrl(templateId: string, theme?: 'light' | 'dark'): string {
  // Use the editor's own proxy route — MCP server is not publicly accessible
  const params = theme ? `?theme=${theme}` : '';
  return `/api/templates/${templateId}/thumbnail${params}`;
}

/**
 * Get preview image URL for a template
 */
export function getTemplatePreviewUrl(templateId: string, theme?: 'light' | 'dark'): string {
  const params = theme ? `?theme=${theme}` : '';
  return `${MCP_BASE_URL}/api/templates/${templateId}/preview${params}`;
}

/**
 * Get live preview URL for a template (for iframe)
 */
export function getTemplateLiveUrl(templateId: string, theme?: 'light' | 'dark'): string {
  const params = theme ? `?theme=${theme}` : '';

  // Use relative path for iframe to avoid CORS issues
  return `/mcp-live/api/templates/${templateId}/live${params}`;
}

/**
 * Search templates by keyword
 */
export async function searchTemplates(query: string): Promise<Template[]> {
  try {
    console.log('[TemplateService] Searching templates:', query);

    const response = await fetch(`${MCP_BASE_URL}/api/templates/search?q=${encodeURIComponent(query)}`);

    if (!response.ok) {
      throw new Error(`Failed to search templates: ${response.statusText}`);
    }

    const results = (await response.json()) as Template[];

    console.log('[TemplateService] Found', results.length, 'templates');

    return results;
  } catch (error) {
    console.error('[TemplateService] Failed to search templates:', error);
    throw new Error(`Failed to search templates: ${error}`);
  }
}

/**
 * Get templates by category
 */
export async function fetchTemplatesByCategory(category: string): Promise<Template[]> {
  try {
    const allTemplates = await fetchTemplates();
    return allTemplates.filter((t) => t.category === category);
  } catch (error) {
    console.error('[TemplateService] Failed to fetch templates by category:', error);
    throw new Error(`Failed to fetch templates by category: ${error}`);
  }
}

/**
 * Get all categories
 */
export async function fetchCategories(): Promise<string[]> {
  try {
    const templates = await fetchTemplates();
    const categories = new Set(templates.map((t) => t.category));

    return Array.from(categories).sort();
  } catch (error) {
    console.error('[TemplateService] Failed to fetch categories:', error);
    throw new Error(`Failed to fetch categories: ${error}`);
  }
}

