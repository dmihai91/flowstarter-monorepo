'use client';

import { SectionWrapper, SectionHeading } from './SectionWrapper';
import { LANDING } from './landing-content';

const d = LANDING.differentiation;

export function DifferentiationSection() {
  return (
    <SectionWrapper className="bg-gray-50/50 dark:bg-white/[0.02]">
      <SectionHeading className="text-center">{d.title}</SectionHeading>

      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {d.cards.map((card) => (
          <div key={card.label} className={`rounded-2xl p-8 transition-all ${
            card.highlighted
              ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/20'
              : 'bg-white/70 dark:bg-white/[0.04] ring-1 ring-gray-200 dark:ring-white/10'
          }`}>
            <h3 className={`text-lg font-semibold ${card.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {card.label}
            </h3>
            <p className={`mt-3 text-sm leading-relaxed ${card.highlighted ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
