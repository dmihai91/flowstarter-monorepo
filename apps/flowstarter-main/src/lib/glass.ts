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
  'rounded-[var(--fs-radius-2xl)] border backdrop-blur-2xl backdrop-saturate-150';

/** Inline style object — resolves --fs-* tokens at runtime for dark/light */
export const glassStyle: React.CSSProperties = {
  background: 'var(--fs-glass-bg)',
  borderColor: 'var(--fs-glass-edge)',
  boxShadow: 'var(--fs-card-shadow)',
};

/** Hover variant — adds lift on interactive cards */
export const glassHoverClass =
  'rounded-[var(--fs-radius-2xl)] border backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 hover:-translate-y-0.5';

/** Skeleton pulse placeholder using token colors */
export const skeletonClass = 'bg-[var(--fs-rule)] rounded animate-pulse';
