'use client';

import { useTranslations } from '@/lib/i18n';

export default function TeamDashboardLoading() {
  const { t } = useTranslations();
  
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-white/10" />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--purple)] animate-spin"
            style={{ animationDuration: '0.8s' }}
          />
        </div>
        <p className="text-sm text-gray-500 dark:text-white/50">{t('dashboard.loading')}</p>
      </div>
    </div>
  );
}
