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
    // The nav sections, listed as the header lists them. 'templates' used to
    // sit in here and matched nothing: that section's id is 'template-library'.
    const sectionIds = [
      'process',
      'editor-showcase',
      'pricing',
      'faq',
    ] as const;
    // Sorted by where they actually are, because the loop below keeps the last
    // section above the marker and would otherwise depend on this array being
    // in page order. It was not: 'editor-showcase' sits after 'process' on the
    // page, so scrolling into the editor highlighted Process instead.
    const getSections = () =>
      sectionIds
        .map((id) => document.getElementById(id))
        .filter((el): el is HTMLElement => el !== null)
        .sort((a, b) => a.offsetTop - b.offsetTop);

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
