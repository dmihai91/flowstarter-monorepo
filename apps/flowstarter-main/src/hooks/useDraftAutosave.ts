'use client';

import { useTranslations } from '@/lib/i18n';
import { useWizardStore } from '@/store/wizard-store';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useUpsertDraft } from './useDraft';

export function useDraftAutosave(projectId?: string | null) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslations();
  const { projectConfig, currentStep } = useWizardStore();
  const upsertDraft = useUpsertDraft(projectId);
  const [, setIsRedirecting] = useState(false);

  const isOnWizard = useMemo(
    () => Boolean(pathname?.startsWith('/dashboard/new')),
    [pathname]
  );

  const saveNow = useCallback(async () => {
    if (!isOnWizard) return true; // nothing to save outside the wizard
    try {
      await upsertDraft.mutateAsync({ ...projectConfig, currentStep });
      toast.success(t('draft.saveDraftSuccess'), {
        description: t('draft.saveDraftSuccessDescription'),
      });
      return true;
    } catch (error) {
      toast.error(t('draft.saveDraftFailed'), {
        description: t('draft.saveDraftFailedDescription'),
      });
      return false;
    }
  }, [isOnWizard, projectConfig, currentStep, t, upsertDraft]);

  const goToDashboard = useCallback(async () => {
    setIsRedirecting(true);
    // Show a very short loader overlay until navigation occurs
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('draft-loading-start', {
          detail: { scope: 'redirect' },
        })
      );
    }
    const ok = await saveNow();
    if (ok) {
      // Clean up scroll state before navigation
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('overflow');

      router.push('/dashboard');
      // Leave the loader on until the next route paints; add a failsafe timeout
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('draft-loading-end', {
              detail: { scope: 'redirect' },
            })
          );
        }
        setIsRedirecting(false);
      }, 1200);
    } else {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('draft-loading-end', {
            detail: { scope: 'redirect' },
          })
        );
      }
      setIsRedirecting(false);
    }
  }, [router, saveNow]);

  return {
    isOnWizard,
    isSaving: upsertDraft.isPending,
    saveNow,
    goToDashboard,
    draftError: upsertDraft.error,
  };
}
