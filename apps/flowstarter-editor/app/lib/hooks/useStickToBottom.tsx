import { useCallback, useMemo, useRef, useState, type MutableRefObject } from 'react';
import type { StickToBottomOptions, StickToBottomState } from './stick-to-bottom-types';
import {
  STICK_TO_BOTTOM_OFFSET_PX,
  RETAIN_ANIMATION_DURATION_MS,
  isMouseDown,
  useRefCallback,
  mergeAnimations,
} from './stick-to-bottom-utils';
import { useScrollToBottom } from './useScrollToBottom';
import { useScrollEventHandlers } from './useScrollEventHandlers';

// Re-export types for backward compatibility
export type {
  StickToBottomState,
  SpringAnimation,
  Animation,
  ScrollElements,
  GetTargetScrollTop,
  StickToBottomOptions,
  ScrollToBottomOptions,
  ScrollToBottom,
  StopScroll,
} from './stick-to-bottom-types';

export const useStickToBottom = (options: StickToBottomOptions = {}) => {
  const [escapedFromLock, updateEscapedFromLock] = useState(false);
  const [isAtBottom, updateIsAtBottom] = useState(options.initial !== false);
  const [isNearBottom, setIsNearBottom] = useState(false);

  const optionsRef = useRef<StickToBottomOptions>(null!);
  optionsRef.current = options;

  const scrollElRef = useRef<HTMLElement | null>(null);

  const isSelecting = useCallback(() => {
    if (!isMouseDown()) {
      return false;
    }

    const selection = window.getSelection();

    if (!selection || !selection.rangeCount) {
      return false;
    }

    const range = selection.getRangeAt(0);

    return !!(
      range.commonAncestorContainer.contains(scrollElRef.current) ||
      scrollElRef.current?.contains(range.commonAncestorContainer)
    );
  }, []);

  const setIsAtBottom = useCallback((isAtBottom: boolean) => {
    state.isAtBottom = isAtBottom;
    updateIsAtBottom(isAtBottom);
  }, []);

  const setEscapedFromLock = useCallback((escapedFromLock: boolean) => {
    state.escapedFromLock = escapedFromLock;
    updateEscapedFromLock(escapedFromLock);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: not needed
  const state = useMemo<StickToBottomState>(() => {
    let lastCalculation: { targetScrollTop: number; calculatedScrollTop: number } | undefined;

    return {
      escapedFromLock,
      isAtBottom,
      resizeDifference: 0,
      accumulated: 0,
      velocity: 0,
      listeners: new Set(),

      get scrollTop() {
        return scrollElRef.current?.scrollTop ?? 0;
      },
      set scrollTop(scrollTop: number) {
        if (scrollElRef.current) {
          scrollElRef.current.scrollTop = scrollTop;
          state.ignoreScrollToTop = scrollElRef.current.scrollTop;
        }
      },

      get targetScrollTop() {
        if (!scrollElRef.current || !contentRef.current) {
          return 0;
        }

        return scrollElRef.current.scrollHeight - 1 - scrollElRef.current.clientHeight;
      },
      get calculatedTargetScrollTop() {
        if (!scrollElRef.current || !contentRef.current) {
          return 0;
        }

        const { targetScrollTop } = this;

        if (!options.targetScrollTop) {
          return targetScrollTop;
        }

        if (lastCalculation?.targetScrollTop === targetScrollTop) {
          return lastCalculation.calculatedScrollTop;
        }

        const calculatedScrollTop = Math.max(
          Math.min(
            options.targetScrollTop(targetScrollTop, {
              scrollElement: scrollElRef.current,
              contentElement: contentRef.current,
            }),
            targetScrollTop,
          ),
          0,
        );

        lastCalculation = { targetScrollTop, calculatedScrollTop };

        requestAnimationFrame(() => {
          lastCalculation = undefined;
        });

        return calculatedScrollTop;
      },

      get scrollDifference() {
        return this.calculatedTargetScrollTop - this.scrollTop;
      },

      get isNearBottom() {
        return this.scrollDifference <= STICK_TO_BOTTOM_OFFSET_PX;
      },
    };
  }, []);

  const { scrollToBottom, stopScroll } = useScrollToBottom(
    state, setIsAtBottom, setEscapedFromLock, isSelecting, optionsRef,
  );

  const { handleScroll, handleWheel } = useScrollEventHandlers(
    state, scrollElRef, setIsAtBottom, setEscapedFromLock, setIsNearBottom, isSelecting,
  );

  const scrollRef = useRefCallback((scroll: HTMLElement | null) => {
    scrollElRef.current?.removeEventListener('scroll', handleScroll);
    (scrollElRef.current as HTMLElement | null)?.removeEventListener('wheel', handleWheel as EventListener);
    scrollElRef.current = scroll;
    scroll?.addEventListener('scroll', handleScroll, { passive: true });
    scroll?.addEventListener('wheel', handleWheel as EventListener, { passive: true });
  }, [handleScroll, handleWheel]);

  const contentRef = useRefCallback((content) => {
    state.resizeObserver?.disconnect();

    if (!content) {
      return;
    }

    let previousHeight: number | undefined;

    state.resizeObserver = new ResizeObserver(([entry]) => {
      const { height } = entry.contentRect;
      const difference = height - (previousHeight ?? height);

      state.resizeDifference = difference;

      if (state.scrollTop > state.targetScrollTop) {
        state.scrollTop = state.targetScrollTop;
      }

      setIsNearBottom(state.isNearBottom);

      if (difference >= 0) {
        const animation = mergeAnimations(
          optionsRef.current,
          previousHeight ? optionsRef.current.resize : optionsRef.current.initial,
        );

        scrollToBottom({
          animation,
          wait: true,
          preserveScrollPosition: true,
          duration: animation === 'instant' ? undefined : RETAIN_ANIMATION_DURATION_MS,
        });
      } else {
        if (state.isNearBottom) {
          setEscapedFromLock(false);
          setIsAtBottom(true);
        }
      }

      previousHeight = height;

      requestAnimationFrame(() => {
        setTimeout(() => {
          if (state.resizeDifference === difference) {
            state.resizeDifference = 0;
          }
        }, 1);
      });
    });

    state.resizeObserver?.observe(content);
  }, []);

  return {
    contentRef,
    scrollRef,
    scrollToBottom,
    stopScroll,
    isAtBottom: isAtBottom || isNearBottom,
    isNearBottom,
    escapedFromLock,
    state,
  };
};
