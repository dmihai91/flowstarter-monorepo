import { forwardRef, useEffect, useState, type HTMLAttributes } from 'react';
import { getEffectiveTheme } from '../../utils/theme';

export type FlowBackgroundVariant = 'dashboard' | 'editor' | 'landing' | 'wizard' | 'auth';

export interface FlowBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  variant?: FlowBackgroundVariant;
  animated?: boolean;
}

/**
 * FlowBackground — unified Flowstarter editorial gradient.
 *
 * Design language:
 *   Light: warm cream base (#fbf7ef) with a large cool-indigo bloom top-center
 *          and a smaller warm-amber anchor bottom-left. Clean, editorial.
 *   Dark:  near-black base (#040308) with the same indigo bloom at higher opacity
 *          and the warm accent more saturated. Moody, professional.
 *
 * Accent hue: hsl(233,*,*) — matches --fs-accent throughout the system.
 * Warm accent: rgba(180,83,9) / rgba(255,178,122) — matches --fs-accent-warm.
 *
 * Flow lines are subtle vector paths overlaid on top using the same hues.
 * They are always visible (lineOpacity scaled per variant).
 */

interface VariantConfig {
  /** Primary indigo bloom opacity */
  bloomOpacity: number;
  /** Warm anchor opacity */
  warmOpacity: number;
  /** SVG flow line opacity */
  lineOpacity: number;
}

const variants: Record<FlowBackgroundVariant, { light: VariantConfig; dark: VariantConfig }> = {
  auth: {
    light: { bloomOpacity: 0.22, warmOpacity: 0.12, lineOpacity: 0.08 },
    dark:  { bloomOpacity: 0.28, warmOpacity: 0.15, lineOpacity: 0.10 },
  },
  dashboard: {
    light: { bloomOpacity: 0.14, warmOpacity: 0.07, lineOpacity: 0.05 },
    dark:  { bloomOpacity: 0.20, warmOpacity: 0.10, lineOpacity: 0.07 },
  },
  landing: {
    light: { bloomOpacity: 0.18, warmOpacity: 0.09, lineOpacity: 0.06 },
    dark:  { bloomOpacity: 0.24, warmOpacity: 0.13, lineOpacity: 0.08 },
  },
  wizard: {
    light: { bloomOpacity: 0.14, warmOpacity: 0.07, lineOpacity: 0.05 },
    dark:  { bloomOpacity: 0.18, warmOpacity: 0.09, lineOpacity: 0.06 },
  },
  editor: {
    light: { bloomOpacity: 0.10, warmOpacity: 0.05, lineOpacity: 0.03 },
    dark:  { bloomOpacity: 0.14, warmOpacity: 0.07, lineOpacity: 0.05 },
  },
};

const animationCSS = `
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
    [data-fs-bloom], [data-fs-warm], [data-fs-lines] {
      animation: none !important;
    }
  }
`;

export const FlowBackground = forwardRef<HTMLDivElement, FlowBackgroundProps>(
  ({ variant = 'dashboard', animated = true, className = '', style, ...props }, ref) => {
    const [isDark, setIsDark] = useState(() => {
      if (typeof window === 'undefined') return true;
      return getEffectiveTheme() === 'dark';
    });

    useEffect(() => {
      const update = () => setIsDark(getEffectiveTheme() === 'dark');
      update();
      const observer = new MutationObserver(update);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme', 'class'],
      });
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', update);
      return () => {
        observer.disconnect();
        mq.removeEventListener('change', update);
      };
    }, []);

    const cfg = isDark ? variants[variant].dark : variants[variant].light;

    // Base background color — from fs token system
    const baseBg = isDark ? '#040308' : '#fbf7ef';

    // Indigo bloom — hsl(233) core, feathers to transparent
    // Soft enough to be atmospheric, not a spotlight.
    const bloomCore  = isDark ? 'rgba(88, 106, 240, 0.70)'  : 'rgba(78, 94, 218, 0.55)';
    const bloomMid   = isDark ? 'rgba(78, 94, 218, 0.20)'   : 'rgba(78, 94, 218, 0.14)';

    // Warm anchor — amber bottom-left
    const warmCore   = isDark ? 'rgba(255, 160, 80, 0.60)'  : 'rgba(180, 83, 9, 0.45)';
    const warmMid    = isDark ? 'rgba(255, 160, 80, 0.15)'  : 'rgba(180, 83, 9, 0.12)';

    // Secondary indigo — softer counterbalance
    const secondary  = isDark ? 'rgba(130, 148, 255, 0.30)' : 'rgba(78, 94, 218, 0.18)';

    const driftAnim  = animated ? 'fs-bloom-drift 18s ease-in-out infinite' : undefined;
    const warmAnim   = animated ? 'fs-warm-drift 22s ease-in-out infinite' : undefined;

    return (
      <div
        ref={ref}
        className={className}
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          zIndex: -1,
          ...style,
        }}
        {...props}
      >
        {animated && <style dangerouslySetInnerHTML={{ __html: animationCSS }} />}

        {/* ── Base fill ── */}
        <div style={{ position: 'absolute', inset: 0, background: baseBg }} />

        {/* ── Primary indigo bloom — top-center ──
            Large soft ellipse. The dominant color element.
            Gives every surface the editorial indigo identity. */}
        <div data-fs-bloom style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          width: '100%',
          height: '75%',
          borderRadius: '50%',
          opacity: cfg.bloomOpacity,
          animation: driftAnim,
          background: `radial-gradient(ellipse at center,
            ${bloomCore} 0%,
            ${bloomMid} 45%,
            transparent 72%)`,
        }} />

        {/* ── Secondary indigo — top-right ──
            Smaller, offset. Creates asymmetry and depth. */}
        <div style={{
          position: 'absolute',
          top: '-5%',
          right: '-8%',
          width: '55%',
          height: '55%',
          borderRadius: '50%',
          opacity: cfg.bloomOpacity * 0.55,
          background: `radial-gradient(ellipse at center,
            ${secondary} 0%,
            transparent 65%)`,
        }} />

        {/* ── Warm anchor — bottom-left ──
            Amber/sienna. Grounds the composition.
            Mirrors --fs-accent-warm in the landing orbs. */}
        <div data-fs-warm style={{
          position: 'absolute',
          bottom: '-12%',
          left: '-5%',
          width: '55%',
          height: '50%',
          borderRadius: '50%',
          opacity: cfg.warmOpacity,
          animation: warmAnim,
          background: `radial-gradient(ellipse at center,
            ${warmCore} 0%,
            ${warmMid} 45%,
            transparent 72%)`,
        }} />

        {/* ── Tertiary cool — bottom-right ──
            Faint indigo echo. Ties the composition together. */}
        <div style={{
          position: 'absolute',
          bottom: '-8%',
          right: '10%',
          width: '45%',
          height: '40%',
          borderRadius: '50%',
          opacity: cfg.bloomOpacity * 0.30,
          background: `radial-gradient(ellipse at center,
            ${bloomMid} 0%,
            transparent 65%)`,
        }} />

        {/* ── Flow lines SVG ──
            Elegant curved paths in the same indigo-warm hue range.
            Two groups drifting at slightly different speeds. */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: cfg.lineOpacity,
          }}
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            {/* Indigo gradient along the line */}
            <linearGradient id="fs-line-grad-a" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="transparent" />
              <stop offset="20%"  stopColor={isDark ? 'hsl(233,70%,68%)' : 'hsl(233,65%,50%)'} stopOpacity="0.6" />
              <stop offset="60%"  stopColor={isDark ? 'hsl(233,70%,74%)' : 'hsl(233,65%,44%)'} stopOpacity="0.8" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            {/* Warm gradient for lower lines */}
            <linearGradient id="fs-line-grad-b" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="transparent" />
              <stop offset="25%"  stopColor={isDark ? 'hsl(233,60%,60%)' : 'hsl(233,55%,52%)'} stopOpacity="0.5" />
              <stop offset="75%"  stopColor={isDark ? 'hsl(30,80%,65%)' : 'hsl(30,70%,40%)'} stopOpacity="0.45" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Group A — gentle, wide curves */}
          <g
            data-fs-lines
            stroke="url(#fs-line-grad-a)"
            strokeWidth="1.0"
            style={animated ? {
              animation: 'fs-line-drift-1 20s ease-in-out infinite',
            } : undefined}
          >
            <path d="M-60,180 C200,140 420,220 720,175 S1100,135 1500,195" />
            <path d="M-60,340 C180,300 400,380 720,330 S1060,295 1500,360" />
            <path d="M-60,520 C220,480 440,555 720,505 S1080,470 1500,530" />
            <path d="M-60,700 C200,665 440,730 720,685 S1100,650 1500,710" />
          </g>

          {/* Group B — slightly tighter, offset phase */}
          <g
            stroke="url(#fs-line-grad-b)"
            strokeWidth="0.7"
            style={animated ? {
              animation: 'fs-line-drift-2 26s ease-in-out infinite',
            } : undefined}
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
