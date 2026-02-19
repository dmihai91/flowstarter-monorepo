'use client';

import { useTranslations } from '@/lib/i18n';

export function useIntegrationTutorialUrl() {
  const { t } = useTranslations();

  return (integrationId: string): string | undefined => {
    if (integrationId === 'calendly')
      return t('integrations.calendly.tutorialUrl');
    if (integrationId === 'mailchimp')
      return t('integrations.mailchimp.tutorialUrl');
    return undefined;
  };
}
