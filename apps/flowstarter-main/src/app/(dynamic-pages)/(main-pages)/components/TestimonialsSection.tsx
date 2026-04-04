'use client';

import { SectionWrapper, SectionHeading } from './SectionWrapper';
import { LANDING_COPY } from '../landing-copy';

export function TestimonialsSection() {
  const { testimonials } = LANDING_COPY;

  return (
    <SectionWrapper id="testimonials">
      <div className="text-center mb-10">
        <SectionHeading className="text-center mb-3">
          {testimonials.title}
        </SectionHeading>
        <p className="text-sm font-medium text-[var(--purple)] tracking-wide">
          {testimonials.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {testimonials.items.map((t, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-2xl border border-gray-200/60 dark:border-white/[0.06] bg-white/80 dark:bg-white/[0.03] backdrop-blur-sm p-6 shadow-sm"
          >
            {/* Stars */}
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, s) => (
                <svg
                  key={s}
                  className="w-4 h-4 text-amber-400 fill-amber-400"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            {/* Quote */}
            <p className="text-sm leading-relaxed text-gray-600 dark:text-white/60 flex-1">
              &ldquo;{t.quote}&rdquo;
            </p>

            {/* Author */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-white/[0.06]">
              <div className="w-9 h-9 rounded-full bg-[var(--purple-primary-lightest)] text-[var(--purple-primary)] flex items-center justify-center text-xs font-bold shrink-0">
                {t.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t.name}
                </p>
                <p className="text-xs text-gray-400 dark:text-white/35">
                  {t.role}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
