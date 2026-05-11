import type { CSSProperties } from 'react';

/**
 * glass.ts — Shared glass card style utilities.
 *
 * Use these instead of hand-rolling bg-white/95 backdrop-blur-2xl patterns.
 * All values come from --fs-* design tokens defined in brand.css.
 *
 * Usage:
 *   <div className={glassClass} style={glassStyle}>...</div>
 *   <div className={`${glassClass} p-6`} style={glassStyle}>...</div>
 *
 * Or just use <GlassCard> from '@flowstarter/flow-design-system' which wraps this.
 */

/** Tailwind structural classes — no color values */
export const glassClass =
  'rounded-[var(--fs-radius-xl)] border backdrop-blur-xl backdrop-saturate-125';

/** Inline style object — resolves --fs-* tokens at runtime for dark/light */
export const glassStyle: CSSProperties = {
  background: 'var(--fs-glass-bg)',
  borderColor: 'var(--fs-glass-edge)',
  boxShadow: 'var(--fs-card-shadow)',
};

/** Hover variant — adds lift on interactive cards */
export const glassHoverClass =
  'rounded-[var(--fs-radius-xl)] border backdrop-blur-xl backdrop-saturate-125 transition-all duration-200 hover:-translate-y-0.5';

/** Skeleton pulse placeholder using token colors */
export const skeletonClass = 'bg-[var(--fs-rule)] rounded animate-pulse';

/**
 * Dashboard atmosphere — editorial dual-tone wash using landing tokens
 * (`--ls-accent` indigo + `--ls-accent-warm` rust). Two low-opacity radials
 * (cool top-left, warm bottom-right) sit on the FlowBackground orbs; a soft
 * mid vignette and bottom fade darken the canvas without swallowing the wash.
 * `.ls-card` glass remains the only strong surface treatment so the depth
 * reads as "glass on paper" instead of stacked glass shells.
 */
export const dashboardLightOverlay = `
  radial-gradient(ellipse 70% 55% at 8% 0%, rgba(78, 94, 218, 0.10) 0%, transparent 62%),
  radial-gradient(ellipse 56% 50% at 96% 108%, rgba(180, 83, 9, 0.07) 0%, transparent 64%),
  linear-gradient(180deg, rgba(251, 247, 239, 0) 0%, rgba(243, 236, 219, 0.32) 100%)
`;

export const dashboardDarkOverlay = `
  radial-gradient(ellipse 64% 52% at 6% 2%, rgba(78, 94, 218, 0.22) 0%, transparent 58%),
  radial-gradient(ellipse 54% 46% at 98% 104%, rgba(180, 83, 9, 0.12) 0%, transparent 62%),
  radial-gradient(ellipse 110% 70% at 50% 56%, rgba(10, 7, 20, 0) 0%, rgba(4, 3, 8, 0.32) 78%),
  linear-gradient(180deg, rgba(10, 7, 20, 0) 0%, rgba(4, 3, 8, 0.42) 100%)
`;

/**
 * Editorial paper grain — same SVG fractal noise the landing uses in
 * `.ls-grain`. Layered above the wash to break up gradients and avoid the
 * flat "AI gradient" feel. Tile size kept at 160px to match the landing.
 */
export const dashboardGrainBackground =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 160 160' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/** Sidebar chrome (shared by client + team sidebars) */
export function getSidebarChromeStyle(
  resolvedTheme: 'light' | 'dark' | undefined
): CSSProperties {
  const isDark = resolvedTheme === 'dark';
  return {
    background: isDark ? 'var(--fs-chrome-bg)' : 'var(--fs-chrome-bg)',
    borderRight: `1px solid var(--fs-chrome-border)`,
    boxShadow: 'var(--fs-chrome-shadow)',
    backdropFilter: isDark
      ? 'blur(14px) saturate(125%)'
      : 'blur(16px) saturate(120%)',
    WebkitBackdropFilter: isDark
      ? 'blur(14px) saturate(125%)'
      : 'blur(16px) saturate(120%)',
  };
}

export const sidebarNavBaseClass =
  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150';
export const sidebarNavActiveClass =
  'bg-[var(--purple)] text-white font-semibold shadow-md hover:brightness-110';
export const sidebarNavIdleClass =
  'text-[var(--fs-ink-dim)] hover:bg-[var(--fs-bg-elevated)]/75 hover:text-[var(--fs-ink)]';
export const sidebarSectionLabelClass =
  'mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--fs-ink-faint)]';

export function getSidebarToggleButtonClass(
  resolvedTheme: 'light' | 'dark' | undefined
): string {
  const darkClass =
    'border-white/20 bg-white/[0.10] text-white shadow-[0_8px_22px_rgba(0,0,0,0.35)] hover:border-white/30 hover:bg-white/[0.16]';
  const lightClass =
    'border-slate-300/90 bg-white text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.14)] hover:border-slate-400/85 hover:bg-slate-50';
  return [
    'group inline-flex h-8 w-8 items-center justify-center rounded-md border transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fs-accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
    resolvedTheme === 'dark' ? darkClass : lightClass,
  ].join(' ');
}

export const sidebarFooterToggleClass = [
  'group w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
  'text-[var(--fs-ink-faint)] hover:bg-[var(--fs-bg-elevated)]/75 hover:text-[var(--fs-ink)]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fs-accent-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
].join(' ');
