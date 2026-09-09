import 'server-only';

/**
 * Model calls for the intake graph: phrase an ask, extract fields from a turn.
 *
 * Both go through `callLlmObject` under the `intake_graph` budget. Callers must
 * fail open — scripted `promptText` and single-field apply are always enough
 * to keep the funnel moving.
 */
import { z } from 'zod';
import { callLlmObject } from '@/lib/ai/llm';
import type { DiscoveryData } from '@/app/(dynamic-pages)/(main-pages)/components/discovery/discovery.logic';
import type { IntakeQuestion } from '@/app/(dynamic-pages)/(main-pages)/components/discovery/intake-script';
import { knownSnapshot, openQuestionsForModel } from './script-bridge';
import type { IntakeGraphLocale } from './types';

const PhraseSchema = z.object({
  prompt: z.string().min(1).max(500),
});

const ExtractSchema = z.object({
  answers: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        value: z.string().min(1).max(2000),
      })
    )
    .max(8),
});

export type PhraseAskInput = {
  question: IntakeQuestion;
  scriptedPrompt: string;
  data: DiscoveryData;
  answered: readonly string[];
  essentialsOnly: boolean;
  locale: IntakeGraphLocale;
  t: (key: string) => string;
};

export async function phraseAsk(input: PhraseAskInput): Promise<string> {
  const open = openQuestionsForModel(
    input.data,
    input.answered,
    input.essentialsOnly,
    input.t
  );
  const { object } = await callLlmObject<{ prompt: string }>({
    action: 'intake_graph',
    workspaceId: null,
    schema: PhraseSchema,
    temperature: 0.4,
    system:
      "You are Flowstarter's intake agent. Rephrase ONE scripted question so it " +
      'sounds like a capable, warm colleague in a short chat. Keep the same ' +
      'meaning. Do not ask about anything else. Do not invent requirements. ' +
      'One or two short sentences. Match the locale.',
    prompt: JSON.stringify({
      locale: input.locale,
      pendingId: input.question.id,
      kind: input.question.kind,
      scriptedPrompt: input.scriptedPrompt,
      known: knownSnapshot(input.data),
      alsoOpenSoon: open.filter((q) => q.id !== input.question.id).slice(0, 3),
    }),
  });
  const prompt = object.prompt?.trim();
  return prompt || input.scriptedPrompt;
}

export type ExtractAnswersInput = {
  pendingId: string;
  userText: string;
  data: DiscoveryData;
  answered: readonly string[];
  essentialsOnly: boolean;
  locale: IntakeGraphLocale;
  t: (key: string) => string;
};

export async function extractAnswers(
  input: ExtractAnswersInput
): Promise<Array<{ id: string; value: string }>> {
  const open = openQuestionsForModel(
    input.data,
    input.answered,
    input.essentialsOnly,
    input.t
  );
  if (!input.userText.trim() || open.length === 0) return [];

  const { object } = await callLlmObject<{
    answers: Array<{ id: string; value: string }>;
  }>({
    action: 'intake_graph',
    workspaceId: null,
    schema: ExtractSchema,
    temperature: 0,
    system:
      'Extract intake fields the visitor already answered in this one message. ' +
      "Only use ids from the allowed list. Prefer the visitor's own words. " +
      'For choice fields, return the option value (not the label) when it matches. ' +
      'Omit fields that were not clearly answered. Never invent facts.',
    prompt: JSON.stringify({
      locale: input.locale,
      pendingId: input.pendingId,
      userText: input.userText,
      known: knownSnapshot(input.data),
      allowed: open,
    }),
  });

  return (object.answers ?? []).filter(
    (entry) =>
      typeof entry.id === 'string' &&
      typeof entry.value === 'string' &&
      entry.value.trim().length > 0
  );
}
