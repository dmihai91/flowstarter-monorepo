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
  const canProceed = data.businessName?.trim();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mb-2">
          Tell us about your business
        </h2>
        <p className="text-gray-500 dark:text-zinc-400 text-sm">
          We'll use this to personalize your website.
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
            placeholder="e.g., CoffeeRoast"
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
            <option value="">Select an industry</option>
            <option value="restaurant">Restaurant / Food & Drink</option>
            <option value="retail">Retail / E-Commerce</option>
            <option value="services">Professional Services</option>
            <option value="health">Health & Wellness</option>
            <option value="creative">Creative / Portfolio</option>
            <option value="tech">Technology</option>
            <option value="education">Education</option>
            <option value="nonprofit">Non-Profit</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1.5">
            Brief description
          </label>
          <textarea
            value={data.businessDescription || ''}
            onChange={(e) => onUpdate({ businessDescription: e.target.value })}
            placeholder="What does your business do? Who are your customers?"
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
