import { type MutableRefObject, useCallback } from 'react';
import type {
  ScrollToBottom,
  ScrollToBottomOptions,
  StickToBottomOptions,
  StickToBottomState,
  StopScroll,
} from './stick-to-bottom-types';
import { SIXTY_FPS_INTERVAL_MS, mergeAnimations } from './stick-to-bottom-utils';

export function useScrollToBottom(
  state: StickToBottomState,
  setIsAtBottom: (v: boolean) => void,
  setEscapedFromLock: (v: boolean) => void,
  isSelecting: () => boolean,
  optionsRef: MutableRefObject<StickToBottomOptions>,
) {
  const scrollToBottom = useCallback<ScrollToBottom>(
    (scrollOptions = {}) => {
      if (typeof scrollOptions === 'string') {
        scrollOptions = { animation: scrollOptions };
      }

      if (!scrollOptions.preserveScrollPosition) {
        setIsAtBottom(true);
      }

      const waitElapsed = Date.now() + (Number(scrollOptions.wait) || 0);
      const behavior = mergeAnimations(optionsRef.current, scrollOptions.animation);
      const { ignoreEscapes = false } = scrollOptions;

      let durationElapsed: number;
      let startTarget = state.calculatedTargetScrollTop;

      if (scrollOptions.duration instanceof Promise) {
        scrollOptions.duration.finally(() => {
          durationElapsed = Date.now();
        });
      } else {
        durationElapsed = waitElapsed + (scrollOptions.duration ?? 0);
      }

      const next = async (): Promise<boolean> => {
        const promise = new Promise(requestAnimationFrame).then(() => {
          if (!state.isAtBottom) {
            state.animation = undefined;

            return false;
          }

          const { scrollTop } = state;
          const tick = performance.now();
          const tickDelta = (tick - (state.lastTick ?? tick)) / SIXTY_FPS_INTERVAL_MS;
          state.animation ||= { behavior, promise, ignoreEscapes };

          if (state.animation.behavior === behavior) {
            state.lastTick = tick;
          }

          if (isSelecting()) {
            return next();
          }

          if (waitElapsed > Date.now()) {
            return next();
          }

          if (scrollTop < Math.min(startTarget, state.calculatedTargetScrollTop)) {
            if (state.animation?.behavior === behavior) {
              if (behavior === 'instant') {
                state.scrollTop = state.calculatedTargetScrollTop;
                return next();
              }

              state.velocity =
                (behavior.damping * state.velocity + behavior.stiffness * state.scrollDifference) / behavior.mass;
              state.accumulated += state.velocity * tickDelta;
              state.scrollTop += state.accumulated;

              if (state.scrollTop !== scrollTop) {
                state.accumulated = 0;
              }
            }

            return next();
          }

          if (durationElapsed > Date.now()) {
            startTarget = state.calculatedTargetScrollTop;

            return next();
          }

          state.animation = undefined;

          if (state.scrollTop < state.calculatedTargetScrollTop) {
            return scrollToBottom({
              animation: mergeAnimations(optionsRef.current, optionsRef.current.resize),
              ignoreEscapes,
              duration: Math.max(0, durationElapsed - Date.now()) || undefined,
            });
          }

          return state.isAtBottom;
        });

        return promise.then((isAtBottom) => {
          requestAnimationFrame(() => {
            if (!state.animation) {
              state.lastTick = undefined;
              state.velocity = 0;
            }
          });

          return isAtBottom;
        });
      };

      if (scrollOptions.wait !== true) {
        state.animation = undefined;
      }

      if (state.animation?.behavior === behavior) {
        return state.animation.promise;
      }

      return next();
    },
    [setIsAtBottom, isSelecting, state],
  );

  const stopScroll = useCallback<StopScroll>(() => {
    setEscapedFromLock(true);
    setIsAtBottom(false);
  }, [setEscapedFromLock, setIsAtBottom]);

  return { scrollToBottom, stopScroll };
}
