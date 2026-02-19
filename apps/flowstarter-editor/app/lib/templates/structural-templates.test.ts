/**
 * Structural Templates Tests
 * 
 * Tests for template archetype definitions, recommendation scoring,
 * and profile-to-template mapping.
 */

import { describe, it, expect } from 'vitest';
import {
  TEMPLATE_ARCHETYPES,
  LEGACY_TEMPLATE_MAPPING,
  recommendArchetypes,
  getBestArchetype,
  getArchetypesForCategory,
  getTemplateSlugsForProfile,
  type TemplateArchetype,
} from './structural-templates';
import type { QuickProfile } from '~/components/editor/editor-chat/types';

// ═══════════════════════════════════════════════════════════════════════════
// ARCHETYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

describe('TEMPLATE_ARCHETYPES', () => {
  it('has exactly 6 archetypes', () => {
    expect(Object.keys(TEMPLATE_ARCHETYPES)).toHaveLength(6);
  });

  it('includes all expected archetypes', () => {
    const expected: TemplateArchetype[] = [
      'authority-builder',
      'service-provider',
      'portfolio-showcase',
      'course-creator',
      'local-expert',
      'event-host',
    ];
    
    expected.forEach(archetype => {
      expect(TEMPLATE_ARCHETYPES[archetype]).toBeDefined();
    });
  });

  describe('archetype properties', () => {
    it('each archetype has required properties', () => {
      Object.values(TEMPLATE_ARCHETYPES).forEach(archetype => {
        expect(archetype.id).toBeDefined();
        expect(archetype.name).toBeDefined();
        expect(archetype.tagline).toBeDefined();
        expect(archetype.description).toBeDefined();
        expect(archetype.structure).toBeInstanceOf(Array);
        expect(archetype.bestFor).toBeInstanceOf(Array);
        expect(archetype.goalAlignment).toBeInstanceOf(Array);
        expect(archetype.offerAlignment).toBeInstanceOf(Array);
        expect(archetype.toneAlignment).toBeInstanceOf(Array);
        expect(archetype.icon).toBeDefined();
      });
    });

    it('authority-builder targets leads and bookings with high-ticket', () => {
      const archetype = TEMPLATE_ARCHETYPES['authority-builder'];
      expect(archetype.goalAlignment).toContain('leads');
      expect(archetype.goalAlignment).toContain('bookings');
      expect(archetype.offerAlignment).toContain('high-ticket');
    });

    it('service-provider targets bookings', () => {
      const archetype = TEMPLATE_ARCHETYPES['service-provider'];
      expect(archetype.goalAlignment).toContain('bookings');
    });

    it('course-creator targets sales', () => {
      const archetype = TEMPLATE_ARCHETYPES['course-creator'];
      expect(archetype.goalAlignment).toContain('sales');
    });

    it('local-expert targets bookings with low-ticket', () => {
      const archetype = TEMPLATE_ARCHETYPES['local-expert'];
      expect(archetype.goalAlignment).toContain('bookings');
      expect(archetype.offerAlignment).toContain('low-ticket');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY MAPPING
// ═══════════════════════════════════════════════════════════════════════════

describe('LEGACY_TEMPLATE_MAPPING', () => {
  it('maps all 12 legacy templates', () => {
    expect(Object.keys(LEGACY_TEMPLATE_MAPPING)).toHaveLength(12);
  });

  it('maps coach-pro to authority-builder', () => {
    expect(LEGACY_TEMPLATE_MAPPING['coach-pro']).toBe('authority-builder');
  });

  it('maps therapist-care to service-provider', () => {
    expect(LEGACY_TEMPLATE_MAPPING['therapist-care']).toBe('service-provider');
  });

  it('maps creative-portfolio to portfolio-showcase', () => {
    expect(LEGACY_TEMPLATE_MAPPING['creative-portfolio']).toBe('portfolio-showcase');
  });

  it('maps edu-course-creator to course-creator', () => {
    expect(LEGACY_TEMPLATE_MAPPING['edu-course-creator']).toBe('course-creator');
  });

  it('maps fitness-coach to local-expert', () => {
    expect(LEGACY_TEMPLATE_MAPPING['fitness-coach']).toBe('local-expert');
  });

  it('maps workshop-host to event-host', () => {
    expect(LEGACY_TEMPLATE_MAPPING['workshop-host']).toBe('event-host');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RECOMMENDATION SCORING
// ═══════════════════════════════════════════════════════════════════════════

describe('recommendArchetypes', () => {
  it('returns 3 recommendations', () => {
    const profile: QuickProfile = {
      goal: 'leads',
      offerType: 'high-ticket',
      tone: 'professional',
    };
    
    const recommendations = recommendArchetypes(profile);
    expect(recommendations).toHaveLength(3);
  });

  it('returns scores sorted in descending order', () => {
    const profile: QuickProfile = {
      goal: 'bookings',
      offerType: 'low-ticket',
      tone: 'friendly',
    };
    
    const recommendations = recommendArchetypes(profile);
    expect(recommendations[0].score).toBeGreaterThanOrEqual(recommendations[1].score);
    expect(recommendations[1].score).toBeGreaterThanOrEqual(recommendations[2].score);
  });

  it('includes reasons for each recommendation', () => {
    const profile: QuickProfile = {
      goal: 'leads',
      offerType: 'high-ticket',
      tone: 'professional',
    };
    
    const recommendations = recommendArchetypes(profile);
    recommendations.forEach(rec => {
      expect(rec.reasons).toBeInstanceOf(Array);
    });
  });

  describe('goal-based recommendations', () => {
    it('recommends authority-builder for leads + high-ticket + professional', () => {
      const profile: QuickProfile = {
        goal: 'leads',
        offerType: 'high-ticket',
        tone: 'professional',
      };
      
      const recommendations = recommendArchetypes(profile);
      expect(recommendations[0].archetype).toBe('authority-builder');
    });

    it('recommends service-provider for bookings + low-ticket + friendly', () => {
      const profile: QuickProfile = {
        goal: 'bookings',
        offerType: 'low-ticket',
        tone: 'friendly',
      };
      
      const recommendations = recommendArchetypes(profile);
      // service-provider or local-expert should be top for this profile
      expect(['service-provider', 'local-expert']).toContain(recommendations[0].archetype);
    });

    it('recommends course-creator for sales + low-ticket + friendly', () => {
      const profile: QuickProfile = {
        goal: 'sales',
        offerType: 'low-ticket',
        tone: 'friendly',
      };
      
      const recommendations = recommendArchetypes(profile);
      expect(recommendations[0].archetype).toBe('course-creator');
    });

    it('recommends portfolio-showcase for leads + high-ticket + bold', () => {
      const profile: QuickProfile = {
        goal: 'leads',
        offerType: 'high-ticket',
        tone: 'bold',
      };
      
      const recommendations = recommendArchetypes(profile);
      // Should include portfolio-showcase in recommendations
      const archetypes = recommendations.map(r => r.archetype);
      expect(archetypes).toContain('portfolio-showcase');
    });
  });

  describe('score breakdown', () => {
    it('scores goal alignment at 40 points', () => {
      const profile: QuickProfile = {
        goal: 'bookings',
        offerType: 'free', // Doesn't match service-provider
        tone: 'bold', // Doesn't match service-provider's primary
      };
      
      const recommendations = recommendArchetypes(profile);
      const serviceProvider = recommendations.find(r => r.archetype === 'service-provider');
      
      // Should have at least 40 points from goal match
      expect(serviceProvider?.score).toBeGreaterThanOrEqual(40);
    });

    it('adds offer alignment bonus', () => {
      const profileWithMatch: QuickProfile = {
        goal: 'leads',
        offerType: 'high-ticket',
        tone: 'professional',
      };
      
      const profileWithoutMatch: QuickProfile = {
        goal: 'leads',
        offerType: 'free',
        tone: 'professional',
      };
      
      const withMatch = recommendArchetypes(profileWithMatch);
      const withoutMatch = recommendArchetypes(profileWithoutMatch);
      
      const authorityWithMatch = withMatch.find(r => r.archetype === 'authority-builder');
      const authorityWithoutMatch = withoutMatch.find(r => r.archetype === 'authority-builder');
      
      expect(authorityWithMatch!.score).toBeGreaterThan(authorityWithoutMatch!.score);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BEST ARCHETYPE SELECTION
// ═══════════════════════════════════════════════════════════════════════════

describe('getBestArchetype', () => {
  it('returns authority-builder for coaching profile', () => {
    const profile: QuickProfile = {
      goal: 'leads',
      offerType: 'high-ticket',
      tone: 'professional',
    };
    
    const best = getBestArchetype(profile);
    expect(best).toBe('authority-builder');
  });

  it('returns course-creator for education profile', () => {
    const profile: QuickProfile = {
      goal: 'sales',
      offerType: 'low-ticket',
      tone: 'friendly',
    };
    
    const best = getBestArchetype(profile);
    expect(best).toBe('course-creator');
  });

  it('returns a valid archetype for any profile', () => {
    const profile: QuickProfile = {
      goal: 'bookings',
      offerType: 'free',
      tone: 'bold',
    };
    
    const best = getBestArchetype(profile);
    expect(TEMPLATE_ARCHETYPES[best]).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY TO ARCHETYPE MAPPING
// ═══════════════════════════════════════════════════════════════════════════

describe('getArchetypesForCategory', () => {
  it('returns archetypes for coaching category', () => {
    const archetypes = getArchetypesForCategory('coaching');
    expect(archetypes).toContain('authority-builder');
    expect(archetypes).toContain('event-host');
    expect(archetypes).toContain('course-creator');
  });

  it('returns archetypes for mental-health category', () => {
    const archetypes = getArchetypesForCategory('mental-health');
    expect(archetypes).toContain('service-provider');
    expect(archetypes).toContain('authority-builder');
  });

  it('returns archetypes for fitness category', () => {
    const archetypes = getArchetypesForCategory('fitness');
    expect(archetypes).toContain('local-expert');
    expect(archetypes).toContain('course-creator');
  });

  it('returns archetypes for creative category', () => {
    const archetypes = getArchetypesForCategory('creative');
    expect(archetypes).toContain('portfolio-showcase');
  });

  it('returns archetypes for education category', () => {
    const archetypes = getArchetypesForCategory('education');
    expect(archetypes).toContain('course-creator');
    expect(archetypes).toContain('event-host');
  });

  it('returns default archetypes for unknown category', () => {
    const archetypes = getArchetypesForCategory('unknown-category');
    expect(archetypes).toHaveLength(3);
    expect(archetypes).toContain('authority-builder');
    expect(archetypes).toContain('service-provider');
    expect(archetypes).toContain('local-expert');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE SLUG RESOLUTION
// ═══════════════════════════════════════════════════════════════════════════

describe('getTemplateSlugsForProfile', () => {
  it('returns template slugs for recommended archetypes', () => {
    const profile: QuickProfile = {
      goal: 'leads',
      offerType: 'high-ticket',
      tone: 'professional',
    };
    
    const slugs = getTemplateSlugsForProfile(profile);
    expect(slugs.length).toBeGreaterThan(0);
    expect(slugs.length).toBeLessThanOrEqual(3);
  });

  it('returns coach-pro for authority-builder profile', () => {
    const profile: QuickProfile = {
      goal: 'leads',
      offerType: 'high-ticket',
      tone: 'professional',
    };
    
    const slugs = getTemplateSlugsForProfile(profile);
    expect(slugs).toContain('coach-pro');
  });

  it('returns valid slugs for any profile', () => {
    const profiles: QuickProfile[] = [
      { goal: 'leads', offerType: 'high-ticket', tone: 'professional' },
      { goal: 'sales', offerType: 'low-ticket', tone: 'friendly' },
      { goal: 'bookings', offerType: 'free', tone: 'bold' },
    ];
    
    profiles.forEach(profile => {
      const slugs = getTemplateSlugsForProfile(profile);
      expect(slugs.length).toBeGreaterThan(0);
      slugs.forEach(slug => {
        expect(typeof slug).toBe('string');
        expect(slug.length).toBeGreaterThan(0);
      });
    });
  });
});
