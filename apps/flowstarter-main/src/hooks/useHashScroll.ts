'use client';

import { smoothScrollToSection } from '@/utils/smoothScroll';
import { useEffect } from 'react';

/**
 * Hook to handle smooth scrolling to hash on page load and hash changes
 */
export function useHashScroll() {
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // Function to handle hash scrolling
    const handleHashScroll = () => {
      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const hash = window.location.hash;
      if (hash) {
        const targetId = hash.substring(1);

        // Longer delay to ensure all components are fully mounted and rendered
        timeoutId = setTimeout(() => {
          const element = document.getElementById(targetId);
          if (element) {
            console.log(`Scrolling to section: ${targetId}`);
            smoothScrollToSection(targetId);
          } else {
            console.warn(
              `Section with ID "${targetId}" not found yet. Retrying...`
            );
            // Retry after another delay
            setTimeout(() => {
              smoothScrollToSection(targetId);
            }, 500);
          }
        }, 500);
      }
    };

    // Handle initial hash on page load - wait for everything to be ready
    const initialScroll = () => {
      // Use requestAnimationFrame to ensure the page is painted
      requestAnimationFrame(() => {
        setTimeout(handleHashScroll, 100);
      });
    };

    if (document.readyState === 'complete') {
      initialScroll();
    } else {
      window.addEventListener('load', initialScroll);
    }

    // Handle hash changes (browser back/forward)
    window.addEventListener('hashchange', handleHashScroll);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener('hashchange', handleHashScroll);
      window.removeEventListener('load', initialScroll);
    };
  }, []);
}
