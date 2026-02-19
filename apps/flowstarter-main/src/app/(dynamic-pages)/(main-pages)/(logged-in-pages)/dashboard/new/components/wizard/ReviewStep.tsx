'use client';

import type { WizardStepProps } from '@/types/project-config';

interface ReviewStepProps extends WizardStepProps {
  /** The Supabase project/draft ID - available after draft is created in earlier wizard steps */
  projectId?: string | null;
}

export function ReviewStep({ projectConfig, projectId }: ReviewStepProps) {
  // TODO: Implement new coding editor integration
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Review & Generate
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Coding editor integration coming soon
        </p>
        <div className="mt-4 text-sm text-gray-500">
          <p>Project: {projectConfig.name}</p>
          {projectId && <p>Draft ID: {projectId}</p>}
        </div>
      </div>
    </div>
  );
}
