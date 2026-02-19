'use client';

import { PageContainer } from '@/components/PageContainer';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { GlassCard } from '@/components/ui/glass-card';
import { useIntegrations, type Integration } from '@/hooks/useIntegrations';
import { useTranslations } from '@/lib/i18n';
import {
  BarChart3,
  Calendar,
  Mail,
  MessageSquare,
  Plug,
  Zap,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardSubtitle } from '../components/DashboardSubtitle';
import { PageSectionHeader } from '../components/PageSectionHeader';
import { IntegrationCard } from './components/IntegrationCard';
import { IntegrationWizardContent } from './components/IntegrationWizardContent';

type Provider = 'google-analytics' | 'calendly' | 'mailchimp';

export default function IntegrationsIndexPage() {
  const { t } = useTranslations();
  const { isConnected } = useIntegrations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null
  );
  const [oauthStatus, setOauthStatus] = useState<string | null>(null);

  // Handle OAuth callback from URL params
  useEffect(() => {
    const provider = searchParams.get('provider') as Provider | null;
    const status = searchParams.get('status');
    if (provider && status) {
      setSelectedProvider(provider);
      setOauthStatus(status);
      setWizardOpen(true);
      // Clean up URL params
      router.replace('/dashboard/integrations', { scroll: false });
    }
  }, [searchParams, router]);

  const handleConnect = (provider: Provider) => {
    setSelectedProvider(provider);
    setOauthStatus(null);
    setWizardOpen(true);
  };

  const handleWizardComplete = () => {
    // Reload the page to refresh integration status
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleWizardClose = () => {
    setWizardOpen(false);
    setSelectedProvider(null);
    setOauthStatus(null);
  };

  const integrations: Integration[] = [
    {
      id: 'google-analytics',
      name: t('integrations.googleAnalytics.name'),
      description: t('integrations.googleAnalytics.description'),
      icon: BarChart3,
      status: 'not_connected',
      features: [
        'View analytics in Flowstarter dashboard',
        'Track page views, visitors, and conversions',
        'Real-time visitor monitoring',
      ],
      configFields: [],
      iconColor: 'text-black dark:text-white',
      iconStyle: {
        background:
          'linear-gradient(to bottom right, hsl(174 30% 45%), hsl(172 32% 40%))',
      },
    },
    {
      id: 'calendly',
      name: t('integrations.calendly.name'),
      description: t('integrations.calendly.description'),
      icon: Calendar,
      status: 'not_connected',
      features: [
        t('integrations.calendly.features.scheduling'),
        t('integrations.calendly.features.reminders'),
        t('integrations.calendly.features.timezone'),
      ],
      configFields: [],
      iconColor: 'text-black dark:text-white',
      iconStyle: {
        background:
          'linear-gradient(to bottom right, hsl(160 28% 42%), hsl(158 30% 38%))',
      },
    },
    {
      id: 'mailchimp',
      name: t('integrations.mailchimp.name'),
      description: t('integrations.mailchimp.description'),
      icon: Mail,
      status: 'not_connected',
      features: [
        t('integrations.mailchimp.features.contactSync'),
        t('integrations.mailchimp.features.campaignManagement'),
        t('integrations.mailchimp.features.emailAnalytics'),
      ],
      configFields: [],
      iconColor: 'text-black dark:text-white',
      iconStyle: {
        background:
          'linear-gradient(to bottom right, hsl(145 25% 44%), hsl(143 27% 40%))',
      },
    },
  ];

  const activeCount = integrations.filter((i) => isConnected(i.id)).length;
  const availableCount = integrations.length;
  return (
    <PageContainer gradientVariant="integrations">
      {/* Hero Section */}
      <section className="relative mb-12">
        <div className="relative z-10">
          {/* Integrations Title - Top */}
          <PageSectionHeader title={t('integrations.title')} className="mb-4" />

          {/* Greeting section */}
          <div className="mb-6">
            <DashboardSubtitle>{t('integrations.subtitle')}</DashboardSubtitle>
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-linear-to-br from-emerald-500/5 to-teal-500/5">
                <Zap className="h-4 w-4 text-emerald-600/60 dark:text-emerald-400/60" />
              </div>
              <span className="font-medium">
                {activeCount} {t('integrations.active')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-linear-to-br from-gray-500/5 to-gray-600/5">
                <Plug className="h-4 w-4 text-gray-600/60 dark:text-gray-400/60" />
              </div>
              <span>
                {availableCount} {t('integrations.available')}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-10">
            <div className="grow border-t border-gray-300/60 dark:border-gray-600/40"></div>
          </div>

          {/* Integration Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {integrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onConnect={() => handleConnect(integration.id as Provider)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Integration Wizard Dialog */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProvider === 'google-analytics' &&
                'Connect Google Analytics'}
              {selectedProvider === 'calendly' && 'Connect Calendly'}
              {selectedProvider === 'mailchimp' && 'Connect Mailchimp'}
            </DialogTitle>
          </DialogHeader>
          {selectedProvider && (
            <IntegrationWizardContent
              provider={selectedProvider}
              initialStatus={oauthStatus}
              onComplete={handleWizardComplete}
              onClose={handleWizardClose}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Integration Request Section */}
      <GlassCard className="mt-6">
        <div className="relative z-10 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
            <div className="flex items-start gap-5 flex-1 min-w-0">
              <div className="shrink-0 w-14 h-14 rounded-2xl text-black dark:text-white flex items-center justify-center shadow-lg">
                <MessageSquare className="h-7 w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className="text-lg font-bold mb-1"
                  style={{ color: 'var(--copy-headlines)' }}
                >
                  {t('integrations.custom.title')}
                </h3>
                <p className="text-sm" style={{ color: 'var(--copy-body)' }}>
                  {t('integrations.custom.description')}
                </p>
              </div>
            </div>
            <div className="shrink-0 ml-auto">
              <Button
                asChild
                variant="default"
                className="h-11 px-6 font-medium shadow-md hover:shadow-lg whitespace-nowrap"
              >
                <a href="/help" className="inline-flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {t('integrations.custom.requestButton')}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>
    </PageContainer>
  );
}
