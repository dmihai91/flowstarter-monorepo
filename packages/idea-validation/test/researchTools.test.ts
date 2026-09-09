import { describe, expect, it } from 'vitest';

import { MemoryFactCache } from '../src/cache';
import type { ChatResult, LlmClient } from '../src/llm';
import { buildResearchTools } from '../src/researchTools';
import type { SearchClient, SearchResponse, SearchResult } from '../src/search';

class FakeSearch implements SearchClient {
  constructor(private results: SearchResult[]) {}
  async search(query: string): Promise<SearchResponse> {
    return { ok: true, query, results: this.results };
  }
}
class FakeLlm implements LlmClient {
  constructor(private content: string) {}
  async chat(): Promise<ChatResult> {
    return { ok: true, content: this.content, toolCalls: [], costUsd: 0, model: 'x', usage: { inputTokens: 0, outputTokens: 0 } };
  }
}
function src(domain: string): SearchResult {
  return { title: domain, url: `https://${domain}/p`, content: 'snippet', score: 1, domain };
}

describe('buildResearchTools', () => {
  it('exposes web_search and corroborate_metric', () => {
    const reg = buildResearchTools({ search: new FakeSearch([]), llm: new FakeLlm('[]') });
    expect(reg.has('web_search')).toBe(true);
    expect(reg.has('corroborate_metric')).toBe(true);
  });

  it('exposes get_current_date returning the current year', async () => {
    const reg = buildResearchTools({
      search: new FakeSearch([]),
      llm: new FakeLlm('[]'),
      now: () => new Date('2026-06-08T10:00:00Z'),
    });
    expect(reg.has('get_current_date')).toBe(true);
    const out = JSON.parse(await reg.call('get_current_date'));
    expect(out).toEqual({ ok: true, date: '2026-06-08', year: 2026 });
  });

  it('runs web_search through the registry', async () => {
    const reg = buildResearchTools({ search: new FakeSearch([src('a.com'), src('b.com')]), llm: new FakeLlm('[]') });
    const out = JSON.parse(await reg.call('web_search', { query: 'idea' }));
    expect(out.ok).toBe(true);
    expect(out.results).toHaveLength(2);
    expect(out.results[0].domain).toBe('a.com');
  });

  it('runs corroborate_metric and returns a model-facing fact', async () => {
    const rows = JSON.stringify([
      { value: 100, unit: 'usd', source_index: 0 },
      { value: 110, unit: 'usd', source_index: 1 },
      { value: 105, unit: 'usd', source_index: 2 },
    ]);
    const reg = buildResearchTools({
      search: new FakeSearch([src('a.com'), src('b.com'), src('c.com')]),
      llm: new FakeLlm(rows),
      cache: new MemoryFactCache(),
    });
    const out = JSON.parse(await reg.call('corroborate_metric', { metric: 'market_size_usd', instruction: 'TAM in USD', queries: ['q1', 'q2'] }));
    expect(out.ok).toBe(true);
    expect(out.fact.status).toBe('corroborated');
    expect(out.fact.n_sources).toBe(3);
  });
});
