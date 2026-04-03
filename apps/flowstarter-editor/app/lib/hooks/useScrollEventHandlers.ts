import { type MutableRefObject, type Dispatch, type SetStateAction, useCallback } from 'react';
import type { StickToBottomState } from './stick-to-bottom-types';
import { useRefCallback } from './stick-to-bottom-utils';

export function useScrollEventHandlers(
  state: StickToBottomState,
  scrollRef: MutableRefObject<HTMLElement | null>,
  setIsAtBottom: (v: boolean) => void,
  setEscapedFromLock: (v: boolean) => void,
  setIsNearBottom: Dispatch<SetStateAction<boolean>>,
  isSelecting: () => boolean,
) {
  const handleScroll = useCallback(
    ({ target }: Event) => {
      if (target !== scrollRef.current) {
        return;
      }

      const { scrollTop, ignoreScrollToTop } = state;
      let { lastScrollTop = scrollTop } = state;

      state.lastScrollTop = scrollTop;
      state.ignoreScrollToTop = undefined;

      if (ignoreScrollToTop && ignoreScrollToTop > scrollTop) {
        lastScrollTop = ignoreScrollToTop;
      }

      setIsNearBottom(state.isNearBottom);

      setTimeout(() => {
        if (state.resizeDifference || scrollTop === ignoreScrollToTop) {
          return;
        }

        if (isSelecting()) {
          setEscapedFromLock(true);
          setIsAtBottom(false);

          return;
        }

        const isScrollingDown = scrollTop > lastScrollTop;
        const isScrollingUp = scrollTop < lastScrollTop;

        if (state.animation?.ignoreEscapes) {
          state.scrollTop = lastScrollTop;
          return;
        }

        if (isScrollingUp) {
          setEscapedFromLock(true);
          setIsAtBottom(false);
        }

        if (isScrollingDown) {
          setEscapedFromLock(false);
        }

        if (!state.escapedFromLock && state.isNearBottom) {
          setIsAtBottom(true);
        }
      }, 1);
    },
    [setEscapedFromLock, setIsAtBottom, isSelecting, state],
  );

  const handleWheel = useCallback(
    ({ target, deltaY }: WheelEvent) => {
      let element = target as HTMLElement;

      while (!['scroll', 'auto'].includes(getComputedStyle(element).overflow)) {
        if (!element.parentElement) {
          return;
        }

        element = element.parentElement;
      }

      if (
        element === scrollRef.current &&
        deltaY < 0 &&
        scrollRef.current.scrollHeight > scrollRef.current.clientHeight &&
        !state.animation?.ignoreEscapes
      ) {
        setEscapedFromLock(true);
        setIsAtBottom(false);
      }
    },
    [setEscapedFromLock, setIsAtBottom, state],
  );

  return { handleScroll, handleWheel };
}
