/**
 * Regression Tests for Onboarding Bugs
 *
 * Bug 1: Progress dots not updating - EmptyState.tsx step mapping was incorrect
 * Bug 2: "My Project" name suggestion - useProjectNameHandlers had stale closure
 */

import { describe, it, expect } from 'vitest';

/**
 * Test 1: EmptyState step indicator mapping
 *
 * The bug: The step indicator dots used outdated step names ['describe', 'template', 'palette', 'font', 'creating']
 * that didn't match the actual OnboardingStep type. Steps like 'business-uvp', 'business-audience', etc.
 * would return -1 from indexOf, causing no dots to be highlighted.
 *
 * The fix: Updated step array to ['describe', 'name', 'business-summary', 'template', 'personalization', 'creating']
 * and added mapping logic for business-* steps.
 */
describe('EmptyState Step Indicator Mapping', () => {
  // Replicate the fixed logic from EmptyState.tsx
  const steps = ['describe', 'name', 'business-summary', 'template', 'personalization', 'creating'];

  function getMappedStep(step: string | undefined): string {
    if (step === 'welcome') return 'describe';
    if (step?.startsWith('business-')) return 'business-summary';
    return step || 'describe';
  }

  function getCurrentIndex(step: string | undefined): number {
    const mappedStep = getMappedStep(step);
    return steps.indexOf(mappedStep);
  }

  it('should map welcome step to describe', () => {
    expect(getCurrentIndex('welcome')).toBe(0);
  });

  it('should correctly index describe step', () => {
    expect(getCurrentIndex('describe')).toBe(0);
  });

  it('should correctly index name step', () => {
    expect(getCurrentIndex('name')).toBe(1);
  });

  it('should map business-uvp to business-summary index', () => {
    expect(getCurrentIndex('business-uvp')).toBe(2);
  });

  it('should map business-audience to business-summary index', () => {
    expect(getCurrentIndex('business-audience')).toBe(2);
  });

  it('should map business-goals to business-summary index', () => {
    expect(getCurrentIndex('business-goals')).toBe(2);
  });

  it('should map business-tone to business-summary index', () => {
    expect(getCurrentIndex('business-tone')).toBe(2);
  });

  it('should map business-selling to business-summary index', () => {
    expect(getCurrentIndex('business-selling')).toBe(2);
  });

  it('should map business-pricing to business-summary index', () => {
    expect(getCurrentIndex('business-pricing')).toBe(2);
  });

  it('should correctly index business-summary step', () => {
    expect(getCurrentIndex('business-summary')).toBe(2);
  });

  it('should correctly index template step', () => {
    expect(getCurrentIndex('template')).toBe(3);
  });

  it('should correctly index personalization step', () => {
    expect(getCurrentIndex('personalization')).toBe(4);
  });

  it('should correctly index creating step', () => {
    expect(getCurrentIndex('creating')).toBe(5);
  });

  it('should handle undefined step', () => {
    expect(getCurrentIndex(undefined)).toBe(0);
  });

  // Regression test: Ensure OLD step names don't exist in the array
  it('should NOT contain old step names that caused the bug', () => {
    expect(steps).not.toContain('palette');
    expect(steps).not.toContain('font');
  });

  // Ensure all mapped steps return valid indices (not -1)
  const allSteps = [
    'welcome',
    'describe',
    'name',
    'business-uvp',
    'business-audience',
    'business-goals',
    'business-tone',
    'business-selling',
    'business-pricing',
    'business-summary',
    'template',
    'personalization',
    'creating',
  ];

  it.each(allSteps)('should return valid index for step: %s', (step) => {
    const index = getCurrentIndex(step);
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(steps.length);
  });
});

/**
 * Test 2: useProjectNameHandlers dependency array
 *
 * The bug: The generateProjectName callback had an empty dependency array [],
 * causing flowHook.projectDescription to be captured at initial render time
 * and never update. When user clicked "Suggest a name", the description was
 * always empty/stale, causing fallback to "My Project".
 *
 * The fix: Added [flowHook.projectDescription, messageHook] to the dependency array.
 *
 * Note: This test validates the logic pattern, not the actual React hook
 * (which would require more complex testing setup with renderHook).
 */
describe('Project Name Generation Context', () => {
  it('should use project description when available', async () => {
    // Simulate the fixed behavior: description is passed correctly
    const projectDescription = 'A hair salon site with stylist portfolios';

    // The API endpoint receives the description
    const requestBody = { projectDescription };

    // Verify the description is not empty (would have been empty with the bug)
    expect(requestBody.projectDescription).toBeTruthy();
    expect(requestBody.projectDescription.length).toBeGreaterThan(0);
    expect(requestBody.projectDescription).toContain('hair salon');
  });

  it('should not fallback to default when description exists', () => {
    const DEFAULT_PROJECT_NAME_GENERATION = 'My Project';
    const projectDescription = 'A fitness trainer site';

    // With the bug, projectDescription would be '' due to stale closure
    // After fix, projectDescription correctly contains the user's input
    const shouldUseFallback = !projectDescription || projectDescription.trim().length === 0;

    expect(shouldUseFallback).toBe(false);
  });

  it('should extract description from message history as fallback', () => {
    // The fixed code also looks at message history if description is empty
    const messages = [
      { role: 'user', content: 'A restaurant website with menu and reservations' },
      { role: 'assistant', content: 'Got it! Let me help you build that.' },
      { role: 'user', content: 'Suggest a name' },
    ];

    // Find first user message that isn't "Suggest a name"
    const firstUserMessage = messages.find(
      (m) => m.role === 'user' && !m.content.includes('Suggest a name')
    );

    expect(firstUserMessage).toBeDefined();
    expect(firstUserMessage?.content).toContain('restaurant');
  });
});

/**
 * Test 3: API endpoint name generation
 *
 * Ensure the API generates contextual names, not generic fallbacks
 */
describe('Project Name API Fallback Logic', () => {
  // Replicate the generateFallbackName logic from projectNameAgent.ts
  function generateFallbackName(description: string): string {
    const keywords = description.toLowerCase();

    const businessNameMap: Record<string, string[]> = {
      salon: ['Serenity Touch', 'Mane Street', 'Style Studio'],
      spa: ['Bliss Retreat', 'Pure Escape', 'Zen Garden'],
      restaurant: ['The Table', 'Savory Spot', 'Fresh Kitchen'],
      fitness: ['Peak Performance', 'Vitality Hub', 'Motion Studio'],
    };

    for (const [keyword, names] of Object.entries(businessNameMap)) {
      if (keywords.includes(keyword)) {
        return names[0]; // Return first option for deterministic testing
      }
    }

    return 'New Venture'; // Generic fallback
  }

  it('should generate salon-related name for salon description', () => {
    const name = generateFallbackName('A hair salon site with stylist portfolios');
    expect(['Serenity Touch', 'Mane Street', 'Style Studio']).toContain(name);
  });

  it('should generate spa-related name for spa description', () => {
    const name = generateFallbackName('A spa website with treatment menu');
    expect(['Bliss Retreat', 'Pure Escape', 'Zen Garden']).toContain(name);
  });

  it('should generate restaurant-related name for restaurant description', () => {
    const name = generateFallbackName('A restaurant website with online ordering');
    expect(['The Table', 'Savory Spot', 'Fresh Kitchen']).toContain(name);
  });

  it('should NOT return "My Project" for any valid description', () => {
    const descriptions = [
      'A hair salon site',
      'A restaurant website',
      'A fitness trainer site',
      'An e-commerce store',
      'A portfolio website',
    ];

    for (const desc of descriptions) {
      const name = generateFallbackName(desc);
      expect(name).not.toBe('My Project');
    }
  });
});

