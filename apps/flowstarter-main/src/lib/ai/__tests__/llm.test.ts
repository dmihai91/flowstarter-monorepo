/**
 * The LLM wrapper's contract: budget, ledger, caching, cost.
 *
 * The two properties that matter for Phase 0 are that an over-budget call
 * throws AND is still recorded (spend that broke the rail must be visible),
 * and that a broken ledger never breaks a user's request.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { generateTextMock, insertMock, selectResult } = vi.hoisted(() => ({
  generateTextMock: vi.fn(),
  insertMock: vi.fn(),
  selectResult: { data: [] as unknown[], error: null as unknown },
}));

vi.mock('ai', () => ({
  generateText: (args: unknown) => generateTextMock(args),
  generateObject: vi.fn(),
  streamText: vi.fn(),
}));

vi.mock('@/lib/ai/client', () => ({
  models: { projectDetails: { modelId: 'anthropic/claude-sonnet-4' } },
  getModel: (id?: string) => ({ modelId: id ?? 'anthropic/claude-sonnet-4' }),
  isOpenRouterConfigured: () => true,
}));

vi.mock('@/supabase-clients/server', () => ({
  createSupabaseServiceRoleClient: () => ({
    from: () => ({
      insert: (values: Record<string, unknown>) => insertMock(values),
      select: () => ({
        eq: () => ({ gte: () => Promise.resolve(selectResult) }),
      }),
    }),
  }),
}));

import {
  LLM_BUDGETS,
  LlmBudgetExceededError,
  callLlm,
  estimateCostUsd,
  llmActionConfig,
  normalizeLlmUsage,
  recordLlmUsage,
} from '../llm';

const LEDGER_COLUMNS = [
  'action',
  'cached_tokens',
  'cost_estimate',
  'model',
  'project_id',
  'tokens_in',
  'tokens_out',
  'workspace_id',
];

const WORKSPACE_ID = '0f4e1088-8d8f-4f18-83b1-406cc292b23c';

function reply(
  usage: Record<string, number>,
  extra: Record<string, unknown> = {}
) {
  return { text: 'ok', usage, finishReason: 'stop', ...extra };
}

beforeEach(() => {
  generateTextMock.mockReset();
  insertMock.mockReset();
  insertMock.mockResolvedValue({ error: null });
  selectResult.data = [];
  selectResult.error = null;
  delete process.env.LLM_WORKSPACE_DAILY_TOKEN_CAP;
  delete process.env.LLM_BUDGET_SUPPORT_CHAT;
  delete process.env.LLM_MODEL_SUPPORT_CHAT;
});

describe('usage ledger', () => {
  it('records exactly the llm_usage columns, attributed to the workspace', async () => {
    generateTextMock.mockResolvedValueOnce(
      reply({ inputTokens: 1_000, outputTokens: 100, cachedInputTokens: 400 })
    );

    const result = await callLlm({
      action: 'support_chat',
      workspaceId: WORKSPACE_ID,
      projectId: 'project-1',
      prompt: 'hi',
    });

    expect(insertMock).toHaveBeenCalledTimes(1);
    const row = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(Object.keys(row).sort()).toEqual(LEDGER_COLUMNS);
    expect(row.workspace_id).toBe(WORKSPACE_ID);
    expect(row.project_id).toBe('project-1');
    expect(row.action).toBe('support_chat');
    expect(row.model).toBe('anthropic/claude-sonnet-4');
    expect(row.tokens_in).toBe(1_000);
    expect(row.tokens_out).toBe(100);
    expect(row.cached_tokens).toBe(400);
    expect(row.cost_estimate).toBeCloseTo(
      (600 / 1e6) * 3 + (400 / 1e6) * 0.3 + (100 / 1e6) * 15,
      10
    );
    expect(result.usage.totalTokens).toBe(1_100);
  });

  it('records anonymous funnel traffic with a null workspace_id', async () => {
    generateTextMock.mockResolvedValueOnce(
      reply({ inputTokens: 10, outputTokens: 5 })
    );

    await callLlm({ action: 'preview_edit', workspaceId: null, prompt: 'x' });

    const row = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(row.workspace_id).toBeNull();
    expect(row.project_id).toBeNull();
  });

  it('writes null — never 0 — for a model with no published price', async () => {
    generateTextMock.mockResolvedValueOnce(
      reply({ inputTokens: 10, outputTokens: 5 })
    );

    const result = await callLlm({
      action: 'support_chat',
      model: 'some-lab/unlisted-model',
      prompt: 'x',
    });

    const row = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(row.model).toBe('some-lab/unlisted-model');
    expect(row.cost_estimate).toBeNull();
    expect(result.costEstimate).toBeNull();
  });

  it('prefers the provider-reported cost over the estimate', async () => {
    generateTextMock.mockResolvedValueOnce(
      reply(
        { inputTokens: 10, outputTokens: 5 },
        { providerMetadata: { openrouter: { usage: { cost: 0.0042 } } } }
      )
    );

    await callLlm({ action: 'support_chat', prompt: 'x' });

    const row = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(row.cost_estimate).toBe(0.0042);
  });

  it('never fails the caller when the ledger insert errors', async () => {
    generateTextMock.mockResolvedValue(
      reply({ inputTokens: 10, outputTokens: 5 })
    );

    insertMock.mockResolvedValueOnce({ error: { message: 'no such table' } });
    await expect(
      callLlm({ action: 'support_chat', prompt: 'x' })
    ).resolves.toMatchObject({ text: 'ok' });

    insertMock.mockRejectedValueOnce(new Error('connection reset'));
    await expect(
      callLlm({ action: 'support_chat', prompt: 'x' })
    ).resolves.toMatchObject({ text: 'ok' });
  });

  it('recordLlmUsage never rejects on its own', async () => {
    insertMock.mockRejectedValueOnce(new Error('down'));
    await expect(
      recordLlmUsage({
        action: 'preview_generate',
        model: 'z-ai/glm-5.2',
        tokensIn: 1,
        tokensOut: 1,
        cachedTokens: 0,
      })
    ).resolves.toBeUndefined();
  });
});

describe('budget enforcement', () => {
  it('throws LlmBudgetExceededError and still records the overspend', async () => {
    const budget = LLM_BUDGETS.support_chat.maxTokens;
    generateTextMock.mockResolvedValueOnce(
      reply({ inputTokens: budget, outputTokens: 50 })
    );

    const call = callLlm({
      action: 'support_chat',
      workspaceId: WORKSPACE_ID,
      prompt: 'x',
    });

    await expect(call).rejects.toBeInstanceOf(LlmBudgetExceededError);
    await expect(call).rejects.toMatchObject({
      action: 'support_chat',
      reason: 'total_tokens',
      budgetTokens: budget,
    });

    expect(insertMock).toHaveBeenCalledTimes(1);
    const row = insertMock.mock.calls[0][0] as Record<string, unknown>;
    expect(row.tokens_in).toBe(budget);
    expect(row.tokens_out).toBe(50);
    expect(row.workspace_id).toBe(WORKSPACE_ID);
  });

  it('treats a provider-reported truncation as a budget breach', async () => {
    generateTextMock.mockResolvedValueOnce({
      text: 'half a json obj',
      usage: { inputTokens: 10, outputTokens: 5 },
      finishReason: 'length',
    });

    await expect(
      callLlm({ action: 'site_copy', prompt: 'x' })
    ).rejects.toMatchObject({ reason: 'truncated' });
    expect(insertMock).toHaveBeenCalledTimes(1);
  });

  it('lets a call site opt out of the truncation rule', async () => {
    generateTextMock.mockResolvedValueOnce({
      text: 'a clipped but usable reply',
      usage: { inputTokens: 10, outputTokens: 5 },
      finishReason: 'length',
    });

    await expect(
      callLlm({ action: 'support_chat', prompt: 'x', allowTruncation: true })
    ).resolves.toMatchObject({ text: 'a clipped but usable reply' });
  });

  it('sends the action output cap to the provider before the call', async () => {
    generateTextMock.mockResolvedValueOnce(
      reply({ inputTokens: 10, outputTokens: 5 })
    );

    await callLlm({ action: 'support_chat', prompt: 'x' });

    const args = generateTextMock.mock.calls[0][0] as {
      maxOutputTokens?: number;
    };
    expect(args.maxOutputTokens).toBe(LLM_BUDGETS.support_chat.maxOutputTokens);
  });

  it('honours a per-call budget override', async () => {
    generateTextMock.mockResolvedValueOnce(
      reply({ inputTokens: 100, outputTokens: 10 })
    );

    await expect(
      callLlm({ action: 'support_chat', prompt: 'x', budgetTokens: 50 })
    ).rejects.toMatchObject({ budgetTokens: 50, usedTokens: 110 });
  });

  it('lets ops retune a budget and a model through the environment', () => {
    process.env.LLM_BUDGET_SUPPORT_CHAT = '99999';
    process.env.LLM_MODEL_SUPPORT_CHAT = 'anthropic/claude-3.5-haiku';
    expect(llmActionConfig('support_chat')).toMatchObject({
      maxTokens: 99_999,
      model: 'anthropic/claude-3.5-haiku',
    });
  });

  it('is off by default but refuses over the rolling workspace cap', async () => {
    selectResult.data = [
      { tokens_in: 900, tokens_out: 200 },
      { tokens_in: 100, tokens_out: 0 },
    ];
    generateTextMock.mockResolvedValue(
      reply({ inputTokens: 5, outputTokens: 5 })
    );

    // Cap unset → the rolling query never runs and the call proceeds.
    await expect(
      callLlm({
        action: 'support_chat',
        workspaceId: WORKSPACE_ID,
        prompt: 'x',
      })
    ).resolves.toMatchObject({ text: 'ok' });

    process.env.LLM_WORKSPACE_DAILY_TOKEN_CAP = '1000';
    generateTextMock.mockClear();
    await expect(
      callLlm({
        action: 'support_chat',
        workspaceId: WORKSPACE_ID,
        prompt: 'x',
      })
    ).rejects.toMatchObject({
      reason: 'workspace_daily_cap',
      usedTokens: 1_200,
    });
    // Refused before spending anything.
    expect(generateTextMock).not.toHaveBeenCalled();
  });
});

describe('prompt caching', () => {
  it('marks the system prefix cacheable on Anthropic models', async () => {
    generateTextMock.mockResolvedValueOnce(
      reply({ inputTokens: 10, outputTokens: 5 })
    );

    await callLlm({
      action: 'support_chat',
      system: 'a long static system prompt',
      prompt: 'hello',
    });

    const args = generateTextMock.mock.calls[0][0] as {
      messages: Array<{ role: string; providerOptions?: unknown }>;
    };
    expect(args.messages[0].role).toBe('system');
    expect(args.messages[0].providerOptions).toEqual({
      openrouter: { cacheControl: { type: 'ephemeral' } },
    });
    expect(args.messages[1]).toMatchObject({ role: 'user', content: 'hello' });
  });

  it('does not fake a cache breakpoint on models that ignore it', async () => {
    generateTextMock.mockResolvedValueOnce(
      reply({ inputTokens: 10, outputTokens: 5 })
    );

    await callLlm({
      action: 'recommend_tier',
      system: 'a long static system prompt',
      prompt: 'hello',
    });

    const args = generateTextMock.mock.calls[0][0] as {
      messages: Array<{ providerOptions?: unknown }>;
    };
    expect(args.messages[0].providerOptions).toBeUndefined();
  });

  it('leaves a bare prompt alone (no static prefix to cache)', async () => {
    generateTextMock.mockResolvedValueOnce(
      reply({ inputTokens: 10, outputTokens: 5 })
    );

    await callLlm({ action: 'site_copy', prompt: 'just a prompt' });

    const args = generateTextMock.mock.calls[0][0] as {
      prompt?: string;
      messages?: unknown;
    };
    expect(args.prompt).toBe('just a prompt');
    expect(args.messages).toBeUndefined();
  });

  it('asks OpenRouter for usage accounting on every call', async () => {
    generateTextMock.mockResolvedValueOnce(
      reply({ inputTokens: 10, outputTokens: 5 })
    );

    await callLlm({ action: 'support_chat', prompt: 'x' });

    const args = generateTextMock.mock.calls[0][0] as {
      providerOptions?: Record<string, unknown>;
    };
    expect(args.providerOptions).toEqual({
      openrouter: { usage: { include: true } },
    });
  });
});

describe('usage + cost helpers', () => {
  it('normalizes both the v5 and legacy usage shapes', () => {
    expect(
      normalizeLlmUsage({
        inputTokens: 10,
        outputTokens: 4,
        cachedInputTokens: 3,
      })
    ).toEqual({ tokensIn: 10, tokensOut: 4, cachedTokens: 3, totalTokens: 14 });
    expect(normalizeLlmUsage({ promptTokens: 7, completionTokens: 2 })).toEqual(
      {
        tokensIn: 7,
        tokensOut: 2,
        cachedTokens: 0,
        totalTokens: 9,
      }
    );
    expect(normalizeLlmUsage(undefined)).toEqual({
      tokensIn: 0,
      tokensOut: 0,
      cachedTokens: 0,
      totalTokens: 0,
    });
  });

  it('returns null, not zero, for an unpriced or missing model', () => {
    const usage = { tokensIn: 1_000, tokensOut: 1_000, cachedTokens: 0 };
    expect(estimateCostUsd(null, usage)).toBeNull();
    expect(estimateCostUsd('z-ai/glm-5.2', usage)).toBeNull();
    expect(estimateCostUsd('openai/gpt-4o', usage)).toBeCloseTo(0.0125, 10);
  });

  it('every action has a budget and a model', () => {
    for (const [action, config] of Object.entries(LLM_BUDGETS)) {
      expect(config.maxTokens, action).toBeGreaterThan(0);
      expect(config.model, action).toMatch(/\//);
    }
  });
});
