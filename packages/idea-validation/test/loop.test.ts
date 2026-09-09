import { describe, expect, it } from 'vitest';

import type { ChatRequest, ChatResult, LlmClient } from '../src/llm';
import { runIdeaValidation } from '../src/loop';
import { ToolRegistry } from '../src/tools';

/** A fake LLM that replays a scripted list of results (clamps to the last). */
class ScriptedLlm implements LlmClient {
  calls: ChatRequest[] = [];
  private i = 0;
  constructor(private script: ChatResult[]) {}
  async chat(req: ChatRequest): Promise<ChatResult> {
    this.calls.push(req);
    const r = this.script[Math.min(this.i, this.script.length - 1)]!;
    this.i += 1;
    return r;
  }
}

function toolCall(name: string, args: Record<string, unknown>): ChatResult {
  return { ok: true, content: '', toolCalls: [{ id: 'c1', name, arguments: args }], costUsd: 0, model: 'm', usage: { inputTokens: 0, outputTokens: 0 } };
}
function answer(text: string): ChatResult {
  return { ok: true, content: text, toolCalls: [], costUsd: 0, model: 'm', usage: { inputTokens: 0, outputTokens: 0 } };
}

describe('runIdeaValidation', () => {
  it('executes a tool call, then produces an answer', async () => {
    const tools = new ToolRegistry();
    let ran = false;
    tools.register({
      name: 'web_search',
      description: 'search',
      parameters: { type: 'object' },
      run: () => {
        ran = true;
        return { ok: true, results: ['x'] };
      },
    });
    const llm = new ScriptedLlm([toolCall('web_search', { q: 'idea' }), answer('It is a good idea.')]);
    const events: string[] = [];
    const res = await runIdeaValidation({ idea: 'a saas', llm, tools, maxIterations: 6, emit: (e) => events.push(e) });

    expect(ran).toBe(true);
    expect(res.finalMessage).toBe('It is a good idea.');
    expect(events).toContain('act');
    expect(events).toContain('observe');
    expect(events).toContain('answer');
  });

  it('bounds iterations and forces a final answer when the loop never settles', async () => {
    const tools = new ToolRegistry();
    tools.register({ name: 'web_search', description: '', parameters: { type: 'object' }, run: () => ({ ok: true }) });
    const llm = new ScriptedLlm([toolCall('web_search', {}), toolCall('web_search', {}), answer('forced summary')]);

    const res = await runIdeaValidation({ idea: 'x', llm, tools, maxIterations: 2 });

    expect(res.iterations).toBe(2);
    expect(res.finalMessage).toBe('forced summary');
    expect(llm.calls.length).toBe(3); // 2 loop turns + 1 forced answer
    expect(llm.calls[2]!.toolChoice).toBe('none');
  });

  it('injects the current date into the system prompt', async () => {
    const llm = new ScriptedLlm([answer('done')]);
    await runIdeaValidation({ idea: 'x', llm, tools: new ToolRegistry(), now: () => new Date('2026-06-08T00:00:00Z') });
    const sys = llm.calls[0]!.messages[0]!;
    expect(sys.role).toBe('system');
    expect(sys.content).toContain('2026');
    expect(sys.content).toContain('2026-06-08');
  });

  it('stops on an LLM error and still returns a result', async () => {
    const tools = new ToolRegistry();
    const llm = new ScriptedLlm([{ ok: false, content: '', toolCalls: [], costUsd: 0, model: 'm', usage: { inputTokens: 0, outputTokens: 0 }, error: 'timeout' }]);
    const res = await runIdeaValidation({ idea: 'x', llm, tools, maxIterations: 3 });
    expect(res.finalMessage).toBeNull();
    expect(res.steps.some((s) => s.observations.some((o) => o.includes('LLM error')))).toBe(true);
  });
});
