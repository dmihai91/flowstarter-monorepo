import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/i18n';
import { useWizardStore } from '@/store/wizard-store';
import type { ProjectWizardStep } from '@/types/project-config';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';

interface WizardNavigationProps {
  currentStep: ProjectWizardStep;
  currentStepIndex: number;
  canProceed: boolean;
  isGenerating?: boolean;
  isNextLoading: boolean;
  allowSubmit: boolean;
  onNext: () => Promise<void> | void;
  onPrevious: () => void;
  onSubmitForReview?: () => void;
  setIsNextLoading: (loading: boolean) => void;
  maxWidth?: 'default' | 'large';
}

export function WizardNavigation({
  currentStep,
  currentStepIndex,
  canProceed,
  isGenerating,
  isNextLoading,
  allowSubmit,
  onNext,
  onPrevious,
  onSubmitForReview,
  setIsNextLoading,
  maxWidth = 'default',
}: WizardNavigationProps) {
  const { t } = useTranslations();
  const detailsPhase = useWizardStore((s) => s.detailsPhase);
  const setDetailsPhase = useWizardStore((s) => s.setDetailsPhase);
  const showAssistantTransition = useWizardStore(
    (s) => s.showAssistantTransition
  );

  const showBackButton =
    currentStepIndex > 0 ||
    (currentStep === 'details' && detailsPhase === 'refine') ||
    (currentStep === 'details' && showAssistantTransition);

  const handleBack = () => {
    if (
      currentStep === 'details' &&
      detailsPhase === 'refine' &&
      !showAssistantTransition
    ) {
      setDetailsPhase('collect');
    } else {
      onPrevious();
    }
  };

  const handleNext = async () => {
    if (isGenerating || isNextLoading) return;
    if (currentStep === 'details' && detailsPhase === 'collect') {
      setDetailsPhase('refine');
      return;
    }
    if (!canProceed) return;

    setIsNextLoading(true);
    try {
      await Promise.resolve(onNext());
    } finally {
      setIsNextLoading(false);
    }
  };

  return (
    <div
      className={`mt-6 pb-20 sm:pb-0 mb-6 ${
        maxWidth === 'large' ? 'max-w-8xl' : 'max-w-5xl'
      } mx-auto w-full`}
    >
      {/* Buttons row - directly under the card with help text centered */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Back Button */}
        {showBackButton ? (
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isGenerating}
            className="text-sm sm:text-base border border-gray-200 dark:border-gray-700 hover:border-[var(--surface-2)] dark:hover:border-[var(--surface-2)] hover:bg-[var(--surface-2)]/80 dark:hover:bg-[var(--surface-2)]/80 hover:shadow-md transition-all font-medium disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700 disabled:hover:bg-transparent flex-1 sm:flex-none sm:w-auto !h-11"
          >
            <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
            {t('app.back')}
          </Button>
        ) : (
          <div className="hidden sm:block sm:w-auto" />
        )}

        {/* Center: Help link */}
        <div className="hidden md:block flex-1 text-center text-xs sm:text-sm text-muted-foreground">
          {t('app.needHelp')}{' '}
          <a
            href="/contact"
            className="underline underline-offset-4 text-primary hover:text-primary/90 hover:opacity-80"
          >
            {t('app.bookCallWithUs')}
          </a>
        </div>

        {/* Right: Next/Continue/Publish Button */}
        {currentStep !== 'review' &&
          !(currentStep === 'details' && detailsPhase === 'collect') && (
            <Button
              id="wizard-continue-button"
              onClick={handleNext}
              disabled={isGenerating || isNextLoading || !canProceed}
              className="flex-1 sm:flex-none sm:w-auto h-11 sm:h-10 text-base sm:text-sm rounded-lg justify-center"
              data-wizard-next
              aria-busy={isNextLoading}
            >
              {isNextLoading ? (
                <>
                  <span>{t('app.saveContinue')}</span>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                </>
              ) : (
                <>
                  <span>
                    {currentStep === 'details' && detailsPhase === 'collect'
                      ? t('app.continue')
                      : t('app.saveContinue')}
                  </span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}

        {currentStep === 'review' && (
          <Button
            onClick={() => (onSubmitForReview ? onSubmitForReview() : onNext())}
            disabled={!allowSubmit}
            className="text-sm sm:text-base !h-10 px-5 bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-gray-200 shadow-md disabled:bg-black/60 disabled:text-white/75 dark:disabled:bg-white/55 dark:disabled:text-black/75"
          >
            <Check className="h-4 w-4 mr-2 stroke-current" />
            {t('app.publish')}
          </Button>
        )}
      </div>

      {/* Mobile: Help link below buttons */}
      <div className="md:hidden text-center text-xs text-muted-foreground mt-6">
        {t('app.needHelp')}{' '}
        <a
          href="/contact"
          className="underline underline-offset-4 text-[var(--purple)] hover:text-[var(--purple)]/90 hover:opacity-80"
        >
          {t('app.bookCallWithUs')}
        </a>
      </div>
    </div>
  );
}
