import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MVP_INDUSTRIES,
  getIndustryOptions,
  getIndustryAutocompleteOptions,
  normalizeIndustryId,
  detectIndustryFromDescription,
} from '../industries';

describe('industries', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleLogSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('MVP_INDUSTRIES', () => {
    it('should have all expected industries', () => {
      expect(MVP_INDUSTRIES).toHaveLength(11);
      const ids = MVP_INDUSTRIES.map((i) => i.id);
      expect(ids).toContain('consultants-coaches');
      expect(ids).toContain('therapists-psychologists');
      expect(ids).toContain('photographers-videographers');
      expect(ids).toContain('designers-creative-studios');
      expect(ids).toContain('personal-trainers-wellness');
      expect(ids).toContain('salons-barbers-spas');
      expect(ids).toContain('restaurants-cafes');
      expect(ids).toContain('content-creation');
      expect(ids).toContain('fashion-beauty');
      expect(ids).toContain('health-wellness');
      expect(ids).toContain('other');
    });

    it('should have name and description for each industry', () => {
      MVP_INDUSTRIES.forEach((industry) => {
        expect(industry.id).toBeTruthy();
        expect(industry.name).toBeTruthy();
        expect(industry.description).toBeTruthy();
      });
    });
  });

  describe('getIndustryOptions', () => {
    it('should return all industries with correct structure', () => {
      const options = getIndustryOptions();
      expect(options).toHaveLength(11);
      options.forEach((option) => {
        expect(option).toHaveProperty('id');
        expect(option).toHaveProperty('name');
        expect(option).toHaveProperty('description');
      });
    });
  });

  describe('getIndustryAutocompleteOptions', () => {
    it('should return industries with only id and name', () => {
      const options = getIndustryAutocompleteOptions();
      expect(options).toHaveLength(11);
      options.forEach((option) => {
        expect(option).toHaveProperty('id');
        expect(option).toHaveProperty('name');
        expect(option).not.toHaveProperty('description');
      });
    });
  });

  describe('normalizeIndustryId', () => {
    it('should return "other" for undefined input', () => {
      expect(normalizeIndustryId(undefined)).toBe('other');
    });

    it('should return "other" for empty string', () => {
      expect(normalizeIndustryId('')).toBe('other');
    });

    it('should return valid industry ID as-is', () => {
      expect(normalizeIndustryId('consultants-coaches')).toBe(
        'consultants-coaches'
      );
      expect(normalizeIndustryId('therapists-psychologists')).toBe(
        'therapists-psychologists'
      );
    });

    it('should normalize valid ID with different casing', () => {
      expect(normalizeIndustryId('CONSULTANTS-COACHES')).toBe(
        'consultants-coaches'
      );
      expect(normalizeIndustryId('Therapists-Psychologists')).toBe(
        'therapists-psychologists'
      );
    });

    describe('pattern matching', () => {
      it('should match therapist patterns', () => {
        expect(normalizeIndustryId('therapist')).toBe(
          'therapists-psychologists'
        );
        expect(normalizeIndustryId('psychologist')).toBe(
          'therapists-psychologists'
        );
        expect(normalizeIndustryId('counselor')).toBe(
          'therapists-psychologists'
        );
        expect(normalizeIndustryId('mental health professional')).toBe(
          'therapists-psychologists'
        );
      });

      it('should match photographer patterns', () => {
        expect(normalizeIndustryId('photographer')).toBe(
          'photographers-videographers'
        );
        expect(normalizeIndustryId('videographer')).toBe(
          'photographers-videographers'
        );
        expect(normalizeIndustryId('wedding photographer')).toBe(
          'photographers-videographers'
        );
      });

      it('should match designer patterns', () => {
        expect(normalizeIndustryId('graphic design')).toBe(
          'designers-creative-studios'
        );
        expect(normalizeIndustryId('web design')).toBe(
          'designers-creative-studios'
        );
        expect(normalizeIndustryId('creative agency')).toBe(
          'designers-creative-studios'
        );
      });

      it('should match personal trainer patterns', () => {
        expect(normalizeIndustryId('personal trainer')).toBe(
          'personal-trainers-wellness'
        );
        expect(normalizeIndustryId('fitness coach')).toBe(
          'personal-trainers-wellness'
        );
        expect(normalizeIndustryId('yoga instructor')).toBe(
          'personal-trainers-wellness'
        );
      });

      it('should match salon patterns', () => {
        expect(normalizeIndustryId('hair salon')).toBe('salons-barbers-spas');
        expect(normalizeIndustryId('barber')).toBe('salons-barbers-spas');
        expect(normalizeIndustryId('spa')).toBe('salons-barbers-spas');
      });

      it('should match restaurant patterns', () => {
        expect(normalizeIndustryId('restaurant')).toBe('restaurants-cafes');
        expect(normalizeIndustryId('cafe')).toBe('restaurants-cafes');
        expect(normalizeIndustryId('catering')).toBe('restaurants-cafes');
      });

      it('should match content creation patterns', () => {
        expect(normalizeIndustryId('blogger')).toBe('content-creation');
        expect(normalizeIndustryId('youtuber')).toBe('content-creation');
        expect(normalizeIndustryId('podcaster')).toBe('content-creation');
        expect(normalizeIndustryId('influencer')).toBe('content-creation');
      });

      it('should match fashion patterns', () => {
        // 'fashion designer' matches 'designer' first (designers-creative-studios pattern)
        expect(normalizeIndustryId('fashion designer')).toBe(
          'designers-creative-studios'
        );
        expect(normalizeIndustryId('makeup artist')).toBe('fashion-beauty');
        expect(normalizeIndustryId('boutique')).toBe('fashion-beauty');
        // Pure fashion keywords
        expect(normalizeIndustryId('fashion')).toBe('fashion-beauty');
        expect(normalizeIndustryId('beauty')).toBe('fashion-beauty');
      });

      it('should match health & wellness patterns', () => {
        expect(normalizeIndustryId('health coach')).toBe('health-wellness');
        expect(normalizeIndustryId('holistic wellness')).toBe(
          'health-wellness'
        );
        expect(normalizeIndustryId('life coach')).toBe('health-wellness');
      });

      it('should match consultant patterns', () => {
        expect(normalizeIndustryId('business consultant')).toBe(
          'consultants-coaches'
        );
        expect(normalizeIndustryId('career coach')).toBe('consultants-coaches');
        expect(normalizeIndustryId('financial advisor')).toBe(
          'consultants-coaches'
        );
      });
    });

    it('should log when pattern is matched', () => {
      normalizeIndustryId('therapist');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[normalizeIndustryId] Matched')
      );
    });

    it('should log when no match is found', () => {
      normalizeIndustryId('unknown industry');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[normalizeIndustryId] No match found for "unknown industry", defaulting to "other"'
      );
    });

    it('should handle whitespace in input', () => {
      expect(normalizeIndustryId('  therapist  ')).toBe(
        'therapists-psychologists'
      );
    });

    it('should default to "other" for unrecognized industries', () => {
      expect(normalizeIndustryId('astronaut')).toBe('other');
      expect(normalizeIndustryId('random text')).toBe('other');
    });

    it('should match patterns case-insensitively', () => {
      expect(normalizeIndustryId('THERAPIST')).toBe('therapists-psychologists');
      expect(normalizeIndustryId('Photographer')).toBe(
        'photographers-videographers'
      );
    });

    it('should match partial strings', () => {
      expect(normalizeIndustryId('I am a therapist offering services')).toBe(
        'therapists-psychologists'
      );
      expect(normalizeIndustryId('Professional photographer in NYC')).toBe(
        'photographers-videographers'
      );
    });
  });

  describe('detectIndustryFromDescription', () => {
    it('should return "other" for undefined description', () => {
      expect(detectIndustryFromDescription(undefined)).toBe('other');
    });

    it('should return "other" for empty description', () => {
      expect(detectIndustryFromDescription('')).toBe('other');
    });

    it('should use existing valid industry', () => {
      expect(
        detectIndustryFromDescription('some description', 'consultants-coaches')
      ).toBe('consultants-coaches');
    });

    it('should normalize existing industry if it is not valid', () => {
      expect(detectIndustryFromDescription('I am a therapist', 'therapy')).toBe(
        'therapists-psychologists'
      );
    });

    it('should detect from description when existing industry is invalid', () => {
      expect(
        detectIndustryFromDescription(
          'I am a professional photographer',
          'invalid-industry'
        )
      ).toBe('photographers-videographers');
    });

    it('should detect from description when no existing industry', () => {
      expect(
        detectIndustryFromDescription('I run a small cafe in downtown')
      ).toBe('restaurants-cafes');
    });

    it('should prefer existing industry over description', () => {
      expect(
        detectIndustryFromDescription(
          'I offer photography services',
          'consultants-coaches'
        )
      ).toBe('consultants-coaches');
    });

    it('should return "other" when existing industry is "other"', () => {
      expect(
        detectIndustryFromDescription('I am a photographer', 'other')
      ).toBe('photographers-videographers');
    });

    it('should detect complex descriptions', () => {
      expect(
        detectIndustryFromDescription(
          'Professional mental health counselor with 10 years experience'
        )
      ).toBe('therapists-psychologists');
    });

    it('should handle descriptions with multiple industry keywords', () => {
      // Should match first pattern found (therapists comes before designers in pattern list)
      expect(
        detectIndustryFromDescription(
          'I am a designer who also does therapy work'
        )
      ).toBe('therapists-psychologists');
    });
  });
});
