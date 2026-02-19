import { useTranslations } from '@/lib/i18n';

interface ProceedModeSectionProps {
  hasIndustry: boolean;
  collectMode: string;
  setCollectMode: (mode: 'ai' | 'manual') => void;
  children: React.ReactNode;
}

export function ProceedModeSection({
  hasIndustry,
  children,
}: ProceedModeSectionProps) {
  const { t } = useTranslations();

  return (
    <div className="space-y-6">
      <div
        className={`relative ${
          !hasIndustry ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        <div className="space-y-4 my-6">
          <div className="text-sm font-medium leading-[1.3] text-gray-900 dark:text-white">
            {t('wizard.details.howProceed')}
          </div>
        </div>
        <div className="space-y-2">{children}</div>
      </div>
    </div>
  );
}
