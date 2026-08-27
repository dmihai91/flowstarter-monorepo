/**
 * The single LLM seam — hybrid routing decision: every plain model call in this
 * pipeline goes through OpenRouter (planning, extraction, the verdict judges).
 * Implemented with raw `fetch` against OpenRouter's OpenAI-compatible
 * `/chat/completions` endpoint (mirrors the raw-fetch pattern already used for
 * the Cursor path in agentic-codegen) so the package has zero runtime deps and
 * the whole loop is testable with an injected fake — no network.
 *
 * The app-tier coding agent (Claude Agent SDK) is the documented exception to
 * "all calls through OpenRouter"; it does not apply to this idea-evaluation
 * phase, which is pure research + judgement.
 */

import type { OpenAiToolDef } from './tools';

export type Role = 'brain' | 'extract' | 'judge';

/**
 * OpenRouter model slugs per role, each overridable via env so model choice is
 * config, not a code edit (A/B the planner/judge, swap the extraction model
 * without a deploy). Defaults verified on OpenRouter 2026-06.
 *
 * - brain   = reasoning: drives the ReAct loop + verdict synthesis (Sonnet 4.6).
 * - extract = mini, high-volume: page text -> typed records, classification.
 *             DeepSeek V4 Flash (~$0.10/$0.20 per 1M) — ~10x cheaper than Haiku;
 *             a bad extracted row is backstopped by the corroboration core.
 *             Alt: openai/gpt-5.4-mini (more capable, ~$0.75/$4.50 per 1M).
 * - judge   = reasoning at the verdict gate (paired with JUDGE_ALT_MODEL).
 */
export const ROLE_MODELS: Record<Role, string> = {
  brain: process.env.IDEA_VALIDATION_MODEL_BRAIN ?? 'anthropic/claude-sonnet-4.6',
  extract: process.env.IDEA_VALIDATION_MODEL_EXTRACT ?? 'deepseek/deepseek-v4-flash',
  judge: process.env.IDEA_VALIDATION_MODEL_JUDGE ?? 'anthropic/claude-sonnet-4.6',
};

/** Cross-family second-opinion judge at the verdict gate (different family from
 * `brain` so the verdict's errors decorrelate). Defaults to a GPT mini slug. */
export const JUDGE_ALT_MODEL =
  process.env.IDEA_VALIDATION_MODEL_JUDGE_ALT ?? 'openai/gpt-5.4-mini';

const PROVIDER_ROUTING = { sort: 'throughput' as const };
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  /** Set on a `tool` message: which assistant tool_call it answers. */
  toolCallId?: string;
  /** Set on an `assistant` message that requested tools. */
  toolCalls?: ToolCall[];
}

export type ToolChoice = 'auto' | 'none' | { name: string };

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  tools?: OpenAiToolDef[];
  toolChoice?: ToolChoice;
  temperature?: number;
  maxTokens?: number;
  /** Hard wall-clock; the request is aborted past this. Default 120s. */
  wallClockMs?: number;
}

export interface ChatResult {
  ok: boolean;
  content: string;
  toolCalls: ToolCall[];
  costUsd: number;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
  /** Populated on failure: 'timeout' | 'empty' | 'error' | `http NNN`. */
  error?: string;
}

/** The injectable contract. Tests pass a fake; default calls OpenRouter. */
export interface LlmClient {
  chat(req: ChatRequest): Promise<ChatResult>;
}

export function isConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

const emptyUsage = { inputTokens: 0, outputTokens: 0 };

interface ApiToolCall {
  id?: string;
  function?: { name?: string; arguments?: string };
}
interface ApiResponse {
  choices?: Array<{ message?: { content?: string | null; tool_calls?: ApiToolCall[] } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number };
}

/** Default client: OpenRouter over raw fetch. Never throws. */
export class OpenRouterClient implements LlmClient {
  constructor(private apiKey: string | undefined = process.env.OPENROUTER_API_KEY) {}

  async chat(req: ChatRequest): Promise<ChatResult> {
    const wallClockMs = req.wallClockMs ?? 120_000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), wallClockMs);
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: req.model,
          messages: toApiMessages(req.messages),
          ...(req.tools && req.tools.length > 0 ? { tools: req.tools } : {}),
          ...(req.toolChoice ? { tool_choice: toApiToolChoice(req.toolChoice) } : {}),
          temperature: req.temperature ?? 0.3,
          max_tokens: req.maxTokens ?? 4000,
          provider: PROVIDER_ROUTING,
          usage: { include: true },
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        return fail(req.model, `http ${res.status}`);
      }
      const j = (await res.json()) as ApiResponse;
      const msg = j.choices?.[0]?.message;
      const toolCalls = (msg?.tool_calls ?? []).map(
        (tc): ToolCall => ({
          id: tc.id ?? '',
          name: tc.function?.name ?? '',
          arguments: safeParse(tc.function?.arguments),
        }),
      );
      const content = (msg?.content ?? '').trim();
      const usage = {
        inputTokens: j.usage?.prompt_tokens ?? 0,
        outputTokens: j.usage?.completion_tokens ?? 0,
      };
      if (!content && toolCalls.length === 0) {
        return { ok: false, content: '', toolCalls: [], costUsd: 0, model: req.model, usage, error: 'empty' };
      }
      return { ok: true, content, toolCalls, costUsd: j.usage?.cost ?? 0, model: req.model, usage };
    } catch (e) {
      const aborted = controller.signal.aborted;
      return fail(req.model, aborted ? 'timeout' : e instanceof Error ? e.message : 'error');
    } finally {
      clearTimeout(timer);
    }
  }
}

function fail(model: string, error: string): ChatResult {
  return { ok: false, content: '', toolCalls: [], costUsd: 0, model, usage: emptyUsage, error };
}

function toApiMessages(messages: readonly ChatMessage[]): unknown[] {
  return messages.map((m) => {
    if (m.role === 'assistant' && m.toolCalls && m.toolCalls.length > 0) {
      return {
        role: 'assistant',
        content: m.content || null,
        tool_calls: m.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
        })),
      };
    }
    if (m.role === 'tool') {
      return { role: 'tool', tool_call_id: m.toolCallId ?? '', content: m.content };
    }
    return { role: m.role, content: m.content };
  });
}

function toApiToolChoice(choice: ToolChoice): unknown {
  if (choice === 'auto' || choice === 'none') return choice;
  return { type: 'function', function: { name: choice.name } };
}

function safeParse(raw: string | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
