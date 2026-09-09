import type { Metadata } from 'next';
import { MarketingShell, PageHero } from '@/components/marketing';
import { CustomInquiryForm } from './CustomInquiryForm';

export const metadata: Metadata = {
  title: 'Custom Solution Inquiry · Flowstarter',
  description:
    'Bespoke builds for small and medium businesses. Tell us about the project, and we respond within 2 business days.',
  robots: { index: true, follow: true },
};

export default function CustomInquiryPage() {
  return (
    <MarketingShell>
      <main id="main-content" className="flex-1">
        <PageHero
          eyebrow="Custom Solutions"
          headlinePrefix="Tell us about the project."
          headlineFlourish="We'll see if we're the right fit."
          sub={
            <>
              Bespoke builds for small and medium businesses. We respond within
              2 business days.
            </>
          }
        />

        <section className="ls-section ls-section--pad">
          <div className="ls-container">
            <CustomInquiryForm />
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
