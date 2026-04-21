import { useCallback, useLayoutEffect, useRef } from "react";

/**
 * Fallback effect-event helper for React versions without `useEffectEvent`.
 */
export function useEffectEvent<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
): (...args: TArgs) => TResult {
  const fnRef = useRef(fn);

  useLayoutEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  return useCallback((...args: TArgs) => fnRef.current(...args), []);
}
