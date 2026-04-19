import { forwardRef, type HTMLAttributes } from 'react';

export type FlowBackgroundVariant = 'dashboard' | 'editor' | 'landing' | 'wizard' | 'auth';

export interface FlowBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  variant?: FlowBackgroundVariant;
  animated?: boolean;
}

/**
 * FlowBackground — zero-JS, pure-CSS atmospheric gradient.
 *
 * Colors come entirely from --fs-* CSS custom properties defined in brand.css.
 * There is NO isDark useState, no useEffect, no hydration mismatch.
 * Theme switching works by .dark class toggling CSS vars — no JS involved.
 * This eliminates the reflow flash on Android Chrome / OnePlus and any SSR client.
 *
 * Variant opacities are injected as CSS custom properties per-element.
 * The .dark class on <html> switches --fs-bloom-core etc automatically.
 */

type VariantCfg = { bloom: number; warm: number; lines: number };

const VARIANTS: Record<FlowBackgroundVariant, VariantCfg> = {
  auth:      { bloom: 0.25, warm: 0.14, lines: 0.09 },
  dashboard: { bloom: 0.17, warm: 0.09, lines: 0.06 },
  landing:   { bloom: 0.21, warm: 0.11, lines: 0.07 },
  wizard:    { bloom: 0.16, warm: 0.08, lines: 0.05 },
  editor:    { bloom: 0.12, warm: 0.06, lines: 0.04 },
};

// Dark mode gets ~30% more opacity — controlled via CSS, not JS
const GLOBAL_CSS = `
  .fs-bg-root {
    --fb-dk-boost: 1;
  }
  .dark .fs-bg-root {
    --fb-dk-boost: 1.35;
    --fs-bloom-core:      rgba(88, 106, 240, 0.70);
    --fs-bloom-mid:       rgba(78, 94, 218, 0.20);
    --fs-warm-core:       rgba(255, 160, 80, 0.60);
    --fs-warm-mid:        rgba(255, 160, 80, 0.15);
    --fs-secondary-bloom: rgba(130, 148, 255, 0.30);
  }
  @keyframes fs-bloom-drift {
    0%, 100% { transform: translateX(-50%) scale(1); }
    50%       { transform: translateX(-50%) scale(1.04) translateY(-12px); }
  }
  @keyframes fs-warm-drift {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.06) translate(10px, -8px); }
  }
  @keyframes fs-line-drift-1 {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes fs-line-drift-2 {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(6px); }
  }
  @media (max-width: 768px) {
    .fs-bg-bloom, .fs-bg-warm, .fs-bg-lines-a, .fs-bg-lines-b {
      animation: none !important;
    }
  }
`;

export const FlowBackground = forwardRef<HTMLDivElement, FlowBackgroundProps>(
  ({ variant = 'dashboard', animated = true, className = '', style, ...props }, ref) => {
    const { bloom, warm, lines } = VARIANTS[variant];

    return (
      <div
        ref={ref}
        className={`fs-bg-root ${className}`}
        style={{ pointerEvents: 'none', position: 'absolute', inset: 0, zIndex: -1, ...style }}
        {...props}
      >
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

        {/* Base fill */}
        <div style={{ position: 'absolute', inset: 0, background: 'var(--fs-bg-base)' }} />

        {/* Primary indigo bloom — top-center, dominant */}
        <div
          className="fs-bg-bloom"
          style={{
            position: 'absolute',
            top: '-15%', left: '50%',
            width: '100%', height: '75%',
            borderRadius: '50%',
            opacity: bloom,
            animation: animated ? 'fs-bloom-drift 18s ease-in-out infinite' : undefined,
            background: 'radial-gradient(ellipse at center, var(--fs-bloom-core) 0%, var(--fs-bloom-mid) 45%, transparent 72%)',
          }}
        />

        {/* Secondary indigo — top-right, balanced */}
        <div style={{
          position: 'absolute',
          top: '5%', right: '5%',
          width: '40%', height: '45%',
          borderRadius: '50%',
          opacity: bloom * 0.45,
          background: 'radial-gradient(ellipse at center, var(--fs-secondary-bloom) 0%, transparent 65%)',
        }} />

        {/* Warm anchor — bottom-left */}
        <div
          className="fs-bg-warm"
          style={{
            position: 'absolute',
            bottom: '-12%', left: '-5%',
            width: '55%', height: '50%',
            borderRadius: '50%',
            opacity: warm,
            animation: animated ? 'fs-warm-drift 22s ease-in-out infinite' : undefined,
            background: 'radial-gradient(ellipse at center, var(--fs-warm-core) 0%, var(--fs-warm-mid) 45%, transparent 72%)',
          }}
        />

        {/* Tertiary cool — bottom-right */}
        <div style={{
          position: 'absolute',
          bottom: '-8%', right: '10%',
          width: '45%', height: '40%',
          borderRadius: '50%',
          opacity: bloom * 0.30,
          background: 'radial-gradient(ellipse at center, var(--fs-bloom-mid) 0%, transparent 65%)',
        }} />

        {/* Flow lines */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: lines }}
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="fs-line-a" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="transparent" />
              <stop offset="20%"  stopColor="hsl(233,65%,50%)" stopOpacity="0.6" />
              <stop offset="60%"  stopColor="hsl(233,70%,58%)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="fs-line-b" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="transparent" />
              <stop offset="30%"  stopColor="hsl(233,60%,52%)" stopOpacity="0.5" />
              <stop offset="70%"  stopColor="hsl(30,70%,42%)"  stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <g
            className="fs-bg-lines-a"
            stroke="url(#fs-line-a)"
            strokeWidth="1.0"
            style={animated ? { animation: 'fs-line-drift-1 20s ease-in-out infinite' } : undefined}
          >
            <path d="M-60,180 C200,140 420,220 720,175 S1100,135 1500,195" />
            <path d="M-60,340 C180,300 400,380 720,330 S1060,295 1500,360" />
            <path d="M-60,520 C220,480 440,555 720,505 S1080,470 1500,530" />
            <path d="M-60,700 C200,665 440,730 720,685 S1100,650 1500,710" />
          </g>
          <g
            className="fs-bg-lines-b"
            stroke="url(#fs-line-b)"
            strokeWidth="0.7"
            style={animated ? { animation: 'fs-line-drift-2 26s ease-in-out infinite' } : undefined}
          >
            <path d="M-60,260 C240,220 460,300 720,255 S1080,215 1500,280" />
            <path d="M-60,430 C200,395 420,465 720,420 S1060,385 1500,445" />
            <path d="M-60,610 C210,575 440,645 720,600 S1080,565 1500,625" />
            <path d="M-60,800 C240,765 460,840 720,795 S1090,755 1500,815" />
          </g>
        </svg>
      </div>
    );
  }
);

FlowBackground.displayName = 'FlowBackground';
