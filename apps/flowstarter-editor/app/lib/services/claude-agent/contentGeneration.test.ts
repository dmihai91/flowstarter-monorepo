import { describe, it, expect } from 'vitest';
import { generateContentFiles, getDomainInfo } from './contentGeneration';
import type { SiteGenerationInput, IntegrationConfig } from './types';

describe('contentGeneration', () => {
  const baseInput: SiteGenerationInput = {
    projectId: 'test-project',
    siteName: 'Test Site',
    businessInfo: {
      name: 'Test Business',
      tagline: 'Making testing great',
      description: 'A test business for unit tests',
      services: ['Testing', 'Quality Assurance', 'Automation'],
      contact: {
        email: 'test@example.com',
        phone: '555-1234',
        address: '123 Test St',
      },
    },
    template: {
      slug: 'test-template',
      name: 'Test Template',
    },
    design: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      accentColor: '#60A5FA',
      fontFamily: 'Inter',
      headingFont: 'Poppins',
    },
  };

  describe('generateContentFiles', () => {
    it('should generate all required content files', () => {
      const files = generateContentFiles(baseInput);

      expect(files).toHaveProperty('content/site.md');
      expect(files).toHaveProperty('content/hero.md');
      expect(files).toHaveProperty('content/services.md');
      expect(files).toHaveProperty('content/testimonials.md');
      expect(files).toHaveProperty('content/pricing.md');
      expect(files).toHaveProperty('content/integrations/booking.md');
      expect(files).toHaveProperty('content/integrations/payments.md');
      expect(files).toHaveProperty('content/integrations/contact-form.md');
      expect(files).toHaveProperty('content/integrations/newsletter.md');
      expect(files).toHaveProperty('content/integrations/social-feed.md');
    });

    it('should include business name in site.md', () => {
      const files = generateContentFiles(baseInput);
      expect(files['content/site.md']).toContain('Test Business');
    });

    it('should include tagline in hero.md', () => {
      const files = generateContentFiles(baseInput);
      expect(files['content/hero.md']).toContain('Making testing great');
    });

    it('should include services in services.md', () => {
      const files = generateContentFiles(baseInput);
      expect(files['content/services.md']).toContain('Testing');
      expect(files['content/services.md']).toContain('Quality Assurance');
      expect(files['content/services.md']).toContain('Automation');
    });

    it('should include contact info in contact-form.md', () => {
      const files = generateContentFiles(baseInput);
      expect(files['content/integrations/contact-form.md']).toContain('test@example.com');
      expect(files['content/integrations/contact-form.md']).toContain('555-1234');
    });
  });

  describe('generateContentFiles with integrations', () => {
    it('should generate disabled booking.md when no integration provided', () => {
      const files = generateContentFiles(baseInput);
      expect(files['content/integrations/booking.md']).toContain('enabled: false');
      expect(files['content/integrations/booking.md']).toContain('provider: null');
    });

    it('should generate enabled booking.md with Calendly URL', () => {
      const inputWithCalendly: SiteGenerationInput = {
        ...baseInput,
        integrations: [
          {
            id: 'booking',
            name: 'Calendly',
            config: {
              provider: 'calendly',
              url: 'https://calendly.com/testuser/30min',
            },
          },
        ],
      };

      const files = generateContentFiles(inputWithCalendly);
      expect(files['content/integrations/booking.md']).toContain('enabled: true');
      expect(files['content/integrations/booking.md']).toContain('provider: "calendly"');
      expect(files['content/integrations/booking.md']).toContain('calendly_url: "https://calendly.com/testuser/30min"');
    });

    it('should generate enabled booking.md with Cal.com URL', () => {
      const inputWithCalcom: SiteGenerationInput = {
        ...baseInput,
        integrations: [
          {
            id: 'booking',
            name: 'Cal.com',
            config: {
              provider: 'calcom',
              url: 'https://cal.com/testuser/meeting',
            },
          },
        ],
      };

      const files = generateContentFiles(inputWithCalcom);
      expect(files['content/integrations/booking.md']).toContain('enabled: true');
      expect(files['content/integrations/booking.md']).toContain('provider: "calcom"');
      expect(files['content/integrations/booking.md']).toContain('calcom_url: "https://cal.com/testuser/meeting"');
    });

    it('should generate disabled newsletter.md when no integration provided', () => {
      const files = generateContentFiles(baseInput);
      expect(files['content/integrations/newsletter.md']).toContain('enabled: false');
      expect(files['content/integrations/newsletter.md']).toContain('provider: null');
    });

    it('should generate enabled newsletter.md with Mailchimp URL', () => {
      const inputWithMailchimp: SiteGenerationInput = {
        ...baseInput,
        integrations: [
          {
            id: 'newsletter',
            name: 'Mailchimp',
            config: {
              provider: 'mailchimp',
              url: 'https://test.us1.list-manage.com/subscribe/post?u=abc&id=123',
            },
          },
        ],
      };

      const files = generateContentFiles(inputWithMailchimp);
      expect(files['content/integrations/newsletter.md']).toContain('enabled: true');
      expect(files['content/integrations/newsletter.md']).toContain('provider: "mailchimp"');
      expect(files['content/integrations/newsletter.md']).toContain('form_action_url: "https://test.us1.list-manage.com/subscribe/post?u=abc&id=123"');
    });

    it('should generate enabled newsletter.md with ConvertKit URL', () => {
      const inputWithConvertKit: SiteGenerationInput = {
        ...baseInput,
        integrations: [
          {
            id: 'newsletter',
            name: 'ConvertKit',
            config: {
              provider: 'convertkit',
              url: 'https://app.convertkit.com/forms/123456/subscriptions',
            },
          },
        ],
      };

      const files = generateContentFiles(inputWithConvertKit);
      expect(files['content/integrations/newsletter.md']).toContain('enabled: true');
      expect(files['content/integrations/newsletter.md']).toContain('provider: "convertkit"');
      expect(files['content/integrations/newsletter.md']).toContain('form_action_url:');
    });

    it('should handle multiple integrations', () => {
      const inputWithMultiple: SiteGenerationInput = {
        ...baseInput,
        integrations: [
          {
            id: 'booking',
            name: 'Calendly',
            config: {
              provider: 'calendly',
              url: 'https://calendly.com/testuser/30min',
            },
          },
          {
            id: 'newsletter',
            name: 'Mailchimp',
            config: {
              provider: 'mailchimp',
              url: 'https://test.us1.list-manage.com/subscribe/post?u=abc&id=123',
            },
          },
        ],
      };

      const files = generateContentFiles(inputWithMultiple);
      
      // Booking should be enabled
      expect(files['content/integrations/booking.md']).toContain('enabled: true');
      expect(files['content/integrations/booking.md']).toContain('calendly_url:');
      
      // Newsletter should be enabled
      expect(files['content/integrations/newsletter.md']).toContain('enabled: true');
      expect(files['content/integrations/newsletter.md']).toContain('form_action_url:');
    });
  });

  describe('domain-specialized content', () => {
    it('should detect therapist domain and use appropriate content', () => {
      const therapistInput: SiteGenerationInput = {
        ...baseInput,
        businessInfo: {
          name: 'Safe Harbor Therapy',
          description: 'Licensed therapist helping with anxiety and depression',
          services: ['Anxiety Treatment', 'Depression Therapy', 'Couples Counseling'],
        },
      };

      const files = generateContentFiles(therapistInput);
      const domainInfo = getDomainInfo(therapistInput.businessInfo.description!);
      
      expect(domainInfo.domainId).toBe('therapist');
      expect(files['content/hero.md']).toContain('Safe & Confidential');
      expect(files['content/hero.md']).toContain('Clients Helped');
    });

    it('should detect fitness domain and use appropriate content', () => {
      const fitnessInput: SiteGenerationInput = {
        ...baseInput,
        businessInfo: {
          name: 'Iron Forge Fitness',
          description: 'Personal trainer specializing in strength training',
          services: ['Personal Training', 'Strength Coaching', 'Nutrition Planning'],
        },
      };

      const files = generateContentFiles(fitnessInput);
      const domainInfo = getDomainInfo(fitnessInput.businessInfo.description!);
      
      expect(domainInfo.domainId).toBe('fitness');
      expect(files['content/hero.md']).toContain('Results Guaranteed');
      expect(files['content/hero.md']).toContain('Transformations');
    });

    it('should detect yoga domain and use appropriate content', () => {
      const yogaInput: SiteGenerationInput = {
        ...baseInput,
        businessInfo: {
          name: 'Peaceful Flow Studio',
          description: 'Yoga and meditation classes for all levels',
          services: ['Vinyasa Flow', 'Meditation', 'Beginner Classes'],
        },
      };

      const files = generateContentFiles(yogaInput);
      const domainInfo = getDomainInfo(yogaInput.businessInfo.description!);
      
      expect(domainInfo.domainId).toBe('yoga');
      expect(files['content/hero.md']).toContain('All Levels Welcome');
    });

    it('should detect restaurant domain and use appropriate content', () => {
      const restaurantInput: SiteGenerationInput = {
        ...baseInput,
        businessInfo: {
          name: 'The Golden Fork',
          description: 'Italian restaurant with fresh pasta and local ingredients',
          services: ['Dinner', 'Lunch', 'Catering'],
        },
      };

      const files = generateContentFiles(restaurantInput);
      const domainInfo = getDomainInfo(restaurantInput.businessInfo.description!);
      
      expect(domainInfo.domainId).toBe('food');
      expect(files['content/testimonials.md']).toContain('Guest');
    });

    it('should use generic domain for unmatched descriptions', () => {
      const genericInput: SiteGenerationInput = {
        ...baseInput,
        businessInfo: {
          name: 'Acme Corp',
          description: 'We sell various products and services',
          services: ['Product A', 'Service B'],
        },
      };

      const files = generateContentFiles(genericInput);
      const domainInfo = getDomainInfo(genericInput.businessInfo.description!);
      
      expect(domainInfo.domainId).toBe('generic');
      expect(files['content/hero.md']).toContain('Trusted by Professionals');
    });
  });

  describe('edge cases', () => {
    it('should handle missing optional fields with domain-appropriate defaults', () => {
      const minimalInput: SiteGenerationInput = {
        projectId: 'minimal',
        siteName: 'Minimal Site',
        businessInfo: {
          name: 'Minimal Business',
        },
        template: {
          slug: 'basic',
          name: 'Basic',
        },
        design: {
          primaryColor: '#000000',
        },
      };

      const files = generateContentFiles(minimalInput);

      // Should still generate all files
      expect(Object.keys(files)).toHaveLength(11);
      
      // Should have business name
      expect(files['content/site.md']).toContain('Minimal Business');
      
      // Should have domain-appropriate headline (generic domain)
      expect(files['content/hero.md']).toMatch(/headline:/);
      expect(files['content/hero.md']).toContain('cta_primary:');
    });

    it('should handle empty services array', () => {
      const inputWithEmptyServices: SiteGenerationInput = {
        ...baseInput,
        businessInfo: {
          ...baseInput.businessInfo,
          services: [],
        },
      };

      const files = generateContentFiles(inputWithEmptyServices);
      
      // Should still generate services.md (may be empty or have defaults)
      expect(files['content/services.md']).toBeDefined();
      expect(files['content/services.md']).toContain('services:');
    });

    it('should handle special characters in business name', () => {
      const inputWithSpecialChars: SiteGenerationInput = {
        ...baseInput,
        businessInfo: {
          ...baseInput.businessInfo,
          name: "Mike's Café & Bar",
        },
      };

      const files = generateContentFiles(inputWithSpecialChars);
      
      // Should properly escape/handle special characters
      expect(files['content/site.md']).toContain("Mike's Café & Bar");
    });

    it('should handle undefined integrations array', () => {
      const inputWithoutIntegrations: SiteGenerationInput = {
        ...baseInput,
        integrations: undefined,
      };

      // Should not throw
      expect(() => generateContentFiles(inputWithoutIntegrations)).not.toThrow();
      
      const files = generateContentFiles(inputWithoutIntegrations);
      expect(files['content/integrations/booking.md']).toContain('enabled: false');
    });
  });
});
