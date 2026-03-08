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
        className="group w-full flex items-center gap-2.5 px-3 py-3 sm:px-4 sm:py-3.5 rounded-2xl bg-white/80 dark:bg-[var(--glass-surface)]/80 backdrop-blur-2xl backdrop-saturate-150 border-t border-l border-white/40 dark:border-white/[0.08] border-b border-r border-black/[0.04] dark:border-black/[0.2] shadow-[0_8px_32px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04),1px_1px_0_rgba(0,0,0,0.03)_inset,-1px_-1px_0_rgba(255,255,255,1)_inset,0_1px_0_rgba(255,255,255,0.9)_inset] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35),0_2px_8px_rgba(0,0,0,0.2),1px_1px_0_rgba(0,0,0,0.3)_inset,-1px_-1px_0_rgba(255,255,255,0.08)_inset,0_1px_0_rgba(255,255,255,0.06)_inset] hover:shadow-[0_12px_40px_rgba(0,0,0,0.08),-1px_-1px_0_rgba(255,255,255,1)_inset,0_1px_0_rgba(255,255,255,0.9)_inset] dark:hover:shadow-[0_12px_40px_rgba(124,58,237,0.15),-1px_-1px_0_rgba(255,255,255,0.08)_inset,0_1px_0_rgba(255,255,255,0.06)_inset] transition-all duration-300 overflow-hidden"
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
        fields={scaffold.fields}
        reviewStep={scaffold.reviewStep}
        isFirstStep={scaffold.isFirstStep}
        isLastStep={scaffold.isLastStep}
        reviewStepCount={scaffold.reviewStepCount}
        onUpdateField={scaffold.updateField}
        onNext={scaffold.nextStep}
        onPrev={scaffold.prevStep}
        onRegenerate={scaffold.regenerate}
        onLaunch={() => scaffold.launchEditor()}
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
