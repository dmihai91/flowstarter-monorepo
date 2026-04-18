'use client';

import { useEffect, useRef } from 'react';

/**
 * Adds `is-visible` class to `.reveal-card` children when the container
 * scrolls into view, triggering the staggered revealUp animation.
 */
export function useRevealCards() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          container
            .querySelectorAll<HTMLElement>('.reveal-card')
            .forEach((el) => el.classList.add('is-visible'));
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return ref;
}
