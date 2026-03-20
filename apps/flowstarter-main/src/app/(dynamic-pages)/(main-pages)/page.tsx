'use client';

import Footer from '@/components/Footer';
import { CookieConsent } from '@/components/CookieConsent';
import { ScrollFab } from './components/ScrollFab';
import { FlowFieldBackground } from './components/FlowFieldBackground';
import { LandingHeader } from './components/LandingHeader';
import { LandingHero } from './components/LandingHero';
import { EditorShowcase } from './components/EditorShowcase';
import { ProcessSection } from './components/ProcessSection';
import { ProblemSection } from './components/ProblemSection';
import { PillarsSection } from './components/PillarsSection';
import { IncludedSection } from './components/IncludedSection';
import { DifferentiationSection } from './components/DifferentiationSection';
import { AudienceSection } from './components/AudienceSection';
import { LandingPricing } from './components/LandingPricing';
import { TemplateGallerySection } from './components/TemplateGallerySection';
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
        @keyframes wordReveal {
          0% { opacity: 0; transform: translateY(20px) scale(0.95); filter: blur(4px); }
          60% { opacity: 1; filter: blur(0px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
        }
        @keyframes textFlowW { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .animate-word-reveal {
          opacity: 0;
          background: linear-gradient(135deg, #1e3a8a, #3730a3, #5b21b6, #7C3AED, #4D5DD9, #0e7490);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          animation: wordReveal 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards, textFlowW 6s ease infinite;
        }
        @keyframes sectionFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .section-fade { animation: sectionFadeUp 0.5s ease-out forwards; }
        @keyframes flowDrift { 0% { transform: translateX(0); } 100% { transform: translateX(40px); } }
        @keyframes flowDrift2 { 0% { transform: translateX(0) translateY(0); } 100% { transform: translateX(-30px) translateY(15px); } }
        @keyframes flowDrift3 { 0% { transform: translateX(0) translateY(0); } 100% { transform: translateX(20px) translateY(-10px); } }
        @keyframes shimmerBtn { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-cursor-blink { animation: cursorBlink 1s step-end infinite; }
        @keyframes textFlow { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .text-flow {
          background: linear-gradient(135deg, #1e3a8a, #3730a3, #5b21b6, #7C3AED, #4D5DD9, #0e7490);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          animation: textFlow 6s ease infinite;
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
        <TemplateGallerySection />

        {/* 3. How it works — 3 steps */}
        <ProcessSection />

        {/* 4. Starting online pains */}
        <ProblemSection />

        {/* 5. Why experts choose Flowstarter — 3 pillars */}
        <PillarsSection />

        {/* 6. Positioning */}
        <DifferentiationSection />

        {/* 7. Who this is for */}
        <AudienceSection />

        {/* 8. Everything you need — features */}
        <IncludedSection />

        {/* 9. Clear pricing */}
        <LandingPricing />

        {/* 10. Manifesto — emotional/mission */}
        <ManifestoSection />

        {/* 11. Who's behind Flowstarter */}
        <TeamSection />

        {/* 12. FAQ */}
        <FAQSection />

        {/* 13. Final CTA + footer */}
        <FinalCTASection />
        <Footer />
        <CookieConsent />
      </div>
        <ScrollFab />
    </>
  );
}
