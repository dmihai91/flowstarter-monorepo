'use client';

import { Label } from '@/components/ui/label';
import { PLATFORM_CONFIG } from '@/lib/const';
import { useTranslations } from '@/lib/i18n';
import { ExternalLink, Server } from 'lucide-react';

interface DomainTypeCardsProps {
  selected: 'custom' | 'hosted';
  onChangeAction: (value: 'custom' | 'hosted') => void;
}

export function DomainTypeCards({
  selected,
  onChangeAction,
}: DomainTypeCardsProps) {
  const { t } = useTranslations();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="relative">
        <input
          type="radio"
          value="hosted"
          id="hosted"
          className="peer sr-only"
          checked={selected === 'hosted'}
          onChange={() => onChangeAction('hosted')}
        />
        <Label
          htmlFor="hosted"
          className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:border-green-300 hover:shadow-md transform hover:scale-[1.01] ${
            selected === 'hosted'
              ? 'border-green-500 bg-green-50 dark:bg-green-900/30 shadow-md ring-1 ring-green-500/20'
              : 'border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4" style={{ color: 'var(--green)' }} />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {t('domain.hostedOption.title')}
              </span>
            </div>
            {selected === 'hosted' && (
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center ml-3">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            )}
          </div>
          <div className="my-2">
            <span className="inline-block text-sm px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/30">
              {t('domain.recommended')}
            </span>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-300 mb-1">
            {t('domain.hostedOption.freeSubdomainOn')} {PLATFORM_CONFIG.DOMAIN}
          </span>
        </Label>
      </div>

      <div className="relative">
        <input
          type="radio"
          value="custom"
          id="custom"
          className="peer sr-only"
          checked={selected === 'custom'}
          onChange={() => onChangeAction('custom')}
        />
        <Label
          htmlFor="custom"
          className={`flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:border-blue-300 hover:shadow-md transform hover:scale-[1.01] ${
            selected === 'custom'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md ring-1 ring-blue-500/20'
              : 'border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <ExternalLink
                className="h-4 w-4"
                style={{ color: 'var(--blue)' }}
              />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {t('domain.customOption.title')}
              </span>
            </div>
            {selected === 'custom' && (
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center ml-3">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            )}
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-300 mb-1">
            {t('domain.customOption.useExisting')}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t('domain.customOption.note')}
          </span>
        </Label>
      </div>
    </div>
  );
}
