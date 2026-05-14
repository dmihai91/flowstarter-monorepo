/**
 * Pure formatting utilities.
 * No React dependencies - usable anywhere (components, API routes, tests).
 */
import { formatDistanceToNow } from 'date-fns';

/**
 * Format a date for display. Uses the existing `formatDateString` from useFormatDate
 * for complex cases. This is for simple, common inline formatting.
 */
export function formatDate(
  date: Date | string | null | undefined,
  style: 'short' | 'medium' | 'long' = 'medium',
  locale?: string
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const loc =
    locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');

  switch (style) {
    case 'short':
      return d.toLocaleDateString(loc);
    case 'long':
      return d.toLocaleDateString(loc, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'medium':
    default:
      return d.toLocaleDateString(loc, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
  }
}

/**
 * Format a time for display.
 */
export function formatTime(
  date: Date | string | null | undefined,
  locale?: string
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const loc =
    locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
  return d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
}

/**
 * Compact relative time (e.g., "2h ago", "3d ago").
 */
export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const diffMs = Date.now() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d, 'short');
}

/**
 * Extract up to 2 uppercase initials from a name, email, or any string.
 * Splits on whitespace, '@', and '.' so both names and email addresses work.
 * e.g. "Jane Doe" → "JD", "jane@example.com" → "JE", null → "?"
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return (
    name
      .split(/[\s@.]+/)
      .filter(Boolean)
      .map((w) => w[0]!)
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  );
}

/**
 * Truncate text with ellipsis.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

/**
 * Compact relative time without an "ago" suffix, backed by date-fns.
 * e.g. "2m", "3h", "5d", "2mo", "1y"
 */
export function compactRelative(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: false })
    .replace('about ', '')
    .replace('almost ', '')
    .replace('over ', '')
    .replace('less than a minute', '<1m')
    .replace(/ minutes?/, 'm')
    .replace(/ hours?/, 'h')
    .replace(/ days?/, 'd')
    .replace(/ months?/, 'mo')
    .replace(/ years?/, 'y');
}

/**
 * Format a raw AI token count as a compact string.
 * e.g. 1_234_567 → "1.23M", 12_345 → "12.3k", 1_234 → "1.23k", 999 → "999"
 */
export function formatTokenCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}k`;
  return n.toLocaleString('en-IE');
}

const _euroFormatter = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format a number as Euro currency (Irish locale, no decimals).
 * e.g. 1234 → "€1,234"
 */
export function formatEuro(n: number): string {
  return _euroFormatter.format(n);
}
