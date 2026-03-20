'use client';

import { SectionWrapper, SectionHeading } from './SectionWrapper';
import { LandingIcon, type IconName } from './LandingIcons';
import { LANDING_COPY } from '../landing-copy';

export function IncludedSection() {
  const included = LANDING_COPY.included;

  return (
    <SectionWrapper id="included">
      <div className="text-center">
        <SectionHeading>{included.title}</SectionHeading>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {included.cards.map((card, i) => (
          <div
            key={card.title}
            className="rounded-3xl border border-[var(--landing-card-border)] bg-[var(--landing-card-bg)] p-7 shadow-[0_10px_40px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(15,23,42,0.10)]"
          >
            <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${i % 2 === 0 ? "bg-[var(--purple-primary-lightest)] text-[var(--purple-primary)]" : "bg-gray-100 dark:bg-white/[0.07] text-gray-500 dark:text-gray-400"}`}>
              <LandingIcon name={card.icon as IconName} className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{card.title}</h3>
            {card.description && <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{card.description}</p>}
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
