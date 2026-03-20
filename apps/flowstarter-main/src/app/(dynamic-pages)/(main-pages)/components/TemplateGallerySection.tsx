'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const TEMPLATES = [
  { slug: 'therapist-care',     name: 'Therapist Care',     category: 'Health & Wellness',   accent: '#4A7C6F' },
  { slug: 'fitness-coach',      name: 'Fitness Coach',      category: 'Health & Fitness',    accent: '#E85D26' },
  { slug: 'academic-tutor',     name: 'Academic Tutor',     category: 'Education',           accent: '#1A3A6B' },
  { slug: 'beauty-stylist',     name: 'Beauty Stylist',     category: 'Beauty & Style',      accent: '#C97B63' },
  { slug: 'coach-pro',          name: 'Coach Pro',          category: 'Business Coaching',   accent: '#2C5F8A' },
  { slug: 'creative-portfolio', name: 'Creative Portfolio', category: 'Portfolio',           accent: '#7C3AED' },
];

type Template = typeof TEMPLATES[0];

function Card({
  t, i, featured, isInView,
}: {
  t: Template; i: number; featured: boolean; isInView: boolean;
}) {
  return (
    <motion.a
      href="https://library.flowstarter.dev"
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.92, filter: 'blur(12px)' }}
      animate={isInView
        ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
        : { opacity: 0, scale: 0.92, filter: 'blur(12px)' }}
      transition={{ duration: 0.7, delay: 0.05 + i * 0.11, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.2, ease: 'easeOut' } }}
      className={[
        'group relative block w-full rounded-2xl overflow-hidden',
        'border border-gray-200/60 dark:border-white/[0.08]',
        'shadow-[0_2px_16px_rgba(15,23,42,0.07)] dark:shadow-none',
        'hover:shadow-[0_20px_52px_rgba(77,93,217,0.20)] dark:hover:shadow-[0_20px_52px_rgba(77,93,217,0.28)]',
        'hover:border-[var(--purple-primary)]/50 dark:hover:border-[var(--purple-primary)]/40',
        'transition-all duration-300',
        featured ? 'aspect-[16/9]' : 'aspect-[4/3]',
      ].join(' ')}
    >
      <img
        src={`/thumbs/${t.slug}.png`}
        alt={t.name}
        className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.06]"
        loading="lazy"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pt-10 pb-3 px-4 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/55 mb-0.5">{t.category}</p>
        <div className="flex items-center justify-between gap-2">
          <p className={`font-bold text-white leading-tight ${featured ? 'text-base sm:text-lg' : 'text-sm sm:text-base'}`}>
            {t.name}
          </p>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white/75 text-xs font-medium flex items-center gap-1 shrink-0">
            Preview
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </div>
      </div>
      <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full ring-2 ring-white/40 shadow-sm" style={{ backgroundColor: t.accent }} />
    </motion.a>
  );
}

export function TemplateGallerySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
  const T = TEMPLATES;

  return (
    <motion.div
      ref={sectionRef}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <section className="py-20 sm:py-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">

          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase bg-[var(--purple-primary)]/10 text-[var(--purple-primary)] border border-[var(--purple-primary)]/20 mb-5">
              A design for every industry
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-4 [text-wrap:balance]">
              Your site, ready to launch.
            </h2>
            <p className="text-lg text-gray-500 dark:text-neutral-400 max-w-xl mx-auto">
              Pick yours. We customise it to your brand, copy, and clients.
            </p>
          </div>

          {/*
            Mobile layout (editorial):
              [0] full-width featured  (16:9)
              [1][2] pair              (4:3)
              [3] full-width featured  (16:9)
              [4][5] pair              (4:3)

            Desktop layout (3-col):
              [0 spans 2] [1]
              [2] [3] [4]
              [5 spans 2] (centered or left)
          */}

          {/* ── MOBILE layout (hidden on md+) ─────────────────────────── */}
          <div className="flex flex-col gap-4 md:hidden">
            <Card t={T[0]} i={0} featured isInView={isInView} />
            <div className="grid grid-cols-2 gap-4">
              <Card t={T[1]} i={1} featured={false} isInView={isInView} />
              <Card t={T[2]} i={2} featured={false} isInView={isInView} />
            </div>
            <Card t={T[3]} i={3} featured isInView={isInView} />
            <div className="grid grid-cols-2 gap-4">
              <Card t={T[4]} i={4} featured={false} isInView={isInView} />
              <Card t={T[5]} i={5} featured={false} isInView={isInView} />
            </div>
          </div>

          {/* ── DESKTOP layout (hidden below md) ──────────────────────── */}
          <div className="hidden md:flex flex-col gap-5">
            {/* Row 1: [0 wide] [1] */}
            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-2"><Card t={T[0]} i={0} featured isInView={isInView} /></div>
              <Card t={T[1]} i={1} featured={false} isInView={isInView} />
            </div>
            {/* Row 2: [2] [3] [4] */}
            <div className="grid grid-cols-3 gap-5">
              <Card t={T[2]} i={2} featured={false} isInView={isInView} />
              <Card t={T[3]} i={3} featured={false} isInView={isInView} />
              <Card t={T[4]} i={4} featured={false} isInView={isInView} />
            </div>
            {/* Row 3: [5 wide] */}
            <div className="grid grid-cols-3 gap-5">
              <div className="col-span-2"><Card t={T[5]} i={5} featured isInView={isInView} /></div>
              <div /> {/* spacer */}
            </div>
          </div>

          <div className="text-center mt-12">
            <a
              href="https://library.flowstarter.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl border border-[var(--purple-primary)]/30 bg-[var(--purple-primary)]/5 text-[var(--purple-primary)] font-semibold text-sm hover:bg-[var(--purple-primary)]/10 hover:border-[var(--purple-primary)]/50 transition-all duration-200 group"
            >
              Browse the library
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>

        </div>
      </section>
    </motion.div>
  );
}
