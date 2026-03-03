'use client';

import Footer from '@/components/Footer';
import { CookieConsent } from '@/components/CookieConsent';
import { FlowFieldBackground } from './components/FlowFieldBackground';
import { LandingHeader } from './components/LandingHeader';
import { LandingHero } from './components/LandingHero';
import { EditorShowcase } from './components/EditorShowcase';
import { ProcessSection } from './components/ProcessSection';
import { PillarsSection } from './components/PillarsSection';
import { IncludedSection } from './components/IncludedSection';
import { TrustSection } from './components/TrustSection';
import { LandingPricing } from './components/LandingPricing';
import { ManifestoSection } from './components/ManifestoSection';
import { TeamSection } from './components/TeamSection';
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
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-fade {
          opacity: 0;
          animation: heroFadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .hero-fade-1 { animation-delay: 0.1s; }
        .hero-fade-2 { animation-delay: 0.3s; }
        .hero-fade-3 { animation-delay: 0.5s; }
        .hero-fade-4 { animation-delay: 0.7s; }
        .hero-fade-5 { animation-delay: 0.9s; }
        @keyframes flowDrift { 0% { transform: translateX(0); } 100% { transform: translateX(40px); } }
        @keyframes flowDrift2 { 0% { transform: translateX(0) translateY(0); } 100% { transform: translateX(-30px) translateY(15px); } }
        @keyframes flowDrift3 { 0% { transform: translateX(0) translateY(0); } 100% { transform: translateX(20px) translateY(-10px); } }
        @keyframes shimmerBtn { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-cursor-blink { animation: cursorBlink 1s step-end infinite; }
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
        @keyframes typing { from { width: 0; } to { width: 100%; } }
        .typing-container { overflow: hidden; white-space: nowrap; border-right: 2px solid var(--purple, #4D5DD9); animation: typing 2s steps(30) forwards, cursorBlink 1s step-end infinite; will-change: transform; }
      `}</style>

      <div className="min-h-screen bg-[var(--landing-bg)] dark:bg-[var(--landing-dark-surface)] text-gray-900 dark:text-white font-display relative overflow-x-hidden transition-colors duration-300">
        <FlowFieldBackground />
        <LandingHeader />

        {/* 1. Hero — headline + paragraph + CTA + price pill */}
        <LandingHero />

        {/* 2. Editor demo showcase */}
        <EditorShowcase />

        {/* 3. How it works — 3 steps */}
        <ProcessSection />

        {/* 4. Why experts choose Flowstarter — 3 pillars */}
        <PillarsSection />

        {/* 5. Social proof / trust indicators */}
        <TrustSection />

        {/* 6. Everything you need — features */}
        <IncludedSection />

        {/* 7. Clear pricing */}
        <LandingPricing />

        {/* 8. Manifesto — emotional/mission */}
        <ManifestoSection />

        {/* 9. Who's behind Flowstarter */}
        <TeamSection />

        {/* 10. FAQ */}
        <FAQSection />

        {/* 10. Final CTA + footer */}
        <FinalCTASection />
        <Footer />
        <CookieConsent />
      </div>
    </>
  );
}
