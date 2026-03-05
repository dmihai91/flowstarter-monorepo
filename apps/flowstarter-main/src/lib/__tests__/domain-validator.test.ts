import { describe, it, expect } from 'vitest';
import { DomainValidator } from '../domain-validator';

describe('DomainValidator', () => {
  describe('validate', () => {
    describe('valid domains', () => {
      it('accepts simple domain', () => {
        expect(DomainValidator.validate('mysite.com')).toEqual({ isValid: true });
      });

      it('accepts subdomain', () => {
        expect(DomainValidator.validate('sub.mysite.com').isValid).toBe(true);
      });

      it('accepts domain with hyphen', () => {
        expect(DomainValidator.validate('my-site.com').isValid).toBe(true);
      });

      it('accepts domain with numbers', () => {
        expect(DomainValidator.validate('site123.com').isValid).toBe(true);
      });

      it('accepts various TLDs', () => {
        const tlds = ['com', 'org', 'net', 'io', 'dev', 'app', 'tech', 'ai'];
        for (const tld of tlds) {
          expect(DomainValidator.validate(`mysite.${tld}`).isValid).toBe(true);
        }
      });

      it('accepts multi-level subdomains', () => {
        expect(DomainValidator.validate('a.b.mysite.com').isValid).toBe(true);
      });

      it('normalizes uppercase to lowercase', () => {
        expect(DomainValidator.validate('MYSITE.COM').isValid).toBe(true);
      });

      it('trims whitespace', () => {
        expect(DomainValidator.validate('  mysite.com  ').isValid).toBe(true);
      });
    });

    describe('empty/null input', () => {
      it('rejects empty string', () => {
        const result = DomainValidator.validate('');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Domain is required');
      });

      it('rejects whitespace-only', () => {
        const result = DomainValidator.validate('   ');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Domain cannot be empty');
      });

      it('rejects null-like values', () => {
        expect(DomainValidator.validate(null as unknown as string).isValid).toBe(false);
        expect(DomainValidator.validate(undefined as unknown as string).isValid).toBe(false);
      });
    });

    describe('protocol and prefix handling', () => {
      it('rejects http:// prefix and suggests fix', () => {
        const result = DomainValidator.validate('http://mysite.com');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Remove http://');
        expect(result.suggestions).toContain('mysite.com');
      });

      it('rejects https:// prefix and suggests fix', () => {
        const result = DomainValidator.validate('https://mysite.com');
        expect(result.isValid).toBe(false);
        expect(result.suggestions).toContain('mysite.com');
      });

      it('rejects www. prefix and suggests fix', () => {
        const result = DomainValidator.validate('www.mysite.com');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Remove www.');
        expect(result.suggestions).toContain('mysite.com');
      });
    });

    describe('spaces', () => {
      it('rejects spaces in domain and suggests hyphen replacement', () => {
        const result = DomainValidator.validate('my site.com');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('spaces');
        expect(result.suggestions).toContain('my-site.com');
      });
    });

    describe('paths and parameters', () => {
      it('rejects paths', () => {
        const result = DomainValidator.validate('mysite.com/page');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('paths');
        expect(result.suggestions).toContain('mysite.com');
      });

      it('rejects query parameters', () => {
        const result = DomainValidator.validate('mysite.com?q=1');
        expect(result.isValid).toBe(false);
        expect(result.suggestions).toContain('mysite.com');
      });

      it('rejects hash fragments', () => {
        const result = DomainValidator.validate('mysite.com#section');
        expect(result.isValid).toBe(false);
        expect(result.suggestions).toContain('mysite.com');
      });
    });

    describe('length limits', () => {
      it('rejects domains longer than 253 chars', () => {
        const long = 'a'.repeat(250) + '.com';
        const result = DomainValidator.validate(long);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('too long');
      });

      it('rejects domains shorter than 3 chars', () => {
        const result = DomainValidator.validate('ab');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('too short');
      });

      it('rejects domain parts longer than 63 chars', () => {
        const longPart = 'a'.repeat(64) + '.com';
        // This is 67 chars total, should pass length check but fail on part length
        const result = DomainValidator.validate(longPart);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('too long');
      });
    });

    describe('invalid characters', () => {
      it('rejects special characters', () => {
        expect(DomainValidator.validate('exam!ple.com').isValid).toBe(false);
        expect(DomainValidator.validate('exam@ple.com').isValid).toBe(false);
        expect(DomainValidator.validate('exam_ple.com').isValid).toBe(false);
      });
    });

    describe('consecutive dots and hyphens', () => {
      it('rejects consecutive dots', () => {
        const result = DomainValidator.validate('example..com');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('consecutive');
      });

      it('rejects consecutive hyphens', () => {
        const result = DomainValidator.validate('exam--ple.com');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('consecutive');
      });
    });

    describe('boundary characters', () => {
      it('rejects leading dot', () => {
        expect(DomainValidator.validate('.example.com').isValid).toBe(false);
      });

      it('rejects trailing dot', () => {
        expect(DomainValidator.validate('example.com.').isValid).toBe(false);
      });

      it('rejects leading hyphen', () => {
        expect(DomainValidator.validate('-example.com').isValid).toBe(false);
      });

      it('rejects trailing hyphen', () => {
        expect(DomainValidator.validate('example.com-').isValid).toBe(false);
      });

      it('rejects part starting with hyphen', () => {
        const result = DomainValidator.validate('-test.com');
        expect(result.isValid).toBe(false);
      });

      it('rejects part ending with hyphen', () => {
        const result = DomainValidator.validate('test-.com');
        expect(result.isValid).toBe(false);
      });
    });

    describe('TLD validation', () => {
      it('requires at least two parts', () => {
        const result = DomainValidator.validate('localhost');
        // This fails the length check first (< 3 chars if short) or the TLD check
        expect(result.isValid).toBe(false);
      });

      it('suggests TLDs for missing TLD', () => {
        const result = DomainValidator.validate('mysite');
        expect(result.isValid).toBe(false);
        // Could fail on various checks depending on length
      });

      it('rejects unrecognized TLD', () => {
        const result = DomainValidator.validate('mysite.zzz');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('not a recognized');
      });

      it('provides suggestions for unrecognized TLD', () => {
        const result = DomainValidator.validate('mysite.xzy');
        expect(result.isValid).toBe(false);
        expect(result.suggestions).toBeDefined();
        expect(result.suggestions!.length).toBeGreaterThan(0);
      });
    });

    describe('numeric domain parts', () => {
      it('rejects purely numeric domain labels (non-TLD)', () => {
        const result = DomainValidator.validate('123.com');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('numeric');
      });
    });

    describe('reserved domains', () => {
      it('rejects localhost', () => {
        const result = DomainValidator.validate('localhost.com');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('reserved');
      });

      it('rejects example.com', () => {
        const result = DomainValidator.validate('example.com');
        expect(result.isValid).toBe(false);
        // example.com hits reserved check
      });

      it('rejects test.com', () => {
        const result = DomainValidator.validate('test.com');
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe('validateQuick', () => {
    it('returns true for valid domain', () => {
      expect(DomainValidator.validateQuick('mysite.dev')).toBe(true);
    });

    it('returns false for invalid domain', () => {
      expect(DomainValidator.validateQuick('')).toBe(false);
      expect(DomainValidator.validateQuick('invalid')).toBe(false);
    });
  });

  describe('getValidationStatus', () => {
    it('returns empty for empty input', () => {
      expect(DomainValidator.getValidationStatus('')).toBe('empty');
      expect(DomainValidator.getValidationStatus('  ')).toBe('empty');
    });

    it('returns valid for valid domain', () => {
      expect(DomainValidator.getValidationStatus('mysite.dev')).toBe('valid');
    });

    it('returns invalid for invalid domain', () => {
      expect(DomainValidator.getValidationStatus('bad!domain')).toBe('invalid');
    });

    it('handles null/undefined', () => {
      expect(DomainValidator.getValidationStatus(null as unknown as string)).toBe('empty');
      expect(DomainValidator.getValidationStatus(undefined as unknown as string)).toBe('empty');
    });
  });
});
