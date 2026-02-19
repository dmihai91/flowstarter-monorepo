import { cn } from '@/lib/utils';
import type { ProjectWizardStep } from '@/types/project-config';
import { StepDot } from './StepDot';

interface StepButtonProps {
  step: {
    id: ProjectWizardStep;
    title: string;
    description: string;
  };
  index: number;
  isAccessible: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
  isLastStep: boolean;
  onClick: () => void;
  variant: 'mobile' | 'tablet' | 'desktop';
}

const variantStyles = {
  mobile: {
    button: 'min-w-[160px] px-2.5 py-1.5',
    title: 'text-[0.85rem] leading-4',
    titleMargin: 'ml-2',
    divider: 'w-10 ml-3',
    dotSize: 'sm' as const,
  },
  tablet: {
    button: 'min-w-[180px] px-3 py-2',
    title: 'text-[0.9rem]',
    titleMargin: 'ml-2',
    divider: 'w-12 ml-4',
    dotSize: 'md' as const,
  },
  desktop: {
    button: 'min-w-[190px] px-3 py-2',
    title: 'text-[0.9rem]',
    titleMargin: 'ml-2.5',
    divider: 'w-10 ml-4 mr-2.5',
    dotSize: 'md' as const,
  },
};

export function StepButton({
  step,
  index,
  isAccessible,
  isCompleted,
  isCurrent,
  isLastStep,
  onClick,
  variant,
}: StepButtonProps) {
  const styles = variantStyles[variant];

  return (
    <button
      className={cn(
        'snap-center flex items-center rounded-xl transition-all duration-200',
        styles.button,
        isAccessible
          ? 'hover:bg-white/10 dark:hover:bg-white/5'
          : 'opacity-60 cursor-not-allowed'
      )}
      onClick={onClick}
      title={step.title}
      aria-current={isCurrent ? 'step' : undefined}
    >
      <div className="flex items-center">
        <StepDot
          index={index}
          stepId={step.id}
          isCompleted={isCompleted}
          isCurrent={isCurrent}
          size={styles.dotSize}
        />
        <div className={cn('text-left', styles.titleMargin)}>
          <div
            className={cn(
              'font-medium tracking-tight text-gray-900 dark:text-gray-100',
              styles.title
            )}
          >
            {step.title}
          </div>
          {variant === 'desktop' && (
            <div className="hidden xl:block text-gray-600 dark:text-gray-400 text-[0.8rem] font-normal">
              {step.description}
            </div>
          )}
        </div>
      </div>
      {!isLastStep && (
        <div
          className={cn(
            'h-px border-t border-solid border-gray-300/80 dark:border-white/40',
            styles.divider
          )}
        />
      )}
    </button>
  );
}
