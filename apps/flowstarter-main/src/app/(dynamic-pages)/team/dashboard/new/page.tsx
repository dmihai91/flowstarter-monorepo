'use client';

import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { GradientBackground } from '@/components/ui/gradient-background';
import { TeamHeader } from '../../components/TeamHeader';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react';

import { useNewProject } from './hooks/useNewProject';
import { GenerationScreen } from './components/GenerationScreen';
import { ClientInfoStep, BusinessInfoStep, GoalsStep, ContactStep } from './components/steps';

function NewProjectPageContent() {
  const {
    projectData,
    step,
    setStep,
    isAIMode,
    isLoading,
    isSaving,
    isGenerating,
    generationStep,
    userLoaded,
    nameError,
    regenField,
    setRegenField,
    regenPrompt,
    setRegenPrompt,
    isRegenerating,
    updateField,
    handleBusinessNameChange,
    handleRegenerate,
    handleSubmit,
    canProceed,
  } = useNewProject();

  const showGenerationScreen = isGenerating && isAIMode;
  const showLoading = (isLoading || !userLoaded) && !showGenerationScreen;

  // Generation screen
  if (showGenerationScreen) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <TeamHeader />
        <div className="flex-1 flex flex-col items-center justify-center relative mt-16">
          <GradientBackground variant="dashboard" className="fixed inset-0" />
          <GenerationScreen currentStep={generationStep} />
        </div>
      </div>
    );
  }

  // Loading screen
  if (showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GradientBackground variant="dashboard" className="fixed" />
        <div className="relative z-10">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--purple)]" />
        </div>
      </div>
    );
  }

  return (
    <>
      <GradientBackground variant="dashboard" className="fixed" />

      <div className="min-h-screen font-display relative flex flex-col">
        <TeamHeader />
        <div className="h-16" />

        {/* Progress bar */}
        <div className="sticky top-16 z-50 bg-white/80 dark:bg-[#0a0a0c]/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between sm:justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-8 sm:w-10 h-1.5 rounded-full transition-colors ${
                    s <= step ? 'bg-[var(--purple)]' : 'bg-gray-200 dark:bg-white/10'
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-500 dark:text-white/50 whitespace-nowrap">Step {step} of 4</div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-12 pb-32">
          {/* Step 1/2: Client Info */}
          {(isAIMode ? step === 2 : step === 1) && (
            <ClientInfoStep projectData={projectData} updateField={updateField} />
          )}

          {/* Step 1/2: Business Info */}
          {(isAIMode ? step === 1 : step === 2) && (
            <BusinessInfoStep
              projectData={projectData}
              updateField={updateField}
              handleBusinessNameChange={handleBusinessNameChange}
              isAIMode={isAIMode}
              nameError={nameError}
              regenField={regenField}
              setRegenField={setRegenField}
              regenPrompt={regenPrompt}
              setRegenPrompt={setRegenPrompt}
              isRegenerating={isRegenerating}
              handleRegenerate={handleRegenerate}
            />
          )}

          {/* Step 3: Goals */}
          {step === 3 && <GoalsStep projectData={projectData} updateField={updateField} />}

          {/* Step 4: Contact */}
          {step === 4 && <ContactStep projectData={projectData} updateField={updateField} />}
        </main>

        {/* Fixed navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-gradient-to-t from-white via-white to-transparent dark:from-[#0a0a0c] dark:via-[#0a0a0c] pt-6 sm:pt-8 pb-4 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between gap-3">
                {step > 1 ? (
                  <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-2 flex-1 sm:flex-none">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                ) : (
                  <Link href="/team/dashboard" className="flex-1 sm:flex-none">
                    <Button variant="outline" className="gap-2 w-full">
                      <ArrowLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Cancel</span>
                    </Button>
                  </Link>
                )}

                {step < 4 ? (
                  <Button
                    onClick={() => setStep(step + 1)}
                    disabled={!canProceed()}
                    className="gap-2 flex-1 sm:flex-none bg-gradient-to-r from-[var(--purple)] to-blue-500 text-white hover:opacity-90"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="gap-2 flex-1 sm:flex-none bg-gradient-to-r from-[var(--purple)] to-blue-500 text-white hover:opacity-90 min-w-[140px]"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="hidden sm:inline">Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer hidden on wizard - fixed nav takes its place */}
      </div>
    </>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <GradientBackground variant="dashboard" className="fixed" />
        <Loader2 className="w-8 h-8 animate-spin text-[var(--purple)]" />
      </div>
    }>
      <NewProjectPageContent />
    </Suspense>
  );
}
