import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates and normalizes project names to a standard format.
 * - Trims whitespace
 * - Collapses multiple spaces
 * - Allows letters, numbers, spaces, hyphens, apostrophes, and ampersands
 * - Enforces length 3-80
 */
export const NameValidator = {
  normalize(name: string): string {
    if (!name) return '';
    return (
      name
        .trim()
        // normalize whitespace
        .replace(/\s+/g, ' ')
        // normalize unicode quotes to ascii
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        // normalize en/em dashes to hyphen with spaces around
        .replace(/\s*[-–—]\s*/g, ' - ')
        // drop any characters outside allowed set (keep letters, numbers, space, period, ampersand, apostrophe, and hyphen)
        .replace(/[^A-Za-z0-9 .&'-]/g, '')
        // collapse multiple periods/spaces
        .replace(/\.{2,}/g, '.')
        .replace(/\s+/g, ' ')
        // ensure starts/ends with alphanumeric by trimming non-alphanumerics at boundaries
        .replace(/^[^A-Za-z0-9]+/, '')
        .replace(/[^A-Za-z0-9]+$/, '')
        // limit length to 80 to match server schema
        .slice(0, 80)
    );
  },

  isValid(name: string): { valid: boolean; error?: string } {
    if (!name || typeof name !== 'string') {
      return { valid: false, error: 'Name is required' };
    }

    const normalized = this.normalize(name);

    if (normalized.length < 3) {
      return { valid: false, error: 'Name must be at least 3 characters' };
    }
    if (normalized.length > 80) {
      return { valid: false, error: 'Name must be at most 80 characters' };
    }

    // Allow ASCII letters, numbers, spaces, hyphens, apostrophes, periods, and &; must start/end alphanumeric
    const allowedPattern = /^[A-Za-z0-9][A-Za-z0-9 .&'-]*[A-Za-z0-9]$/;
    if (!allowedPattern.test(normalized)) {
      return {
        valid: false,
        error:
          'Name can include letters, numbers, spaces, hyphens, apostrophes, periods, and &',
      };
    }

    return { valid: true };
  },
};

/**
 * Converts a name to a subdomain-safe slug (lowercase).
 */
export function nameToSubdomain(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}
