'use client';

import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface PromptSuggestionsProps {
  prompts: string[];
  onPromptClick: (prompt: string) => void;
  className?: string;
}

export function PromptSuggestions({
  prompts,
  onPromptClick,
  className,
}: PromptSuggestionsProps) {
  const { t } = useTranslations();
  const { user } = useUser();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Set initial state based on screen size (only on client)
    if (typeof window === 'undefined') return;

    const checkScreenSize = () => {
      // Only set initial expanded state once, then let user control it
      if (!isInitialized) {
        // Show 1 prompt by default (collapsed state)
        setIsExpanded(false);
        setIsInitialized(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [isInitialized]);

  // Show prompts collapsed by default, expanded when user clicks expand button
  const displayedPrompts = useMemo(() => {
    if (isExpanded) {
      // Show all prompts when expanded
      return prompts;
    }
    // When collapsed: show 1 prompt on all screen sizes
    return prompts.slice(0, 1);
  }, [prompts, isExpanded]);

  // Get user display name
  const userName = user?.firstName || user?.fullName || 'there';

  return (
    <div className={cn('flex flex-col gap-3 min-w-0', className)}>
      <div className="flex items-start gap-[8px] min-w-0">
        <p className="text-md sm:text-base font-medium leading-normal text-gray-900 dark:text-white wrap-break-word ml-1">
          {t('assistant.prompts.greeting', { user: userName })}
        </p>
      </div>
      <AnimatePresence initial={false}>
        {displayedPrompts.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden min-w-0 mb-2"
          >
            <div className="flex flex-col gap-3 min-w-0">
              {displayedPrompts.map((prompt, index) => (
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
      {/* Show expand button when collapsed (only if there are more prompts than displayed) */}
      {!isExpanded && displayedPrompts.length < prompts.length && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="border border-gray-200/50 dark:border-white/15 flex gap-[8px] items-center px-[12px] py-[11px] rounded-[12px] bg-white/25 dark:bg-[rgba(58,58,74,0.2)] backdrop-blur-xl hover:bg-white/35 dark:hover:bg-[rgba(58,58,74,0.3)] transition-all duration-300 w-fit shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
        >
          <Plus className="h-[16px] w-[12px] text-gray-700 dark:text-white" />
          <p className="text-base font-medium leading-4 text-gray-700 dark:text-white">
            {t('assistant.prompts.expand')}
          </p>
        </button>
      )}
      {/* Show collapse button when expanded */}
      {isExpanded && displayedPrompts.length > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="border border-gray-200/50 dark:border-white/15 flex gap-[8px] items-center px-[12px] py-[11px] rounded-[12px] bg-white/25 dark:bg-[rgba(58,58,74,0.2)] backdrop-blur-xl hover:bg-white/35 dark:hover:bg-[rgba(58,58,74,0.3)] transition-all duration-300 w-fit shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
        >
          <Minus className="h-[16px] w-[12px] text-gray-700 dark:text-white" />
          <p className="text-base font-medium leading-4 text-gray-700 dark:text-white">
            {t('assistant.prompts.collapse')}
          </p>
        </button>
      )}
    </div>
  );
}
