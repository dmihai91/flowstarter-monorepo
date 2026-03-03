import { describe, it, expect } from "vitest";
import { renderHook } from '@testing-library/react';
import { useFormatDate, formatDateString } from '../useFormatDate';

describe('useFormatDate', () => {
  const testDate = new Date('2025-11-21T14:30:00Z');

  describe('formatDate', () => {
    it('should format date with default medium style', () => {
      const { result } = renderHook(() => useFormatDate('en-US'));
      const formatted = result.current.formatDate(testDate);
      expect(formatted).toMatch(/Nov(ember)?\s+21,?\s+2025/);
    });

    it('should format date with short style', () => {
      const { result } = renderHook(() => useFormatDate('en-US'));
      const formatted = result.current.formatDate(testDate, { style: 'short' });
      expect(formatted).toMatch(/11\/21\/2025|11\/21\/25/);
    });

    it('should format date with long style', () => {
      const { result } = renderHook(() => useFormatDate('en-US'));
      const formatted = result.current.formatDate(testDate, { style: 'long' });
      expect(formatted).toMatch(/November\s+21,?\s+2025/);
    });

    it('should format date with time when includeTime is true', () => {
      const { result } = renderHook(() => useFormatDate('en-US'));
      const formatted = result.current.formatDate(testDate, {
        includeTime: true,
      });
      expect(formatted).toMatch(/Nov|21|2025/);
      expect(formatted).toMatch(/\d{1,2}:\d{2}/); // Time pattern
    });

    it('should handle string dates', () => {
      const { result } = renderHook(() => useFormatDate('en-US'));
      const formatted = result.current.formatDate('2025-11-21T14:30:00Z');
      expect(formatted).toMatch(/Nov(ember)?\s+21,?\s+2025/);
    });

    it('should return empty string for null', () => {
      const { result } = renderHook(() => useFormatDate('en-US'));
      expect(result.current.formatDate(null)).toBe('');
    });

    it('should return empty string for invalid date', () => {
      const { result } = renderHook(() => useFormatDate('en-US'));
      expect(result.current.formatDate('invalid-date')).toBe('');
    });

    it('should respect different locales', () => {
      const { result: usResult } = renderHook(() => useFormatDate('en-US'));
      const { result: deResult } = renderHook(() => useFormatDate('de-DE'));

      const usFormatted = usResult.current.formatDate(testDate, {
        style: 'short',
      });
      const deFormatted = deResult.current.formatDate(testDate, {
        style: 'short',
      });

      // US: MM/DD/YYYY, DE: DD.MM.YYYY
      expect(usFormatted).not.toBe(deFormatted);
    });
  });

  describe('formatTimeAgo', () => {
    it('should return "Just now" for recent dates', () => {
      const { result } = renderHook(() => useFormatDate('en-US'));
      const now = new Date();
      expect(result.current.formatTimeAgo(now)).toBe('Just now');
    });

    it('should format minutes ago', () => {
      const { result } = renderHook(() => useFormatDate('en-US'));
      const date = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      expect(result.current.formatTimeAgo(date)).toBe('30m ago');
    });

    it('should format hours ago', () => {
      const { result } = renderHook(() => useFormatDate('en-US'));
      const date = new Date(Date.now() - 5 * 60 * 60 * 1000); // 5 hours ago
      expect(result.current.formatTimeAgo(date)).toBe('5h ago');
    });

    it('should format days ago', () => {
      const { result } = renderHook(() => useFormatDate('en-US'));
      const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      expect(result.current.formatTimeAgo(date)).toBe('3d ago');
    });

    it('should format weeks ago', () => {
      const { result } = renderHook(() => useFormatDate('en-US'));
      const date = new Date(Date.now() - 2 * 7 * 24 * 60 * 60 * 1000); // 2 weeks ago
      expect(result.current.formatTimeAgo(date)).toBe('2w ago');
    });

    it('should fall back to short date for older dates', () => {
      const { result } = renderHook(() => useFormatDate('en-US'));
      const date = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago
      const formatted = result.current.formatTimeAgo(date);
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
    });

    it('should return empty string for null', () => {
      const { result } = renderHook(() => useFormatDate('en-US'));
      expect(result.current.formatTimeAgo(null)).toBe('');
    });
  });

  describe('formatRelative', () => {
    it('should format relative dates using Intl.RelativeTimeFormat', () => {
      const { result } = renderHook(() => useFormatDate('en-US'));
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const formatted = result.current.formatRelative(yesterday);
      expect(formatted).toMatch(/yesterday|1 day ago/i);
    });

    it('should handle future dates', () => {
      const { result } = renderHook(() => useFormatDate('en-US'));
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const formatted = result.current.formatRelative(tomorrow);
      expect(formatted).toMatch(/tomorrow|in 1 day/i);
    });
  });
});

describe('formatDateString (standalone)', () => {
  const testDate = new Date('2025-11-21T14:30:00Z');

  it('should format date with default options', () => {
    const formatted = formatDateString(testDate, { locale: 'en-US' });
    expect(formatted).toMatch(/Nov(ember)?\s+21,?\s+2025/);
  });

  it('should format date with short style', () => {
    const formatted = formatDateString(testDate, {
      locale: 'en-US',
      style: 'short',
    });
    expect(formatted).toMatch(/11\/21\/2025|11\/21\/25/);
  });

  it('should return empty string for null', () => {
    expect(formatDateString(null)).toBe('');
  });

  it('should return empty string for invalid date', () => {
    expect(formatDateString('not-a-date')).toBe('');
  });
});
