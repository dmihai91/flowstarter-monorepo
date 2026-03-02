'use client';

import Footer from '@/components/Footer';
import { CookieConsent } from '@/components/CookieConsent';
import { FlowFieldBackground } from './components/FlowFieldBackground';
import { LandingHeader } from './components/LandingHeader';
import { LandingHero } from './components/LandingHero';
import { PillarsSection } from './components/PillarsSection';
import { ProcessSection } from './components/ProcessSection';
import { IncludedSection } from './components/IncludedSection';
import { TrustSection } from './components/TrustSection';
import { HowItWorksPreview } from './components/HowItWorksPreview';
import { LandingPricing } from './components/LandingPricing';
import { ManifestoSection } from './components/ManifestoSection';
import { FAQSection } from './components/FAQSection';
import { FinalCTASection } from './components/FinalCTASection';

export default function LandingPage() {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .font-display { font-family: 'Outfit', system-ui, sans-serif; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
        @keyframes flowDrift { 0% { transform: translateX(0); } 100% { transform: translateX(40px); } }
        @keyframes flowDrift2 { 0% { transform: translateX(0) translateY(0); } 100% { transform: translateX(-30px) translateY(15px); } }
        @keyframes flowDrift3 { 0% { transform: translateX(0) translateY(0); } 100% { transform: translateX(20px) translateY(-10px); } }
        @keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-cursor-blink { animation: cursorBlink 1s step-end infinite; }
        @keyframes typing { from { width: 0; } to { width: 100%; } }
        .typing-container { overflow: hidden; white-space: nowrap; border-right: 2px solid var(--purple, #4D5DD9); animation: typing 2s steps(30) forwards, cursorBlink 1s step-end infinite; will-change: transform; }
      `}</style>

      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0c] text-gray-900 dark:text-white font-display relative overflow-x-hidden transition-colors duration-300">
        <FlowFieldBackground />
        <LandingHeader />
        <LandingHero />
        <PillarsSection />
        <ProcessSection />
        <IncludedSection />
        <TrustSection />
        <HowItWorksPreview />
        <LandingPricing />
        <ManifestoSection />
        <FAQSection />
        <FinalCTASection />
        <Footer />
        <CookieConsent />
      </div>
    </>
  );
}
