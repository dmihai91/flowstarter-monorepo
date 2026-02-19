import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/i18n';
import type { ProjectConfig } from '@/types/project-config';
import { Bot, Edit3, Info } from 'lucide-react';

interface ProjectSummaryProps {
  projectConfig: ProjectConfig;
  onEdit: () => void;
}

export function ProjectSummary({ projectConfig, onEdit }: ProjectSummaryProps) {
  const { t } = useTranslations();

  // Create summary bullet points
  const summaryPoints: string[] = [];

  if (projectConfig.name) {
    summaryPoints.push(`${t('basic.name.label')}: ${projectConfig.name}`);
  }

  if (projectConfig.description) {
    summaryPoints.push(
      `${t('basic.description.label')}: ${projectConfig.description}`
    );
  }

  if (projectConfig.businessGoals) {
    summaryPoints.push(
      `${t('wizard.summary.mainGoal')}: ${projectConfig.businessGoals}.`
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary header with bot icon */}
      <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-[#3a3a44] rounded-xl border border-dashed border-gray-300 dark:border-[#4a4a56]">
        <div className="flex-shrink-0">
          <Bot className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {t('wizard.summary.title')}
          </h3>
          <ul className="space-y-2 list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
            {summaryPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Info message */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex-shrink-0 mt-0.5">
          <Info className="h-4 w-4" style={{ color: 'var(--blue)' }} />
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {t('wizard.summary.instruction')}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          onClick={onEdit}
          variant="outline"
          className="flex-1 sm:flex-initial rounded-xl !px-6 !py-3 text-sm font-medium h-auto min-h-0"
        >
          <Edit3 className="h-4 w-4 mr-2" />
          {t('wizard.summary.editDetails')}
        </Button>
      </div>
    </div>
  );
}
