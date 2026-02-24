'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAssistantValidation } from '@/hooks/useAssistantValidation';
import { useTranslations } from '@/lib/i18n';
import {
  AlertCircle,
  Bot,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Wand2,
} from 'lucide-react';
import { useMemo, useState } from 'react';

export default function QuickChatCard() {
  const { t } = useTranslations();
  const [input, setInput] = useState('');
  const { isValid, wordCount, hasContent, meetsContentRequirement } =
    useAssistantValidation(input);

  const status: 'sufficient' | 'insufficient' | null = useMemo(() => {
    if (!hasContent) return null;
    return isValid ? 'sufficient' : 'insufficient';
  }, [hasContent, isValid]);

  const handleQuickMode = () => {
    if (!input.trim()) return;
  };

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/80 shadow-sm p-5 sm:p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 flex items-center justify-center shadow-sm">
            <MessageSquare className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {t('dashboard.quickMode.title')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('dashboard.quickMode.subtitle')}
            </p>
          </div>
        </div>
        <Badge className="bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500 text-white border-0 text-xs font-medium px-2.5 py-0.5">
          <Wand2 className="h-3 w-3 mr-1" />
          AI powered
        </Badge>
      </div>

      <div className="rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-white/60 dark:bg-gray-900/50 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 rounded-xl bg-indigo-500/10 p-2 text-indigo-500 dark:text-indigo-300">
            <Bot className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              {t('dashboard.quickMode.promptTitle')}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="border-gray-300/70 dark:border-gray-700"
              >
                {t('dashboard.quickMode.points.industry')}
              </Badge>
              <Badge
                variant="outline"
                className="border-gray-300/70 dark:border-gray-700"
              >
                {t('dashboard.quickMode.points.siteType')}
              </Badge>
              <Badge
                variant="outline"
                className="border-gray-300/70 dark:border-gray-700"
              >
                {t('dashboard.quickMode.points.audience')}
              </Badge>
              <Badge
                variant="outline"
                className="border-gray-300/70 dark:border-gray-700"
              >
                {t('dashboard.quickMode.points.goals')}
              </Badge>
              <Badge
                variant="outline"
                className="border-gray-300/70 dark:border-gray-700"
              >
                {t('dashboard.quickMode.points.style')}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-200/70 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-950/40 p-4 space-y-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('dashboard.quickMode.placeholder')}
          className="min-h-[120px] resize-none border-0 bg-white/80 dark:bg-gray-900/60 text-gray-900 dark:text-gray-100 focus-visible:ring-2 focus-visible:ring-indigo-500/60"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <FileText className="h-4 w-4" />
            </div>
            <div className="hidden sm:block h-4 w-px bg-gray-300/70 dark:bg-gray-700" />
            <div className="flex items-center gap-2">
              {status === 'insufficient' && (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-amber-700 dark:text-amber-400">
                    {!meetsContentRequirement
                      ? t('assistant.validation.needMoreContent', {
                          current: wordCount,
                          required: 15,
                        })
                      : t('assistant.validation.briefDescription')}
                  </span>
                </>
              )}
            </div>
          </div>
          <Button
            variant="accent"
            size="md"
            onClick={handleQuickMode}
            disabled={!isValid}
          >
            <Wand2 className="h-4 w-4" />
            {t('dashboard.quickMode.quickModeButton')}
          </Button>
        </div>
      </div>
    </section>
  );
}
