import { useTranslations } from '@/lib/i18n';
import { Sparkles } from 'lucide-react';

export function QuickModePill() {
  const { t } = useTranslations();

  return (
    <div className="pb-[6px] pl-[4px] mb-[8px]">
      <div className="glass-3d relative inline-flex items-center gap-[6px] rounded-[8px] px-[10px] py-[4px] text-xs font-medium border border-gray-200/70 dark:border-white/15 bg-white/40 dark:bg-[rgba(58,58,74,0.2)] backdrop-blur-xl shadow-[0_2px_8px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05),inset_0_0.5px_0_rgba(255,255,255,0.6),inset_0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.1),inset_0_0.5px_0_rgba(255,255,255,0.08),inset_0_1px_3px_rgba(0,0,0,0.1)]">
        <div className="absolute inset-0 rounded-[8px] bg-gradient-to-b from-black/[0.02] to-black/[0.04] dark:from-black/[0.1] dark:to-black/[0.15] pointer-events-none"></div>
        <Sparkles
          className="relative h-3 w-3"
          style={{ color: 'var(--purple)' }}
        />
        <span className="relative text-gray-900 dark:text-white font-medium text-md">
          {t('assistant.button.quickMode')}
        </span>
      </div>
    </div>
  );
}
