import nextDynamic from 'next/dynamic';

import { SiteHeader } from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { CookieConsent } from '@/components/CookieConsent';

import { LandingHero } from './components/LandingHero';
import { EditorShowcase } from './components/EditorShowcase';
import { ProblemSection } from './components/ProblemSection';
import { SolutionSection } from './components/SolutionSection';
import { DifferentiationSection } from './components/DifferentiationSection';
import { ProcessSection } from './components/ProcessSection';
import { AudienceSection } from './components/AudienceSection';
import { ProofSection } from './components/ProofSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { ScrollFab } from './components/ScrollFab';
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
const SupportBot = nextDynamic(() =>
  import('./components/SupportBot').then((m) => ({ default: m.SupportBot }))
);
const EcommerceWaitlistModal = nextDynamic(() =>
  import('./components/EcommerceWaitlistModal').then((m) => ({
    default: m.EcommerceWaitlistModal,
  }))
);

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
        <EditorShowcase />
        <hr className="ls-scope ls-section-divider" aria-hidden="true" />
        <ProblemSection />
        <hr className="ls-scope ls-section-divider" aria-hidden="true" />
        <SolutionSection />
        <hr className="ls-scope ls-section-divider" aria-hidden="true" />
        <DifferentiationSection />
        <hr className="ls-scope ls-section-divider" aria-hidden="true" />
        <ProcessSection />
        <hr className="ls-scope ls-section-divider" aria-hidden="true" />
        <AudienceSection />
        <hr className="ls-scope ls-section-divider" aria-hidden="true" />
        <ProofSection />
        <hr className="ls-scope ls-section-divider" aria-hidden="true" />
        <TestimonialsSection />
        <hr className="ls-scope ls-section-divider" aria-hidden="true" />
        <LandingPricing />
        <hr className="ls-scope ls-section-divider" aria-hidden="true" />
        <FAQSection />
        <FinalCTASection />
      </main>
      <Footer />
      <CookieConsent />
      <ScrollFab />
      <SupportBot />
      <EcommerceWaitlistModal />
    </div>
  );
}
