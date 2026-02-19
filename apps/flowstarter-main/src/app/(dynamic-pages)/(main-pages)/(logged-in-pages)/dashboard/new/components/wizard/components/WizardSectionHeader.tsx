'use client';

import type React from 'react';

interface WizardSectionHeaderProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  background?: string;
  maxWidth?: 'default' | 'large';
}

export function WizardSectionHeader({
  title,
  description,
  action,
  background = 'var(--wizard-header-bg)',
  maxWidth = 'default',
}: WizardSectionHeaderProps) {
  // Keep the accent color but make it semi-transparent and add glassmorphism
  const translucentBackground = `color-mix(in oklab, ${background} 82%, transparent)`;

  return (
    <div
      className={`relative border border-white/40 dark:border-white/10 text-gray-900 dark:text-white rounded-t-[24px] rounded-b-none shadow-lg overflow-hidden gap-0 ${
        maxWidth === 'large' ? 'max-w-8xl' : 'max-w-4xl'
      } mx-auto backdrop-blur-md`}
      style={{ background: translucentBackground } as React.CSSProperties}
    >
      <div className="py-5 px-6 sm:py-6 sm:px-8 lg:px-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2
            className="text-[1.2rem] font-bold mb-2 uppercase tracking-tight"
            style={{ color: 'var(--wizard-header-text)' }}
          >
            {title}
          </h2>
          <p
            className="text-sm opacity-90"
            style={{ color: 'var(--wizard-header-text)' }}
          >
            {description}
          </p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
