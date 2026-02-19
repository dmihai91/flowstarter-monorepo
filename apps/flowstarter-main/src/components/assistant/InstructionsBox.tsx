import { useTranslations } from '@/lib/i18n';
import { Bot } from 'lucide-react';

export function InstructionsBox() {
  const { t } = useTranslations();

  return (
    <div className="mb-8 rounded-xl p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/30 dark:border-white/10">
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <Bot className="h-6 w-6 text-gray-900 dark:text-gray-100" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {t('assistant.title')}
          </h3>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                {t('assistant.instructions.industry')}
                {t('assistant.instructions.industryDescription')}
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>{t('assistant.instructions.pageType')}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>{t('assistant.instructions.audience')}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>{t('assistant.instructions.goals')}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>{t('assistant.instructions.visualStyle')}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
