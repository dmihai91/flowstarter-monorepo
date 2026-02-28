'use client';

import { LoadingScreen } from '@flowstarter/flow-design-system';
import { useTranslations } from '@/lib/i18n';
import { useWizardStore } from '@/store/wizard-store';

export default function WizardLoading() {
  const { t } = useTranslations();
  const skipLoadingScreen = useWizardStore((state) => state.skipLoadingScreen);

  // Don't show loading screen if skipLoadingScreen is true (e.g., from quick mode)
  if (skipLoadingScreen) {
    return null;
  }

  return <LoadingScreen message={t('wizard.loading')} />;
}
