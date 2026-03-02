/**
 * Pure formatting utilities.
 * No React dependencies — usable anywhere (components, API routes, tests).
 */

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

  const loc = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');

  switch (style) {
    case 'short':
      return d.toLocaleDateString(loc);
    case 'long':
      return d.toLocaleDateString(loc, { year: 'numeric', month: 'long', day: 'numeric' });
    case 'medium':
    default:
      return d.toLocaleDateString(loc, { year: 'numeric', month: 'short', day: 'numeric' });
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

  const loc = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en-US');
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
 * Truncate text with ellipsis.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}
