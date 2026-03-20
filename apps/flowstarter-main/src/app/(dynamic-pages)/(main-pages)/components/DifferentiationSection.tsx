'use client';

import { SectionWrapper, SectionHeading } from './SectionWrapper';
import { LANDING_COPY, type DifferentiationCard } from '../landing-copy';

export function DifferentiationSection() {
  const differentiation = LANDING_COPY.differentiation;

  return (
    <SectionWrapper tinted>
      <SectionHeading className="text-center">{differentiation.title}</SectionHeading>

      <div className="mt-8 sm:mt-12 grid gap-3 sm:gap-5 md:grid-cols-3">
        {differentiation.cards.map((card: DifferentiationCard) => (
          <div key={card.label} className={`rounded-xl sm:rounded-2xl px-5 py-4 sm:p-7 transition-all ${
            card.highlighted
              ? 'bg-[linear-gradient(135deg,var(--landing-btn-from),var(--landing-btn-via))] text-white shadow-xl shadow-[var(--landing-text-accent)]/20 ring-2 ring-[var(--purple-primary)]/40'
              : 'bg-gray-50/80 dark:bg-white/[0.04] ring-1 ring-gray-200/60 dark:ring-white/[0.08]'
          }`}>
            <h3 className={`text-base sm:text-lg font-semibold ${card.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {card.label}
            </h3>
            <div className={`mt-3 mb-3 h-px ${card.highlighted ? 'bg-white/20' : 'bg-gray-200 dark:bg-white/10'}`} />
            <p className={`mt-2 text-sm leading-relaxed ${card.highlighted ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
              {card.description}
              {card.bullets && (
                <ul className="mt-3 space-y-1.5 text-left">
                  {card.bullets.map((b: string) => (
                    <li key={b} className="flex items-start gap-2 text-sm">
                      <span className={`mt-0.5 shrink-0 ${card.highlighted ? "text-white/90" : "text-[var(--purple-primary)]"}`}>✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
