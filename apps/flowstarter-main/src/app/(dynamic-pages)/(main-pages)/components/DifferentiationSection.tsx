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
              ? 'bg-[linear-gradient(135deg,var(--landing-btn-from),var(--landing-btn-via))] text-white shadow-xl shadow-[var(--landing-text-accent)]/20'
              : 'bg-[var(--landing-card-bg)] ring-1 ring-[var(--landing-card-border)]'
          }`}>
            <h3 className={`text-base sm:text-lg font-semibold ${card.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {card.label}
            </h3>
            <p className={`mt-2 text-sm leading-relaxed ${card.highlighted ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
              {card.description}
              {card.bullets && (
                <ul className="mt-3 space-y-1.5 text-left">
                  {card.bullets.map((b: string) => (
                    <li key={b} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 text-[var(--purple-primary)] shrink-0">✓</span>
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
