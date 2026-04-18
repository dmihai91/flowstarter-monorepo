'use client';

import { useRef, useState, useEffect, type ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div';
  id?: string;
  'data-section'?: string;
  staggerChildren?: boolean;
}

/**
 * Client-only wrapper that reveals its server-rendered children
 * when they scroll into view. Content is always in the DOM (SSR-friendly).
 */
export function ScrollReveal({
  children,
  className = '',
  as: Tag = 'section',
  id,
  'data-section': dataSection,
  staggerChildren,
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.01, rootMargin: '0px 0px 400px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (staggerChildren && isVisible && ref.current) {
      ref.current
        .querySelectorAll<HTMLElement>('.reveal-card')
        .forEach((el) => el.classList.add('is-visible'));
    }
  }, [staggerChildren, isVisible]);

  return (
    <Tag
      ref={ref as any}
      id={id}
      data-section={dataSection}
      className={`${className} transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </Tag>
  );
}

/**
 * A child item inside ScrollReveal that staggers its entrance.
 * Renders immediately in SSR; animation is progressive enhancement.
 */
export function StaggerItem({
  children,
  index,
  isVisible,
  className = '',
}: {
  children: ReactNode;
  index: number;
  isVisible?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`${className} transition-all duration-[600ms] ${
        isVisible !== false
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-5'
      }`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      {children}
    </div>
  );
}
