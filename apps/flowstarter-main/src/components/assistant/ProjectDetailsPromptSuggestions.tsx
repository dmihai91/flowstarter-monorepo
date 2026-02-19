'use client';

import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface ProjectDetailsPromptSuggestionsProps {
  prompts: string[];
  onPromptClick: (prompt: string) => void;
  className?: string;
}

export function ProjectDetailsPromptSuggestions({
  prompts,
  onPromptClick,
  className,
}: ProjectDetailsPromptSuggestionsProps) {
  const { t } = useTranslations();

  return (
    <div className={cn('flex flex-col gap-3 min-w-0', className)}>
      <div className="flex items-start gap-[8px] min-w-0">
        <p className="text-md sm:text-base font-medium leading-normal text-gray-900 dark:text-white wrap-break-word ml-1">
          {t('assistant.prompts.projectDetailsGreeting')}
        </p>
      </div>
      <AnimatePresence initial={false}>
        {prompts.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden min-w-0 mb-2"
          >
            <div className="flex flex-col gap-3 min-w-0">
              {prompts.map((prompt, index) => (
                <motion.button
                  key={`${prompt}-${index}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: index * 0.05,
                    duration: 0.2,
                    ease: 'easeOut',
                  }}
                  whileHover={{ scale: 1.01, rotateY: 2, rotateX: -1, z: 10 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onPromptClick(prompt)}
                  className="group relative overflow-hidden rounded-[12px] bg-white/25 dark:bg-[rgba(58,58,74,0.2)] backdrop-blur-xl border border-gray-200/50 dark:border-white/15 px-5 py-2 text-left text-[0.925rem] font-normal leading-6 text-gray-700 dark:text-gray-300 hover:bg-white/35 dark:hover:bg-[rgba(58,58,74,0.3)] transition-all duration-100 whitespace-normal wrap-break-word overflow-wrap-anywhere max-w-fit shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_16px_rgba(0,0,0,0.08),0_4px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.4)] dark:hover:shadow-[0_8px_16px_rgba(0,0,0,0.15),0_4px_8px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.1)]"
                  style={{
                    transformOrigin: 'left center',
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                  }}
                >
                  <span className="relative block wrap-break-word overflow-wrap-anywhere max-w-fit">
                    {prompt}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
