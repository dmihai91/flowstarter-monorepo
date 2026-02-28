/**
 * Flowstarter Design System - Shadow Tokens
 *
 * Glassmorphism and elevation shadow presets.
 */

export const glassShadows = {
  /** Multi-layer glassmorphism shadow for cards */
  glass: '0 2px 4px rgba(0,0,0,0.02), 0 8px 16px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.8) inset, 0 -1px 0 rgba(0,0,0,0.02) inset',
  /** Dark mode glassmorphism shadow */
  glassDark: '0 2px 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.2), 0 1px 0 rgba(255,255,255,0.05) inset, 0 -1px 0 rgba(0,0,0,0.2) inset',
  /** Simple elevation shadow */
  elevated: '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
  /** Very light shadow */
  subtle: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
} as const;
