/**
 * The ReAct loop — ported from ask-sage's `agent_graph.py` control flow:
 *
 *     plan? -> (agent <-> tools)* -> answer
 *
 * One agent turn asks the model (with tools) what to do next. If it returns
 * tool calls, the tools node runs them, feeds observations back, and loops. If
 * it returns content, that's the answer. The loop is bounded by `maxIterations`;
 * when exhausted it forces a final answer (tool_choice: none) so a run always
 * terminates with either an answer or an explicit "couldn't finish".
 *
 * Events (`think` / `act` / `observe` / `answer`) are emitted for the SSE
 * RunPanel. The verdict-synthesis + trust-gate (the structured go/no-go card)
 * sits on top of this and lands in the next increment.
 */

import type { ChatMessage, ChatResult, LlmClient } from './llm';
import type { ToolRegistry } from './tools';

export type EmitFn = (event: string, data: Record<string, unknown>) => void;

export interface RunAction {
  tool: string;
  arguments: Record<string, unknown>;
  result: string;
}

export interface RunStep {
  iteration: number;
  actions: RunAction[];
  observations: string[];
}

export interface RunOptions {
  /** The user's business idea (the thing being evaluated). */
  idea: string;
  llm: LlmClient;
  tools: ToolRegistry;
  /** OpenRouter model slug; defaults to the brain model. */
  model?: string;
  /** Overrides the default research system prompt. */
  systemPrompt?: string;
  /** Max agent turns before a final answer is forced. Default 6. */
  maxIterations?: number;
  emit?: EmitFn;
  temperature?: number;
  /** Clock, injectable for tests. Defaults to the real now. */
  now?: () => Date;
}

export interface RunResult {
  finalMessage: string | null;
  steps: RunStep[];
  iterations: number;
}

const DEFAULT_SYSTEM = `You are a rigorous business-idea analyst. Research the user's idea using the provided tools before judging it. Ground every market figure, competitor, and claim in a tool result — never assert a number you did not retrieve. If the evidence is thin, say so plainly rather than guessing. Conclude with a clear, honest assessment: is this a good idea, what is the product-market fit, who are the competitors, and what are the biggest risks.`;

export async function runIdeaValidation(opts: RunOptions): Promise<RunResult> {
  const { idea, llm, tools } = opts;
  const emit: EmitFn = opts.emit ?? (() => {});
  const model = opts.model ?? 'anthropic/claude-sonnet-4.6';
  const maxIterations = opts.maxIterations ?? 6;
  const temperature = opts.temperature ?? 0.3;
  const catalog = tools.catalog();

  // Date awareness: the model has no inherent sense of "now", so without this it
  // searches with a stale year from training data. Inject today's date and
  // instruct it to query the current year — and a get_current_date tool exists
  // for when it wants to compute one explicitly.
  const now = (opts.now ?? (() => new Date()))();
  const iso = now.toISOString().slice(0, 10);
  const year = now.getUTCFullYear();
  const dateLine = `Today's date is ${iso} (current year ${year}). For any time-sensitive query — market size, growth, trends, competitors, funding, demand — search using the CURRENT year ("${year}") or "latest"; never default to an older year like 2023 or 2024.`;
  const system = `${dateLine}\n\n${opts.systemPrompt ?? DEFAULT_SYSTEM}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: `Evaluate this business idea:\n\n${idea}` },
  ];
  const steps: RunStep[] = [];
  let finalMessage: string | null = null;
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration += 1;
    emit('think', { iteration });

    const res = await llm.chat({
      model,
      messages,
      tools: catalog,
      toolChoice: 'auto',
      temperature,
    });

    if (!res.ok) {
      steps.push({ iteration, actions: [], observations: [`LLM error: ${res.error ?? 'unknown'}`] });
      emit('error', { iteration, message: res.error ?? 'unknown' });
      break;
    }

    if (res.toolCalls.length > 0) {
      messages.push({ role: 'assistant', content: res.content, toolCalls: res.toolCalls });
      const step: RunStep = { iteration, actions: [], observations: [] };
      for (const call of res.toolCalls) {
        emit('act', { iteration, tool: call.name, arguments: call.arguments });
        const result = await tools.call(call.name, call.arguments);
        emit('observe', { iteration, tool: call.name, result });
        step.actions.push({ tool: call.name, arguments: call.arguments, result });
        step.observations.push(result);
        messages.push({ role: 'tool', content: result, toolCallId: call.id });
      }
      steps.push(step);
      continue;
    }

    if (res.content) {
      finalMessage = res.content;
      steps.push({ iteration, actions: [], observations: [] });
      break;
    }

    steps.push({ iteration, actions: [], observations: ['Model returned no tool calls and no content.'] });
  }

  // Force a final answer from the gathered evidence if the loop never produced one.
  if (finalMessage === null) {
    const res = await llm.chat({ model, messages, toolChoice: 'none', temperature });
    if (res.ok && res.content) finalMessage = res.content;
  }

  if (finalMessage !== null) emit('answer', { text: finalMessage });
  return { finalMessage, steps, iterations: iteration };
}
