import { useState, useEffect } from 'react';

export function useHeaderState() {
  const [isLoaded] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { isLoaded, scrolled, mobileMenuOpen, setMobileMenuOpen };
}
