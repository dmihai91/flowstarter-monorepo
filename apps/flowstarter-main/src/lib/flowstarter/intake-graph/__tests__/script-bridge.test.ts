/**
 * Deterministic half of the intake graph: apply / extract folding.
 * No LangGraph, no model — the script still decides what sticks.
 */
import { describe, expect, it } from 'vitest';
import { EMPTY_DISCOVERY } from '@/app/(dynamic-pages)/(main-pages)/components/discovery/discovery.logic';
import {
  applyResumeTurn,
  openQuestionsForModel,
  sanitizeAnswered,
} from '../script-bridge';

describe('applyResumeTurn', () => {
  it('applies a primary text answer and marks the question answered', () => {
    const result = applyResumeTurn({
      data: EMPTY_DISCOVERY,
      answered: [],
      pendingId: 'fullName',
      resume: { kind: 'text', text: 'Maria Ionescu' },
    });
    expect(result.errorKey).toBeNull();
    expect(result.data.fullName).toBe('Maria Ionescu');
    expect(result.answered).toEqual(['fullName']);
  });

  it('rejects an invalid email on the primary question', () => {
    const result = applyResumeTurn({
      data: { ...EMPTY_DISCOVERY, fullName: 'Maria' },
      answered: ['fullName'],
      pendingId: 'email',
      resume: { kind: 'text', text: 'not-an-email' },
    });
    expect(result.errorKey).toBe('landing.discovery.chat.errors.email');
    expect(result.answered).toEqual(['fullName']);
  });

  it('folds bonus extractions fields when they validate', () => {
    const result = applyResumeTurn({
      data: EMPTY_DISCOVERY,
      answered: [],
      pendingId: 'fullName',
      resume: {
        kind: 'text',
        text: 'Maria Ionescu, maria@example.com',
      },
      extracted: [
        { id: 'fullName', value: 'Maria Ionescu' },
        { id: 'email', value: 'maria@example.com' },
        { id: 'businessName', value: 'Ionescu Dental' },
      ],
    });
    expect(result.errorKey).toBeNull();
    expect(result.data.fullName).toBe('Maria Ionescu');
    expect(result.data.email).toBe('maria@example.com');
    expect(result.data.businessName).toBe('Ionescu Dental');
    expect(result.answered).toEqual(['fullName', 'email', 'businessName']);
  });

  it('allows skipping an optional question', () => {
    const result = applyResumeTurn({
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
      pendingId: 'targetAudience',
      resume: { kind: 'skip' },
    });
    expect(result.errorKey).toBeNull();
    expect(result.answered).toContain('targetAudience');
  });
});

describe('sanitizeAnswered', () => {
  it('drops unknown ids and de-dupes', () => {
    expect(sanitizeAnswered(['fullName', 'nope', 'fullName', 'email'])).toEqual(
      ['fullName', 'email']
    );
  });
});

describe('openQuestionsForModel', () => {
  it('lists the next few non-panel questions', () => {
    const t = (key: string) => key;
    const open = openQuestionsForModel(EMPTY_DISCOVERY, [], false, t);
    expect(open[0]?.id).toBe('fullName');
    expect(open.some((q) => q.id === 'selectedTier')).toBe(false);
  });
});
