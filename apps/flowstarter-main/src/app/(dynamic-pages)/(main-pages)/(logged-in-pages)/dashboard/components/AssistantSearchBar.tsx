'use client';

import { AssistantInput } from '@/components/AssistantInput';
import { Button } from '@/components/ui/button';
import { useAIClassify } from '@/hooks/useAI';
import { useAssistantValidation } from '@/hooks/useAssistantValidation';
import { useTranslations } from '@/lib/i18n';
import { useWizardStore } from '@/store/wizard-store';
import { Loader2, Send, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AssistantSearchBar() {
  const { t } = useTranslations();
  const router = useRouter();
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const validation = useAssistantValidation(value);
  const setPrefillData = useWizardStore((state) => state.setPrefillData);
  const setSelectedIndustry = useWizardStore(
    (state) => state.setSelectedIndustry
  );

  // React Query mutation for classification
  const classifyMutation = useAIClassify();

  const handleSubmit = async () => {
    // Mark as touched to show validation
    setTouched(true);

    // Only proceed if validation passes
    if (!validation.isValid) {
      return;
    }

    classifyMutation.mutate(
      { description: value },
      {
        onSuccess: (classification) => {
          console.log(
            '[AssistantSearchBar] Classification result:',
            classification
          );

          const prefillData = {
            name: '',
            description: value,
            userDescription: value,
            targetUsers: '',
            businessGoals: '',
            USP: '',
            platformType: classification.template,
            industry: classification.industry,
          };

          // Store prefill data in wizard store
          setPrefillData(prefillData);

          // Also set industry in the store directly for immediate use
          if (classification.industry) {
            setSelectedIndustry(classification.industry);
          }

          // Navigate to wizard with ai-generated flag
          router.push('/dashboard/new?mode=ai-generated');
        },
        onError: (error) => {
          console.error('[AssistantSearchBar] Classification error:', error);

          // Fall back to original behavior without classification
          const prefillData = {
            name: '',
            description: value,
            userDescription: value,
            targetUsers: '',
            businessGoals: '',
            USP: '',
          };
          setPrefillData(prefillData);
          router.push('/dashboard/new?mode=ai-generated');
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isClassifying = classifyMutation.isPending;

  return (
    <div className="glass-3d mt-8 rounded-[16px] border border-gray-200/60 dark:border-white/15 bg-white/25 dark:bg-[rgba(58,58,74,0.2)] backdrop-blur-xl px-[24px] py-[16px] transition-all duration-500 hover:-translate-y-1 shadow-[0_12px_40px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05),inset_0_2px_0_rgba(255,255,255,0.8),inset_0_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_2px_6px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.15),0_8px_24px_rgba(0,0,0,0.1),inset_0_2px_0_rgba(255,255,255,0.9),inset_0_2px_8px_rgba(0,0,0,0.05)]">
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
            <div className="p-1.5 rounded-xl bg-linear-to-br from-[var(--purple)]/10 to-[var(--purple)]/10 border border-[var(--purple)]/20 dark:border-[var(--purple)]/20">
              <Sparkles className="h-4 w-4 text-[var(--purple)] dark:text-[var(--purple)]" />
            </div>
            <span>{t('dashboard.search.poweredBy')}</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {t('dashboard.search.helper')}
        </p>

        <div onKeyDown={handleKeyDown}>
          <AssistantInput
            value={value}
            onChange={setValue}
            onBlur={() => setTouched(true)}
            hideLabel
            showLabel={false}
            touched={touched}
            placeholder={t('dashboard.search.placeholderSite')}
            rows={3}
            className="mb-3"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 flex-1">
            <Chip>{t('dashboard.chips.generateHomepage')}</Chip>
            <Chip>{t('dashboard.chips.chooseTemplate')}</Chip>
            <Chip>{t('dashboard.chips.writeAbout')}</Chip>
            <Chip>{t('dashboard.chips.planSitemap')}</Chip>
            <Link href="/dashboard/examples">
              <Chip>{t('dashboard.chips.browseExamples')}</Chip>
            </Link>
          </div>
          <Button
            className="rounded-lg bg-linear-to-r from-[var(--purple)] to-[var(--purple)] hover:from-[var(--purple)] hover:to-[var(--purple)] text-white shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={isClassifying || (!validation.isValid && touched)}
          >
            {isClassifying ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Send className="h-5 w-5 mr-2" />
            )}
            {isClassifying ? 'Analyzing...' : t('app.continue')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="glass-3d inline-flex items-center rounded-full border border-gray-200/50 dark:border-gray-700/50 bg-white/20 dark:bg-gray-900/50 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-white/30 dark:hover:bg-gray-800/60 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03),inset_0_0.5px_0_rgba(255,255,255,0.5),inset_0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.1),0_1px_3px_rgba(0,0,0,0.05),inset_0_0.5px_0_rgba(255,255,255,0.04),inset_0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.05),inset_0_0.5px_0_rgba(255,255,255,0.6),inset_0_1px_3px_rgba(0,0,0,0.04)] hover:-translate-y-0.5"
    >
      {children}
    </button>
  );
}

export default AssistantSearchBar;
