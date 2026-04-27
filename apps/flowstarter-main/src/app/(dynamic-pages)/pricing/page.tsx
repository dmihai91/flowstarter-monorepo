import { PublicPageLayout } from '@/components/PublicPageLayout';
import { LandingPricing } from '@/app/(dynamic-pages)/(main-pages)/components/LandingPricing';

export const dynamic = 'force-static';

export default function PricingPage() {
  return (
    <PublicPageLayout>
      <main className="relative z-10 pt-24 sm:pt-28">
        <LandingPricing />
      </main>
    </PublicPageLayout>
  );
}
