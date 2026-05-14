import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  formatTime,
  timeAgo,
  truncateText,
  compactRelative,
  formatTokenCount,
  formatEuro,
  getInitials,
} from '../format-utils';

describe('formatDate', () => {
  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatDate('invalid')).toBe('');
  });

  it('formats a valid date string', () => {
    const result = formatDate('2025-06-15', 'medium', 'en-US');
    expect(result).toContain('2025');
    expect(result).toContain('Jun');
  });

  it('formats short style', () => {
    const result = formatDate(new Date(2025, 0, 15), 'short', 'en-US');
    expect(result).toBeTruthy();
  });

  it('formats long style', () => {
    const result = formatDate(new Date(2025, 0, 15), 'long', 'en-US');
    expect(result).toContain('January');
  });
});

describe('formatTime', () => {
  it('returns empty for null', () => {
    expect(formatTime(null)).toBe('');
  });

  it('formats time from date', () => {
    const result = formatTime(new Date(2025, 0, 15, 14, 30), 'en-US');
    expect(result).toContain('30');
  });
});

describe('timeAgo', () => {
  it('returns empty for null', () => {
    expect(timeAgo(null)).toBe('');
  });

  it('returns "Just now" for recent dates', () => {
    expect(timeAgo(new Date())).toBe('Just now');
  });

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(timeAgo(fiveMinAgo)).toBe('5m ago');
  });

  it('returns hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(timeAgo(threeHoursAgo)).toBe('3h ago');
  });

  it('returns days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(timeAgo(twoDaysAgo)).toBe('2d ago');
  });

  it('falls back to formatted date for old dates', () => {
    const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = timeAgo(oldDate);
    expect(result).not.toContain('ago');
    expect(result).toBeTruthy();
  });
});

describe('compactRelative', () => {
  const BASE = '2025-06-15T12:00:00.000Z';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(BASE));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "<1m" for timestamps less than a minute ago', () => {
    const iso = new Date(new Date(BASE).getTime() - 10_000).toISOString();
    expect(compactRelative(iso)).toBe('<1m');
  });

  it('formats minutes without suffix', () => {
    const iso = new Date(new Date(BASE).getTime() - 5 * 60_000).toISOString();
    expect(compactRelative(iso)).toBe('5m');
  });

  it('formats hours without suffix', () => {
    const iso = new Date(
      new Date(BASE).getTime() - 3 * 3_600_000
    ).toISOString();
    expect(compactRelative(iso)).toBe('3h');
  });

  it('formats days without suffix', () => {
    const iso = new Date(
      new Date(BASE).getTime() - 3 * 86_400_000
    ).toISOString();
    expect(compactRelative(iso)).toBe('3d');
  });

  it('formats months without suffix', () => {
    const iso = new Date('2025-04-15T12:00:00.000Z').toISOString();
    expect(compactRelative(iso)).toBe('2mo');
  });

  it('formats years without suffix', () => {
    const iso = new Date('2023-06-15T12:00:00.000Z').toISOString();
    expect(compactRelative(iso)).toBe('2y');
  });

  it('strips filler words (about, almost, over)', () => {
    const result = compactRelative(
      new Date(new Date(BASE).getTime() - 5 * 60_000).toISOString()
    );
    expect(result).not.toContain('about');
    expect(result).not.toContain('almost');
    expect(result).not.toContain('over');
    expect(result).not.toContain('ago');
  });
});

describe('formatTokenCount', () => {
  it('formats millions to 2 decimal places', () => {
    expect(formatTokenCount(1_234_567)).toBe('1.23M');
  });

  it('formats tens-of-thousands to 1 decimal place', () => {
    expect(formatTokenCount(12_345)).toBe('12.3k');
  });

  it('formats thousands to 2 decimal places', () => {
    expect(formatTokenCount(1_234)).toBe('1.23k');
  });

  it('formats sub-thousands with locale string', () => {
    expect(formatTokenCount(999)).toMatch(/999/);
  });

  it('boundary: exactly 1_000 uses thousand format', () => {
    expect(formatTokenCount(1_000)).toBe('1.00k');
  });

  it('boundary: exactly 10_000 uses tens-of-thousands format', () => {
    expect(formatTokenCount(10_000)).toBe('10.0k');
  });

  it('boundary: exactly 1_000_000 uses million format', () => {
    expect(formatTokenCount(1_000_000)).toBe('1.00M');
  });
});

describe('formatEuro', () => {
  it('formats a positive integer as Euro', () => {
    const result = formatEuro(1234);
    expect(result).toContain('1,234');
    expect(result).toContain('€');
  });

  it('formats zero', () => {
    const result = formatEuro(0);
    expect(result).toContain('0');
    expect(result).toContain('€');
  });

  it('rounds to zero decimal places', () => {
    const result = formatEuro(1234);
    expect(result).not.toMatch(/\d\.\d/);
  });
});

describe('getInitials', () => {
  it('returns "?" for null', () => {
    expect(getInitials(null)).toBe('?');
  });

  it('returns "?" for undefined', () => {
    expect(getInitials(undefined)).toBe('?');
  });

  it('returns "?" for empty string', () => {
    expect(getInitials('')).toBe('?');
  });

  it('extracts initials from a full name', () => {
    expect(getInitials('Jane Doe')).toBe('JD');
  });

  it('handles a single word (only first letter)', () => {
    expect(getInitials('Acme')).toBe('A');
  });

  it('caps at 2 characters for multi-word names', () => {
    expect(getInitials('John Paul George Ringo')).toBe('JP');
  });

  it('extracts initials from an email address (splits on @)', () => {
    expect(getInitials('jane@example.com')).toBe('JE');
  });

  it('splits on dots as well', () => {
    expect(getInitials('first.last')).toBe('FL');
  });

  it('produces uppercase output', () => {
    expect(getInitials('alice bob')).toBe('AB');
  });

  it('falls back to "?" for a string of separators only', () => {
    expect(getInitials('   ')).toBe('?');
  });
});

describe('truncateText', () => {
  it('returns full text if under limit', () => {
    expect(truncateText('hello', 10)).toBe('hello');
  });

  it('truncates with ellipsis', () => {
    expect(truncateText('hello world this is long', 10)).toBe('hello worl…');
  });

  it('returns exact length text unchanged', () => {
    expect(truncateText('hello', 5)).toBe('hello');
  });
});
