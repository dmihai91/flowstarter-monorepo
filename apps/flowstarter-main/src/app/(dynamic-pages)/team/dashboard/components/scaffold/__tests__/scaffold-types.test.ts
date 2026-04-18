import { describe, it, expect } from 'vitest';
import {
  briefFromEngine,
  toBrandProfile,
  EMPTY_CLIENT,
  EMPTY_BRIEF,
} from '../scaffold-types';
import type { ProjectBrief } from '@/lib/engine/contracts';

function makeProjectBrief(overrides: Partial<ProjectBrief> = {}): ProjectBrief {
  return {
    version: '1.0',
    source: 'project-brief',
    generatedAt: '2026-01-01T00:00:00Z',
    siteName: 'Test Site',
    summary: 'A test summary',
    industry: 'Technology',
    archetype: 'saas',
    targetAudience: 'Developers',
    usp: 'Best tooling',
    goal: 'leads',
    offerType: 'premium',
    brandTone: 'professional',
    offerings: ['Consulting', 'Development'],
    contact: {
      email: 'test@example.com',
      phone: '555-0100',
      address: '123 Main St',
      clientName: 'Test Client',
    },
    sourceInput: {
      userDescription: 'A test project',
      normalizedDescription: 'a test project',
    },
    ...overrides,
  };
}

describe('briefFromEngine', () => {
  it('maps engine artifacts to ProjectBriefDraft correctly', () => {
    const brief = makeProjectBrief();
    const draft = briefFromEngine(brief);

    expect(draft.projectName).toBe('Test Site');
    expect(draft.industry).toBe('Technology');
    expect(draft.summary).toBe('A test summary');
    expect(draft.targetAudience).toBe('Developers');
    expect(draft.valueProposition).toBe('Best tooling');
    expect(draft.offerings).toEqual(['Consulting', 'Development']);
    expect(draft.goals).toEqual(['leads']);
    expect(draft.offerType).toBe('premium');
    expect(draft.brandTone).toBe('professional');
    expect(draft.contactEmail).toBe('test@example.com');
    expect(draft.contactPhone).toBe('555-0100');
    expect(draft.contactAddress).toBe('123 Main St');
  });

  it('defaults to multi-page and empty integrations', () => {
    const draft = briefFromEngine(makeProjectBrief());
    expect(draft.pagePreference).toBe('multi-page');
    expect(draft.integrations).toEqual([]);
  });

  it('defaults extended brand fields to empty values', () => {
    const draft = briefFromEngine(makeProjectBrief());
    expect(draft.valuePropositionDetail).toBe('');
    expect(draft.primaryGoal).toBe('');
    expect(draft.desiredCustomerAction).toBe('');
    expect(draft.differentiators).toEqual([]);
    expect(draft.trustSignals).toEqual([]);
    expect(draft.contentStylePreference).toBe('');
    expect(draft.brandSecondaryTones).toEqual([]);
    expect(draft.brandNotes).toBe('');
  });

  it('handles missing optional contact fields', () => {
    const brief = makeProjectBrief({
      contact: { clientName: 'X' },
    });
    const draft = briefFromEngine(brief);
    expect(draft.contactEmail).toBe('');
    expect(draft.contactPhone).toBe('');
    expect(draft.contactAddress).toBe('');
  });

  it('handles missing goal by returning empty goals array', () => {
    const brief = makeProjectBrief({
      goal: undefined as unknown as ProjectBrief['goal'],
    });
    const draft = briefFromEngine(brief);
    expect(draft.goals).toEqual([]);
  });

  it('defaults offerType to accessible when missing', () => {
    const brief = makeProjectBrief({
      offerType: undefined as unknown as ProjectBrief['offerType'],
    });
    const draft = briefFromEngine(brief);
    expect(draft.offerType).toBe('accessible');
  });

  it('defaults brandTone to professional when missing', () => {
    const brief = makeProjectBrief({
      brandTone: undefined as unknown as ProjectBrief['brandTone'],
    });
    const draft = briefFromEngine(brief);
    expect(draft.brandTone).toBe('professional');
  });
});

describe('toBrandProfile', () => {
  it('builds BrandProfile from a populated draft', () => {
    const draft = {
      ...EMPTY_BRIEF,
      brandTone: 'warm' as const,
      brandSecondaryTones: ['playful' as const, 'bold' as const],
      brandNotes: 'Keep it fun',
      valuePropositionDetail: 'We deliver fast',
      valueProposition: 'Fallback VP',
      primaryGoal: 'leads',
      goals: ['sales' as const],
      desiredCustomerAction: 'Book a call',
      differentiators: ['Speed', 'Quality'],
      trustSignals: ['ISO certified'],
      contentStylePreference: 'concise',
    };

    const profile = toBrandProfile(draft);

    expect(profile.brandTone.primary).toBe('warm');
    expect(profile.brandTone.secondary).toEqual(['playful', 'bold']);
    expect(profile.brandTone.notes).toBe('Keep it fun');
    expect(profile.valueProposition).toBe('We deliver fast');
    expect(profile.primaryGoal).toBe('leads');
    expect(profile.desiredCustomerAction).toBe('Book a call');
    expect(profile.differentiators).toEqual(['Speed', 'Quality']);
    expect(profile.trustSignals).toEqual(['ISO certified']);
    expect(profile.contentStylePreference).toBe('concise');
    expect(profile.operatorNotes).toBe('Keep it fun');
  });

  it('falls back to valueProposition when valuePropositionDetail is empty', () => {
    const draft = {
      ...EMPTY_BRIEF,
      valuePropositionDetail: '',
      valueProposition: 'Fallback VP',
    };
    const profile = toBrandProfile(draft);
    expect(profile.valueProposition).toBe('Fallback VP');
  });

  it('falls back to goals[0] when primaryGoal is empty', () => {
    const draft = {
      ...EMPTY_BRIEF,
      primaryGoal: '',
      goals: ['bookings' as const],
    };
    const profile = toBrandProfile(draft);
    expect(profile.primaryGoal).toBe('bookings');
  });

  it('returns undefined for empty optional fields', () => {
    const profile = toBrandProfile(EMPTY_BRIEF);

    expect(profile.brandTone.secondary).toBeUndefined();
    expect(profile.brandTone.notes).toBeUndefined();
    expect(profile.valueProposition).toBeUndefined();
    expect(profile.primaryGoal).toBeUndefined();
    expect(profile.desiredCustomerAction).toBeUndefined();
    expect(profile.differentiators).toBeUndefined();
    expect(profile.trustSignals).toBeUndefined();
    expect(profile.contentStylePreference).toBeUndefined();
    expect(profile.operatorNotes).toBeUndefined();
  });
});

describe('EMPTY_CLIENT', () => {
  it('has correct default structure', () => {
    expect(EMPTY_CLIENT).toEqual({
      name: '',
      email: '',
      phone: '',
    });
  });
});

describe('EMPTY_BRIEF', () => {
  it('has all string fields as empty strings', () => {
    const stringFields = [
      'projectName',
      'industry',
      'summary',
      'targetAudience',
      'valueProposition',
      'contactEmail',
      'contactPhone',
      'contactAddress',
      'valuePropositionDetail',
      'primaryGoal',
      'desiredCustomerAction',
      'contentStylePreference',
      'brandNotes',
    ] as const;

    for (const field of stringFields) {
      expect(EMPTY_BRIEF[field]).toBe('');
    }
  });

  it('has all array fields as empty arrays', () => {
    const arrayFields = [
      'offerings',
      'goals',
      'integrations',
      'differentiators',
      'trustSignals',
      'brandSecondaryTones',
    ] as const;

    for (const field of arrayFields) {
      expect(EMPTY_BRIEF[field]).toEqual([]);
    }
  });

  it('has correct enum defaults', () => {
    expect(EMPTY_BRIEF.offerType).toBe('accessible');
    expect(EMPTY_BRIEF.brandTone).toBe('professional');
    expect(EMPTY_BRIEF.pagePreference).toBe('multi-page');
  });
});
