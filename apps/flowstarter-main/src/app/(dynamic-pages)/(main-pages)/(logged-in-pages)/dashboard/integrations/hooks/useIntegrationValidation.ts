'use client';

import { useTranslations } from '@/lib/i18n';

export function useIntegrationValidation() {
  const { t } = useTranslations();

  return (
    integrationId: string,
    fieldName: string,
    value: string
  ): string | null => {
    if (integrationId === 'mailchimp') {
      if (fieldName === 'apiKey') {
        if (!value.trim())
          return t('integrations.mailchimp.errors.apiKeyRequired');
        if (!/^[a-z0-9-]{10,}$/i.test(value))
          return t('integrations.mailchimp.errors.apiKeyInvalid');
      }
      if (fieldName === 'audienceId') {
        if (!value.trim())
          return t('integrations.mailchimp.errors.audienceIdRequired');
        if (value.length < 5)
          return t('integrations.mailchimp.errors.audienceIdInvalid');
      }
    }

    if (integrationId === 'calendly') {
      if (fieldName === 'apiKey') {
        if (!value.trim())
          return t('integrations.calendly.errors.apiKeyRequired');
        if (value.length < 10)
          return t('integrations.calendly.errors.apiKeyTooShort');
      }
      if (fieldName === 'eventUrl') {
        if (!value.trim())
          return t('integrations.calendly.errors.eventUrlRequired');
        try {
          const url = new URL(value);
          if (!/calendly\.com$/i.test(url.hostname))
            return t('integrations.calendly.errors.eventUrlHost');
        } catch {
          return t('integrations.calendly.errors.eventUrlInvalid');
        }
      }
    }

    return null;
  };
}
