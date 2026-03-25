'use client';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTranslations } from '@/lib/i18n';
import { ChevronDown, Wand2 } from 'lucide-react';
import { ScaffoldClientInfo } from './scaffold/ScaffoldClientInfo';
import { ScaffoldClarify } from './scaffold/ScaffoldClarify';
import { ScaffoldInput } from './scaffold/ScaffoldInput';
import { ScaffoldProgress } from './scaffold/ScaffoldProgress';
import { ScaffoldReview } from './scaffold/ScaffoldReview';
import { useScaffoldForm } from './scaffold/useScaffoldForm';

export function QuickScaffold() {
  const { t } = useTranslations();
  const [isExpanded, setIsExpanded] = useLocalStorage('scaffold-expanded', false);
  const scaffold = useScaffoldForm();

  // Collapsed state
  if (!isExpanded && (scaffold.phase === 'client' || scaffold.phase === 'input')) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="group flex w-full items-center gap-2.5 overflow-hidden rounded-2xl border border-white/60 bg-white/70 px-3 py-3 shadow-[0_2px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_2px_20px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.3)] sm:px-4 sm:py-3.5"
        type="button"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--purple)]/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
          <Wand2 className="w-4 h-4 text-[var(--purple)]" />
        </div>
        <span className="text-sm text-gray-600 dark:text-white/60 group-hover:text-gray-900 dark:group-hover:text-white transition-colors truncate min-w-0 flex-1 text-left">
          {t('scaffold.collapsed.prompt')}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-[var(--purple)] flex-shrink-0 transition-colors" />
      </button>
    );
  }

  if (scaffold.phase === 'client') {
    return (
      <ScaffoldClientInfo
        clientInfo={scaffold.clientInfo}
        onUpdate={scaffold.updateClientInfo}
        onSubmit={scaffold.submitClientInfo}
        onCollapse={() => setIsExpanded(false)}
      />
    );
  }

  if (scaffold.phase === 'progress') {
    return <ScaffoldProgress steps={scaffold.aiSteps} />;
  }

  if (scaffold.phase === 'clarify') {
    return (
      <ScaffoldClarify
        questions={scaffold.followUpQuestions}
        answers={scaffold.clarifyAnswers}
        onUpdateAnswer={scaffold.updateClarifyAnswer}
        onSubmit={scaffold.submitClarification}
        onReset={scaffold.reset}
      />
    );
  }

  if (scaffold.phase === 'review') {
    return (
      <ScaffoldReview
        brief={scaffold.brief}
        reviewStep={scaffold.reviewStep}
        isFirstStep={scaffold.isFirstStep}
        isLastStep={scaffold.isLastStep}
        reviewStepCount={scaffold.reviewStepCount}
        onUpdateBrief={scaffold.updateBrief}
        onToggleGoal={scaffold.toggleGoal}
        onToggleIntegration={scaffold.toggleIntegration}
        onNext={scaffold.isLastStep ? scaffold.proceedToTemplate : scaffold.nextStep}
        onPrev={scaffold.prevStep}
        onRegenerate={scaffold.regenerate}
        onReset={scaffold.reset}
      />
    );
  }

  return (
    <ScaffoldInput
      onSubmit={scaffold.submitDescription}
      onCollapse={() => setIsExpanded(false)}
      isEnriching={scaffold.isEnriching}
    />
  );
}
