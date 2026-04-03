'use client';

import { useScaffoldForm } from '../components/scaffold/useScaffoldForm';
import { ScaffoldClientInfo } from '../components/scaffold/ScaffoldClientInfo';
import { ScaffoldInput } from '../components/scaffold/ScaffoldInput';
import { ScaffoldProgress } from '../components/scaffold/ScaffoldProgress';
import { ScaffoldClarify } from '../components/scaffold/ScaffoldClarify';
import { ScaffoldReview } from '../components/scaffold/ScaffoldReview';
import { TemplateGallery } from './TemplateGallery';
import { StepIndicator } from './StepIndicator';
import { PaymentStep } from './PaymentStep';
import { TemplateStep } from './TemplateStep';
import { useWizardState } from './useWizardState';

export function NewProjectWizard() {
  const form = useScaffoldForm();
  const {
    isLaunching,
    galleryOpen,
    setGalleryOpen,
    launchError,
    templates,
    templatesLoading,
    industry,
    setIndustry,
    mode,
    setMode,
    prompt,
    setPrompt,
    stepIndex,
    scheduleSaveDraft,
    handleInitialStepSubmit,
    handleLaunch,
    selectedTemplate,
  } = useWizardState(form);

  return (
    <div className="py-4 sm:py-8 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Step indicator — hide during progress/clarify */}
        {!['progress', 'clarify'].includes(form.phase) && (
          <StepIndicator
            current={stepIndex}
            reviewStep={form.reviewStep}
            reviewStepCount={form.reviewStepCount}
          />
        )}

        {/* Content card */}
        <div className="rounded-[28px] sm:rounded-[36px] border border-gray-200/60 bg-white/70 px-4 py-6 sm:px-10 sm:py-10 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_rgba(0,0,0,0.08)] sm:shadow-[0_24px_64px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] dark:border-white/[0.06] dark:bg-white/[0.04] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
          {form.phase === 'client' && (
            <ScaffoldClientInfo
              clientInfo={form.clientInfo}
              onUpdate={(field, value) => {
                form.updateClientInfo(field, value);
                scheduleSaveDraft({ ...form.clientInfo, [field]: value });
              }}
              onSubmit={handleInitialStepSubmit}
              onCollapse={() => {}}
              industry={industry}
              onIndustryChange={setIndustry}
              mode={mode}
              onModeChange={setMode}
              prompt={prompt}
              onPromptChange={setPrompt}
            />
          )}

          {form.phase === 'input' && (
            <ScaffoldInput
              onSubmit={form.submitDescription}
              onCollapse={() => form.reset()}
              isEnriching={form.isEnriching}
            />
          )}

          {form.phase === 'progress' && (
            <ScaffoldProgress steps={form.aiSteps} />
          )}

          {form.phase === 'clarify' && (
            <ScaffoldClarify
              questions={form.followUpQuestions}
              answers={form.clarifyAnswers}
              onUpdateAnswer={form.updateClarifyAnswer}
              onSubmit={form.submitClarification}
              onReset={form.reset}
            />
          )}

          {form.phase === 'review' && (
            <ScaffoldReview
              brief={form.brief}
              reviewStep={form.reviewStep}
              reviewStepCount={form.reviewStepCount}
              isFirstStep={form.isFirstStep}
              isLastStep={form.isLastStep}
              onUpdateBrief={form.updateBrief}
              onToggleGoal={form.toggleGoal}
              onToggleIntegration={form.toggleIntegration}
              onNext={form.isLastStep ? form.proceedToTemplate : form.nextStep}
              onPrev={form.prevStep}
              onBackToInput={form.backToInput}
              onRegenerate={form.regenerate}
              onReset={form.reset}
            />
          )}

          {form.phase === 'template' && (
            <TemplateStep
              form={form}
              templates={templates}
              templatesLoading={templatesLoading}
              selectedTemplate={selectedTemplate}
              onOpenGallery={() => setGalleryOpen(true)}
            />
          )}

          {form.phase === 'payment' && (
            <PaymentStep
              planName={form.planName}
              setPlanName={form.setPlanName}
              setupFee={form.setupFee}
              setSetupFee={form.setSetupFee}
              onBack={() => form.setPhase('template')}
              onLaunch={handleLaunch}
              isLaunching={isLaunching}
            />
          )}

          {launchError && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl px-4 py-3">
              {launchError}
            </p>
          )}
        </div>
      </div>

      {galleryOpen && (
        <TemplateGallery
          templates={templates}
          selectedId={form.selectedTemplateId}
          recommendedIds={form.templateRecommendations}
          recommendedReasons={form.templateReasons}
          onSelect={(templateId) => {
            form.setSelectedTemplateId(templateId);
            form.setSelectedPalette(null);
            form.setSelectedFont(null);
          }}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </div>
  );
}
