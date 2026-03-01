/**
 * Flowstarter Design System - Shadow Tokens
 *
 * Glassmorphism and elevation shadow presets.
 */

export const glassShadows = {
  /** Multi-layer glassmorphism shadow for cards */
  glass: '0 8px 32px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04), 1px 1px 0 rgba(0,0,0,0.03) inset, -1px -1px 0 rgba(255,255,255,1) inset, 0 1px 0 rgba(255,255,255,0.9) inset',
  /** Dark mode glassmorphism shadow */
  glassDark: '0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2), 1px 1px 0 rgba(0,0,0,0.3) inset, -1px -1px 0 rgba(255,255,255,0.08) inset, 0 1px 0 rgba(255,255,255,0.06) inset',
  /** Simple elevation shadow */
  elevated: '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
  /** Very light shadow */
  subtle: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
} as const;
