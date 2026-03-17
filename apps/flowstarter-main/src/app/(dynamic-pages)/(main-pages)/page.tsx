'use client';

import Footer from '@/components/Footer';
import { CookieConsent } from '@/components/CookieConsent';
import { LandingHeader } from './components/LandingHeader';
import { LandingHero } from './components/LandingHero';
import { ProblemSection } from './components/ProblemSection';
import { SolutionSection } from './components/SolutionSection';
import { IncludedSection } from './components/IncludedSection';
import { LandingPricing } from './components/LandingPricing';
import { DifferentiationSection } from './components/DifferentiationSection';
import { AudienceSection } from './components/AudienceSection';
import { FAQSection } from './components/FAQSection';
import { FinalCTASection } from './components/FinalCTASection';

export default function LandingPage() {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .font-display { font-family: 'Outfit', system-ui, sans-serif; }
        html { scroll-behavior: smooth; }
      `}</style>

      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white font-display relative overflow-x-hidden transition-colors duration-300">
        <LandingHeader />
        <LandingHero />
        <ProblemSection />
        <SolutionSection />
        <IncludedSection />
        <LandingPricing />
        <DifferentiationSection />
        <AudienceSection />
        <FAQSection />
        <FinalCTASection />
        <Footer />
        <CookieConsent />
      </div>
    </>
  );
}
