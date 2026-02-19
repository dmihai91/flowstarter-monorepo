'use client';

import MaxWidthContainer from '@/components/MaxWidthContainer';
import { useSearchParams } from 'next/navigation';
import IntegrationConnectWizard from './components/IntegrationConnectWizard';

export default function IntegrationsWizardPage() {
  const search = useSearchParams();
  const provider = (search.get('provider') || 'google-analytics') as
    | 'google-analytics'
    | 'calendly'
    | 'mailchimp';
  const status = search.get('status');

  return (
    <div className="min-h-screen relative pt-4">
      {/* Reuse dashboard-like layered gradient for consistency */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-white dark:bg-[hsl(240,8%,17%)]">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 100% 60% at 0% 0%, var(--integrations-gradient-top-1), transparent 60%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 90% 60% at 100% 0%, var(--integrations-gradient-top-2), transparent 65%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 100%, var(--integrations-gradient-bottom), transparent 60%)',
          }}
        />
        {/* Subtle noise texture to smooth gradients (Lovable-style) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.025]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            backgroundSize: '200px 200px',
            mixBlendMode: 'normal',
          }}
        />
      </div>

      <MaxWidthContainer>
        <IntegrationConnectWizard provider={provider} initialStatus={status} />
      </MaxWidthContainer>
    </div>
  );
}
