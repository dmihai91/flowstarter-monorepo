'use client';

import { cn } from '@/lib/utils';
import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ScrollToTopProps {
  showAfter?: number;
  className?: string;
}

/**
 * Floating button that scrolls to top with smooth animation
 * Shows immediately when user starts scrolling
 * @param showAfter - Pixels to scroll before showing button (default: 10)
 */
export function ScrollToTop({ showAfter = 10, className }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > showAfter);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfter]);

  const scrollToTop = () => {
    const startPosition = window.scrollY;
    const duration = 800;
    let startTime: number | null = null;

    function easeInOutCubic(t: number): number {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    function animation(currentTime: number) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      window.scrollTo(0, startPosition * (1 - ease));

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        window.scrollTo(0, 0);
      }
    }

    requestAnimationFrame(animation);
  };

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        // Fixed positioning with high z-index to stay on top
        'fixed bottom-6 right-6 z-[9999]',
        // Button styling to match new design scheme
        'flex items-center justify-center w-12 h-12 rounded-lg',
        'shadow-lg backdrop-blur-sm border-2',
        'bg-gray-900 dark:bg-white',
        'border-gray-800 dark:border-gray-200',
        'text-white dark:text-gray-900',
        // Visibility transitions
        'transition-all duration-300 ease-in-out',
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto scale-100'
          : 'opacity-0 translate-y-4 pointer-events-none scale-90',
        // Interaction styles
        'cursor-pointer',
        'hover:shadow-xl hover:shadow-gray-500/30 hover:scale-105',
        'hover:bg-gray-800 dark:hover:bg-gray-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-gray-100 focus-visible:ring-offset-2',
        'active:scale-95',
        // Ensure it stays on top of everything
        'select-none',
        className
      )}
      aria-label="Scroll to top"
      title="Scroll to top"
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
    </button>
  );
}
