import { MarketingShell, PageHero } from '@/components/marketing';
import { LandingPricing } from '@/app/(dynamic-pages)/(main-pages)/components/LandingPricing';
import { tServer } from '@/lib/i18n-server';

export const metadata = {
  title: 'Pricing',
  description:
    'Simple pricing. A one-time setup fee plus a monthly subscription that covers hosting, the smart editor, and ongoing support.',
};

export default function PricingPage() {
  const t = tServer as (key: string) => string;
  return (
    <MarketingShell>
      <main id="main-content" className="flex-1">
        <PageHero
          eyebrow={t('pricing.eyebrow')}
          headlinePrefix={t('pricing.headlinePrefix')}
          headlineFlourish={t('pricing.headlineFlourish')}
          sub={t('pricing.sub')}
        />
        <LandingPricing />
      </main>
    </MarketingShell>
  );
}
