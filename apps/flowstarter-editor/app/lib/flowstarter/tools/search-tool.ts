/**
 * Flowstarter Search Tool
 *
 * Web search tool using Tavily API, optimized for agentic workflows.
 * Searches for solutions to build errors, code examples, and documentation.
 */

import { BaseTool, type ToolContext } from '~/lib/flowops/base-tool';

/*
 * ============================================================================
 * Types
 * ============================================================================
 */

export interface SearchInput {
  /** The search query */
  query: string;

  /** Search depth: basic (faster) or advanced (more thorough) */
  searchDepth?: 'basic' | 'advanced';

  /** Include specific domains */
  includeDomains?: string[];

  /** Exclude specific domains */
  excludeDomains?: string[];

  /** Maximum number of results */
  maxResults?: number;

  /** Include raw content from pages */
  includeRawContent?: boolean;

  /** Include answer summary from Tavily */
  includeAnswer?: boolean;
}

export interface SearchResult {
  /** Result title */
  title: string;

  /** Result URL */
  url: string;

  /** Content snippet */
  content: string;

  /** Relevance score (0-1) */
  score: number;

  /** Raw content (if requested) */
  rawContent?: string;
}

export interface SearchOutput {
  /** The original query */
  query: string;

  /** Search results */
  results: SearchResult[];

  /** AI-generated answer summary (if requested) */
  answer?: string;

  /** Total results found */
  totalResults: number;

  /** Search response time in ms */
  responseTimeMs: number;
}

/*
 * ============================================================================
 * Tavily API Response Types
 * ============================================================================
 */

interface TavilyResponse {
  query: string;
  answer?: string;
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
    raw_content?: string;
  }>;
  response_time: number;
}

/*
 * ============================================================================
 * Search Tool Implementation
 * ============================================================================
 */

/**
 * Web search tool using Tavily API.
 *
 * Tavily is optimized for AI agents:
 * - Returns structured, relevant content
 * - Includes relevance scoring
 * - Can provide AI-generated answer summaries
 * - Supports domain filtering
 */
export class SearchTool extends BaseTool<SearchInput, SearchOutput> {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.tavily.com';

  constructor(apiKey?: string) {
    super({
      name: 'search',
      description: 'Web search optimized for AI agents using Tavily API',
      version: '1.0.0',
      category: 'search',
      requiresNetwork: true,
      cacheable: true,
      cacheTtlMs: 1800000, // 30 minutes
      timeoutMs: 15000,
    });

    this.apiKey = apiKey ?? process.env.TAVILY_API_KEY ?? '';
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * BaseTool implementation
   * ──────────────────────────────────────────────────────────────────────────
   */

  protected validateInput(input: SearchInput): string | null {
    if (!input.query || input.query.trim().length === 0) {
      return 'Query is required';
    }

    if (input.query.length > 400) {
      return 'Query must be 400 characters or less';
    }

    if (input.maxResults !== undefined && (input.maxResults < 1 || input.maxResults > 20)) {
      return 'maxResults must be between 1 and 20';
    }

    if (!this.apiKey) {
      return 'TAVILY_API_KEY is not configured';
    }

    return null;
  }

  protected async execute(input: SearchInput, context: ToolContext): Promise<SearchOutput> {
    const startTime = Date.now();

    context.onProgress?.('Searching web...', 10);

    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: this.apiKey,
        query: input.query,
        search_depth: input.searchDepth ?? 'basic',
        include_domains: input.includeDomains,
        exclude_domains: input.excludeDomains,
        max_results: input.maxResults ?? 5,
        include_raw_content: input.includeRawContent ?? false,
        include_answer: input.includeAnswer ?? false,
      }),
      signal: context.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tavily API error: ${response.status} - ${error}`);
    }

    context.onProgress?.('Processing results...', 80);

    const data = (await response.json()) as TavilyResponse;

    const results: SearchResult[] = data.results.map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
      rawContent: r.raw_content,
    }));

    this.logger.info(`Search completed: ${results.length} results for "${input.query.slice(0, 50)}..."`);

    return {
      query: data.query,
      results,
      answer: data.answer,
      totalResults: results.length,
      responseTimeMs: Date.now() - startTime,
    };
  }

  getInputSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query', maxLength: 400 },
        searchDepth: { type: 'string', enum: ['basic', 'advanced'], default: 'basic' },
        includeDomains: { type: 'array', items: { type: 'string' }, description: 'Domains to include' },
        excludeDomains: { type: 'array', items: { type: 'string' }, description: 'Domains to exclude' },
        maxResults: { type: 'number', minimum: 1, maximum: 20, default: 5 },
        includeRawContent: { type: 'boolean', default: false },
        includeAnswer: { type: 'boolean', default: false },
      },
      required: ['query'],
    };
  }

  getOutputSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        query: { type: 'string' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              url: { type: 'string' },
              content: { type: 'string' },
              score: { type: 'number' },
              rawContent: { type: 'string' },
            },
          },
        },
        answer: { type: 'string' },
        totalResults: { type: 'number' },
        responseTimeMs: { type: 'number' },
      },
    };
  }

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * Convenience methods
   * ──────────────────────────────────────────────────────────────────────────
   */

  /**
   * Search for error solutions.
   * Pre-configured for searching programming error solutions.
   */
  async searchError(errorMessage: string, framework?: string): Promise<SearchOutput | null> {
    // Build optimized query for error search
    let query = errorMessage
      .replace(/[A-Za-z]:[\\/][^\s:]+/g, '') // Remove Windows paths
      .replace(/\/[^\s:]+\.[a-z]+/g, '') // Remove Unix paths
      .replace(/:\d+:\d+/g, '') // Remove line:col
      .trim();

    // Limit length
    if (query.length > 100) {
      query = query.slice(0, 100);
    }

    // Add framework context
    if (framework) {
      query = `${framework} ${query}`;
    }

    query += ' fix solution';

    const result = await this.run({
      query,
      searchDepth: 'basic',
      maxResults: 5,
      includeDomains: [
        'stackoverflow.com',
        'github.com',
        'astro.build',
        'tailwindcss.com',
        'developer.mozilla.org',
        'react.dev',
        'vuejs.org',
        'svelte.dev',
      ],
      includeAnswer: true,
    });

    return result.success && result.data ? result.data : null;
  }

  /**
   * Search for code examples.
   */
  async searchCode(topic: string, language?: string): Promise<SearchOutput | null> {
    const query = language ? `${language} ${topic} code example` : `${topic} code example`;

    const result = await this.run({
      query,
      searchDepth: 'advanced',
      maxResults: 5,
      includeRawContent: true,
      includeDomains: ['github.com', 'stackoverflow.com'],
    });

    return result.success && result.data ? result.data : null;
  }
}

/*
 * ============================================================================
 * Singleton instance
 * ============================================================================
 */

let searchToolInstance: SearchTool | null = null;

/**
 * Get the singleton SearchTool instance.
 */
export function getSearchTool(): SearchTool {
  if (!searchToolInstance) {
    searchToolInstance = new SearchTool();
  }

  return searchToolInstance;
}

/**
 * Reset the singleton (for testing).
 */
export function resetSearchTool(): void {
  searchToolInstance = null;
}

