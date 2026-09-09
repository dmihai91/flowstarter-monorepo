/**
 * LangGraph intake: interrupt → resume, multi-extract, finish gate.
 * LLM deps are stubbed — this pins the graph, not the model.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_DISCOVERY } from '@/app/(dynamic-pages)/(main-pages)/components/discovery/discovery.logic';
import {
  resetIntakeGraphDeps,
  resumeIntakeGraph,
  setIntakeGraphDeps,
  startIntakeGraph,
} from '../graph';

describe('intake graph', () => {
  beforeEach(() => {
    setIntakeGraphDeps({
      phraseAsk: async ({ scriptedPrompt, question }) =>
        `Graph: ${question.id} — ${scriptedPrompt}`,
      extractAnswers: async () => [],
      translate: () => (key) => key,
    });
  });

  afterEach(() => {
    resetIntakeGraphDeps();
  });

  it('starts interrupted on the first scripted question', async () => {
    const turn = await startIntakeGraph({ locale: 'en' });
    expect(turn.status).toBe('ask');
    expect(turn.ask?.questionId).toBe('fullName');
    expect(turn.ask?.prompt).toContain('Graph: fullName');
    expect(turn.answered).toEqual([]);
  });

  it('resumes, applies the answer, and asks the next question', async () => {
    const start = await startIntakeGraph({ locale: 'en' });
    const next = await resumeIntakeGraph({
      threadId: start.threadId,
      resume: { kind: 'text', text: 'Maria Ionescu' },
      data: start.data,
      answered: start.answered,
    });
    expect(next.errorKey).toBeNull();
    expect(next.data.fullName).toBe('Maria Ionescu');
    expect(next.answered).toContain('fullName');
    expect(next.status).toBe('ask');
    expect(next.ask?.questionId).toBe('email');
  });

  it('rejects a bad email and re-asks without advancing', async () => {
    const start = await startIntakeGraph({
      data: { ...EMPTY_DISCOVERY, fullName: 'Maria' },
      answered: ['fullName'],
    });
    expect(start.ask?.questionId).toBe('email');

    const bad = await resumeIntakeGraph({
      threadId: start.threadId,
      resume: { kind: 'text', text: 'nope' },
      data: start.data,
      answered: start.answered,
    });
    expect(bad.reason).toBe('validation');
    expect(bad.errorKey).toBe('landing.discovery.chat.errors.email');
    expect(bad.ask?.questionId).toBe('email');
    expect(bad.answered).toEqual(['fullName']);

    const good = await resumeIntakeGraph({
      threadId: start.threadId,
      resume: { kind: 'text', text: 'maria@example.com' },
      data: bad.data,
      answered: bad.answered,
    });
    expect(good.errorKey).toBeNull();
    expect(good.data.email).toBe('maria@example.com');
    expect(good.answered).toContain('email');
  });

  it('applies multi-field extract from one utterance', async () => {
    setIntakeGraphDeps({
      phraseAsk: async ({ scriptedPrompt }) => scriptedPrompt,
      extractAnswers: async () => [
        { id: 'fullName', value: 'Maria Ionescu' },
        { id: 'email', value: 'maria@example.com' },
        { id: 'businessName', value: 'Ionescu Dental' },
      ],
      translate: () => (key) => key,
    });

    const start = await startIntakeGraph({ locale: 'en' });
    const next = await resumeIntakeGraph({
      threadId: start.threadId,
      resume: {
        kind: 'text',
        text: 'I am Maria Ionescu, maria@example.com, Ionescu Dental',
      },
    });
    expect(next.data.fullName).toBe('Maria Ionescu');
    expect(next.data.email).toBe('maria@example.com');
    expect(next.data.businessName).toBe('Ionescu Dental');
    expect(next.answered).toEqual(
      expect.arrayContaining(['fullName', 'email', 'businessName'])
    );
    expect(next.ask?.questionId).not.toBe('fullName');
    expect(next.ask?.questionId).not.toBe('email');
    expect(next.ask?.questionId).not.toBe('businessName');
  });

  it('reports complete when the script is already spent', async () => {
    // Essentials-only with everything required already answered.
    const turn = await startIntakeGraph({
      essentialsOnly: true,
      data: {
        ...EMPTY_DISCOVERY,
        fullName: 'Maria',
        email: 'maria@example.com',
        businessName: 'Clinic',
        description: 'A dental clinic in Cluj with evening appointments.',
        industry: 'Therapy & wellness',
        goal: 'Take bookings or appointments',
        commerceMode: 'none',
      },
      answered: [
        'fullName',
        'email',
        'businessName',
        'description',
        'industry',
        'goal',
        'commerceMode',
      ],
    });
    expect(turn.status).toBe('complete');
    expect(turn.ask).toBeNull();
  });
});
