'use client';

import { useCallback, useMemo } from 'react';

export type DateFormatStyle = 'short' | 'medium' | 'long' | 'full' | 'relative';

export interface FormatDateOptions {
  style?: DateFormatStyle;
  includeTime?: boolean;
  locale?: string;
}

/**
 * Hook for formatting dates in the user's local format.
 *
 * @param locale - Override the browser locale (optional)
 * @returns Object with formatting functions
 */
export function useFormatDate(defaultLocale?: string) {
  const locale =
    defaultLocale ||
    (typeof navigator !== 'undefined' ? navigator.language : 'en-US');

  const formatters = useMemo(
    () => ({
      short: new Intl.DateTimeFormat(locale, {
        dateStyle: 'short',
      }),
      medium: new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
      }),
      long: new Intl.DateTimeFormat(locale, {
        dateStyle: 'long',
      }),
      full: new Intl.DateTimeFormat(locale, {
        dateStyle: 'full',
      }),
      shortWithTime: new Intl.DateTimeFormat(locale, {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
      mediumWithTime: new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    }),
    [locale]
  );

  const relativeFormatter = useMemo(
    () => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }),
    [locale]
  );

  /**
   * Format a date relative to now (e.g., "2 days ago", "in 3 hours")
   */
  const formatRelative = useCallback(
    (date: Date | string | null): string => {
      if (!date) return '';

      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '';

      const now = new Date();
      const diffMs = d.getTime() - now.getTime();
      const diffSecs = Math.round(diffMs / 1000);
      const diffMins = Math.round(diffSecs / 60);
      const diffHours = Math.round(diffMins / 60);
      const diffDays = Math.round(diffHours / 24);
      const diffWeeks = Math.round(diffDays / 7);
      const diffMonths = Math.round(diffDays / 30);
      const diffYears = Math.round(diffDays / 365);

      if (Math.abs(diffSecs) < 60) {
        return relativeFormatter.format(diffSecs, 'second');
      } else if (Math.abs(diffMins) < 60) {
        return relativeFormatter.format(diffMins, 'minute');
      } else if (Math.abs(diffHours) < 24) {
        return relativeFormatter.format(diffHours, 'hour');
      } else if (Math.abs(diffDays) < 7) {
        return relativeFormatter.format(diffDays, 'day');
      } else if (Math.abs(diffWeeks) < 4) {
        return relativeFormatter.format(diffWeeks, 'week');
      } else if (Math.abs(diffMonths) < 12) {
        return relativeFormatter.format(diffMonths, 'month');
      } else {
        return relativeFormatter.format(diffYears, 'year');
      }
    },
    [relativeFormatter]
  );

  /**
   * Format a date with the specified style
   */
  const formatDate = useCallback(
    (date: Date | string | null, options: FormatDateOptions = {}): string => {
      if (!date) return '';

      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '';

      const { style = 'medium', includeTime = false } = options;

      if (style === 'relative') {
        return formatRelative(d);
      }

      if (includeTime) {
        if (style === 'short') return formatters.shortWithTime.format(d);
        return formatters.mediumWithTime.format(d);
      }

      switch (style) {
        case 'short':
          return formatters.short.format(d);
        case 'long':
          return formatters.long.format(d);
        case 'full':
          return formatters.full.format(d);
        case 'medium':
        default:
          return formatters.medium.format(d);
      }
    },
    [formatters, formatRelative]
  );

  /**
   * Format as time ago (e.g., "2h ago", "3d ago") - compact version
   */
  const formatTimeAgo = useCallback(
    (date: Date | string | null): string => {
      if (!date) return '';

      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return '';

      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      const diffWeeks = Math.floor(diffDays / 7);

      if (diffSecs < 60) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffWeeks < 4) return `${diffWeeks}w ago`;

      // Fallback to formatted date for older dates
      return formatters.short.format(d);
    },
    [formatters]
  );

  return {
    formatDate,
    formatRelative,
    formatTimeAgo,
    locale,
  };
}

/**
 * Standalone format function for use outside React components
 */
export function formatDateString(
  date: Date | string | null,
  options: FormatDateOptions & { locale?: string } = {}
): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const locale =
    options.locale ||
    (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
  const { style = 'medium', includeTime = false } = options;

  if (style === 'relative') {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const now = new Date();
    const diffDays = Math.round(
      (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return rtf.format(diffDays, 'day');
  }

  const dateOptions: Intl.DateTimeFormatOptions = {};

  switch (style) {
    case 'short':
      dateOptions.dateStyle = 'short';
      break;
    case 'long':
      dateOptions.dateStyle = 'long';
      break;
    case 'full':
      dateOptions.dateStyle = 'full';
      break;
    case 'medium':
    default:
      dateOptions.dateStyle = 'medium';
  }

  if (includeTime) {
    dateOptions.timeStyle = 'short';
  }

  return new Intl.DateTimeFormat(locale, dateOptions).format(d);
}
