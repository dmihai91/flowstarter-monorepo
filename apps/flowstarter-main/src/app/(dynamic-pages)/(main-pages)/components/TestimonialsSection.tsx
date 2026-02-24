'use client';

import { useTranslations } from '@/lib/i18n';
import { Quote, Star } from 'lucide-react';

export function TestimonialsSection() {
  const { t } = useTranslations();

  const testimonials = [
    {
      name: t('landing.testimonials.testimonial1.name'),
      role: t('landing.testimonials.testimonial1.role'),
      content: t('landing.testimonials.testimonial1.content'),
      rating: 5,
    },
    {
      name: t('landing.testimonials.testimonial2.name'),
      role: t('landing.testimonials.testimonial2.role'),
      content: t('landing.testimonials.testimonial2.content'),
      rating: 5,
    },
    {
      name: t('landing.testimonials.testimonial3.name'),
      role: t('landing.testimonials.testimonial3.role'),
      content: t('landing.testimonials.testimonial3.content'),
      rating: 5,
    },
  ];

  return (
    <section
      id="testimonials"
      className="full-width-section py-12 md:py-16 lg:py-20 relative"
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 backdrop-blur-xl bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)]" />
      <div className="absolute inset-0 border-t border-b border-white/40 dark:border-white/10" />
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--purple)]/5 via-blue-500/3 to-transparent pointer-events-none" />
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-[var(--purple)]/40/10 to-blue-400/10 dark:from-[var(--purple)]/5 dark:to-blue-600/5 blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/10 to-[var(--purple)]/10 dark:from-blue-600/5 dark:to-[var(--purple)]/5 blur-3xl animate-pulse"
          style={{ animationDelay: '1.5s', animationDuration: '4s' }}
        />
      </div>
      <div className="full-width-content relative z-10">
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="space-y-4 max-w-[850px] mx-auto text-center">
            <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium backdrop-blur-xl border border-white dark:border-white/40 bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)]">
              <Quote
                className="mr-1 h-3.5 w-3.5"
                style={{ color: 'var(--purple)' }}
              />
              <span>{t('landing.testimonials.badge')}</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              {t('landing.testimonials.sectionTitle')}
            </h2>
            <p className="text-muted-foreground md:text-lg">
              {t('landing.testimonials.sectionSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 tablet:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl pt-8">
            {testimonials.map((testimonial, idx) => (
              <div
                key={testimonial.name}
                className="group relative flex flex-col space-y-4 rounded-[16px] p-6 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] backdrop-blur-xl border border-white dark:border-white/40 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer bg-[rgba(243,243,243,0.3)] dark:bg-[rgba(58,58,74,0.3)] shadow-md hover:shadow-lg"
                style={{
                  transitionDelay: `${idx * 50}ms`,
                }}
              >
                {/* Quote icon */}
                <div className="relative z-10">
                  <Quote className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                </div>

                {/* Rating */}
                <div className="relative z-10 flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Content */}
                <div className="relative z-10 flex-1">
                  <p className="text-sm leading-relaxed text-muted-foreground italic">
                    &quot;{testimonial.content}&quot;
                  </p>
                </div>

                {/* Author */}
                <div className="relative z-10 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="font-semibold text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
