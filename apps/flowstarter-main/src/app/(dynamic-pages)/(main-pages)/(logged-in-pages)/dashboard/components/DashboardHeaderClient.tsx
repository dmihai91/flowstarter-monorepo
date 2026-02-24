'use client';

import { NewProjectDropdown } from '@/components/NewProjectDropdown';
import { useTranslations } from '@/lib/i18n';

export function DashboardHeaderClient() {
  const { t } = useTranslations();

  return (
    <div className="mb-8 px-4">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-5 py-4 sm:px-6 sm:py-5">
        {/* Decorative pattern layer */}
        <svg
          className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="fs-grid"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M24 0H0V24"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            className="text-gray-200 dark:text-gray-800"
            fill="url(#fs-grid)"
          />
        </svg>

        {/* Subtle color auras */}
        <div className="pointer-events-none absolute -top-16 -left-20 h-64 w-64 rounded-full bg-[var(--purple)]/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-blue-500/10 blur-2xl" />

        <div className="relative flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            {t('dashboard.overview')}
          </h1>
          <NewProjectDropdown />
        </div>
      </div>
    </div>
  );
}

export default DashboardHeaderClient;
