import { describe, expect, it } from 'vitest';

import { MemoryFactCache } from '../src/cache';
import { corroborateMetric } from '../src/engine';
import type { ChatResult, LlmClient } from '../src/llm';
import type { SearchClient, SearchResponse, SearchResult } from '../src/search';

class FakeSearch implements SearchClient {
  calls = 0;
  constructor(private results: SearchResult[]) {}
  async search(query: string): Promise<SearchResponse> {
    this.calls += 1;
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
  return { title: domain, url: `https://${domain}/p`, content: 't', score: 1, domain };
}
const THREE = [src('a.com'), src('b.com'), src('c.com')];
const ROWS = JSON.stringify([
  { value: 100, unit: 'usd', source_index: 0 },
  { value: 110, unit: 'usd', source_index: 1 },
  { value: 105, unit: 'usd', source_index: 2 },
]);

describe('corroborateMetric', () => {
  it('searches, extracts, corroborates', async () => {
    const fact = await corroborateMetric('market_size_usd', {}, {
      search: new FakeSearch(THREE),
      extract: { llm: new FakeLlm(ROWS) },
      cache: new MemoryFactCache(),
      queries: ['q'],
    });
    expect(fact.status).toBe('corroborated');
    expect(fact.nSources).toBe(3);
  });

  it('serves a cached fact on the second call without re-searching', async () => {
    const search = new FakeSearch(THREE);
    const cache = new MemoryFactCache();
    await corroborateMetric('market_size_usd', {}, { search, extract: { llm: new FakeLlm(ROWS) }, cache, queries: ['q'] });
    const before = search.calls;
    const second = await corroborateMetric('market_size_usd', {}, { search, extract: { llm: new FakeLlm(ROWS) }, cache, queries: ['q'] });
    expect(search.calls).toBe(before);
    expect(second.note).toContain('(cached)');
  });

  it('does not cache an EMPTY result', async () => {
    const search = new FakeSearch([src('a.com')]);
    const cache = new MemoryFactCache();
    const first = await corroborateMetric('market_size_usd', {}, { search, extract: { llm: new FakeLlm('[]') }, cache, queries: ['q'] });
    expect(first.status).toBe('empty');
    const before = search.calls;
    await corroborateMetric('market_size_usd', {}, { search, extract: { llm: new FakeLlm('[]') }, cache, queries: ['q'] });
    expect(search.calls).toBeGreaterThan(before);
  });
});
