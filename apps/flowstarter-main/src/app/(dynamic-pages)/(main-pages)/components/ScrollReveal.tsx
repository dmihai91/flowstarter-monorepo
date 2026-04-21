'use client';

import { useState, useEffect, type ReactNode } from 'react';

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
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = node;
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
  }, [node]);

  useEffect(() => {
    if (staggerChildren && isVisible && node) {
      node
        .querySelectorAll<HTMLElement>('.reveal-card')
        .forEach((el) => el.classList.add('is-visible'));
    }
  }, [staggerChildren, isVisible, node]);

  const sharedClassName = `${className} transition-all duration-1000 ease-out ${
    isVisible ? 'opacity-100' : 'opacity-0'
  }`;

  if (Tag === 'div') {
    return (
      <div
        ref={setNode}
        id={id}
        data-section={dataSection}
        className={sharedClassName}
      >
        {children}
      </div>
    );
  }

  return (
    <section
      ref={setNode}
      id={id}
      data-section={dataSection}
      className={sharedClassName}
    >
      {children}
    </section>
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
