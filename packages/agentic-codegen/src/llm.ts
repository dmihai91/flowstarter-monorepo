/**
 * The single LLM seam for the codegen pipeline. Everything goes through
 * OpenRouter via the `ai` SDK — Sonnet for the "brain" roles (planning,
 * critique) and Kimi K2.6 for the "implementer" role (writing/revising the
 * site content). This mirrors apps/flowstarter-main/src/lib/ai/client.ts.
 *
 * `generate` is the only call the orchestrator makes; tests inject a fake
 * `GenerateFn` so the whole pipeline runs with no network — this seam is the
 * "pluggable brain" the gretly orchestrator is built around.
 */
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

/** Which tier handles a call. Maps to a concrete model below. */
export type Role = 'brain' | 'implementer' | 'fast';

/** OpenRouter model slugs per role (verified current on OpenRouter, 2026). */
export const ROLE_MODELS: Record<Role, string> = {
  brain: 'anthropic/claude-sonnet-4.6',
  implementer: 'moonshotai/kimi-k2.6',
  fast: 'anthropic/claude-haiku-4.5',
};

/**
 * "Fast mode": OpenRouter has no per-model fast toggle, but routing to the
 * highest-throughput provider is the equivalent lever — it cut a Kimi K2.6
 * content rewrite from a 120s timeout (slow default provider) to ~30s. We
 * apply it to every call.
 */
const PROVIDER_ROUTING = { sort: 'throughput' as const };

export interface GenerateInput {
  role: Role;
  system: string;
  prompt: string;
  /** Hard wall-clock; the request is aborted past this. Default 120s. */
  wallClockMs?: number;
  /** Cap output size (also our soft cost guard). Default 8000. */
  maxOutputTokens?: number;
  /** 0–1; defaults to 0.4 (content) — planner/critic pass lower. */
  temperature?: number;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface GenerateOutput {
  ok: boolean;
  text: string;
  costUsd: number;
  /** The model slug that served the call (for cost attribution). */
  model: string;
  usage: TokenUsage;
  /** Populated on failure: 'timeout' | 'empty' | 'error'. */
  error?: string;
}

/** The injectable contract. Default implementation calls OpenRouter. */
export type GenerateFn = (input: GenerateInput) => Promise<GenerateOutput>;

let _openrouter: ReturnType<typeof createOpenRouter> | null = null;
function openrouter() {
  if (!_openrouter) {
    _openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
  }
  return _openrouter;
}

export function isConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

/**
 * The IMPLEMENTER role can run on Cursor Composer instead of Kimi when an
 * OpenAI-compatible Cursor endpoint is configured — Composer 2.5 is faster
 * for code/content work. Set CURSOR_BASE_URL (+ CURSOR_API_KEY, CURSOR_MODEL).
 *
 * NOTE: the endpoint must be reachable from wherever the call runs. The funnel
 * generation runs on the app server; the EDIT loop runs inside the Daytona
 * sandbox — a localhost proxy reaches neither, so this only works with a
 * cloud-reachable Cursor endpoint. Kimi (OpenRouter) is the automatic fallback
 * whenever Cursor isn't configured, so the funnel never breaks.
 */
function cursorImplementer(): { baseURL: string; apiKey: string; model: string } | null {
  const baseURL = process.env.CURSOR_BASE_URL;
  if (!baseURL) return null;
  return {
    baseURL: baseURL.replace(/\/+$/, ''),
    apiKey: process.env.CURSOR_API_KEY ?? '',
    model: process.env.CURSOR_MODEL ?? 'composer-2.5',
  };
}

const empty: TokenUsage = { inputTokens: 0, outputTokens: 0 };

/**
 * The single generate seam. Never throws — failures (timeout, empty, API
 * error) come back as `{ ok: false, error }` so the orchestrator can retry or
 * fail open. The implementer role routes to Cursor Composer when configured,
 * otherwise to Kimi over OpenRouter; brain/fast always use OpenRouter.
 */
export const generate: GenerateFn = async (input) => {
  const cursor = input.role === 'implementer' ? cursorImplementer() : null;
  return cursor ? callCursor(cursor, input) : callOpenRouter(input);
};

async function callOpenRouter(input: GenerateInput): Promise<GenerateOutput> {
  const model = ROLE_MODELS[input.role];
  const wallClockMs = input.wallClockMs ?? 120_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), wallClockMs);
  try {
    const res = await generateText({
      model: openrouter().chat(model, {
        extraBody: { provider: PROVIDER_ROUTING },
      }),
      system: input.system,
      prompt: input.prompt,
      temperature: input.temperature ?? 0.4,
      maxOutputTokens: input.maxOutputTokens ?? 8000,
      abortSignal: controller.signal,
    });
    const text = (res.text ?? '').trim();
    const usage = extractUsage(res);
    if (!text) return { ok: false, text: '', costUsd: 0, model, usage, error: 'empty' };
    return { ok: true, text, costUsd: extractCostUsd(res), model, usage };
  } catch (e) {
    const aborted = controller.signal.aborted;
    return {
      ok: false,
      text: '',
      costUsd: 0,
      model,
      usage: empty,
      error: aborted ? 'timeout' : e instanceof Error ? e.message : 'error',
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Cursor Composer via its OpenAI-compatible chat endpoint (raw fetch). */
async function callCursor(
  cfg: { baseURL: string; apiKey: string; model: string },
  input: GenerateInput
): Promise<GenerateOutput> {
  const wallClockMs = input.wallClockMs ?? 120_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), wallClockMs);
  try {
    const res = await fetch(`${cfg.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: 'system', content: input.system },
          { role: 'user', content: input.prompt },
        ],
        temperature: input.temperature ?? 0.4,
        max_tokens: input.maxOutputTokens ?? 8000,
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      return { ok: false, text: '', costUsd: 0, model: cfg.model, usage: empty, error: `http ${res.status}` };
    }
    const j = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
    };
    const text = (j.choices?.[0]?.message?.content ?? '').trim();
    const usage: TokenUsage = {
      inputTokens: j.usage?.prompt_tokens ?? 0,
      outputTokens: j.usage?.completion_tokens ?? 0,
    };
    if (!text) return { ok: false, text: '', costUsd: 0, model: cfg.model, usage, error: 'empty' };
    return { ok: true, text, costUsd: j.usage?.cost ?? 0, model: cfg.model, usage };
  } catch (e) {
    const aborted = controller.signal.aborted;
    return {
      ok: false,
      text: '',
      costUsd: 0,
      model: cfg.model,
      usage: empty,
      error: aborted ? 'timeout' : e instanceof Error ? e.message : 'error',
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Normalize AI SDK usage (v5 inputTokens/outputTokens; older prompt/completion). */
function extractUsage(res: unknown): TokenUsage {
  const u = (res as { usage?: Record<string, number | undefined> }).usage ?? {};
  return {
    inputTokens: u.inputTokens ?? u.promptTokens ?? 0,
    outputTokens: u.outputTokens ?? u.completionTokens ?? 0,
  };
}

/** Pull OpenRouter's reported USD cost out of the SDK result, if present. */
function extractCostUsd(res: unknown): number {
  try {
    const meta = (res as { providerMetadata?: Record<string, unknown> })
      .providerMetadata;
    const usage = (meta?.openrouter as { usage?: { cost?: number } } | undefined)
      ?.usage;
    return typeof usage?.cost === 'number' ? usage.cost : 0;
  } catch {
    return 0;
  }
}
