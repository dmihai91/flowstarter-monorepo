'use client';

import { useState, useEffect, useRef, type ReactNode, type HTMLAttributes } from 'react';

export interface ScrollAwareHeaderProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  threshold?: number;
  transparentClass?: string;
  scrolledClass?: string;
}

export function ScrollAwareHeader({
  children,
  threshold = 10,
  transparentClass = 'bg-transparent',
  scrolledClass = 'bg-white/80 dark:bg-[#14141a]/85 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/12 shadow-sm',
  className = '',
  ...props
}: ScrollAwareHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > threshold);
        ticking.current = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,box-shadow] duration-300 ease-out ${scrolled ? scrolledClass : transparentClass} ${className}`}
      {...props}
    >
      {children}
    </header>
  );
}
