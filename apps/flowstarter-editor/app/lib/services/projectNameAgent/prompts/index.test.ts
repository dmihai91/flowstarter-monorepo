/**
 * Tests for the modular prompt system
 * 
 * Tests category detection, prompt selection, fallback names,
 * banned word filtering, and refinement prompt building.
 */

import { describe, it, expect } from 'vitest';
import {
  detectCategory,
  getGenerationPrompt,
  getFallbackNames,
  getRandomFallbackName,
  getRefinementHints,
  buildRefinementPrompt,
  buildExtractionPrompt,
  buildPersonalizedContext,
  getAllCategoryIds,
  getCategoryById,
  containsBannedWord,
  getBannedWord,
  BANNED_WORDS_ARRAY,
  type UserContext,
} from './index';

describe('Category Detection', () => {
  describe('detectCategory', () => {
    it('detects therapist category from various keywords', () => {
      const therapistDescriptions = [
        'I am a therapist helping people with anxiety',
        'Licensed counselor specializing in trauma',
        'Mental health practice in Seattle',
        'Psychologist offering CBT therapy',
        'Marriage counseling services',
        'LMFT providing family therapy',
      ];

      therapistDescriptions.forEach(desc => {
        const category = detectCategory(desc);
        expect(category.id).toBe('therapist');
      });
    });

    it('detects fitness category', () => {
      const fitnessDescriptions = [
        'Personal trainer for busy professionals',
        'CrossFit gym in downtown',
        'Strength training and conditioning',
        'Fitness coach specializing in HIIT',
      ];

      fitnessDescriptions.forEach(desc => {
        const category = detectCategory(desc);
        expect(category.id).toBe('fitness');
      });
    });

    it('detects yoga category (before fitness due to priority)', () => {
      const yogaDescriptions = [
        'Yoga instructor teaching vinyasa',
        'Pilates studio for beginners',
        'Meditation and mindfulness teacher',
        'Breathwork and yoga practice',
      ];

      yogaDescriptions.forEach(desc => {
        const category = detectCategory(desc);
        expect(category.id).toBe('yoga');
      });
    });

    it('detects coaching category', () => {
      const coachingDescriptions = [
        'Life coach helping entrepreneurs',
        'Executive coaching for CEOs',
        'Business consultant',
        'Career coach and mentor',
      ];

      coachingDescriptions.forEach(desc => {
        const category = detectCategory(desc);
        expect(category.id).toBe('coaching');
      });
    });

    it('detects creative category', () => {
      const creativeDescriptions = [
        'Wedding photographer in NYC',
        'Graphic designer for startups',
        'Portrait photography studio',
        'Video production company',
        'Freelance illustrator',
      ];

      creativeDescriptions.forEach(desc => {
        const category = detectCategory(desc);
        expect(category.id).toBe('creative');
      });
    });

    it('detects beauty category', () => {
      const beautyDescriptions = [
        'Hair stylist specializing in color',
        'Makeup artist for weddings',
        'Esthetician offering facials',
        'Nail salon and spa',
        'Barber shop in Brooklyn',
      ];

      beautyDescriptions.forEach(desc => {
        const category = detectCategory(desc);
        expect(category.id).toBe('beauty');
      });
    });

    it('detects food category', () => {
      const foodDescriptions = [
        'Italian restaurant',
        'Coffee shop and bakery',
        'Personal chef for events',
        'Catering service',
        'Food truck selling tacos',
      ];

      foodDescriptions.forEach(desc => {
        const category = detectCategory(desc);
        expect(category.id).toBe('food');
      });
    });

    it('detects professional category', () => {
      const professionalDescriptions = [
        'Law firm specializing in immigration',
        'Accounting services for small businesses',
        'Dental clinic',
        'Medical practice for families',
        'Lawyer helping with immigration',
      ];

      professionalDescriptions.forEach(desc => {
        const category = detectCategory(desc);
        expect(category.id).toBe('professional');
      });
    });

    it('detects real estate category', () => {
      const realEstateDescriptions = [
        'Real estate agent in Austin',
        'Realtor helping first-time buyers',
        'Property management company',
        'Home sales specialist',
      ];

      realEstateDescriptions.forEach(desc => {
        const category = detectCategory(desc);
        expect(category.id).toBe('realestate');
      });
    });

    it('detects tech category', () => {
      const techDescriptions = [
        'SaaS startup for HR',
        'Web development agency',
        'Mobile app for productivity',
        'Marketing automation platform',
        'AI-powered software',
      ];

      techDescriptions.forEach(desc => {
        const category = detectCategory(desc);
        expect(category.id).toBe('tech');
      });
    });

    it('returns generic category for unmatched descriptions', () => {
      const genericDescriptions = [
        'Selling handmade crafts',
        'My new business venture',
        'Something completely unique',
        '',
      ];

      genericDescriptions.forEach(desc => {
        const category = detectCategory(desc);
        expect(category.id).toBe('generic');
      });
    });

    it('handles empty and null-like inputs', () => {
      expect(detectCategory('').id).toBe('generic');
      expect(detectCategory('   ').id).toBe('generic');
    });

    it('is case-insensitive', () => {
      expect(detectCategory('THERAPIST').id).toBe('therapist');
      expect(detectCategory('Personal Trainer').id).toBe('fitness');
      expect(detectCategory('YOGA INSTRUCTOR').id).toBe('yoga');
    });
  });
});

describe('Prompt Generation', () => {
  describe('getGenerationPrompt', () => {
    it('returns category-specific prompts', () => {
      const therapistPrompt = getGenerationPrompt('I am a therapist');
      expect(therapistPrompt).toContain('therapy');
      expect(therapistPrompt).toContain('Safe');
      expect(therapistPrompt).toContain('Welcoming');

      const fitnessPrompt = getGenerationPrompt('personal trainer');
      expect(fitnessPrompt).toContain('fitness');
      expect(fitnessPrompt).toContain('Powerful');
      expect(fitnessPrompt).toContain('Physical');
    });

    it('includes base rules in all prompts', () => {
      const categories = ['therapist', 'fitness coach', 'photographer', 'restaurant'];
      
      categories.forEach(desc => {
        const prompt = getGenerationPrompt(desc);
        expect(prompt).toContain('RULES');
        expect(prompt).toContain('1-3 words');
        expect(prompt).toContain('Title case');
        expect(prompt).toContain('BANNED');
      });
    });

    it('includes output format in prompts', () => {
      const prompt = getGenerationPrompt('therapist');
      expect(prompt).toContain('3 names');
    });
  });
});

describe('Fallback Names', () => {
  describe('getFallbackNames', () => {
    it('returns array of fallback names for each category', () => {
      const categories = [
        { desc: 'therapist', minNames: 10 },
        { desc: 'personal trainer', minNames: 10 },
        { desc: 'yoga instructor', minNames: 10 },
        { desc: 'life coach', minNames: 10 },
        { desc: 'photographer', minNames: 10 },
        { desc: 'hair stylist', minNames: 10 },
        { desc: 'restaurant', minNames: 10 },
        { desc: 'lawyer', minNames: 10 },
        { desc: 'realtor', minNames: 10 },
        { desc: 'saas startup', minNames: 10 },
        { desc: 'something generic', minNames: 10 },
      ];

      categories.forEach(({ desc, minNames }) => {
        const names = getFallbackNames(desc);
        expect(Array.isArray(names)).toBe(true);
        expect(names.length).toBeGreaterThanOrEqual(minNames);
        names.forEach(name => {
          expect(typeof name).toBe('string');
          expect(name.length).toBeGreaterThan(0);
        });
      });
    });

    it('returns category-appropriate names', () => {
      const therapistNames = getFallbackNames('therapist');
      // Should have calming, safe-feeling names
      expect(therapistNames.some(n => 
        n.includes('Safe') || n.includes('Calm') || n.includes('Haven') || n.includes('Ground')
      )).toBe(true);

      const fitnessNames = getFallbackNames('personal trainer');
      // Should have powerful, energetic names
      expect(fitnessNames.some(n => 
        n.includes('Iron') || n.includes('Forge') || n.includes('Torque') || n.includes('Grit')
      )).toBe(true);
    });
  });

  describe('getRandomFallbackName', () => {
    it('returns a string', () => {
      const name = getRandomFallbackName('therapist');
      expect(typeof name).toBe('string');
      expect(name.length).toBeGreaterThan(0);
    });

    it('returns names from the correct category', () => {
      // Run multiple times to check randomness works
      const names = new Set<string>();
      for (let i = 0; i < 20; i++) {
        names.add(getRandomFallbackName('therapist'));
      }
      
      const therapistFallbacks = getFallbackNames('therapist');
      names.forEach(name => {
        expect(therapistFallbacks).toContain(name);
      });
    });
  });
});

describe('Banned Words', () => {
  describe('containsBannedWord', () => {
    it('detects banned words', () => {
      const bannedNames = [
        'Thrive Therapy',
        'Elevate Coaching',
        'Transform Fitness',
        'Empower Life',
        'Synergy Solutions',
        'Peak Performance',
        'Apex Training',
      ];

      bannedNames.forEach(name => {
        expect(containsBannedWord(name)).toBe(true);
      });
    });

    it('allows good names', () => {
      const goodNames = [
        'Safe Ground',
        'The Clearing',
        'Iron Hour',
        'The Forge',
        'Cornerstone',
        'Half Light',
        'The Practice',
      ];

      goodNames.forEach(name => {
        expect(containsBannedWord(name)).toBe(false);
      });
    });

    it('is case-insensitive', () => {
      expect(containsBannedWord('THRIVE')).toBe(true);
      expect(containsBannedWord('thrive')).toBe(true);
      expect(containsBannedWord('Thrive')).toBe(true);
    });
  });

  describe('getBannedWord', () => {
    it('returns the banned word found', () => {
      expect(getBannedWord('Thrive Therapy')).toBe('Thrive');
      expect(getBannedWord('Elevate Coaching')).toBe('Elevate');
      expect(getBannedWord('Peak Performance')).toBe('Peak');
    });

    it('returns null for allowed names', () => {
      expect(getBannedWord('Safe Ground')).toBeNull();
      expect(getBannedWord('The Practice')).toBeNull();
    });
  });

  describe('BANNED_WORDS_ARRAY', () => {
    it('contains expected banned words', () => {
      const expectedBanned = [
        'Thrive', 'Flourish', 'Elevate', 'Empower', 'Transform',
        'Synergy', 'Leverage', 'Impact', 'Peak', 'Apex',
      ];

      expectedBanned.forEach(word => {
        expect(BANNED_WORDS_ARRAY).toContain(word);
      });
    });

    it('has a reasonable number of banned words', () => {
      expect(BANNED_WORDS_ARRAY.length).toBeGreaterThan(20);
      expect(BANNED_WORDS_ARRAY.length).toBeLessThan(100);
    });
  });
});

describe('Refinement Hints', () => {
  describe('getRefinementHints', () => {
    it('returns hints object for each category', () => {
      const categories = ['therapist', 'personal trainer', 'photographer', 'restaurant'];

      categories.forEach(desc => {
        const hints = getRefinementHints(desc);
        expect(typeof hints).toBe('object');
        expect(Object.keys(hints).length).toBeGreaterThan(0);
      });
    });

    it('includes common refinement keys', () => {
      // Different categories have different hint keys
      // Therapist: warm, professional, creative, shorter, different
      const therapistHints = getRefinementHints('therapist');
      expect(therapistHints).toHaveProperty('warm');
      expect(therapistHints).toHaveProperty('professional');
      expect(therapistHints).toHaveProperty('shorter');

      // Fitness: punchy, professional, creative, shorter, different
      const fitnessHints = getRefinementHints('personal trainer');
      expect(fitnessHints).toHaveProperty('punchy');
      expect(fitnessHints).toHaveProperty('professional');
    });
  });
});

describe('Prompt Builders', () => {
  describe('buildRefinementPrompt', () => {
    it('includes previous name and feedback', () => {
      const prompt = buildRefinementPrompt(
        'Calm Space',
        'make it more professional',
        'therapist practice'
      );

      expect(prompt).toContain('Calm Space');
      expect(prompt).toContain('professional');
      expect(prompt).toContain('therapist');
    });

    it('includes previously suggested names to avoid', () => {
      const prompt = buildRefinementPrompt(
        'Calm Space',
        'try another',
        'therapist',
        ['Safe Ground', 'The Clearing', 'Calm Space']
      );

      expect(prompt).toContain('Safe Ground');
      expect(prompt).toContain('The Clearing');
      expect(prompt).toContain('DO NOT repeat');
    });

    it('includes accumulated requirements', () => {
      const prompt = buildRefinementPrompt(
        'Haven',
        'shorter',
        'therapist',
        [],
        ['must include initials JM', 'no nature words']
      );

      expect(prompt).toContain('initials JM');
      expect(prompt).toContain('no nature words');
      expect(prompt).toContain('ACCUMULATED');
    });

    it('includes style guidance for matching feedback', () => {
      const prompt = buildRefinementPrompt(
        'Safe Space',
        'make it more professional',
        'therapist'
      );

      expect(prompt).toContain('STYLE GUIDANCE');
    });

    it('includes output format for single name', () => {
      const prompt = buildRefinementPrompt('Test', 'shorter', 'therapist');
      expect(prompt).toContain('{"name":');
    });
  });

  describe('buildExtractionPrompt', () => {
    it('includes context when provided', () => {
      const prompt = buildExtractionPrompt(
        'Safe Ground',
        'therapist practice in Seattle',
        ['Haven', 'Safe Ground'],
        ['must be one word']
      );

      expect(prompt).toContain('Safe Ground');
      expect(prompt).toContain('Seattle');
      expect(prompt).toContain('Haven');
      expect(prompt).toContain('one word');
      expect(prompt).toContain('THERAPIST');
    });

    it('includes response type instructions', () => {
      const prompt = buildExtractionPrompt();

      expect(prompt).toContain('USER CONFIRMS');
      expect(prompt).toContain('USER PROVIDES A NAME');
      expect(prompt).toContain('USER WANTS REFINEMENT');
      expect(prompt).toContain('JSON');
    });

    it('includes category-specific style hints', () => {
      const therapistPrompt = buildExtractionPrompt(undefined, 'therapist');
      expect(therapistPrompt).toContain('STYLE HINTS');
      expect(therapistPrompt).toContain('THERAPIST');

      const fitnessPrompt = buildExtractionPrompt(undefined, 'personal trainer');
      expect(fitnessPrompt).toContain('FITNESS');
    });
  });
});

describe('Category Registry', () => {
  describe('getAllCategoryIds', () => {
    it('returns all registered category IDs', () => {
      const ids = getAllCategoryIds();

      expect(ids).toContain('therapist');
      expect(ids).toContain('fitness');
      expect(ids).toContain('yoga');
      expect(ids).toContain('coaching');
      expect(ids).toContain('creative');
      expect(ids).toContain('beauty');
      expect(ids).toContain('food');
      expect(ids).toContain('professional');
      expect(ids).toContain('realestate');
      expect(ids).toContain('tech');
      expect(ids).toContain('generic');
    });

    it('has generic as the last category', () => {
      const ids = getAllCategoryIds();
      expect(ids[ids.length - 1]).toBe('generic');
    });
  });

  describe('getCategoryById', () => {
    it('returns category by ID', () => {
      const therapist = getCategoryById('therapist');
      expect(therapist).toBeDefined();
      expect(therapist?.id).toBe('therapist');
      expect(therapist?.keywords.length).toBeGreaterThan(0);
      expect(therapist?.fallbackNames.length).toBeGreaterThan(0);
    });

    it('returns undefined for unknown ID', () => {
      const unknown = getCategoryById('nonexistent');
      expect(unknown).toBeUndefined();
    });
  });
});

describe('Category Priority', () => {
  it('yoga takes priority over generic fitness terms', () => {
    // "yoga" should match yoga, not fitness
    expect(detectCategory('yoga classes').id).toBe('yoga');
    expect(detectCategory('pilates studio').id).toBe('yoga');
  });

  it('therapist takes priority over coaching for mental health', () => {
    // Mental health terms should match therapist, not coaching
    expect(detectCategory('mental health coaching').id).toBe('therapist');
    expect(detectCategory('anxiety counselor').id).toBe('therapist');
  });

  it('specific categories take priority over generic', () => {
    // Even with generic words, specific keywords should win
    expect(detectCategory('new therapist business').id).toBe('therapist');
    expect(detectCategory('starting a gym').id).toBe('fitness');
  });
});

describe('Edge Cases', () => {
  it('handles mixed-category descriptions', () => {
    // First matching keyword wins based on category order
    const category = detectCategory('therapist who does yoga');
    expect(category.id).toBe('therapist'); // therapist comes before yoga in priority
  });

  it('handles very long descriptions', () => {
    const longDesc = 'I am a therapist ' + 'with lots of text '.repeat(100);
    const category = detectCategory(longDesc);
    expect(category.id).toBe('therapist');
  });

  it('handles special characters', () => {
    expect(detectCategory('therapist & counselor!').id).toBe('therapist');
    expect(detectCategory('yoga/pilates studio').id).toBe('yoga');
  });

  it('handles numbers in descriptions', () => {
    expect(detectCategory('24/7 gym fitness center').id).toBe('fitness');
    expect(detectCategory('therapist with 10 years experience').id).toBe('therapist');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PERSONALIZATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Personalization', () => {
  describe('buildPersonalizedContext', () => {
    it('returns empty string when no userContext provided', () => {
      expect(buildPersonalizedContext()).toBe('');
      expect(buildPersonalizedContext(undefined)).toBe('');
      expect(buildPersonalizedContext({})).toBe('');
    });

    it('includes owner name when provided', () => {
      const userContext: UserContext = {
        ownerName: 'Sarah Mitchell',
      };
      const result = buildPersonalizedContext(userContext);
      
      expect(result).toContain('Sarah Mitchell');
      expect(result).toContain('Owner');
      expect(result).toContain('PERSONALIZATION');
    });

    it('includes initials when provided', () => {
      const userContext: UserContext = {
        initials: 'SM',
      };
      const result = buildPersonalizedContext(userContext);
      
      expect(result).toContain('SM');
      expect(result).toContain('Initials');
    });

    it('includes preferred style when provided', () => {
      const userContext: UserContext = {
        preferredStyle: 'warm and welcoming',
      };
      const result = buildPersonalizedContext(userContext);
      
      expect(result).toContain('warm and welcoming');
      expect(result).toContain('style');
    });

    it('includes keywords when provided', () => {
      const userContext: UserContext = {
        keywords: ['calm', 'clarity', 'peace'],
      };
      const result = buildPersonalizedContext(userContext);
      
      expect(result).toContain('calm');
      expect(result).toContain('clarity');
      expect(result).toContain('peace');
      expect(result).toContain('Keywords');
    });

    it('includes unique approach when provided', () => {
      const userContext: UserContext = {
        uniqueApproach: 'mindfulness-based therapy',
      };
      const result = buildPersonalizedContext(userContext);
      
      expect(result).toContain('mindfulness-based therapy');
      expect(result).toContain('unique');
    });

    it('includes target audience when provided', () => {
      const userContext: UserContext = {
        targetAudience: 'busy professionals',
      };
      const result = buildPersonalizedContext(userContext);
      
      expect(result).toContain('busy professionals');
      expect(result).toContain('audience');
    });

    it('includes location when provided', () => {
      const userContext: UserContext = {
        location: 'Brooklyn',
      };
      const result = buildPersonalizedContext(userContext);
      
      expect(result).toContain('Brooklyn');
      expect(result).toContain('Location');
    });

    it('includes avoid words when provided', () => {
      const userContext: UserContext = {
        avoidWords: ['zen', 'healing', 'journey'],
      };
      const result = buildPersonalizedContext(userContext);
      
      expect(result).toContain('zen');
      expect(result).toContain('healing');
      expect(result).toContain('journey');
      expect(result).toContain('AVOID');
    });

    it('combines multiple context fields', () => {
      const userContext: UserContext = {
        ownerName: 'Elena Park',
        preferredStyle: 'peaceful and grounding',
        keywords: ['flow', 'breath'],
        location: 'Austin',
      };
      const result = buildPersonalizedContext(userContext);
      
      expect(result).toContain('Elena Park');
      expect(result).toContain('peaceful and grounding');
      expect(result).toContain('flow');
      expect(result).toContain('breath');
      expect(result).toContain('Austin');
    });

    it('includes personalization guidelines', () => {
      const userContext: UserContext = {
        ownerName: 'Test User',
      };
      const result = buildPersonalizedContext(userContext);
      
      expect(result).toContain('MUST incorporate');
      expect(result).toContain('DISTINCTIVE');
    });
  });

  describe('getGenerationPrompt with userContext', () => {
    it('returns base prompt without personalization when no userContext', () => {
      const withoutContext = getGenerationPrompt('therapist');
      const withEmptyContext = getGenerationPrompt('therapist', {});
      
      expect(withoutContext).not.toContain('PERSONALIZATION');
      expect(withEmptyContext).not.toContain('PERSONALIZATION');
    });

    it('includes personalization section when userContext provided', () => {
      const userContext: UserContext = {
        ownerName: 'Sarah Mitchell',
        keywords: ['calm'],
      };
      const prompt = getGenerationPrompt('therapist', userContext);
      
      expect(prompt).toContain('PERSONALIZATION');
      expect(prompt).toContain('Sarah Mitchell');
      expect(prompt).toContain('calm');
    });

    it('still includes category-specific content with personalization', () => {
      const userContext: UserContext = {
        ownerName: 'Mike Torres',
      };
      
      const therapistPrompt = getGenerationPrompt('therapist', userContext);
      expect(therapistPrompt).toContain('therapy');
      expect(therapistPrompt).toContain('Safe');
      expect(therapistPrompt).toContain('Mike Torres');
      
      const fitnessPrompt = getGenerationPrompt('personal trainer', userContext);
      expect(fitnessPrompt).toContain('fitness');
      expect(fitnessPrompt).toContain('Mike Torres');
    });

    it('still includes base rules with personalization', () => {
      const userContext: UserContext = {
        ownerName: 'Test User',
      };
      const prompt = getGenerationPrompt('therapist', userContext);
      
      expect(prompt).toContain('RULES');
      expect(prompt).toContain('1-3 words');
      expect(prompt).toContain('BANNED');
    });

    it('inserts personalization in correct position (before RULES)', () => {
      const userContext: UserContext = {
        ownerName: 'Test User',
      };
      const prompt = getGenerationPrompt('therapist', userContext);
      
      const personalizationIndex = prompt.indexOf('PERSONALIZATION');
      const rulesIndex = prompt.indexOf('RULES (apply to ALL names)');
      
      // Personalization should come before rules
      expect(personalizationIndex).toBeLessThan(rulesIndex);
      expect(personalizationIndex).toBeGreaterThan(0);
    });
  });
});

describe('UserContext Interface', () => {
  it('accepts all optional fields', () => {
    const fullContext: UserContext = {
      ownerName: 'John Doe',
      initials: 'JD',
      preferredStyle: 'modern',
      keywords: ['innovative', 'fresh'],
      uniqueApproach: 'AI-powered solutions',
      targetAudience: 'tech startups',
      location: 'San Francisco',
      avoidWords: ['basic', 'simple'],
    };
    
    // Should not throw
    const result = buildPersonalizedContext(fullContext);
    expect(result).toBeTruthy();
  });

  it('accepts partial context', () => {
    const partialContexts: UserContext[] = [
      { ownerName: 'Jane' },
      { keywords: ['one'] },
      { location: 'NYC' },
      { preferredStyle: 'bold' },
    ];
    
    partialContexts.forEach(ctx => {
      const result = buildPersonalizedContext(ctx);
      expect(result).toBeTruthy();
      expect(result).toContain('PERSONALIZATION');
    });
  });
});

describe('Personalization with Romanian Content', () => {
  it('handles Romanian owner names', () => {
    const userContext: UserContext = {
      ownerName: 'Andreea Ionescu',
    };
    const result = buildPersonalizedContext(userContext);
    
    expect(result).toContain('Andreea Ionescu');
  });

  it('handles Romanian keywords with diacritics', () => {
    const userContext: UserContext = {
      keywords: ['liniște', 'echilibru', 'pace'],
    };
    const result = buildPersonalizedContext(userContext);
    
    expect(result).toContain('liniște');
    expect(result).toContain('echilibru');
  });

  it('handles Romanian locations', () => {
    const userContext: UserContext = {
      location: 'București',
    };
    const result = buildPersonalizedContext(userContext);
    
    expect(result).toContain('București');
  });

  it('integrates Romanian context into generation prompt', () => {
    const userContext: UserContext = {
      ownerName: 'Maria Popescu',
      location: 'Cluj-Napoca',
      keywords: ['tradiție', 'calitate'],
    };
    const prompt = getGenerationPrompt('brutarie artizanala', userContext);
    
    expect(prompt).toContain('Maria Popescu');
    expect(prompt).toContain('Cluj-Napoca');
    expect(prompt).toContain('tradiție');
  });
});
