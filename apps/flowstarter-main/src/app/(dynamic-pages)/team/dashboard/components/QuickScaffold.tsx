'use client';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTranslations } from '@/lib/i18n';
import { ChevronDown, Wand2 } from 'lucide-react';
import { ScaffoldClientInfo } from './scaffold/ScaffoldClientInfo';
import { ScaffoldClarify } from './scaffold/ScaffoldClarify';
import { ScaffoldInput } from './scaffold/ScaffoldInput';
import { ScaffoldProgress } from './scaffold/ScaffoldProgress';
import { ScaffoldQuickReview } from './scaffold/ScaffoldQuickReview';
import { useScaffoldForm } from './scaffold/useScaffoldForm';

export function QuickScaffold() {
  const { t } = useTranslations();
  const [isExpanded, setIsExpanded] = useLocalStorage('scaffold-expanded', false);
  const scaffold = useScaffoldForm();

  // Collapsed pill — shown when idle
  if (!isExpanded && (scaffold.phase === 'client' || scaffold.phase === 'input')) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="group flex w-full items-center gap-2.5 overflow-hidden rounded-[28px] border border-gray-200/80 bg-white/95 px-3 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_0_rgba(255,255,255,0.9)_inset] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(0,0,0,0.10),0_1px_0_rgba(255,255,255,0.9)_inset] dark:border-white/[0.06] dark:bg-white/[0.05] dark:shadow-[0_8px_32px_rgba(0,0,0,0.25),0_1px_0_rgba(255,255,255,0.06)_inset] dark:hover:shadow-[0_14px_40px_rgba(0,0,0,0.30),0_1px_0_rgba(255,255,255,0.08)_inset] sm:px-4 sm:py-3.5"
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

  // Step 1 — Client details
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

  // Step 2 — Project description input
  if (scaffold.phase === 'input') {
    return (
      <ScaffoldInput
        onSubmit={scaffold.submitDescription}
        onCollapse={() => setIsExpanded(false)}
        isEnriching={scaffold.isEnriching}
      />
    );
  }

  // AI working
  if (scaffold.phase === 'progress') {
    return <ScaffoldProgress steps={scaffold.aiSteps} />;
  }

  // AI needs more info
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

  // Quick review — compact single card, fill gaps, launch
  if (scaffold.phase === 'review' || scaffold.phase === 'template' || scaffold.phase === 'payment') {
    return (
      <ScaffoldQuickReview
        brief={scaffold.brief}
        onUpdateBrief={scaffold.updateBrief}
        onLaunch={() => scaffold.launchEditor()}
        onRegenerate={scaffold.regenerate}
        onReset={() => { scaffold.reset(); setIsExpanded(false); }}
      />
    );
  }

  return null;
}
