'use client';

import Footer from '@/components/Footer';
import { CookieConsent } from '@/components/CookieConsent';
import { FlowFieldBackground } from './components/FlowFieldBackground';
import { LandingHeader } from './components/LandingHeader';
import { LandingHero } from './components/LandingHero';
import { EditorShowcase } from './components/EditorShowcase';
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
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-fade {
          opacity: 0;
          animation: heroFadeUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .hero-fade-1 { animation-delay: 0.1s; }
        .hero-fade-2 { animation-delay: 0.25s; }
        .hero-fade-3 { animation-delay: 0.4s; }
        .hero-fade-4 { animation-delay: 0.55s; }
        .hero-fade-5 { animation-delay: 0.7s; }
        @keyframes textFlow { 0% { background-position: 0% 50%; } 100% { background-position: 300% 50%; } }
        .text-flow {
          background: linear-gradient(90deg, var(--landing-text-accent) 0%, var(--landing-flow-end) 20%, var(--landing-flow-alt-end) 40%, var(--landing-flow-end) 60%, var(--landing-text-accent) 80%, var(--landing-flow-end) 100%);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          animation: textFlow 5s linear infinite;
        }
      `}</style>

      <div className="min-h-screen bg-[var(--landing-bg)] dark:bg-[var(--landing-dark-surface)] text-gray-900 dark:text-white font-display relative overflow-x-hidden transition-colors duration-300">
        <FlowFieldBackground />
        <LandingHeader />
        <LandingHero />
        <EditorShowcase />
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
