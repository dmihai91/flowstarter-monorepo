/**
 * The research tool catalog the ReAct loop drives: `web_search` (Tavily) and
 * `corroborate_metric` (the cache->search->extract->corroborate engine).
 *
 * `corroborate_metric` is the tool the agent must use for any NUMBER it will
 * rely on — it returns the compact model-facing fact (status/value/range/
 * sources), so the agent reads corroborated evidence, never its own guess.
 */

import { type FactCache } from './cache';
import { corroborateMetric } from './engine';
import type { LlmClient } from './llm';
import { factToModelDict } from './records';
import type { SearchClient, SearchOptions } from './search';
import { ToolRegistry } from './tools';

export interface ResearchToolDeps {
  search: SearchClient;
  /** llm for the extraction tier (cheap model). */
  llm: LlmClient;
  extractModel?: string;
  cache?: FactCache;
  searchOptions?: SearchOptions;
  /** Clock, injectable for tests. Defaults to the real now. */
  now?: () => Date;
}

export function buildResearchTools(deps: ResearchToolDeps): ToolRegistry {
  const reg = new ToolRegistry();
  const now = deps.now ?? (() => new Date());

  reg.register({
    name: 'get_current_date',
    description:
      "Get today's date and the current year. Call this before composing any search query that mentions a year, so you search for current data instead of an outdated year.",
    parameters: { type: 'object' },
    run: () => {
      const d = now();
      return { ok: true, date: d.toISOString().slice(0, 10), year: d.getUTCFullYear() };
    },
  });

  reg.register({
    name: 'web_search',
    description:
      'Search the web for up-to-date information (competitors, market context, demand signals, current facts). Returns titles, URLs, domains, and content snippets.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'the search query' },
        max_results: { type: 'number', description: 'how many results (1-20, default 5)' },
      },
      required: ['query'],
    },
    run: async (args) => {
      const resp = await deps.search.search(String(args.query), {
        ...deps.searchOptions,
        ...(typeof args.max_results === 'number' ? { maxResults: args.max_results } : {}),
      });
      if (!resp.ok) return { ok: false, error: resp.error ?? 'search failed' };
      return {
        ok: true,
        results: resp.results.map((r) => ({ title: r.title, url: r.url, domain: r.domain, content: r.content })),
      };
    },
  });

  reg.register({
    name: 'corroborate_metric',
    description:
      "Research a single NUMERIC metric (market size in USD, a competitor's funding, a growth rate) across independent sources and return a corroborated value with a confidence status. Use this for ANY number you will rely on in the verdict: it dedupes sources by origin and refuses to commit to a figure that is not corroborated. Provide a snake_case metric name, a precise plain-language instruction (with unit + scope), and 2-4 search queries that surface independent sources.",
    parameters: {
      type: 'object',
      properties: {
        metric: { type: 'string', description: 'snake_case metric name, e.g. market_size_usd' },
        instruction: { type: 'string', description: 'exactly what number to extract, including unit and scope' },
        queries: { type: 'array', items: { type: 'string' }, description: '2-4 queries surfacing independent sources' },
      },
      required: ['metric', 'instruction', 'queries'],
    },
    run: async (args) => {
      const metric = String(args.metric);
      const queries = Array.isArray(args.queries) ? args.queries.map(String) : [];
      const fact = await corroborateMetric(
        metric,
        {},
        {
          search: deps.search,
          extract: { llm: deps.llm, model: deps.extractModel },
          cache: deps.cache,
          queries: queries.length > 0 ? queries : undefined,
          metricInstruction: String(args.instruction ?? metric),
          searchOptions: deps.searchOptions,
          asOf: now().toISOString().slice(0, 10),
        },
      );
      return { ok: true, fact: factToModelDict(fact) };
    },
  });

  return reg;
}
