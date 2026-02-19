'use client';

import React, { useEffect } from 'react';

export function WizardPageWrapper({ children }: React.PropsWithChildren) {
  // Force restore scrollbar when wizard mounts
  // This ensures scrollbar is always available even after navigation
  useEffect(() => {
    // Immediately try to restore on mount
    document.body.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('overflow');
    document.documentElement.style.scrollbarGutter = 'stable';
    document.body.style.removeProperty('scrollbar-gutter');

    // Also schedule a delayed restore to catch any race conditions
    const timer = setTimeout(() => {
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('overflow');
      document.documentElement.style.scrollbarGutter = 'stable';
      document.body.style.removeProperty('scrollbar-gutter');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
}
