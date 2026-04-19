'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { useI18n } from '@/lib/i18n';

const TEMPLATES = [
  {
    slug: 'therapist-care',
    name: 'Therapist Care',
    category: 'Health & Wellness',
    accent: '#4A7C6F',
  },
  {
    slug: 'fitness-coach',
    name: 'Fitness Coach',
    category: 'Health & Fitness',
    accent: '#E85D26',
  },
  {
    slug: 'academic-tutor',
    name: 'Academic Tutor',
    category: 'Education',
    accent: '#1A3A6B',
  },
  {
    slug: 'beauty-stylist',
    name: 'Beauty Stylist',
    category: 'Beauty & Style',
    accent: '#C97B63',
  },
  {
    slug: 'coach-pro',
    name: 'Coach Pro',
    category: 'Business Coaching',
    accent: '#2C5F8A',
  },
  {
    slug: 'creative-portfolio',
    name: 'Creative Portfolio',
    category: 'Portfolio',
    accent: '#6d28d9',
  },
] as const;

type Template = (typeof TEMPLATES)[number];

function Card({
  template,
  index,
  featured,
  isInView,
  previewLabel,
}: {
  template: Template;
  index: number;
  featured: boolean;
  isInView: boolean;
  previewLabel: string;
}) {
  return (
    <motion.a
      href="https://library.flowstarter.dev"
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
      animate={
        isInView
          ? { opacity: 1, y: 0, filter: 'blur(0px)' }
          : { opacity: 0, y: 18, filter: 'blur(10px)' }
      }
      transition={{
        duration: 0.75,
        delay: 0.06 + index * 0.09,
        ease: [0.19, 1, 0.22, 1],
      }}
      whileHover={{ y: -4, transition: { duration: 0.22, ease: 'easeOut' } }}
      className={`ls-tpl-card group relative block w-full overflow-hidden ${
        featured ? 'aspect-[16/9]' : 'aspect-[4/3]'
      }`}
    >
      <Image
        src={`/thumbs/${template.slug}.png`}
        alt={template.name}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        className="ls-tpl-img object-cover object-top"
        loading="lazy"
      />

      {/* Accent dot — top right */}
      <span
        className="ls-tpl-dot"
        aria-hidden
        style={{ backgroundColor: template.accent }}
      />

      {/* Overlay with meta */}
      <div className="ls-tpl-overlay">
        <div className="ls-tpl-meta">
          <span className="ls-tpl-cat">{template.category}</span>
          <div className="ls-tpl-row">
            <span
              className={`ls-tpl-name ${featured ? 'ls-tpl-name--lg' : ''}`}
            >
              {template.name}
            </span>
            <span className="ls-tpl-preview">
              {previewLabel}
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </motion.a>
  );
}

export function TemplateGallerySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
  const { t: tStrict } = useI18n();
  const t = tStrict as (key: string) => string;
  const T = TEMPLATES;
  const preview = t('landing.templates.preview');

  return (
    <section
      id="templates"
      ref={sectionRef as unknown as React.RefObject<HTMLElement>}
      className="ls-scope ls-section ls-section--pad"
    >
      <div className="ls-mesh" aria-hidden />      <div className="ls-grain" aria-hidden />

      <div className="ls-container">
        <div className="text-center max-w-3xl mx-auto">
          <div
            className="ls-eyebrow inline-flex items-center justify-center gap-3"
            style={{ justifyContent: 'center' }}
          >
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: '28px',
                height: '1px',
                background: 'var(--ls-ink-faint)',
              }}
            />
            <span className="num">{t('landing.templates.eyebrow')}</span>
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: '28px',
                height: '1px',
                background: 'var(--ls-ink-faint)',
              }}
            />
          </div>
          <h2 className="ls-display mt-7" style={{ textWrap: 'balance' }}>
            <span className="line">
              {t('landing.templates.headlinePrefix')}
            </span>
            <span className="line flourish mt-2">
              {t('landing.templates.headlineFlourish')}
            </span>
          </h2>
          <p className="ls-body ls-body--lead mt-7 mx-auto">
            {t('landing.templates.sub')}
          </p>
        </div>

        {/* Mobile: editorial vertical flow */}
        <div className="mt-14 flex flex-col gap-4 md:hidden">
          <Card
            template={T[0]}
            index={0}
            featured
            isInView={isInView}
            previewLabel={preview}
          />
          <div className="grid grid-cols-2 gap-4">
            <Card
              template={T[1]}
              index={1}
              featured={false}
              isInView={isInView}
              previewLabel={preview}
            />
            <Card
              template={T[2]}
              index={2}
              featured={false}
              isInView={isInView}
              previewLabel={preview}
            />
          </div>
          <Card
            template={T[3]}
            index={3}
            featured
            isInView={isInView}
            previewLabel={preview}
          />
          <div className="grid grid-cols-2 gap-4">
            <Card
              template={T[4]}
              index={4}
              featured={false}
              isInView={isInView}
              previewLabel={preview}
            />
            <Card
              template={T[5]}
              index={5}
              featured={false}
              isInView={isInView}
              previewLabel={preview}
            />
          </div>
        </div>

        {/* Desktop: asymmetric 3-col grid */}
        <div className="mt-14 hidden md:flex md:flex-col md:gap-5">
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2">
              <Card
                template={T[0]}
                index={0}
                featured
                isInView={isInView}
                previewLabel={preview}
              />
            </div>
            <Card
              template={T[1]}
              index={1}
              featured={false}
              isInView={isInView}
              previewLabel={preview}
            />
          </div>
          <div className="grid grid-cols-3 gap-5">
            <Card
              template={T[2]}
              index={2}
              featured={false}
              isInView={isInView}
              previewLabel={preview}
            />
            <Card
              template={T[3]}
              index={3}
              featured={false}
              isInView={isInView}
              previewLabel={preview}
            />
            <Card
              template={T[4]}
              index={4}
              featured={false}
              isInView={isInView}
              previewLabel={preview}
            />
          </div>
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2">
              <Card
                template={T[5]}
                index={5}
                featured
                isInView={isInView}
                previewLabel={preview}
              />
            </div>
            <div />
          </div>
        </div>

        <div className="mt-14 text-center">
          <a
            href="https://library.flowstarter.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="ls-cta ls-cta--sm"
          >
            {t('landing.templates.ctaBrowse')}
            <svg
              className="arrow ml-1 h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.4}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14m-5-6l6 6-6 6"
              />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}