import { describe, it, expect } from 'vitest';
import { parseMarkdownContent, replacePlaceholders } from './parseMarkdown.js';

describe('parseMarkdown', () => {
  describe('parseMarkdownContent', () => {
    it('should parse basic section with key-value pairs', () => {
      const markdown = `
## hero

title: Welcome
subtitle: This is a test
`;
      const result = parseMarkdownContent(markdown);

      expect(result.hero).toBeDefined();
      expect(result.hero.title).toBe('Welcome');
      expect(result.hero.subtitle).toBe('This is a test');
    });

    it('should preserve camelCase section names', () => {
      const markdown = `
## beforeAfter

title: Before and After

## serviceAreas

title: Service Areas
`;
      const result = parseMarkdownContent(markdown);

      expect(result.beforeAfter).toBeDefined();
      expect(result.beforeAfter.title).toBe('Before and After');
      expect(result.serviceAreas).toBeDefined();
      expect(result.serviceAreas.title).toBe('Service Areas');
      // Should NOT have lowercase versions
      expect(result['beforeafter']).toBeUndefined();
      expect(result['serviceareas']).toBeUndefined();
    });

    it('should remove spaces from section names', () => {
      const markdown = `
## My Section

title: Test
`;
      const result = parseMarkdownContent(markdown);

      expect(result.MySection).toBeDefined();
      expect(result['My Section']).toBeUndefined();
    });

    it('should parse arrays of simple strings', () => {
      const markdown = `
## areas

items:
  - Downtown
  - Westside
  - Northbrook
`;
      const result = parseMarkdownContent(markdown);

      expect(result.areas.items).toEqual(['Downtown', 'Westside', 'Northbrook']);
    });

    it('should parse arrays of objects', () => {
      const markdown = `
## navigation

links:
  - label: Home
    href: /
  - label: About
    href: /about
`;
      const result = parseMarkdownContent(markdown);

      expect(result.navigation.links).toHaveLength(2);
      expect((result.navigation.links as any[])[0]).toEqual({
        label: 'Home',
        href: '/',
      });
      expect((result.navigation.links as any[])[1]).toEqual({
        label: 'About',
        href: '/about',
      });
    });

    it('should keep text with colons as strings when key contains spaces', () => {
      const markdown = `
## about

paragraphs:
  - What started as a small family business has grown into something bigger: a trusted name
  - Our simple belief: every homeowner deserves quality work
`;
      const result = parseMarkdownContent(markdown);

      // These should be strings, not objects
      expect(result.about.paragraphs).toHaveLength(2);
      expect(typeof (result.about.paragraphs as any[])[0]).toBe('string');
      expect((result.about.paragraphs as any[])[0]).toContain('something bigger: a trusted');
      expect(typeof (result.about.paragraphs as any[])[1]).toBe('string');
      expect((result.about.paragraphs as any[])[1]).toContain('belief: every');
    });

    it('should parse nested objects', () => {
      const markdown = `
## contact

location:
  address: 123 Main St
  city: New York
  phone: 555-1234
`;
      const result = parseMarkdownContent(markdown);

      expect(result.contact.location).toBeDefined();
      const location = result.contact.location as Record<string, any>;
      expect(location.address).toBe('123 Main St');
      expect(location.city).toBe('New York');
      expect(location.phone).toBe('555-1234');
    });

    it('should parse boolean values', () => {
      const markdown = `
## settings

enabled: true
disabled: false
`;
      const result = parseMarkdownContent(markdown);

      expect(result.settings.enabled).toBe(true);
      expect(result.settings.disabled).toBe(false);
    });

    it('should parse integer numbers', () => {
      const markdown = `
## stats

count: 100
rating: 5
`;
      const result = parseMarkdownContent(markdown);

      expect(result.stats.count).toBe(100);
      expect(result.stats.rating).toBe(5);
    });

    it('should keep decimal ratings as strings', () => {
      const markdown = `
## stats

rating: 4.9
score: 3.5
`;
      const result = parseMarkdownContent(markdown);

      // Ratings like "4.9" should stay as strings
      expect(result.stats.rating).toBe('4.9');
      expect(result.stats.score).toBe('3.5');
    });

    it('should remove HTML comments', () => {
      const markdown = `
<!-- This is a comment -->
## hero

title: Test
<!-- Another comment -->
subtitle: Description
`;
      const result = parseMarkdownContent(markdown);

      expect(result.hero.title).toBe('Test');
      expect(result.hero.subtitle).toBe('Description');
    });

    it('should handle quoted strings', () => {
      const markdown = `
## content

single: 'Hello World'
double: "Hello World"
`;
      const result = parseMarkdownContent(markdown);

      expect(result.content.single).toBe('Hello World');
      expect(result.content.double).toBe('Hello World');
    });

    it('should parse complex real-world content', () => {
      const markdown = `
## hero

badge: Licensed & Insured
title: Expert Home Renovation
subtitle: Quality craftsmanship
primaryCta: Get Estimate
stats:
  - value: "2,500+"
    label: Projects
  - value: "15+"
    label: Years

## services

items:
  - icon: Hammer
    title: Kitchen Remodel
    description: Transform your kitchen
    price: From $15,000
`;
      const result = parseMarkdownContent(markdown);

      expect(result.hero.badge).toBe('Licensed & Insured');
      expect((result.hero.stats as any[]).length).toBe(2);
      expect((result.hero.stats as any[])[0].value).toBe('2,500+');

      expect((result.services.items as any[]).length).toBe(1);
      expect((result.services.items as any[])[0].icon).toBe('Hammer');
    });

    it('should handle empty sections gracefully', () => {
      const markdown = `
## empty

## filled

title: Has content
`;
      const result = parseMarkdownContent(markdown);

      expect(result.empty).toBeUndefined();
      expect(result.filled).toBeDefined();
      expect(result.filled.title).toBe('Has content');
    });

    it('should skip lines starting with # inside sections', () => {
      const markdown = `
## section

# This is a comment
title: Value
`;
      const result = parseMarkdownContent(markdown);

      expect(result.section.title).toBe('Value');
    });
  });

  describe('replacePlaceholders', () => {
    it('should replace simple placeholders', () => {
      const data = { title: 'Welcome to {{PROJECT_NAME}}' };
      const values = { PROJECT_NAME: 'My App' };

      const result = replacePlaceholders(data, values);

      expect(result.title).toBe('Welcome to My App');
    });

    it('should handle multiple placeholders', () => {
      const data = { text: '{{GREETING}} to {{NAME}}!' };
      const values = { GREETING: 'Hello', NAME: 'World' };

      const result = replacePlaceholders(data, values);

      expect(result.text).toBe('Hello to World!');
    });

    it('should handle placeholders with spaces', () => {
      const data = { text: '{{ PROJECT_NAME }} is great' };
      const values = { PROJECT_NAME: 'My App' };

      const result = replacePlaceholders(data, values);

      expect(result.text).toBe('My App is great');
    });

    it('should leave unknown placeholders unchanged', () => {
      const data = { text: 'Hello {{UNKNOWN}}' };
      const values = {};

      const result = replacePlaceholders(data, values);

      expect(result.text).toBe('Hello {{UNKNOWN}}');
    });

    it('should replace placeholders in nested objects', () => {
      const data = {
        hero: {
          title: '{{PROJECT_NAME}}',
          nested: {
            deep: '{{DESCRIPTION}}',
          },
        },
      };
      const values = { PROJECT_NAME: 'App', DESCRIPTION: 'Great app' };

      const result = replacePlaceholders(data, values);

      expect(result.hero.title).toBe('App');
      expect(result.hero.nested.deep).toBe('Great app');
    });

    it('should replace placeholders in arrays', () => {
      const data = {
        items: ['{{A}}', '{{B}}', 'static'],
      };
      const values = { A: 'First', B: 'Second' };

      const result = replacePlaceholders(data, values);

      expect(result.items).toEqual(['First', 'Second', 'static']);
    });

    it('should handle arrays of objects with placeholders', () => {
      const data = {
        links: [
          { label: '{{NAV_HOME}}', href: '/' },
          { label: '{{NAV_ABOUT}}', href: '/about' },
        ],
      };
      const values = { NAV_HOME: 'Home', NAV_ABOUT: 'About Us' };

      const result = replacePlaceholders(data, values);

      expect(result.links[0].label).toBe('Home');
      expect(result.links[1].label).toBe('About Us');
    });

    it('should not modify non-string values', () => {
      const data = {
        count: 42,
        enabled: true,
        items: [1, 2, 3],
      };
      const values = { ANY: 'value' };

      const result = replacePlaceholders(data, values);

      expect(result.count).toBe(42);
      expect(result.enabled).toBe(true);
      expect(result.items).toEqual([1, 2, 3]);
    });
  });

  describe('integration: parse and replace', () => {
    it('should parse markdown and replace placeholders', () => {
      const markdown = `
## hero

title: Welcome to {{PROJECT_NAME}}
subtitle: {{PROJECT_DESCRIPTION}}

## footer

copyright: © {{YEAR}} {{PROJECT_NAME}}
`;
      const values = {
        PROJECT_NAME: 'My Company',
        PROJECT_DESCRIPTION: 'We build great things',
        YEAR: '2024',
      };

      const parsed = parseMarkdownContent(markdown);
      const result = replacePlaceholders(parsed, values);

      expect(result.hero.title).toBe('Welcome to My Company');
      expect(result.hero.subtitle).toBe('We build great things');
      expect(result.footer.copyright).toBe('© 2024 My Company');
    });
  });
});
