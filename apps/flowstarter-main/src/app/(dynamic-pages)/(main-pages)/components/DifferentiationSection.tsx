'use client';

import { SectionWrapper, SectionHeading } from './SectionWrapper';
import { LANDING } from './landing-content';

const d = LANDING.differentiation;

export function DifferentiationSection() {
  return (
    <SectionWrapper tinted>
      <SectionHeading className="text-center">{d.title}</SectionHeading>

      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {d.cards.map((card) => (
          <div key={card.label} className={`rounded-2xl p-8 transition-all ${
            card.highlighted
              ? 'bg-[linear-gradient(135deg,var(--landing-btn-from),var(--landing-btn-via))] text-white shadow-xl shadow-[var(--landing-text-accent)]/20'
              : 'bg-[var(--landing-card-bg)] ring-1 ring-[var(--landing-card-border)]'
          }`}>
            <h3 className={`text-lg font-semibold ${card.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {card.label}
            </h3>
            <p className={`mt-3 text-sm leading-relaxed ${card.highlighted ? 'text-[var(--purple-primary-lightest)]' : 'text-gray-500 dark:text-gray-400'}`}>
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
