/**
 * Token accounting and the per-run budget on the Pi coding-agent path.
 *
 * The preview pipeline does not go through the main app's AI-SDK wrapper, so
 * it needs its own half of the same guarantee: every assistant turn is
 * measured, handed to the app's usage ledger, and counted against a whole-run
 * ceiling that stops the build rather than letting it burn through the budget.
 *
 * The Pi runtime is stubbed end to end — this exercises the real subscribe
 * handler inside `runTextSession`, not a re-implementation of it.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

interface FakeEvent {
  type: string;
  assistantMessageEvent?: { type: string; delta: string };
  message?: Record<string, unknown>;
}

const script: { events: FakeEvent[][]; aborted: number; run: number } = {
  events: [],
  aborted: 0,
  run: 0,
};

vi.mock('@earendil-works/pi-ai', () => ({
  InMemoryCredentialStore: class {},
}));

vi.mock('@earendil-works/pi-coding-agent', () => {
  class SettingsManager {
    static inMemory() {
      return {};
    }
  }
  class SessionManager {
    static inMemory() {
      return {};
    }
  }
  class DefaultResourceLoader {
    async reload() {}
  }
  class ModelRuntime {
    static async create() {
      return new ModelRuntime();
    }
    async setRuntimeApiKey() {}
    getModel() {
      return { id: 'stub-model', maxTokens: 4_000 };
    }
  }
  return {
    SettingsManager,
    SessionManager,
    DefaultResourceLoader,
    ModelRuntime,
    defineTool: (definition: unknown) => definition,
    createAgentSession: async () => {
      const events = script.events[script.run] ?? [];
      script.run += 1;
      let subscriber: ((event: FakeEvent) => void) | undefined;
      let aborted = false;
      const session = {
        model: { id: 'stub-model' },
        subscribe(fn: (event: FakeEvent) => void) {
          subscriber = fn;
          return () => {
            subscriber = undefined;
          };
        },
        async prompt() {
          for (const event of events) {
            if (aborted) break;
            subscriber?.(event);
          }
        },
        async abort() {
          aborted = true;
          script.aborted += 1;
        },
        dispose() {},
      };
      return { session };
    },
  };
});

import {
  DEFAULT_PI_MAX_RUN_TOKENS,
  PiRunBudgetExceededError,
  PiSdkFlowstarterAgents,
  normalizePiUsage,
  type PiSdkOptions,
  type PiUsageEvent,
} from '../src/flowstarter/pi-sdk';

function turn(usage: Record<string, number>, text = 'done'): FakeEvent[] {
  return [
    { type: 'message_update', assistantMessageEvent: { type: 'text_delta', delta: text } },
    {
      type: 'message_end',
      message: {
        role: 'assistant',
        stopReason: 'stop',
        model: 'z-ai/glm-5.2',
        usage,
      },
    },
  ];
}

function agents(options: Partial<PiSdkOptions> = {}) {
  return new PiSdkFlowstarterAgents({
    provider: 'openrouter',
    modelId: 'z-ai/glm-5.2',
    ...options,
  });
}

function run(instance: PiSdkFlowstarterAgents): Promise<string> {
  return (
    instance as unknown as {
      runTextSession(input: Record<string, unknown>): Promise<string>;
    }
  ).runTextSession({
    cwd: process.cwd(),
    systemPrompt: 'system',
    prompt: 'prompt',
    tools: [],
    action: 'preview_generate',
  });
}

beforeEach(() => {
  script.events = [];
  script.aborted = 0;
  script.run = 0;
});

describe('normalizePiUsage', () => {
  it('folds cache reads and writes back into the prompt total', () => {
    expect(
      normalizePiUsage({ input: 100, output: 50, cacheRead: 20, cacheWrite: 10 })
    ).toEqual({
      tokensIn: 130,
      tokensOut: 50,
      cachedTokens: 20,
      totalTokens: 180,
    });
  });

  it('prefers the provider total and survives a missing usage block', () => {
    expect(
      normalizePiUsage({ input: 10, output: 5, totalTokens: 99 })
    ).toMatchObject({ totalTokens: 99 });
    expect(normalizePiUsage(undefined)).toEqual({
      tokensIn: 0,
      tokensOut: 0,
      cachedTokens: 0,
      totalTokens: 0,
    });
  });
});

describe('usage sink', () => {
  it('reports one normalized event per assistant turn', async () => {
    script.events = [
      [
        ...turn({ input: 100, output: 50, cacheRead: 20, cacheWrite: 10 }, 'a'),
        ...turn({ input: 40, output: 10 }, 'b'),
      ],
    ];
    const seen: PiUsageEvent[] = [];
    const instance = agents({ usageSink: (usage) => void seen.push(usage) });

    await expect(run(instance)).resolves.toBe('ab');

    expect(seen).toEqual([
      {
        action: 'preview_generate',
        model: 'z-ai/glm-5.2',
        tokensIn: 130,
        tokensOut: 50,
        cachedTokens: 20,
      },
      {
        action: 'preview_generate',
        model: 'z-ai/glm-5.2',
        tokensIn: 40,
        tokensOut: 10,
        cachedTokens: 0,
      },
    ]);
    expect(instance.tokensUsed).toBe(230);
  });

  it('accumulates across the sessions of one preview run', async () => {
    script.events = [[...turn({ input: 100, output: 20 })], [...turn({ input: 30, output: 5 })]];
    const instance = agents();

    await run(instance);
    await run(instance);

    expect(instance.tokensUsed).toBe(155);
  });

  it('never lets a broken sink break the build', async () => {
    script.events = [[...turn({ input: 10, output: 5 }, 'ok')]];
    const instance = agents({
      usageSink: () => {
        throw new Error('ledger down');
      },
    });

    await expect(run(instance)).resolves.toBe('ok');
  });

  it('never lets a rejected async sink break the build', async () => {
    script.events = [[...turn({ input: 10, output: 5 }, 'ok')]];
    const instance = agents({
      usageSink: async () => {
        throw new Error('insert failed');
      },
    });

    await expect(run(instance)).resolves.toBe('ok');
  });
});

describe('per-run token cap', () => {
  it('defaults to the preview ceiling from the spec', () => {
    expect(DEFAULT_PI_MAX_RUN_TOKENS).toBeGreaterThanOrEqual(200_000);
    expect(DEFAULT_PI_MAX_RUN_TOKENS).toBeLessThanOrEqual(300_000);
  });

  it('aborts the session and fails the run with a clear error', async () => {
    script.events = [[...turn({ input: 900, output: 200 })]];
    const instance = agents({ maxRunTokens: 1_000 });

    await expect(run(instance)).rejects.toBeInstanceOf(PiRunBudgetExceededError);
    expect(script.aborted).toBe(1);
  });

  it('names the action, the spend and the ceiling', async () => {
    script.events = [[...turn({ input: 900, output: 200 })]];
    const instance = agents({ maxRunTokens: 1_000 });

    await expect(run(instance)).rejects.toMatchObject({
      name: 'PiRunBudgetExceededError',
      action: 'preview_generate',
      usedTokens: 1_100,
      maxRunTokens: 1_000,
    });
  });

  it('trips on the cumulative total, not one oversized turn', async () => {
    script.events = [[...turn({ input: 400, output: 100 })], [...turn({ input: 400, output: 100 })]];
    const instance = agents({ maxRunTokens: 900 });

    await expect(run(instance)).resolves.toBe('done');
    await expect(run(instance)).rejects.toBeInstanceOf(PiRunBudgetExceededError);
  });

  it('can be disabled with 0 for an unbounded operator run', async () => {
    script.events = [[...turn({ input: 10_000_000, output: 1 })]];
    const instance = agents({ maxRunTokens: 0 });

    await expect(run(instance)).resolves.toBe('done');
    expect(script.aborted).toBe(0);
  });

  it('reports the budget breach rather than the provider error behind it', async () => {
    script.events = [
      [
        {
          type: 'message_end',
          message: {
            role: 'assistant',
            stopReason: 'error',
            errorMessage: 'upstream 429',
            usage: { input: 5_000, output: 0 },
          },
        },
      ],
    ];
    const instance = agents({ maxRunTokens: 100 });

    await expect(run(instance)).rejects.toBeInstanceOf(PiRunBudgetExceededError);
  });
});
