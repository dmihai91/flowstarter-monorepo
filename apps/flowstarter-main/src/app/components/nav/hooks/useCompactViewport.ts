'use client';
import { useEffect, useState } from 'react';

/**
 * Hook to detect if the viewport is in a compact state (mobile landscape, split view).
 * @returns boolean indicating if the navbar should be in compact mode.
 */
export function useCompactViewport(): boolean {
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const updateCompact = () => {
      const h = window.innerHeight;
      const w = window.innerWidth;
      setIsCompact(h <= 420 || (w <= 600 && h <= 480));
    };

    updateCompact();
    window.addEventListener('resize', updateCompact);
    window.addEventListener('orientationchange', updateCompact);

    return () => {
      window.removeEventListener('resize', updateCompact);
      window.removeEventListener('orientationchange', updateCompact);
    };
  }, []);

  return isCompact;
}
