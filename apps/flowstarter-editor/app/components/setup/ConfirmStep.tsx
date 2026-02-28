/**
 * Confirm Step
 *
 * Summary of selections before starting the build.
 */

import { Palette, Type, Layout, Building2 } from 'lucide-react';
import type { SetupData } from './SetupWizard';

interface ConfirmStepProps {
  data: SetupData;
  onConfirm: () => void;
  onPrev: () => void;
  isLoading?: boolean;
}

export function ConfirmStep({ data, onConfirm, onPrev, isLoading }: ConfirmStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mb-2">
          Ready to build
        </h2>
        <p className="text-gray-500 dark:text-zinc-400 text-sm">
          Review your selections and start building your website.
        </p>
      </div>

      {/* Summary cards */}
      <div className="space-y-3">
        <SummaryCard
          icon={<Building2 size={18} />}
          label="Business"
          value={data.businessName || 'Not set'}
          detail={data.industry}
        />
        <SummaryCard
          icon={<Layout size={18} />}
          label="Template"
          value={data.templateName || 'Not selected'}
        />
        <SummaryCard
          icon={<Palette size={18} />}
          label="Color Palette"
          value={data.palette || 'Default'}
        />
        <SummaryCard
          icon={<Type size={18} />}
          label="Fonts"
          value={data.headingFont ? `${data.headingFont} + ${data.bodyFont}` : 'Default'}
        />
      </div>

      <div className="flex justify-between">
        <button
          onClick={onPrev}
          disabled={isLoading}
          className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
        >
          Previous
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="px-8 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-60 transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating workspace...
            </>
          ) : (
            'Start Building'
          )}
        </button>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
      <div className="text-emerald-600 dark:text-emerald-400 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 dark:text-zinc-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">
          {value}
        </p>
        {detail && (
          <p className="text-xs text-gray-500 dark:text-zinc-400">{detail}</p>
        )}
      </div>
    </div>
  );
}
