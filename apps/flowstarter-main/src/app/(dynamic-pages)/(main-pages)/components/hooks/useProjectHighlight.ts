import { useState, useEffect, useRef } from 'react';

/**
 * Manages the "newly created project" highlight effect.
 * Reads from sessionStorage, scrolls to the card, then clears after 3s.
 */
export function useProjectHighlight(deps: unknown[] = []) {
  const [highlightProjectId, setHighlightProjectId] = useState<string | null>(null);
  const highlightedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const newProjectId = window.sessionStorage.getItem('fs_new_project_id');
    if (!newProjectId) return;

    setHighlightProjectId(newProjectId);

    // Scroll to the highlighted project after a brief delay
    const scrollTimer = setTimeout(() => {
      highlightedRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 100);

    // Remove highlight after animation
    const clearTimer = setTimeout(() => {
      setHighlightProjectId(null);
      window.sessionStorage.removeItem('fs_new_project_id');
    }, 3000);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { highlightProjectId, highlightedRef };
}
