import { LANDING_COPY } from '../landing-copy';

/** Backward-compatible alias for older section components. */
export const LANDING = {
  ...LANDING_COPY,
  solution: LANDING_COPY.process,
} as const;
