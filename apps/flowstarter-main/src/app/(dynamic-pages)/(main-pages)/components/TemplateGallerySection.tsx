'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const TEMPLATES = [
  { slug: 'therapist-care',     name: 'Therapist Care',    category: 'Health & Wellness',   accent: '#4A7C6F' },
  { slug: 'fitness-coach',      name: 'Fitness Coach',     category: 'Health & Fitness',    accent: '#E85D26' },
  { slug: 'academic-tutor',     name: 'Academic Tutor',    category: 'Education',           accent: '#1A3A6B' },
  { slug: 'beauty-stylist',     name: 'Beauty Stylist',    category: 'Beauty & Style',      accent: '#C97B63' },
  { slug: 'coach-pro',          name: 'Coach Pro',         category: 'Business Coaching',   accent: '#2C5F8A' },
  { slug: 'creative-portfolio', name: 'Creative Portfolio',category: 'Portfolio',           accent: '#7C3AED' },
];

export function TemplateGallerySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={sectionRef}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <section className="py-20 sm:py-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase bg-[var(--purple-primary)]/10 text-[var(--purple-primary)] border border-[var(--purple-primary)]/20 mb-5">
              Template Gallery
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
              Your site, ready to launch.
            </h2>
            <p className="text-lg text-gray-500 dark:text-neutral-400 max-w-xl mx-auto">
              Pick a template built for your industry. We customise it to your brand, copy, and clients.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
            {TEMPLATES.map((template, i) => (
              <motion.a
                key={template.slug}
                href="https://library.flowstarter.dev"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="group relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.08] hover:border-[var(--purple-primary)]/40 hover:shadow-[0_8px_30px_rgba(77,93,217,0.12)] transition-all duration-300 aspect-[4/3]"
              >
                <img
                  src={`https://library.flowstarter.dev/thumbs/${template.slug}.png`}
                  alt={template.name}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-0.5">{template.category}</p>
                  <p className="text-base font-bold text-white leading-tight">{template.name}</p>
                </div>
                <div
                  className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full ring-2 ring-white/30"
                  style={{ backgroundColor: template.accent }}
                />
              </motion.a>
            ))}
          </div>

          <div className="text-center mt-10">
            <a
              href="https://library.flowstarter.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--purple-primary)]/30 bg-[var(--purple-primary)]/5 text-[var(--purple-primary)] font-semibold text-sm hover:bg-[var(--purple-primary)]/10 hover:border-[var(--purple-primary)]/50 transition-colors"
            >
              Browse all templates
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
