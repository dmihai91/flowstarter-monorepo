import { describe, expect, it } from 'vitest';
import { formatDate, formatTime, timeAgo, truncateText } from '../format-utils';

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
