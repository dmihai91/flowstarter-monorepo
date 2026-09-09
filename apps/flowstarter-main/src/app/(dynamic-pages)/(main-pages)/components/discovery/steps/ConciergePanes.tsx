'use client';

/**
 * The shell the last two wizard steps share: one conversation on the left, the
 * site taking shape on the right, and a single "Now:" line that is never
 * scrolled away from.
 *
 * Layout is a two-column grid on desktop and a stack under 900px. The DOM
 * order is Now → site → conversation, which is already the mobile order the
 * product asks for (status pinned at the top, the site next, the conversation
 * under it); the desktop arrangement is done with explicit grid placement so
 * the "Now:" line can sit at the top of the left column without being written
 * to the page twice.
 *
 * Everything here is presentational. The stages own their own state.
 */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

/**
 * The site pane's height, shared by the skeleton, the live frame and the
 * conversation column so the three always line up. Tall on purpose: the
 * pane is the product, and a squat window makes a real site look like a
 * thumbnail. Below 900px the panes stack, so the site takes less of the
 * phone's screen and the conversation stays reachable.
 */
export const SITE_PANE_HEIGHT_CLASS =
  'h-[48vh] min-h-[320px] min-[900px]:h-[68vh] min-[900px]:min-h-[480px]';

/** The desktop the site is laid out for. Its own breakpoints see this width. */
export const SITE_DESIGN_WIDTH = 1280;

/**
 * Narrower panes than this show the site at their own width instead: a
 * phone-wide pane showing a desktop page shrunk four times over is not
 * "what the site looks like", it is a postage stamp.
 */
const MIN_SCALED_PANE_WIDTH = 720;

export type SiteViewport = {
  /**
   * Set on the element the frame sits in (position: relative, overflow
   * hidden). A callback ref, because that element is only rendered once
   * there is a site to show, which is after the stage has mounted.
   */
  ref: (el: HTMLDivElement | null) => void;
  /** Inline style for the frame: laid out at desktop width, scaled to fit. */
  frameStyle: CSSProperties;
  /** The scale applied, 1 when the frame is shown at the pane's own width. */
  scale: number;
};

/**
 * Lays a frame out at `SITE_DESIGN_WIDTH` and scales it down to fit the
 * pane, so the site inside renders its desktop layout (its media queries
 * see 1280px) rather than the tablet layout a 900px iframe would trigger.
 * The frame's height is grown by the inverse of the scale so the scaled
 * result still fills the pane exactly.
 *
 * The pane is measured with a ResizeObserver; where there is none (jsdom)
 * the frame is shown unscaled at the pane's width.
 */
export function useSiteViewport(): SiteViewport {
  const observer = useRef<ResizeObserver | null>(null);
  const [pane, setPane] = useState<{ width: number; height: number } | null>(
    null
  );

  const ref = useCallback((el: HTMLDivElement | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!el || typeof ResizeObserver === 'undefined') {
      setPane(null);
      return;
    }
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setPane((prev) =>
        prev && prev.width === rect.width && prev.height === rect.height
          ? prev
          : { width: rect.width, height: rect.height }
      );
    };
    measure();
    observer.current = new ResizeObserver(measure);
    observer.current.observe(el);
  }, []);

  useEffect(() => () => observer.current?.disconnect(), []);

  if (!pane || pane.width < MIN_SCALED_PANE_WIDTH) {
    return { ref, frameStyle: { width: '100%', height: '100%' }, scale: 1 };
  }
  const scale = Math.min(1, pane.width / SITE_DESIGN_WIDTH);
  return {
    ref,
    scale,
    frameStyle: {
      width: `${pane.width / scale}px`,
      height: `${pane.height / scale}px`,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
    },
  };
}

export function ConciergePanes({
  now,
  site,
  conversation,
}: {
  now: ReactNode;
  site: ReactNode;
  conversation: ReactNode;
}) {
  return (
    <div
      data-testid="concierge-panes"
      className={[
        'grid grid-cols-1 gap-3',
        'min-[900px]:grid-cols-[minmax(300px,0.62fr)_minmax(0,1.38fr)]',
        'min-[900px]:grid-rows-[auto_minmax(0,1fr)] min-[900px]:items-start',
      ].join(' ')}
    >
      {/* Pinned on mobile (it is the first thing in the stack), static in the
          left column on desktop. */}
      <div className="sticky top-0 z-20 min-[900px]:static min-[900px]:col-start-1 min-[900px]:row-start-1">
        {now}
      </div>
      <div
        data-testid="concierge-site-pane"
        className="min-[900px]:col-start-2 min-[900px]:row-start-1 min-[900px]:row-span-2"
      >
        {site}
      </div>
      <div
        data-testid="concierge-conversation-pane"
        className="min-[900px]:col-start-1 min-[900px]:row-start-2 min-[900px]:min-h-0"
      >
        {conversation}
      </div>
    </div>
  );
}

export type NowState = 'waiting' | 'working' | 'done' | 'failed';

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m ${String(rest).padStart(2, '0')}s`;
}

/**
 * The one line that is always on screen: what the team is doing right now,
 * and how long this has been going on. Elapsed time is shown because the
 * build takes minutes and a silent spinner reads as a hang.
 *
 * `aria-live` without `role="status"` on purpose: the stages under this line
 * have status regions of their own (the info agent's "thinking", the editor's
 * replies), and a second implicit status role here would make every
 * `getByRole('status')` in the stage ambiguous — for a screen reader as much
 * as for a test. The polite announcement is the part that matters.
 */
export function NowLine({
  label,
  state,
  elapsedSeconds,
}: {
  label: string;
  state: NowState;
  elapsedSeconds?: number | null;
}) {
  return (
    <div
      data-testid="concierge-now"
      aria-live="polite"
      className={[
        'flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 backdrop-blur',
        state === 'failed'
          ? 'border-amber-500/40 bg-amber-500/[0.08]'
          : 'border-[var(--purple-primary)]/30 bg-[var(--purple-primary)]/[0.07]',
      ].join(' ')}
    >
      <span
        aria-hidden
        className="flex h-4 w-4 shrink-0 items-center justify-center"
      >
        {state === 'working' ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--purple-primary)] border-t-transparent" />
        ) : state === 'waiting' ? (
          <span className="h-2 w-2 rounded-full bg-[var(--purple-primary)]/60" />
        ) : state === 'failed' ? (
          <svg
            className="h-4 w-4 text-amber-600 dark:text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v5m0 3.5h.01"
            />
          </svg>
        ) : (
          <svg
            className="h-4 w-4 text-[var(--purple-primary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--purple-primary)]">
        Now
      </span>
      <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[var(--fs-ink)] line-clamp-2">
        {label}
      </span>
      {typeof elapsedSeconds === 'number' && (
        <span className="shrink-0 text-[11px] tabular-nums text-[var(--fs-ink-faint)]">
          {formatElapsed(elapsedSeconds)}
        </span>
      )}
    </div>
  );
}

/**
 * A page-shaped placeholder: header, hero, three cards. Deliberately empty
 * bars rather than invented headlines — a visitor should never be able to
 * mistake the waiting state for a first draft of their own copy.
 */
export function SiteSkeleton({ caption }: { caption: string }) {
  return (
    <div
      data-testid="concierge-skeleton"
      className={`flex w-full flex-col bg-white p-5 dark:bg-white/[0.04] ${SITE_PANE_HEIGHT_CLASS}`}
    >
      <div
        className="flex min-h-0 flex-1 animate-pulse flex-col gap-4"
        aria-hidden
      >
        {/* header */}
        <div className="flex items-center gap-3">
          <div className="h-5 w-24 rounded bg-black/10 dark:bg-white/10" />
          <div className="ml-auto flex gap-2">
            <div className="h-3 w-12 rounded bg-black/[0.07] dark:bg-white/[0.07]" />
            <div className="h-3 w-12 rounded bg-black/[0.07] dark:bg-white/[0.07]" />
            <div className="h-3 w-12 rounded bg-black/[0.07] dark:bg-white/[0.07]" />
          </div>
        </div>
        {/* hero */}
        <div className="space-y-2.5 rounded-lg bg-black/[0.03] p-5 dark:bg-white/[0.03]">
          <div className="h-6 w-3/4 rounded bg-black/10 dark:bg-white/10" />
          <div className="h-6 w-1/2 rounded bg-black/10 dark:bg-white/10" />
          <div className="h-3 w-2/3 rounded bg-black/[0.07] dark:bg-white/[0.07]" />
          <div className="h-8 w-32 rounded-lg bg-[var(--purple-primary)]/20" />
        </div>
        {/* three cards */}
        <div className="grid flex-1 grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="space-y-2 rounded-lg border border-black/[0.06] p-3 dark:border-white/[0.06]"
            >
              <div className="h-3 w-2/3 rounded bg-black/10 dark:bg-white/10" />
              <div className="h-2.5 w-full rounded bg-black/[0.06] dark:bg-white/[0.06]" />
              <div className="h-2.5 w-5/6 rounded bg-black/[0.06] dark:bg-white/[0.06]" />
            </div>
          ))}
        </div>
      </div>
      {caption && (
        <p className="shrink-0 pt-3 text-center text-[11px] leading-snug text-[var(--fs-ink-faint)]">
          {caption}
        </p>
      )}
    </div>
  );
}

export type BubbleTone = 'agent' | 'you' | 'earlier' | 'offer' | 'alert';

/**
 * One turn of the conversation. Phases, the visitor's answers, the agents'
 * replies and the offer all use this, because in the product they are all
 * the same thing: messages in one conversation.
 */
export function ChatBubble({
  tone,
  author,
  meta,
  state,
  children,
}: {
  tone: BubbleTone;
  author?: string;
  /** Right-aligned annotation, e.g. the elapsed time a phase started at. */
  meta?: string;
  /** Only meaningful for phase messages. */
  state?: 'working' | 'done';
  children: ReactNode;
}) {
  if (tone === 'you') {
    return (
      <div className="flex justify-end">
        <span className="max-w-[88%] rounded-2xl rounded-br-md bg-[var(--purple-primary)] px-3 py-1.5 text-[13px] leading-snug text-white">
          {children}
        </span>
      </div>
    );
  }
  return (
    <div
      className={[
        'rounded-2xl rounded-bl-md border px-3 py-2 text-[13px] leading-snug',
        tone === 'earlier'
          ? 'border-[var(--fs-rule)] bg-transparent text-[var(--fs-ink-faint)]'
          : tone === 'offer'
          ? 'border-[var(--purple-primary)]/30 bg-[var(--purple-primary)]/[0.06] text-[var(--fs-ink)]'
          : tone === 'alert'
          ? 'border-amber-500/40 bg-amber-500/[0.08] text-[var(--fs-ink)]'
          : 'border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)] text-[var(--fs-ink)]',
      ].join(' ')}
    >
      {(author || meta) && (
        <div className="mb-1 flex items-center gap-2">
          {state && (
            <span
              aria-hidden
              className="flex h-3.5 w-3.5 shrink-0 items-center justify-center"
            >
              {state === 'working' ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--purple-primary)] border-t-transparent" />
              ) : (
                <svg
                  className="h-3.5 w-3.5 text-[var(--purple-primary)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </span>
          )}
          {author && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--fs-ink-faint)]">
              {author}
            </span>
          )}
          {meta && (
            <span className="ml-auto shrink-0 text-[10px] tabular-nums text-[var(--fs-ink-faint)]">
              {meta}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * The scrolling conversation column itself.
 *
 * It scrolls *itself* to the newest message rather than calling
 * `scrollIntoView` on a sentinel: on a phone the panes are stacked inside a
 * scrolling modal, and asking the browser to bring an element into view there
 * drags the whole modal down — pulling the site the visitor is watching off
 * the screen every time an agent says something.
 */
export function ConversationLog({
  label,
  scrollSignal,
  children,
}: {
  label: string;
  /** Bump to scroll to the newest message (message count is the usual value). */
  scrollSignal?: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [scrollSignal]);

  return (
    <div
      ref={ref}
      role="log"
      aria-label={label}
      className="max-h-[46vh] min-h-[180px] space-y-2 overflow-y-auto rounded-xl border border-[var(--fs-rule)] bg-[var(--fs-bg-elevated)]/40 p-3 min-[900px]:max-h-[calc(68vh-1.5rem)]"
    >
      {children}
    </div>
  );
}

/**
 * Seconds since the stage started, ticking while `running`. Frozen (not
 * reset) when it stops, so the finished build still says how long it took.
 */
export function useElapsedSeconds(running: boolean): number {
  const [seconds, setSeconds] = useState(0);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  return seconds;
}
