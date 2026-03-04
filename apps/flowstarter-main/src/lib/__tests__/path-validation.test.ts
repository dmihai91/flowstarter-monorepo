import { describe, it, expect, vi } from 'vitest';
import {
  validateResourceId,
  validatePathWithinBase,
  validateTemplateId,
  validateUUID,
  sanitizeFilename,
} from '../path-validation';

describe('path-validation', () => {
  describe('validateResourceId', () => {
    it('accepts valid alphanumeric ID', () => {
      const result = validateResourceId('personal-brand-pro');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('personal-brand-pro');
    });

    it('accepts ID with underscores', () => {
      expect(validateResourceId('my_template_1').valid).toBe(true);
    });

    it('accepts ID with hyphens and numbers', () => {
      expect(validateResourceId('template-123').valid).toBe(true);
    });

    it('trims whitespace', () => {
      const result = validateResourceId('  my-id  ');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('my-id');
    });

    describe('null/undefined/empty', () => {
      it('rejects null by default', () => {
        const result = validateResourceId(null);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('ID is required');
      });

      it('rejects undefined by default', () => {
        const result = validateResourceId(undefined);
        expect(result.valid).toBe(false);
      });

      it('allows null when allowEmpty is true', () => {
        const result = validateResourceId(null, { allowEmpty: true });
        expect(result.valid).toBe(true);
      });

      it('rejects empty string by default', () => {
        const result = validateResourceId('');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('ID cannot be empty');
      });

      it('allows empty string when allowEmpty is true', () => {
        const result = validateResourceId('', { allowEmpty: true });
        expect(result.valid).toBe(true);
      });
    });

    describe('length limits', () => {
      it('rejects ID exceeding default max length (64)', () => {
        const longId = 'a'.repeat(65);
        const result = validateResourceId(longId);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('maximum length');
      });

      it('accepts ID at max length', () => {
        const id = 'a'.repeat(64);
        expect(validateResourceId(id).valid).toBe(true);
      });

      it('respects custom maxLength', () => {
        expect(validateResourceId('abcde', { maxLength: 4 }).valid).toBe(false);
        expect(validateResourceId('abcd', { maxLength: 4 }).valid).toBe(true);
      });
    });

    describe('path traversal detection', () => {
      it('rejects parent directory traversal (..)', () => {
        expect(validateResourceId('..').valid).toBe(false);
      });

      it('rejects encoded dot (%2e)', () => {
        expect(validateResourceId('%2e%2e').valid).toBe(false);
      });

      it('rejects encoded slash (%2f)', () => {
        expect(validateResourceId('path%2ffile').valid).toBe(false);
      });

      it('rejects encoded backslash (%5c)', () => {
        expect(validateResourceId('path%5cfile').valid).toBe(false);
      });

      it('rejects backslash', () => {
        expect(validateResourceId('path\\file').valid).toBe(false);
      });

      it('rejects null bytes', () => {
        expect(validateResourceId('file\0name').valid).toBe(false);
      });

      it('rejects control characters', () => {
        expect(validateResourceId('file\x01name').valid).toBe(false);
      });
    });

    describe('character validation', () => {
      it('rejects dots', () => {
        expect(validateResourceId('file.html').valid).toBe(false);
      });

      it('rejects slashes', () => {
        expect(validateResourceId('path/file').valid).toBe(false);
      });

      it('rejects spaces', () => {
        expect(validateResourceId('my template').valid).toBe(false);
      });

      it('rejects special characters', () => {
        expect(validateResourceId('file@name').valid).toBe(false);
        expect(validateResourceId('file#name').valid).toBe(false);
        expect(validateResourceId('file$name').valid).toBe(false);
      });
    });
  });

  describe('validatePathWithinBase', () => {
    it('accepts path within base directory', () => {
      const result = validatePathWithinBase('/app/templates', 'personal-brand-pro/index.html');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toContain('personal-brand-pro');
    });

    it('accepts exact base directory', () => {
      const result = validatePathWithinBase('/app/templates', '.');
      expect(result.valid).toBe(true);
    });

    it('rejects path traversal above base', () => {
      const result = validatePathWithinBase('/app/templates', '../../etc/passwd');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('within the allowed directory');
    });

    it('rejects empty base path', () => {
      const result = validatePathWithinBase('', 'file.txt');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('rejects empty target path', () => {
      const result = validatePathWithinBase('/app', '');
      expect(result.valid).toBe(false);
    });

    it('prevents partial directory name matching', () => {
      // /app/templates-backup should not match /app/templates base
      const result = validatePathWithinBase('/app/templates', '../templates-backup/file.txt');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateTemplateId', () => {
    const allowed = ['personal-brand-pro', 'local-business-pro', 'saas-product-pro'] as const;

    it('accepts allowed template ID', () => {
      const result = validateTemplateId('personal-brand-pro', allowed);
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('personal-brand-pro');
    });

    it('rejects unknown template ID', () => {
      const result = validateTemplateId('unknown-template', allowed);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Template not found');
    });

    it('rejects invalid resource ID format', () => {
      const result = validateTemplateId('../evil', allowed);
      expect(result.valid).toBe(false);
    });

    it('rejects empty template ID', () => {
      const result = validateTemplateId('', allowed);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateUUID', () => {
    it('accepts valid UUID', () => {
      const result = validateUUID('550e8400-e29b-41d4-a716-446655440000');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('normalizes uppercase UUID', () => {
      const result = validateUUID('550E8400-E29B-41D4-A716-446655440000');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('trims whitespace', () => {
      const result = validateUUID('  550e8400-e29b-41d4-a716-446655440000  ');
      expect(result.valid).toBe(true);
    });

    it('rejects null', () => {
      expect(validateUUID(null).valid).toBe(false);
    });

    it('rejects undefined', () => {
      expect(validateUUID(undefined).valid).toBe(false);
    });

    it('rejects non-string', () => {
      expect(validateUUID(123 as unknown as string).valid).toBe(false);
    });

    it('rejects malformed UUID', () => {
      expect(validateUUID('not-a-uuid').valid).toBe(false);
      expect(validateUUID('550e8400-e29b-41d4-a716').valid).toBe(false);
      expect(validateUUID('550e8400e29b41d4a716446655440000').valid).toBe(false);
    });

    it('rejects UUID with invalid characters', () => {
      expect(validateUUID('550e8400-e29b-41d4-a716-44665544000g').valid).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('sanitizes basic input', () => {
      expect(sanitizeFilename('My File Name')).toBe('my-file-name');
    });

    it('removes special characters', () => {
      expect(sanitizeFilename('file@#$%.txt')).toBe('file-txt');
    });

    it('collapses multiple hyphens', () => {
      expect(sanitizeFilename('file---name')).toBe('file-name');
    });

    it('removes leading/trailing hyphens', () => {
      expect(sanitizeFilename('---file---')).toBe('file');
    });

    it('handles empty input', () => {
      expect(sanitizeFilename('')).toBe('file');
      expect(sanitizeFilename('   ')).toBe('file');
      expect(sanitizeFilename('!!!!')).toBe('file');
    });

    it('truncates to 64 characters', () => {
      const long = 'a'.repeat(100);
      expect(sanitizeFilename(long).length).toBeLessThanOrEqual(64);
    });

    it('appends extension', () => {
      expect(sanitizeFilename('myfile', 'html')).toBe('myfile.html');
      expect(sanitizeFilename('myfile', '.html')).toBe('myfile.html');
    });

    it('preserves underscores and hyphens', () => {
      expect(sanitizeFilename('my_file-name')).toBe('my_file-name');
    });

    it('lowercases input', () => {
      expect(sanitizeFilename('MyFile')).toBe('myfile');
    });
  });
});
