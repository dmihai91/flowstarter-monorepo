'use client';

import { PLATFORM_CONFIG } from '@/lib/const';
import { useI18n } from '@/lib/i18n';

interface DomainPreviewBannerProps {
  domainType: 'custom' | 'hosted';
  domain: string;
  projectName: string;
}

export function DomainPreviewBanner({
  domainType,
  domain,
  projectName,
}: DomainPreviewBannerProps) {
  const { t } = useI18n();
  const displayDomain =
    domainType === 'hosted'
      ? domain || `${projectName}${PLATFORM_CONFIG.SUBDOMAIN_SUFFIX}`
      : domain;

  return (
    <div className="p-3 rounded-xl bg-linear-to-r from-blue-50/80 to-green-50/60 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200/30 dark:border-blue-700/30 backdrop-blur-sm">
      <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
        <span className="font-semibold">{t('domain.preview.availableAt')}</span>{' '}
        <span className="font-mono bg-white/60 dark:bg-gray-800/60 px-2 py-1 rounded-xl border border-gray-200/50 dark:border-gray-600/50 text-gray-800 dark:text-gray-200">
          {displayDomain}
        </span>
        <div
          className={`flex items-center gap-2 mt-2 ${
            domainType === 'custom'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-green-600 dark:text-green-400'
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              domainType === 'custom' ? 'bg-blue-500' : 'bg-green-500'
            }`}
          ></div>
          <span className="font-medium">
            {domainType === 'custom'
              ? t('domain.preview.customConfigured')
              : `${t('domain.preview.hostedOn')} ${PLATFORM_CONFIG.DOMAIN}`}
          </span>
        </div>
      </div>
    </div>
  );
}
