'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface CalendlyEmbedProps {
  url: string;
  utmSource?: string;
  utmMedium?: string;
  utmContent?: string;
  utmCampaign?: string;
  utmTerm?: string;
  /** Prefill the visitor's name on the Calendly form. */
  prefillName?: string;
  /** Prefill the visitor's email on the Calendly form. */
  prefillEmail?: string;
  /**
   * Prefill custom Calendly question answers, in order (a1, a2, …).
   * The Calendly event must have matching custom questions configured.
   */
  prefillAnswers?: ReadonlyArray<string | undefined>;
  onEventScheduled?: () => void;
  className?: string;
}

/**
 * Calendly page-setting colors per theme.
 * Calendly accepts hex values without the leading "#".
 *
 * @see https://github.com/tcampb/react-calendly (formatCalendlyUrl → pageSettings)
 */
const THEME_COLORS = {
  light: {
    background_color: 'ffffff',
    text_color: '1a1a2e',
    primary_color: '4f46e5', // purple-primary ≈ hsl(241 93% 61%)
  },
  dark: {
    background_color: '0f1117',
    text_color: 'f0f0f5',
    primary_color: '6366f1', // purple-primary (dark) ≈ hsl(241 96% 63%)
  },
} as const;

/**
 * Inline Calendly embed using a direct iframe — same approach as the
 * official `react-calendly` InlineWidget component.
 *
 * Syncs with the app's light / dark / auto theme via `useTheme()`.
 * When the resolved theme changes the iframe `src` updates so
 * Calendly re-renders with matching colors.
 *
 * Key: the `embed_domain=1` and `embed_type=Inline` query params tell
 * Calendly to allow iframe embedding and enable postMessage communication.
 *
 * @see https://github.com/tcampb/react-calendly/blob/master/src/components/InlineWidget/InlineWidget.tsx
 */
export function CalendlyEmbed({
  url,
  utmSource,
  utmMedium,
  utmContent,
  utmCampaign,
  utmTerm,
  prefillName,
  prefillEmail,
  prefillAnswers,
  onEventScheduled,
  className,
}: CalendlyEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { resolvedTheme } = useTheme();

  const colors = THEME_COLORS[resolvedTheme];

  // Build the embed URL with required params + theme colors
  const src = useMemo(() => {
    const u = new URL(url);
    // Required for iframe embedding
    u.searchParams.set('embed_domain', '1');
    u.searchParams.set('embed_type', 'Inline');
    // Cleaner look
    u.searchParams.set('hide_gdpr_banner', '1');
    u.searchParams.set('hide_landing_page_details', '1');
    // Theme colors
    u.searchParams.set('background_color', colors.background_color);
    u.searchParams.set('text_color', colors.text_color);
    u.searchParams.set('primary_color', colors.primary_color);
    // UTM tracking
    if (utmSource) u.searchParams.set('utm_source', utmSource);
    if (utmMedium) u.searchParams.set('utm_medium', utmMedium);
    if (utmContent) u.searchParams.set('utm_content', utmContent);
    if (utmCampaign) u.searchParams.set('utm_campaign', utmCampaign);
    if (utmTerm) u.searchParams.set('utm_term', utmTerm);
    // Prefill — saves the visitor from re-typing what they already gave us
    if (prefillName) u.searchParams.set('name', prefillName);
    if (prefillEmail) u.searchParams.set('email', prefillEmail);
    if (prefillAnswers) {
      prefillAnswers.forEach((answer, idx) => {
        if (answer && answer.trim()) {
          u.searchParams.set(`a${idx + 1}`, answer);
        }
      });
    }
    return u.toString();
  }, [
    url,
    colors,
    utmSource,
    utmMedium,
    utmContent,
    utmCampaign,
    utmTerm,
    prefillName,
    prefillEmail,
    prefillAnswers,
  ]);

  // Show spinner again when theme changes (new iframe src = reload)
  useEffect(() => {
    setIsLoading(true);
  }, [src]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Listen for Calendly postMessage events (event_scheduled)
  useEffect(() => {
    if (!onEventScheduled) return;
    const handler = (e: MessageEvent) => {
      let data = e.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (data?.event === 'calendly.event_scheduled') {
        onEventScheduled();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onEventScheduled]);

  return (
    <div
      className={`calendly-inline-widget ${className ?? ''}`}
      style={{ position: 'relative', minHeight: '700px' }}
    >
      {isLoading && (
        <div
          className="flex items-center justify-center bg-white dark:bg-[#0f1117] rounded-xl transition-colors"
          style={{ position: 'absolute', inset: 0, zIndex: 2 }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--purple-primary)] border-t-transparent" />
            <p className="text-sm text-gray-400 dark:text-white/40">
              Loading calendar...
            </p>
          </div>
        </div>
      )}

      <iframe
        key={src}
        src={src}
        width="100%"
        height="100%"
        frameBorder="0"
        title="Calendly Scheduling Page"
        onLoad={handleLoad}
        style={{
          border: 'none',
          minWidth: '320px',
          height: '700px',
        }}
      />
    </div>
  );
}
