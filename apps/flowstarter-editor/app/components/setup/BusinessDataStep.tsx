import { useTranslation } from "~/lib/i18n/useTranslation";
/**
 * Business Data Step
 *
 * Shows loaded business data or lets the user enter it.
 */

import type { SetupData } from './SetupWizard';

interface BusinessDataStepProps {
  data: SetupData;
  onUpdate: (updates: Partial<SetupData>) => void;
  onNext: () => void;
}

export function BusinessDataStep({ data, onUpdate, onNext }: BusinessDataStepProps) {
  const { t } = useTranslation();
  const canProceed = data.businessName?.trim();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mb-2">
          {t.setup.businessData.title}
        </h2>
        <p className="text-gray-500 dark:text-zinc-400 text-sm">
          {t.setup.businessData.subtitle}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
            Business name
          </label>
          <input
            type="text"
            value={data.businessName || ''}
            onChange={(e) => onUpdate({ businessName: e.target.value })}
            placeholder={t.setup.businessData.businessNamePlaceholder}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
            Industry
          </label>
          <select
            value={data.industry || ''}
            onChange={(e) => onUpdate({ industry: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          >
            <option value="">{t.setup.businessData.selectIndustry}</option>
            <option value="restaurant">{t.setup.businessData.restaurant}</option>
            <option value="retail">{t.setup.businessData.retail}</option>
            <option value="services">{t.setup.businessData.services}</option>
            <option value="health">{t.setup.businessData.health}</option>
            <option value="creative">{t.setup.businessData.creative}</option>
            <option value="tech">{t.setup.businessData.tech}</option>
            <option value="education">{t.setup.businessData.education}</option>
            <option value="nonprofit">{t.setup.businessData.nonprofit}</option>
            <option value="other">{t.setup.businessData.other}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
            Brief description
          </label>
          <textarea
            value={data.businessDescription || ''}
            onChange={(e) => onUpdate({ businessDescription: e.target.value })}
            placeholder={t.setup.businessData.descriptionPlaceholder}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
