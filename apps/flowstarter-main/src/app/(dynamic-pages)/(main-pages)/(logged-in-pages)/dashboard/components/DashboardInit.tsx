'use client';

import { useI18n } from '@/lib/i18n';
import { useWizardStore } from '@/store/wizard-store';
import React, { useEffect } from 'react';

interface DashboardInitProps extends React.PropsWithChildren {
  showBanner?: boolean;
  hideChildrenWhenDraft?: boolean;
}

export function DashboardInit({ children }: DashboardInitProps) {
  const { t } = useI18n();
  const isDiscarding = useWizardStore((state) => state.isDiscarding);

  // Manage scrollbar visibility during discard
  useEffect(() => {
    if (isDiscarding) {
      // Store original values
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalHtmlScrollbarGutter =
        document.documentElement.style.scrollbarGutter;
      const originalBodyScrollbarGutter = document.body.style.scrollbarGutter;

      // Hide scrollbar and its container/gutter completely
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.scrollbarGutter = 'auto';
      document.body.style.scrollbarGutter = 'auto';

      // Restore original values when isDiscarding becomes false
      return () => {
        // If original value was empty, remove the style property entirely
        // to let CSS take over again
        if (originalBodyOverflow) {
          document.body.style.overflow = originalBodyOverflow;
        } else {
          document.body.style.removeProperty('overflow');
        }

        if (originalHtmlOverflow) {
          document.documentElement.style.overflow = originalHtmlOverflow;
        } else {
          document.documentElement.style.removeProperty('overflow');
        }

        if (originalHtmlScrollbarGutter) {
          document.documentElement.style.scrollbarGutter =
            originalHtmlScrollbarGutter;
        } else {
          // Restore to default CSS value (scrollbar-gutter: stable from globals.css)
          document.documentElement.style.scrollbarGutter = 'stable';
        }

        if (originalBodyScrollbarGutter) {
          document.body.style.scrollbarGutter = originalBodyScrollbarGutter;
        } else {
          document.body.style.removeProperty('scrollbar-gutter');
        }
      };
    }
  }, [isDiscarding]);

  return (
    <>
      {/* Full-screen loading overlay during draft discard */}
      {isDiscarding && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('draft.discardingDraft')}
            </p>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
