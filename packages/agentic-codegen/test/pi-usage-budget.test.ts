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

const script: {
  events: FakeEvent[][];
  aborted: number;
  run: number;
  /** The model id each session was created with, in order. */
  models: string[];
} = {
  events: [],
  aborted: 0,
  run: 0,
  models: [],
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
    getModel(_provider: string, id: string) {
      return { id, maxTokens: 4_000 };
    }
  }
  return {
    SettingsManager,
    SessionManager,
    DefaultResourceLoader,
    ModelRuntime,
    defineTool: (definition: unknown) => definition,
    createAgentSession: async (options: { model?: { id?: string } }) => {
      const events = script.events[script.run] ?? [];
      script.run += 1;
      script.models.push(options.model?.id ?? 'none');
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
  DEFAULT_PI_SESSION_ATTEMPTS,
  MAX_RETRYABLE_TIMEOUT_MS,
  PiRunDeadlineExceededError,
  PiSessionAttemptError,
  isTransientSessionError,
  PiRunBudgetExceededError,
  PiSdkFlowstarterAgents,
  normalizePiUsage,
  type PiSdkOptions,
  type PiUsageEvent,
} from '../src/flowstarter/pi-sdk';

function turn(usage: Record<string, number>, text = 'done'): FakeEvent[] {
  return [
    {
      type: 'message_update',
      assistantMessageEvent: { type: 'text_delta', delta: text },
    },
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
    // Real backoff is for real providers; here it would only slow the suite.
    retryBaseDelayMs: 0,
    ...options,
  });
}

/** A turn the provider gave up on: what OpenRouter's `finish_reason: error` looks like. */
function failedTurn(errorMessage: string): FakeEvent[] {
  return [
    {
      type: 'message_end',
      message: {
        role: 'assistant',
        stopReason: 'error',
        errorMessage,
        model: 'z-ai/glm-5.2',
        usage: { input: 10, output: 0 },
      },
    },
  ];
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
  script.models = [];
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('normalizePiUsage', () => {
  it('folds cache reads and writes back into the prompt total', () => {
    expect(
      normalizePiUsage({
        input: 100,
        output: 50,
        cacheRead: 20,
        cacheWrite: 10,
      }),
    ).toEqual({
      tokensIn: 130,
      tokensOut: 50,
      cachedTokens: 20,
      totalTokens: 180,
    });
  });

  it('prefers the provider total and survives a missing usage block', () => {
    expect(
      normalizePiUsage({ input: 10, output: 5, totalTokens: 99 }),
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
    // The run cap counts what is paid for: tokensIn - cachedTokens + tokensOut.
    // Cache reads dominate a real preview (every turn re-sends the template
    // context), so counting them aborted genuine runs at the old ceiling.
    expect(instance.tokensUsed).toBe(210);
  });

  it('accumulates across the sessions of one preview run', async () => {
    script.events = [
      [...turn({ input: 100, output: 20 })],
      [...turn({ input: 30, output: 5 })],
    ];
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
    // Measured 2026-08-30: a real preview needs ~300-400k uncached tokens
    // (2.5M tokens_in over 39 turns, 1.4M of them cache reads). The ceiling
    // is on uncached tokens and leaves headroom for repair passes.
    expect(DEFAULT_PI_MAX_RUN_TOKENS).toBeGreaterThanOrEqual(600_000);
    expect(DEFAULT_PI_MAX_RUN_TOKENS).toBeLessThanOrEqual(2_000_000);
  });

  it('aborts the session and fails the run with a clear error', async () => {
    script.events = [[...turn({ input: 900, output: 200 })]];
    const instance = agents({ maxRunTokens: 1_000 });

    await expect(run(instance)).rejects.toBeInstanceOf(
      PiRunBudgetExceededError,
    );
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
    script.events = [
      [...turn({ input: 400, output: 100 })],
      [...turn({ input: 400, output: 100 })],
    ];
    const instance = agents({ maxRunTokens: 900 });

    await expect(run(instance)).resolves.toBe('done');
    await expect(run(instance)).rejects.toBeInstanceOf(
      PiRunBudgetExceededError,
    );
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

    await expect(run(instance)).rejects.toBeInstanceOf(
      PiRunBudgetExceededError,
    );
  });
});

describe('session attempts', () => {
  it('restarts a session the provider gave up on, and returns the good one', async () => {
    script.events = [
      failedTurn('Provider finish_reason: error'),
      [...turn({ input: 10, output: 5 }, 'second time lucky')],
    ];

    await expect(run(agents())).resolves.toBe('second time lucky');
    expect(script.run).toBe(2);
  });

  it('gives up after the configured attempts, with the last reason', async () => {
    script.events = [
      failedTurn('Provider finish_reason: error'),
      failedTurn('upstream overloaded'),
      failedTurn('still down'),
      [...turn({ input: 10, output: 5 }, 'never reached')],
    ];

    await expect(run(agents())).rejects.toThrow(/still down/);
    expect(script.run).toBe(DEFAULT_PI_SESSION_ATTEMPTS);
  });

  it('does not retry an account problem: a retry cannot fix a quota', async () => {
    script.events = [
      failedTurn('402 insufficient_quota: add credits'),
      [...turn({ input: 10, output: 5 }, 'would have worked')],
    ];

    await expect(run(agents())).rejects.toThrow(/insufficient_quota/);
    expect(script.run).toBe(1);
  });

  it('treats an empty text-only answer as a failed turn', async () => {
    script.events = [
      [...turn({ input: 10, output: 0 }, '')],
      [...turn({ input: 10, output: 5 }, '{}')],
    ];

    await expect(run(agents())).resolves.toBe('{}');
    expect(script.run).toBe(2);
  });

  it('runs the last attempt on the fallback model when one is configured', async () => {
    script.events = [
      failedTurn('Provider finish_reason: error'),
      failedTurn('Provider finish_reason: error'),
      [...turn({ input: 10, output: 5 }, 'from the fallback')],
    ];

    await expect(
      run(agents({ fallbackModelId: 'z-ai/glm-5.3-flash' })),
    ).resolves.toBe('from the fallback');
    expect(script.models).toEqual([
      'z-ai/glm-5.2',
      'z-ai/glm-5.2',
      'z-ai/glm-5.3-flash',
    ]);
  });

  it('honours a per-role fallback over the base one', async () => {
    script.events = [
      failedTurn('Provider finish_reason: error'),
      failedTurn('Provider finish_reason: error'),
      [...turn({ input: 10, output: 5 }, 'ok')],
    ];
    const instance = agents({
      fallbackModelId: 'base-fallback',
      roles: {
        brand: { modelId: 'brand-model', fallbackModelId: 'brand-fallback' },
      },
    });
    await (
      instance as unknown as {
        runTextSession(input: Record<string, unknown>): Promise<string>;
      }
    ).runTextSession({
      cwd: process.cwd(),
      systemPrompt: 'system',
      prompt: 'prompt',
      tools: [],
      role: 'brand',
      action: 'preview_generate',
    });
    expect(script.models).toEqual([
      'brand-model',
      'brand-model',
      'brand-fallback',
    ]);
  });

  it("never retries past the run budget: the ceiling is the operator's", async () => {
    script.events = [
      [...turn({ input: 900, output: 200 })],
      [...turn({ input: 10, output: 5 }, 'not reached')],
    ];

    await expect(run(agents({ maxRunTokens: 1_000 }))).rejects.toBeInstanceOf(
      PiRunBudgetExceededError,
    );
    expect(script.run).toBe(1);
  });

  it('can be switched off', async () => {
    script.events = [
      failedTurn('Provider finish_reason: error'),
      [...turn({ input: 10, output: 5 }, 'not reached')],
    ];

    await expect(run(agents({ maxSessionAttempts: 1 }))).rejects.toThrow(
      /finish_reason/,
    );
    expect(script.run).toBe(1);
  });
});

describe('which session failures are transient', () => {
  it('retries a short session that timed out, never a long one', () => {
    const timeout = new PiSessionAttemptError('Pi agent timed out', 'timeout');
    expect(isTransientSessionError(timeout, 120_000)).toBe(true);
    expect(isTransientSessionError(timeout, MAX_RETRYABLE_TIMEOUT_MS)).toBe(
      true,
    );
    expect(isTransientSessionError(timeout, 600_000)).toBe(false);
  });

  it('retries provider weather and empty answers, not account problems', () => {
    expect(
      isTransientSessionError(
        new PiSessionAttemptError(
          'Pi session failed: Provider finish_reason: error',
          'provider',
        ),
      ),
    ).toBe(true);
    expect(
      isTransientSessionError(new PiSessionAttemptError('no output', 'empty')),
    ).toBe(true);
    expect(
      isTransientSessionError(
        new PiSessionAttemptError(
          'Pi session failed: 401 invalid_api_key',
          'provider',
        ),
      ),
    ).toBe(false);
    expect(isTransientSessionError(new Error('anything else'))).toBe(false);
  });
});

describe('the run deadline', () => {
  it('refuses to start a session with no time left, and never retries into it', async () => {
    script.events = [[...turn({ input: 10, output: 5 }, 'not reached')]];
    await expect(
      run(agents({ deadlineAt: Date.now() - 1 })),
    ).rejects.toBeInstanceOf(PiRunDeadlineExceededError);
    expect(script.run).toBe(0);
  });

  it('runs normally while the deadline is far away', async () => {
    script.events = [[...turn({ input: 10, output: 5 }, 'ok')]];
    await expect(
      run(agents({ deadlineAt: Date.now() + 600_000 })),
    ).resolves.toBe('ok');
  });
});

describe('a personalization pass that runs out of clock', () => {
  it('returns the files it wrote as a timed-out candidate instead of throwing', async () => {
    const { mkdtemp, mkdir, writeFile } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const root = await mkdtemp(join(tmpdir(), 'partial-'));
    await mkdir(join(root, 'src/content'), { recursive: true });
    await writeFile(
      join(root, 'src/content/site-labels.md'),
      'template',
      'utf8',
    );
    await writeFile(
      join(root, 'package.json'),
      '{"scripts":{"dev":"astro dev"}}',
      'utf8',
    );

    const instance = agents();
    (instance as unknown as { runTextSession: unknown }).runTextSession =
      async (input: {
        customTools?: Array<{
          name: string;
          execute: (id: string, params: unknown) => Promise<unknown>;
        }>;
      }) => {
        const write = input.customTools?.find(
          (tool) => tool.name === 'write_file',
        );
        await write?.execute('1', {
          path: 'src/content/site-labels.md',
          content: 'Ionescu Dental',
        });
        throw new PiSessionAttemptError(
          'Pi agent timed out after 600000ms',
          'timeout',
        );
      };

    const result = await instance.buildPreview({
      workspaceRoot: root,
      intake: {
        projectId: 'p',
        business: {
          name: 'Ionescu Dental',
          niche: 'dental',
          location: 'Cluj',
          description: 'x',
        },
        socialMedia: [],
        locale: 'en',
        submittedAt: new Date().toISOString(),
        consent: { publicProfileAnalysis: false, acceptedAt: '' },
      } as never,
      brandConfig: {} as never,
      templateSlug: 'wellness-therapy',
      cachedAssets: [],
    });
    expect(result.timedOut).toBe(true);
    expect(result.changedPaths).toEqual(['src/content/site-labels.md']);
  });

  it('still throws when the timeout hit before anything was written', async () => {
    const { mkdtemp, mkdir, writeFile } = await import('node:fs/promises');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const root = await mkdtemp(join(tmpdir(), 'nothing-'));
    await mkdir(join(root, 'src/content'), { recursive: true });
    await writeFile(
      join(root, 'src/content/site-labels.md'),
      'template',
      'utf8',
    );

    const instance = agents();
    (instance as unknown as { runTextSession: unknown }).runTextSession =
      async () => {
        throw new PiSessionAttemptError(
          'Pi agent timed out after 600000ms',
          'timeout',
        );
      };
    await expect(
      instance.buildPreview({
        workspaceRoot: root,
        intake: {
          projectId: 'p',
          business: { name: 'x', niche: 'y', location: 'z', description: 'd' },
          socialMedia: [],
          locale: 'en',
          submittedAt: new Date().toISOString(),
          consent: { publicProfileAnalysis: false, acceptedAt: '' },
        } as never,
        brandConfig: {} as never,
        templateSlug: 'wellness-therapy',
        cachedAssets: [],
      }),
    ).rejects.toThrow(/timed out/);
  });
});
