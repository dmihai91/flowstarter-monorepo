'use client';

import { GlassCard } from '@/components/ui/glass-card';
import { useIntegrations } from '@/hooks/useIntegrations';
import { useTranslations } from '@/lib/i18n';
import { ChevronRight } from 'lucide-react';

export function IntegrationsCard() {
  const { t } = useTranslations();
  const { isConnected } = useIntegrations();

  // List of all available integrations
  const integrations = [
    { id: 'google-analytics', name: t('integrations.googleAnalytics.name') },
    { id: 'calendly', name: t('integrations.calendly.name') },
    { id: 'mailchimp', name: t('integrations.mailchimp.name') },
  ];

  const activeCount = integrations.filter((i) => isConnected(i.id)).length;
  const totalCount = integrations.length;

  return (
    <GlassCard
      href="/dashboard/integrations"
      as="link"
      className="gap-[20px] cursor-pointer h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div
          className="text-[14px] font-medium truncate"
          style={{
            color: 'var(--copy-labels)',
            lineHeight: '17px',
            paddingTop: '11px',
            paddingBottom: '11px',
          }}
        >
          {t('integrations.title')}
        </div>
        <div
          className="inline-flex items-center gap-[6px] rounded-[12px] transition-all bg-transparent shrink-0 touch-manipulation hover:opacity-80 border-[1.5px] border-solid"
          style={{
            borderColor: 'var(--divider-border)',
            color: 'var(--copy-headlines)',
            padding: '11px 12px',
            fontSize: '14px',
            fontWeight: '500',
            lineHeight: '17px',
            height: 'fit-content',
          }}
        >
          {t('dashboard.cards.details')}
          <ChevronRight
            className="h-3 w-3"
            style={{ width: '12px', height: '12px' }}
            strokeWidth={2}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col h-full gap-[16px]">
        <div className="flex flex-col gap-[8px]">
          <div
            className="text-[28px] font-semibold tracking-tight w-full whitespace-pre-wrap"
            style={{ color: 'var(--colors-primary)' }}
          >
            {activeCount} / {totalCount}
          </div>
          <div className="text-[14px]" style={{ color: 'var(--copy-body)' }}>
            {activeCount} {t('integrations.active').toLowerCase()}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
