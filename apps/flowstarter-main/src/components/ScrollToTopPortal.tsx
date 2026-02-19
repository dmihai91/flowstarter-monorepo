'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ScrollToTop } from './ScrollToTop';

/**
 * Portal wrapper for ScrollToTop to ensure it renders at body level
 * This prevents any parent positioning contexts from affecting the fixed button
 */
export function ScrollToTopPortal() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(<ScrollToTop />, document.body);
}
