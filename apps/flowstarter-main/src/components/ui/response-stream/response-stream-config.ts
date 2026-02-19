import type { Mode } from './response-stream';

export interface ResponseStreamConfig {
  mode: Mode;
  speed: number;
  fadeDuration?: number;
  segmentDelay?: number;
  characterChunkSize?: number;
}

/**
 * Centralized configuration for ResponseStream components across the application.
 * This ensures consistent streaming behavior throughout the UI.
 */
export const RESPONSE_STREAM_CONFIGS = {
  /** Animated placeholder text in input fields */
  placeholder: {
    mode: 'typewriter' as Mode,
    speed: 30,
  },

  /** Animated placeholder with fade effect and custom timings */
  placeholderFade: {
    mode: 'fade' as Mode,
    speed: 30,
    fadeDuration: 400,
    segmentDelay: 50,
  },

  /** Generation step labels during AI processing */
  generationStep: {
    mode: 'typewriter' as Mode,
    speed: 80,
  },

  /** Generation step messages (smaller/faster than labels) */
  generationMessage: {
    mode: 'typewriter' as Mode,
    speed: 100,
  },

  /** Generation status overlay on input fields */
  generationStatus: {
    mode: 'typewriter' as Mode,
    speed: 15,
  },

  /** Final streaming text result after generation */
  finalResult: {
    mode: 'typewriter' as Mode,
    speed: 30,
  },
} as const;
