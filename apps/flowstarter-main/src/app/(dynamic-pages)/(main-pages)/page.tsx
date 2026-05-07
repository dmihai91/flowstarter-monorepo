import nextDynamic from 'next/dynamic';

import { SiteHeader } from '@/components/SiteHeader';
import { CookieConsent } from '@/components/CookieConsent';

import { AddOnsSection } from './components/AddOnsSection';
import { LandingHero } from './components/LandingHero';
import { EditorShowcase } from './components/EditorShowcase';
import { ProblemSection } from './components/ProblemSection';
import { ProcessSection } from './components/ProcessSection';
import { ScrollFab } from './components/ScrollFab';
import { IncludedSection } from './components/IncludedSection';
import { LandingMinimalFooter } from './components/LandingMinimalFooter';
import { BookingModalProvider } from './components/BookingModalProvider';

// Below-the-fold client islands — code-split into separate chunks so they
// don't bloat the initial JS payload. SSR stays on (default).
const LandingPricing = nextDynamic(() =>
  import('./components/LandingPricing').then((m) => ({
    default: m.LandingPricing,
  }))
);
const FAQSection = nextDynamic(() =>
  import('./components/FAQSection').then((m) => ({ default: m.FAQSection }))
);
const FinalCTASection = nextDynamic(() =>
  import('./components/FinalCTASection').then((m) => ({
    default: m.FinalCTASection,
  }))
);

export const dynamic = 'force-static';

export default function LandingPage() {
  return (
    <div
      className="flex flex-1 flex-col text-[var(--fs-ink)] font-display relative"
      style={{ overflowX: 'clip' }}
    >
      <SiteHeader mode="landing" />
      <main id="main-content" className="flex-1">
        <LandingHero />
        <BookingModalProvider />
        <hr className="ls-scope ls-section-divider" aria-hidden="true" />
        <ProblemSection />
        <hr className="ls-scope ls-section-divider" aria-hidden="true" />
        <ProcessSection />
        <hr className="ls-scope ls-section-divider" aria-hidden="true" />
        <EditorShowcase />
        <hr className="ls-scope ls-section-divider" aria-hidden="true" />
        <IncludedSection />
        <hr className="ls-scope ls-section-divider" aria-hidden="true" />
        <LandingPricing />
        <hr className="ls-scope ls-section-divider" aria-hidden="true" />
        <AddOnsSection />
        <hr className="ls-scope ls-section-divider" aria-hidden="true" />
        <FAQSection />
        <FinalCTASection />
      </main>
      <LandingMinimalFooter />
      <CookieConsent />
      <ScrollFab />
    </div>
  );
}
