import { describe, expect, it } from 'vitest';
import {
  parseClientEditableContent,
  upsertFrontmatterValue,
  upsertNestedFrontmatterValue,
} from './clientEditableContent';

describe('clientEditableContent', () => {
  it('parses root-level and nested contact fields from site and hero content', () => {
    const result = parseClientEditableContent([
      {
        path: 'content/hero.md',
        content: '---\nheadline: "Hello"\nsubheadline: "Welcome here"\n---\n',
      },
      {
        path: 'content/site.md',
        content:
          '---\nname: "Studio North"\ntagline: "Bold work"\ndescription: "A modern studio."\ncontact:\n  email: "hello@example.com"\n  phone: "555-0101"\n  address: "Bucharest"\n---\n',
      },
    ]);

    expect(result.siteName).toBe('Studio North');
    expect(result.heroHeadline).toBe('Hello');
    expect(result.contactEmail).toBe('hello@example.com');
    expect(result.contactLocation).toBe('Bucharest');
  });

  it('updates existing root and nested frontmatter values', () => {
    const rootUpdated = upsertFrontmatterValue('---\nheadline: "Old"\n---\n', 'headline', 'New');
    const nestedUpdated = upsertNestedFrontmatterValue(
      '---\ncontact:\n  email: "old@example.com"\n---\n',
      'contact',
      'email',
      'new@example.com',
    );

    expect(rootUpdated).toContain('headline: "New"');
    expect(nestedUpdated).toContain('email: "new@example.com"');
  });
});
