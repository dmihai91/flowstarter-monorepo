'use client';
import { useEffect, useState } from 'react';

/**
 * Hook to detect if the page has been scrolled past a threshold.
 * @param threshold - The scroll position (in pixels) to trigger the scrolled state. Default is 10.
 * @returns boolean indicating if the page is scrolled past the threshold.
 */
export function useScrolled(threshold = 10): boolean {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return isScrolled;
}
