'use client';

import type React from 'react';

import { useRef, useState, useEffect } from 'react';

/**
 * Hook to detect when an element enters the viewport.
 * Used for scroll-triggered animations.
 * @param threshold - Intersection threshold (0-1), default 0.05
 * @param rootMargin - Root margin for early triggering, default '100px'
 */
export function useScrollAnimation(threshold = 0.01, rootMargin = '0px 0px 400px 0px') {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If already in viewport on mount, show immediately (no animation jump)
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const fadeClass = isVisible ? 'section-fade' : 'opacity-0';
  return { ref, isVisible, fadeClass };
}

/**
 * Get staggered animation styles for items in a list.
 * @param index - Item index in the list
 * @param isVisible - Whether the parent container is visible
 * @param baseDelay - Base delay in ms between items (default 80)
 */
export function getStaggeredAnimation(
  index: number,
  isVisible: boolean,
  baseDelay = 80
): React.CSSProperties {
  return {
    opacity: isVisible ? 1 : 0,
    
    transition: `opacity 0.5s ease-out ${index * baseDelay}ms`,
  };
}
