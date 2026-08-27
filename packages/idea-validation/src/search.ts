/**
 * Web search via Tavily. Tavily fetches + extracts server-side and returns
 * LLM-ready content, so we call ONE trusted host (api.tavily.com) rather than
 * fetching arbitrary user-influenced URLs ourselves — which keeps the SSRF
 * surface out of this pipeline entirely. If a raw `web_fetch(url)` tool is ever
 * added, it must reinstate SSRF guarding (assert-public-url) on the URL.
 *
 * The client is injectable (`SearchClient`) so the engine + tools test with no
 * network. Never throws — failures come back as `{ ok: false, error }`.
 */

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  rawContent?: string;
  score: number;
  /** Registrable host (lowercased, www-stripped) — used as the corroboration origin. */
  domain: string;
}

export interface SearchOptions {
  maxResults?: number;
  searchDepth?: 'basic' | 'advanced' | 'fast' | 'ultra-fast';
  topic?: 'general' | 'news' | 'finance';
  includeRawContent?: boolean | 'markdown' | 'text';
  includeDomains?: string[];
  timeRange?: 'day' | 'week' | 'month' | 'year';
  wallClockMs?: number;
}

export interface SearchResponse {
  ok: boolean;
  query: string;
  results: SearchResult[];
  error?: string;
}

export interface SearchClient {
  search(query: string, options?: SearchOptions): Promise<SearchResponse>;
}

const TAVILY_URL = 'https://api.tavily.com/search';

interface TavilyResult {
  title?: string;
  url?: string;
  content?: string;
  raw_content?: string | null;
  score?: number;
}
interface TavilyResponse {
  results?: TavilyResult[];
}

export function isSearchConfigured(): boolean {
  return !!process.env.TAVILY_API_KEY;
}

export function domainOf(url: string): string {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h.startsWith('www.') ? h.slice(4) : h;
  } catch {
    return '';
  }
}

/** Default client: Tavily over raw fetch. Never throws. */
export class TavilyClient implements SearchClient {
  constructor(private apiKey: string | undefined = process.env.TAVILY_API_KEY) {}

  async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const wallClockMs = options.wallClockMs ?? 20_000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), wallClockMs);
    try {
      const res = await fetch(TAVILY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          query,
          max_results: options.maxResults ?? 5,
          search_depth: options.searchDepth ?? 'basic',
          topic: options.topic ?? 'general',
          include_raw_content: options.includeRawContent ?? false,
          ...(options.includeDomains ? { include_domains: options.includeDomains } : {}),
          ...(options.timeRange ? { time_range: options.timeRange } : {}),
        }),
        signal: controller.signal,
      });
      if (!res.ok) return { ok: false, query, results: [], error: `http ${res.status}` };
      const j = (await res.json()) as TavilyResponse;
      const results = (j.results ?? []).map((r): SearchResult => {
        const url = r.url ?? '';
        return {
          title: r.title ?? '',
          url,
          content: r.content ?? '',
          rawContent: r.raw_content ?? undefined,
          score: typeof r.score === 'number' ? r.score : 0,
          domain: domainOf(url),
        };
      });
      return { ok: true, query, results };
    } catch (e) {
      const aborted = controller.signal.aborted;
      return { ok: false, query, results: [], error: aborted ? 'timeout' : e instanceof Error ? e.message : 'error' };
    } finally {
      clearTimeout(timer);
    }
  }
}
