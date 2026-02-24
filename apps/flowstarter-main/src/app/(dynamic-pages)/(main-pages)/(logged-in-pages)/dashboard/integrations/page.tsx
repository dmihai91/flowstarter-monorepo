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
  CheckCircle2,
  Mail,
  MessageSquare,
  Plug,
  Zap,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
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
      router.replace('/dashboard/integrations', { scroll: false });
    }
  }, [searchParams, router]);

  const handleConnect = (provider: Provider) => {
    setSelectedProvider(provider);
    setOauthStatus(null);
    setWizardOpen(true);
  };

  const handleWizardComplete = () => {
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
      iconColor: 'text-[var(--purple)]',
      iconStyle: {
        background: 'var(--purple)',
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
      iconColor: 'text-[var(--blue)]',
      iconStyle: {
        background: 'var(--blue)',
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
      iconColor: 'text-[var(--green)]',
      iconStyle: {
        background: 'var(--green)',
      },
    },
  ];

  const activeCount = integrations.filter((i) => isConnected(i.id)).length;
  const availableCount = integrations.length;

  return (
    <PageContainer gradientVariant="integrations">
      {/* Hero Section */}
      <section className="relative mb-10">
        <div className="relative z-10">
          {/* Header */}
          <div className="mb-2">
            <p className="text-gray-500 dark:text-white/50">
              Connect your favorite tools
            </p>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-[var(--green)] to-[var(--purple)] bg-clip-text text-transparent">
              Integrations
            </span>
          </h1>

          {/* Status badges */}
          <div className="flex items-center gap-6 mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="w-8 h-8 rounded-xl bg-[var(--green)]/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-[var(--green)]" />
              </div>
              <span className="font-medium">
                {activeCount} {t('integrations.active')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-8 h-8 rounded-xl bg-gray-500/10 flex items-center justify-center">
                <Plug className="h-4 w-4 text-gray-500" />
              </div>
              <span>
                {availableCount} {t('integrations.available')}
              </span>
            </div>
          </div>

          {/* Integration Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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

      {/* Divider */}
      <div className="relative flex items-center justify-center my-10">
        <div className="flex-grow border-t border-gray-300/60 dark:border-gray-600/40"></div>
      </div>

      {/* Custom Integration Request Section */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white dark:text-gray-900" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {t('integrations.custom.title')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('integrations.custom.description')}
              </p>
            </div>
          </div>
          <Button
            asChild
            className="shrink-0"
          >
            <a href="/help" className="inline-flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {t('integrations.custom.requestButton')}
            </a>
          </Button>
        </div>
      </GlassCard>
    </PageContainer>
  );
}
