/**
 * Tests for Site Content Agent
 * 
 * Tests domain detection, content suggestions, and
 * domain-specific configurations.
 */

import { describe, it, expect } from 'vitest';
import {
  detectDomain,
  getContentPrompt,
  getRecommendedSections,
  getDesignRecommendations,
  getConversionSettings,
  getSampleHeadlines,
  getContentSuggestions,
  getAllDomainIds,
  getDomainById,
} from './index';

describe('Domain Detection', () => {
  it('detects therapist domain from various keywords', () => {
    const therapistDescriptions = [
      'I am a therapist helping people with anxiety',
      'Licensed counselor specializing in trauma',
      'Mental health practice in Seattle',
      'Psychologist offering therapy sessions',
      'Marriage counseling services',
    ];

    therapistDescriptions.forEach(desc => {
      const domain = detectDomain(desc);
      expect(domain.id).toBe('therapist');
    });
  });

  it('detects fitness domain from various keywords', () => {
    const fitnessDescriptions = [
      'Personal trainer for busy professionals',
      'CrossFit gym in downtown',
      'Strength training and conditioning coach',
      'Fitness coaching for weight loss',
    ];

    fitnessDescriptions.forEach(desc => {
      const domain = detectDomain(desc);
      expect(domain.id).toBe('fitness');
    });
  });

  it('returns generic domain for unmatched descriptions', () => {
    const genericDescriptions = [
      'Handmade jewelry business',
      'Consulting services',
      'Something completely unique',
      '',
    ];

    genericDescriptions.forEach(desc => {
      const domain = detectDomain(desc);
      expect(domain.id).toBe('generic');
    });
  });

  it('is case-insensitive', () => {
    expect(detectDomain('THERAPIST').id).toBe('therapist');
    expect(detectDomain('Personal Trainer').id).toBe('fitness');
  });
});

describe('Content Prompt Generation', () => {
  it('returns domain-specific prompts', () => {
    const therapistPrompt = getContentPrompt({ description: 'therapist practice' });
    expect(therapistPrompt).toContain('therapy');
    expect(therapistPrompt).toContain('safe');
    expect(therapistPrompt).toContain('confidential');

    const fitnessPrompt = getContentPrompt({ description: 'personal trainer' });
    expect(fitnessPrompt).toContain('fitness');
    expect(fitnessPrompt).toContain('transformation');
    expect(fitnessPrompt).toContain('results');
  });

  it('includes business context in prompts', () => {
    const prompt = getContentPrompt({
      description: 'therapist',
      ownerName: 'Dr. Sarah Mitchell',
      location: 'Seattle, WA',
      services: ['Anxiety', 'Depression', 'Trauma'],
    });

    expect(prompt).toContain('Dr. Sarah Mitchell');
    expect(prompt).toContain('Seattle');
    expect(prompt).toContain('Anxiety');
  });
});

describe('Section Recommendations', () => {
  it('returns domain-specific sections', () => {
    const therapistSections = getRecommendedSections('therapist');
    expect(therapistSections.required).toContain('hero');
    expect(therapistSections.required).toContain('about');
    expect(therapistSections.required).toContain('services');
    expect(therapistSections.required).toContain('contact');
    expect(therapistSections.recommended).toContain('faq');

    const fitnessSections = getRecommendedSections('personal trainer');
    expect(fitnessSections.required).toContain('programs');
    expect(fitnessSections.recommended).toContain('results');
    expect(fitnessSections.recommended).toContain('testimonials');
  });

  it('returns different sections for different domains', () => {
    const therapist = getRecommendedSections('therapist');
    const fitness = getRecommendedSections('personal trainer');

    // Therapist has 'approach', fitness has 'programs'
    expect(therapist.recommended).toContain('approach');
    expect(fitness.required).toContain('programs');
  });
});

describe('Design Recommendations', () => {
  it('returns calming design for therapists', () => {
    const design = getDesignRecommendations('therapist');
    
    expect(design.colorMoods).toContain('calming');
    expect(design.colorMoods).toContain('warm');
    expect(design.layoutStyle).toContain('spacious');
  });

  it('returns energetic design for fitness', () => {
    const design = getDesignRecommendations('personal trainer');
    
    expect(design.colorMoods).toContain('bold');
    expect(design.colorMoods).toContain('energetic');
    expect(design.layoutStyle).toContain('dynamic');
  });
});

describe('Conversion Settings', () => {
  it('uses low urgency for therapists', () => {
    const conversion = getConversionSettings('therapist');
    
    expect(conversion.urgencyLevel).toBe('low');
    expect(conversion.trustPriority).toBe('high');
    expect(conversion.primaryCta).toContain('Consultation');
  });

  it('uses medium urgency for fitness', () => {
    const conversion = getConversionSettings('personal trainer');
    
    expect(conversion.urgencyLevel).toBe('medium');
    expect(conversion.primaryCta).toContain('Transformation');
  });
});

describe('Sample Headlines', () => {
  it('returns warm headlines for therapists', () => {
    const headlines = getSampleHeadlines('therapist');
    
    expect(headlines.length).toBeGreaterThan(0);
    // Therapist headlines should feel safe/supportive
    const hasWarmTone = headlines.some(h => 
      h.includes('Safe') || 
      h.includes('Alone') || 
      h.includes('Heard') ||
      h.includes('Compassion')
    );
    expect(hasWarmTone).toBe(true);
  });

  it('returns motivating headlines for fitness', () => {
    const headlines = getSampleHeadlines('personal trainer');
    
    expect(headlines.length).toBeGreaterThan(0);
    // Fitness headlines should feel energetic
    const hasEnergy = headlines.some(h => 
      h.includes('Transform') || 
      h.includes('Strongest') || 
      h.includes('Results') ||
      h.includes('Potential')
    );
    expect(hasEnergy).toBe(true);
  });
});

describe('Content Suggestions', () => {
  it('returns comprehensive suggestions for domain', () => {
    const suggestions = getContentSuggestions('therapist helping with anxiety');
    
    expect(suggestions.headlines.length).toBeGreaterThan(0);
    expect(suggestions.ctas.length).toBe(2);
    expect(suggestions.sections.length).toBeGreaterThan(3);
    expect(suggestions.designNotes.length).toBeGreaterThan(0);
  });

  it('includes primary and secondary CTAs', () => {
    const suggestions = getContentSuggestions('personal trainer');
    
    expect(suggestions.ctas).toContain('Start Your Transformation');
    expect(suggestions.ctas).toContain('See Success Stories');
  });
});

describe('Domain Registry', () => {
  it('lists all registered domains', () => {
    const ids = getAllDomainIds();
    
    expect(ids).toContain('therapist');
    expect(ids).toContain('fitness');
    expect(ids).toContain('generic');
  });

  it('retrieves domain by ID', () => {
    const therapist = getDomainById('therapist');
    expect(therapist).toBeDefined();
    expect(therapist?.name).toBe('Therapy & Counseling');

    const fitness = getDomainById('fitness');
    expect(fitness).toBeDefined();
    expect(fitness?.name).toBe('Fitness & Personal Training');
  });

  it('returns undefined for unknown domain ID', () => {
    const unknown = getDomainById('nonexistent');
    expect(unknown).toBeUndefined();
  });
});

describe('Contrast: Domain Differences', () => {
  it('therapist vs fitness have distinctly different approaches', () => {
    const therapistDesign = getDesignRecommendations('therapist');
    const fitnessDesign = getDesignRecommendations('fitness');
    
    // Colors should be different
    expect(therapistDesign.colorMoods).not.toEqual(fitnessDesign.colorMoods);
    
    // Layout styles should be different
    expect(therapistDesign.layoutStyle).not.toEqual(fitnessDesign.layoutStyle);
  });

  it('therapist vs fitness have different conversion strategies', () => {
    const therapistConv = getConversionSettings('therapist');
    const fitnessConv = getConversionSettings('fitness');
    
    // Urgency levels should differ
    expect(therapistConv.urgencyLevel).not.toEqual(fitnessConv.urgencyLevel);
    
    // CTAs should be different
    expect(therapistConv.primaryCta).not.toEqual(fitnessConv.primaryCta);
  });

  it('therapist vs fitness recommend different sections', () => {
    const therapistSections = getRecommendedSections('therapist');
    const fitnessSections = getRecommendedSections('fitness');
    
    // Fitness has 'results', therapist might not
    const fitnessHasResults = fitnessSections.recommended.includes('results');
    const therapistHasApproach = therapistSections.recommended.includes('approach');
    
    expect(fitnessHasResults).toBe(true);
    expect(therapistHasApproach).toBe(true);
  });
});
