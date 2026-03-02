/**
 * Shared glassmorphic card class string.
 * Single source of truth for glass card styling.
 */
export const glassCard = 'rounded-2xl bg-white/60 dark:bg-white/[0.03] backdrop-blur-2xl border border-gray-200/50 dark:border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),inset_0_-1px_0_rgba(0,0,0,0.03),0_4px_16px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.03),inset_0_-1px_0_rgba(0,0,0,0.2),0_4px_16px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.08)]' as const;

/**
 * Dark surface color (matches sidebar + header).
 * Use until CSS vars from design system are properly injected.
 */
export const DARK_SURFACE = '#101014' as const;
