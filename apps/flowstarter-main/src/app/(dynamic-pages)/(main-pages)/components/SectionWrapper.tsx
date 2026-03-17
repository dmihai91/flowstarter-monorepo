'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface SectionWrapperProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  padding?: string;
  /** Use tinted background (alternating sections) */
  tinted?: boolean;
}

export function SectionWrapper({ id, children, className = '', padding = 'py-24 md:py-32', tinted = false }: SectionWrapperProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      id={id}
      className={`${padding} ${tinted ? 'bg-[var(--landing-bg-tint)] dark:bg-[var(--landing-dark-surface-tint)]' : ''} ${className}`}
    >
      <motion.div
        className="mx-auto max-w-7xl px-6 lg:px-8"
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {children}
      </motion.div>
    </section>
  );
}

export function SectionHeading({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`font-display text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl ${className}`}>
      {children}
    </h2>
  );
}
