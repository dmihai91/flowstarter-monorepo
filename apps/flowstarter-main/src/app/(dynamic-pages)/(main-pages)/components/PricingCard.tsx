'use client';

import { CTAButton } from './CTAButton';

interface PricingCardProps {
  name: string;
  price: string;
  monthly: string;
  label: string;
  features: readonly string[];
  cta: string;
  recommended?: boolean;
  badge?: string;
}

export function PricingCard({ name, price, monthly, label, features, cta, recommended = false, badge }: PricingCardProps) {
  return (
    <div className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 backdrop-blur-xl ${
      recommended
        ? 'bg-[var(--landing-card-bg)] ring-2 ring-[var(--landing-text-accent)] shadow-2xl shadow-[var(--landing-text-accent)]/10 scale-[1.02] lg:scale-105'
        : 'bg-[var(--landing-card-bg)] ring-1 ring-[var(--landing-card-border)] hover:shadow-lg hover:shadow-[var(--landing-glow)]'
    }`}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-[linear-gradient(135deg,var(--landing-btn-from),var(--landing-btn-via))] px-4 py-1 text-xs font-semibold text-white shadow-lg">
            {badge}
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{name}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>

      <div className="mb-6">
        <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">{price}</span>
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">+ {monthly}</span>
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--landing-text-accent)]" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      {/* TODO(Dorin): Starter CTA needs same visual weight as Growth — currently 'secondary' style. Upgrade to 'primary' or a distinct high-emphasis variant once design is confirmed. */}
      <CTAButton variant={recommended ? 'primary' : 'secondary'} size="md" className="w-full">
        {cta}
      </CTAButton>
    </div>
  );
}
