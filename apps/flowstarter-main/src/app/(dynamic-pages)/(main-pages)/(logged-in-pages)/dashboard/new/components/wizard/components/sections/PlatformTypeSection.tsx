import { useTranslations } from '@/lib/i18n';
import type { ProjectConfig } from '@/types/project-config';
import { AppWindow, Flag, Image as ImageIcon } from 'lucide-react';

interface PlatformTypeSectionProps {
  projectConfig: ProjectConfig;
  onProjectConfigChange: (config: ProjectConfig) => void;
}

export function PlatformTypeSection({
  projectConfig,
  onProjectConfigChange,
}: PlatformTypeSectionProps) {
  const { t } = useTranslations();

  const platformTypes = [
    {
      id: 'business-site',
      label: t('platformType.businessSite') || 'Business Site',
      description:
        t('platformType.businessSiteDesc') || 'Professional business website',
      icon: <AppWindow className="w-6 h-6" />,
    },
    {
      id: 'personal-brand',
      label: t('platformType.personalBrand') || 'Personal Brand',
      description:
        t('platformType.personalBrandDesc') ||
        'Personal brand or professional profile',
      icon: <Flag className="w-6 h-6" />,
    },
    {
      id: 'portfolio',
      label: t('platformType.portfolio') || 'Portfolio',
      description: t('platformType.portfolioDesc') || 'Showcase your work',
      icon: <ImageIcon className="w-6 h-6" />,
    },
  ];

  const handleSelect = (typeId: string) => {
    onProjectConfigChange({
      ...projectConfig,
      platformType: typeId,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-[8px]">
        <label className="block text-md font-medium leading-normal text-gray-900 dark:text-white">
          {t('platformType.label') || 'Platform Type'}
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {platformTypes.map((type) => {
          const isSelected = projectConfig.platformType === type.id;
          return (
            <div
              key={type.id}
              onClick={() => handleSelect(type.id)}
              className={`
                flex items-center gap-4 rounded-[8px] border-[1.5px] border-solid p-4 cursor-pointer transition-all duration-200
                bg-transparent backdrop-blur-sm
                ${
                  isSelected
                    ? 'border-gray-400 dark:border-white/40 bg-white/30 dark:bg-[var(--surface-2)]/30'
                    : 'border-gray-300 dark:border-[var(--border-subtle)] hover:border-gray-400 dark:hover:border-white/40 hover:bg-white/20 dark:hover:bg-[var(--surface-2)]/20'
                }
              `}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-[var(--surface-2)]/30 backdrop-blur-sm border border-gray-300/50 dark:border-white/10 text-gray-900 dark:text-white shrink-0">
                {type.icon}
              </div>
              <div className="flex flex-col gap-0.5 flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {type.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {type.description}
                </div>
              </div>
              <div
                className={`
                  w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200
                  ${
                    isSelected
                      ? 'border-gray-400 dark:border-white/40'
                      : 'border-gray-300 dark:border-[var(--border-subtle)]'
                  }
                `}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-gray-900 dark:bg-white" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
