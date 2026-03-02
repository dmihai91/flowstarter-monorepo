'use client';

import { useRef, useState, useEffect } from 'react';

/**
 * Hook to detect when an element enters the viewport.
 * Used for scroll-triggered animations.
 * @param threshold - Intersection threshold (0-1), default 0.05
 * @param rootMargin - Root margin for early triggering, default '100px'
 */
export function useScrollAnimation(threshold = 0.05, rootMargin = '0px 0px 100px 0px') {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

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

  return { ref, isVisible };
}
