'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface SectionWrapperProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  padding?: string;
  tinted?: boolean;
}

export function SectionWrapper({
  id,
  children,
  className = '',
  padding = 'py-16 md:py-24',
  tinted = false,
}: SectionWrapperProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      id={id}
      className={`relative ${padding} ${className}`}
      style={
        tinted
          ? {
              background: 'var(--landing-bg-tint)',
              maskImage:
                'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
            }
          : undefined
      }
    >
      <motion.div
        className="mx-auto max-w-5xl px-6 lg:px-8"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {children}
      </motion.div>
    </section>
  );
}

export function SectionHeading({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`font-display text-3xl font-semibold tracking-tight text-[var(--fs-ink)] sm:text-4xl lg:text-5xl ${className}`}
    >
      {children}
    </h2>
  );
}
