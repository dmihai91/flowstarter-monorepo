'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useWizardStore } from '@/store/wizard-store';
import { FileClock } from 'lucide-react';
import { useState } from 'react';

export interface DraftNoticeProps {
  message: string;
  onStartOver?: () => void;
  className?: string;
}

export function DraftNotice({
  message,
  onStartOver,
  className,
}: DraftNoticeProps) {
  const { t } = useTranslations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const setIsDiscarding = useWizardStore((state) => state.setIsDiscarding);

  return (
    <div
      className={cn(
        'flex flex-col items-center text-center rounded-xl border px-4 py-3 shadow-lg relative overflow-hidden',
        'max-w-lg w-full sm:w-auto mx-auto',
        'bg-blue-500/10 border-blue-500/20 text-blue-900 backdrop-blur-sm',
        'dark:bg-blue-500/10 dark:border-blue-400/20 dark:text-blue-100',
        'before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-500/5 before:to-[var(--purple)]/5 before:pointer-events-none',
        'transition-[colors,box-shadow] motion-reduce:transition-none mt-3 md:w-full',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 relative z-10">
        <FileClock
          aria-hidden
          className="h-4 w-4 text-blue-600 dark:text-blue-400"
        />
        <span className="text-xs sm:text-sm font-medium">{message}</span>
      </div>

      {onStartOver && (
        <div className="mt-1 relative z-10">
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className={cn(
              'text-xs sm:text-sm underline underline-offset-2 text-blue-700 dark:text-blue-300',
              'hover:text-blue-900 dark:hover:text-blue-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
              'dark:focus-visible:ring-offset-slate-900 rounded hover:bg-blue-500/10 dark:hover:bg-blue-500/20 px-2 py-1 transition-colors'
            )}
          >
            {t('draft.startOver')}
          </button>

          {/* Confirmation dialog */}
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('draft.startOverTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('draft.startOverDesc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('ai.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    setIsDialogOpen(false);
                    if (onStartOver) {
                      setIsDiscarding(true);
                      queueMicrotask(() => onStartOver());
                    }
                  }}
                >
                  {t('draft.deleteDraft')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}

export default DraftNotice;
