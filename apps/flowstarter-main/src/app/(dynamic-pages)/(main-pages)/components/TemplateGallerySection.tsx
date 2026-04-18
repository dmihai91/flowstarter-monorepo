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
      <div className="ls-mesh" aria-hidden />
      <div className="ls-orb ls-orb--violet ls-orb--tl" aria-hidden />
      <div className="ls-orb ls-orb--warm ls-orb--br" aria-hidden />
      <div className="ls-grain" aria-hidden />

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

      <style jsx global>{`
        .ls-tpl-card {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid var(--ls-rule);
          background: var(--ls-glass-bg);
          box-shadow: var(--ls-card-shadow);
          transition: border-color 320ms ease,
            transform 320ms cubic-bezier(0.19, 1, 0.22, 1),
            box-shadow 320ms ease;
        }
        .ls-tpl-card:hover {
          border-color: color-mix(in oklab, var(--ls-accent) 50%, transparent);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6),
            0 24px 60px color-mix(in oklab, var(--ls-accent) 14%, transparent),
            0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .dark .ls-tpl-card:hover {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 30px 80px color-mix(in oklab, var(--ls-accent) 20%, transparent),
            0 8px 24px rgba(0, 0, 0, 0.5);
        }
        .ls-tpl-img {
          transition: transform 700ms cubic-bezier(0.19, 1, 0.22, 1);
        }
        .ls-tpl-card:hover .ls-tpl-img {
          transform: scale(1.06);
        }
        .dark .ls-tpl-img {
          filter: brightness(0.75) saturate(0.9) contrast(1.05);
        }
        .ls-tpl-dot {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 10px;
          height: 10px;
          border-radius: 999px;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5),
            0 2px 6px rgba(0, 0, 0, 0.25);
          z-index: 2;
        }
        .ls-tpl-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: flex-end;
          background: linear-gradient(
            to top,
            rgba(0, 0, 0, 0.82) 0%,
            rgba(0, 0, 0, 0.35) 35%,
            transparent 70%
          );
          z-index: 1;
        }
        .ls-tpl-meta {
          width: 100%;
          padding: 0.9rem 1rem 0.95rem;
          transform: translateY(2px);
          transition: transform 320ms cubic-bezier(0.19, 1, 0.22, 1);
        }
        .ls-tpl-card:hover .ls-tpl-meta {
          transform: translateY(0);
        }
        .ls-tpl-cat {
          display: inline-block;
          font-family: var(--ls-mono);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 0.3rem;
        }
        .ls-tpl-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }
        .ls-tpl-name {
          font-family: var(--ls-sans);
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: -0.015em;
          color: #fff;
          line-height: 1.15;
        }
        .ls-tpl-name--lg {
          font-size: 1.05rem;
        }
        .ls-tpl-preview {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          flex-shrink: 0;
          font-family: var(--ls-mono);
          font-size: 10.5px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.8);
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 260ms ease,
            transform 260ms cubic-bezier(0.19, 1, 0.22, 1);
        }
        .ls-tpl-card:hover .ls-tpl-preview {
          opacity: 1;
          transform: translateX(0);
        }
        @media (hover: none) {
          .ls-tpl-preview {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  );
}
