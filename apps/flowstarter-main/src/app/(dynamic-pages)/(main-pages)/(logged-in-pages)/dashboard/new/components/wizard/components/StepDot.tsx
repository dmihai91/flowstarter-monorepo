import { cn } from '@/lib/utils';
import type { ProjectWizardStep } from '@/types/project-config';
import { getStepColor } from '../../../utils/stepColors';

interface StepDotProps {
  index: number;
  stepId: ProjectWizardStep;
  isCompleted: boolean;
  isCurrent: boolean;
  size: 'sm' | 'md';
}

export function StepDot({
  index,
  stepId,
  isCompleted,
  isCurrent,
  size,
}: StepDotProps) {
  const stepColor = getStepColor(stepId);
  const base = size === 'sm' ? 'w-7 h-7 text-sm' : 'w-8 h-8 text-[0.6875rem]';

  return (
    <div
      className={cn(
        base,
        'rounded-full flex items-center justify-center font-semibold shadow-sm transition-all shrink-0',
        !isCompleted &&
          !isCurrent &&
          'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400',
        isCompleted && 'text-white'
      )}
      style={{
        backgroundColor: isCompleted
          ? stepColor?.bgLight || '#6366f1'
          : isCurrent
          ? 'transparent'
          : undefined,
        color: isCurrent ? stepColor?.bgLight || '#6366f1' : undefined,
        border: isCurrent
          ? `2px solid ${stepColor?.bgLight ?? '#6366f1'}`
          : undefined,
        textShadow: isCompleted ? '0 1px 2px rgba(0,0,0,0.3)' : undefined,
      }}
    >
      {isCompleted ? '✓' : index + 1}
    </div>
  );
}
