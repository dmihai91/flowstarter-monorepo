import FooterCompact from '@/components/FooterCompact';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useWizardStore } from '@/store/wizard-store';
import type { ProjectWizardStep } from '@/types/project-config';
import { useState } from 'react';
import { useWizardLifecycle } from '../../../hooks/useWizardLifecycle';
import { useWizardNavigation } from '../../../hooks/useWizardNavigation';
import { StepsIndicator } from './StepsIndicator';
import { WizardNavigation } from './WizardNavigation';
import { WizardSectionHeader } from './WizardSectionHeader';

const DETAILS_STEP: ProjectWizardStep = 'details';

interface WizardLayoutProps {
  currentStep: ProjectWizardStep;
  steps: Array<{
    id: ProjectWizardStep;
    title: string;
    description: string;
  }>;
  canProceed: boolean;
  isGenerating?: boolean;
  onNext: () => void;
  onPrevious: () => void;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  selectedTemplateName?: string;
  onCancel?: () => void;
  onSubmitForReview?: () => void;
  canSubmitForReview?: boolean;
  autosaveElement?: React.ReactNode;
  onQuickPreview?: () => void;
}

export function WizardLayout({
  currentStep,
  steps,
  canProceed,
  isGenerating,
  onNext,
  onPrevious,
  children,
  headerAction,
  onSubmitForReview,
  canSubmitForReview,
}: WizardLayoutProps) {
  const { t } = useTranslations();
  const {
    currentStepIndex,
    current,
    navigateToStep,
    isStepAccessible,
    getStepState,
  } = useWizardNavigation({ currentStep, steps });

  const detailsPhase = useWizardStore((s) => s.detailsPhase);
  const showAssistantTransition = useWizardStore(
    (s) => s.showAssistantTransition
  );

  const allowSubmit =
    typeof canSubmitForReview === 'boolean'
      ? canSubmitForReview && canProceed
      : currentStep === 'review' && canProceed && !isGenerating;

  const [hasUnsaved] = useState(true);
  const [isNextLoading, setIsNextLoading] = useState(false);

  useWizardLifecycle({ onNext, hasUnsaved });

  return (
    <>
      {/* Wizard Gradient Background - Enhanced visibility for light and dark modes */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-white dark:bg-[hsl(240,8%,17%)]">
        {/* Left ellipse - Pink - positioned at top-left, extended for uniform coverage */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 120% 70% at 0% 0%, var(--wizard-gradient-left) 0%, color-mix(in srgb, var(--wizard-gradient-left) 92%, transparent) 8%, color-mix(in srgb, var(--wizard-gradient-left) 82%, transparent) 18%, color-mix(in srgb, var(--wizard-gradient-left) 70%, transparent) 28%, color-mix(in srgb, var(--wizard-gradient-left) 55%, transparent) 40%, color-mix(in srgb, var(--wizard-gradient-left) 40%, transparent) 50%, color-mix(in srgb, var(--wizard-gradient-left) 25%, transparent) 60%, color-mix(in srgb, var(--wizard-gradient-left) 12%, transparent) 70%, color-mix(in srgb, var(--wizard-gradient-left) 5%, transparent) 78%, transparent 85%)`,
            filter: 'blur(70px)',
            mixBlendMode: 'normal',
          }}
        />
        {/* Right ellipse - Purple - positioned at top-right, extended for uniform coverage */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 100% 65% at 100% 0%, var(--wizard-gradient-right) 0%, color-mix(in srgb, var(--wizard-gradient-right) 92%, transparent) 8%, color-mix(in srgb, var(--wizard-gradient-right) 82%, transparent) 18%, color-mix(in srgb, var(--wizard-gradient-right) 70%, transparent) 28%, color-mix(in srgb, var(--wizard-gradient-right) 55%, transparent) 40%, color-mix(in srgb, var(--wizard-gradient-right) 40%, transparent) 50%, color-mix(in srgb, var(--wizard-gradient-right) 25%, transparent) 60%, color-mix(in srgb, var(--wizard-gradient-right) 12%, transparent) 70%, color-mix(in srgb, var(--wizard-gradient-right) 5%, transparent) 78%, transparent 85%)`,
            filter: 'blur(70px)',
            mixBlendMode: 'normal',
          }}
        />
        {/* Primary noise texture - fine grain to break up concentric bands */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='5' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='0 0.5 1 0.5 0 0.5 1 0.5'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            backgroundSize: '150px 150px',
            mixBlendMode: 'overlay',
          }}
        />
        {/* Secondary noise layer - medium frequency for better coverage */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch' seed='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='0 0.5 1 0.5 0 0.5 1 0.5'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter2)'/%3E%3C/svg%3E\")",
            backgroundSize: '200px 200px',
            mixBlendMode: 'overlay',
          }}
        />
        {/* Coarse noise layer - larger pattern for additional dithering */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter3'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='6' stitchTiles='stitch' seed='3'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='0 0.5 1 0.5 0 0.5 1 0.5'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter3)'/%3E%3C/svg%3E\")",
            backgroundSize: '250px 250px',
            mixBlendMode: 'normal',
          }}
        />
        {/* High-frequency dithering layer for fine banding reduction */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter4'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='6' stitchTiles='stitch' seed='4'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncA type='discrete' tableValues='0 0.5 1 0.5 0 0.5 1 0.5'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter4)'/%3E%3C/svg%3E\")",
            backgroundSize: '120px 120px',
            mixBlendMode: 'overlay',
          }}
        />
      </div>
      <div className="min-h-screen relative flex flex-col">
        {currentStep !== 'review' && (
          <StepsIndicator
            steps={steps}
            navigateToStep={navigateToStep}
            isStepAccessible={isStepAccessible}
            getStepState={getStepState}
          />
        )}

        {/* Content */}
        <div
          className={
            currentStep === 'review'
              ? 'relative z-10 flex-1 flex items-center justify-center py-8 sm:px-6'
              : 'container mx-auto sm:px-6 relative z-10 flex-1 flex items-center justify-center py-2 sm:py-8'
          }
        >
          <div
            className={cn(
              'w-full flex justify-center',
              showAssistantTransition && '-mt-2'
            )}
          >
            <div
              // use cn instead and keep the logic
              className={cn(
                'max-w-8xl w-full px-4 py-4 sm:p-3',
                currentStep === 'template'
                  ? 'max-w-8xl w-full'
                  : 'max-w-full sm:max-w-[400px] md:max-w-2xl xl:max-w-6xl w-full px-3 py-4 sm:p-3'
              )}
            >
              {/* Section header - hidden for template step, review step, details step in collect phase, and AssistantTransition */}
              {currentStep !== 'template' &&
                currentStep !== 'review' &&
                !(currentStep === DETAILS_STEP && detailsPhase === 'collect') &&
                !showAssistantTransition &&
                (() => {
                  // Don't render section header for details step since it has its own header
                  if (currentStep === DETAILS_STEP) {
                    return null;
                  }

                  return (
                    <WizardSectionHeader
                      title={current.title}
                      description={
                        currentStep === DETAILS_STEP
                          ? t('wizard.details.desc2')
                          : current.description
                      }
                      action={headerAction}
                      background={'var(--wizard-section-details-bg)'}
                      maxWidth={'default'}
                    />
                  );
                })()}

              {/* Step Content */}
              <div className={currentStep === 'template' ? 'mt-4' : ''}>
                {children}
              </div>

              {currentStep !== 'review' && (
                <WizardNavigation
                  currentStep={currentStep}
                  currentStepIndex={currentStepIndex}
                  canProceed={canProceed}
                  isGenerating={Boolean(isGenerating)}
                  isNextLoading={isNextLoading}
                  allowSubmit={allowSubmit}
                  onNext={onNext}
                  onPrevious={onPrevious}
                  onSubmitForReview={onSubmitForReview}
                  setIsNextLoading={setIsNextLoading}
                  maxWidth={
                    currentStep === 'template' || showAssistantTransition
                      ? 'large'
                      : 'default'
                  }
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        {currentStep !== 'review' && <FooterCompact />}
      </div>
    </>
  );
}
