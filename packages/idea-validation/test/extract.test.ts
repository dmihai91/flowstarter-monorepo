import { describe, expect, it } from 'vitest';

import { extractRecords } from '../src/extract';
import type { ChatResult, LlmClient } from '../src/llm';
import type { SearchResult } from '../src/search';

class FakeLlm implements LlmClient {
  constructor(
    private content: string,
    private ok = true,
  ) {}
  async chat(): Promise<ChatResult> {
    return { ok: this.ok, content: this.content, toolCalls: [], costUsd: 0, model: 'x', usage: { inputTokens: 0, outputTokens: 0 } };
  }
}

function src(domain: string, content = 'some text'): SearchResult {
  return { title: domain, url: `https://${domain}/p`, content, score: 1, domain };
}

describe('extractRecords', () => {
  it('maps extracted rows to typed records with source provenance', async () => {
    const json = JSON.stringify([
      { value: 100, unit: 'usd', stat: 'value', source_index: 0 },
      { value: 110, unit: 'usd', stat: 'value', source_index: 1 },
    ]);
    const recs = await extractRecords('market_size_usd', [src('a.com'), src('b.com')], { llm: new FakeLlm(json) });
    expect(recs).toHaveLength(2);
    expect(recs[0]!.value).toBe(100);
    expect(recs[0]!.sourceDomain).toBe('a.com');
    expect(recs[0]!.metric).toBe('market_size_usd');
  });

  it('skips bad values and out-of-range source indexes; never fabricates', async () => {
    const json = JSON.stringify([
      { value: 'lots', unit: 'usd', source_index: 0 },
      { value: 50, unit: 'usd', source_index: 9 },
      { value: 75, unit: 'usd', source_index: 1 },
    ]);
    const recs = await extractRecords('m', [src('a.com'), src('b.com')], { llm: new FakeLlm(json) });
    expect(recs).toHaveLength(1);
    expect(recs[0]!.value).toBe(75);
  });

  it('returns no records when the extractor fails (fail-open)', async () => {
    const recs = await extractRecords('m', [src('a.com')], { llm: new FakeLlm('', false) });
    expect(recs).toEqual([]);
  });

  it('tolerates code-fenced JSON', async () => {
    const recs = await extractRecords('m', [src('a.com')], {
      llm: new FakeLlm('```json\n[{"value": 5, "unit": "x", "source_index": 0}]\n```'),
    });
    expect(recs).toHaveLength(1);
    expect(recs[0]!.value).toBe(5);
  });
});
