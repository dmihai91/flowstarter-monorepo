import {
  type DependencyList,
  type MutableRefObject,
  type RefCallback,
  useCallback,
} from 'react';
import type { Animation, SpringAnimation } from './stick-to-bottom-types';
import { DEFAULT_SPRING_ANIMATION } from './stick-to-bottom-types';

export const STICK_TO_BOTTOM_OFFSET_PX = 70;
export const SIXTY_FPS_INTERVAL_MS = 1000 / 60;
export const RETAIN_ANIMATION_DURATION_MS = 350;

let mouseDown = false;

globalThis.document?.addEventListener('mousedown', () => {
  mouseDown = true;
});

globalThis.document?.addEventListener('mouseup', () => {
  mouseDown = false;
});

globalThis.document?.addEventListener('click', () => {
  mouseDown = false;
});

export function isMouseDown() {
  return mouseDown;
}

export function useRefCallback<T extends (ref: HTMLElement | null) => unknown>(
  callback: T,
  deps: DependencyList,
) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: not needed
  const result = useCallback((ref: HTMLElement | null) => {
    result.current = ref;
    return callback(ref);
  }, deps) as unknown as MutableRefObject<HTMLElement | null> & RefCallback<HTMLElement>;

  return result;
}

const animationCache = new Map<string, Readonly<Required<SpringAnimation>>>();

export function mergeAnimations(...animations: (Animation | boolean | undefined)[]) {
  const result = { ...DEFAULT_SPRING_ANIMATION };
  let instant = false;

  for (const animation of animations) {
    if (animation === 'instant') {
      instant = true;
      continue;
    }

    if (typeof animation !== 'object') {
      continue;
    }

    instant = false;

    result.damping = animation.damping ?? result.damping;
    result.stiffness = animation.stiffness ?? result.stiffness;
    result.mass = animation.mass ?? result.mass;
  }

  const key = JSON.stringify(result);

  if (!animationCache.has(key)) {
    animationCache.set(key, Object.freeze(result));
  }

  return instant ? 'instant' : animationCache.get(key)!;
}
