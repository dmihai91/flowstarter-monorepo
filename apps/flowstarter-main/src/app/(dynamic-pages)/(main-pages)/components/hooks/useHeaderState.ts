import { useState, useEffect } from 'react';

export function useHeaderState() {
  const [isLoaded] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sectionIds = [
      'editor-showcase',
      'templates',
      'process',
      'pricing',
      'faq',
    ] as const;
    const getSections = () =>
      sectionIds
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null);

    const onScroll = () => {
      const sections = getSections();
      if (sections.length === 0) return;

      const marker = window.scrollY + 140; // header + breathing room
      let current = '';

      for (const section of sections) {
        if (section.offsetTop <= marker) {
          current = section.id;
        }
      }

      setActiveSection(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return {
    isLoaded,
    scrolled,
    mobileMenuOpen,
    setMobileMenuOpen,
    activeSection,
  };
}
