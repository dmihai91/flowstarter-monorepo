'use client';
import { useState } from 'react';
import { PreQualModal } from './components/PreQualModal';

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
import { TestimonialsSection } from './components/TestimonialsSection';
import { LandingPricing } from './components/LandingPricing';
import { TemplateGallerySection } from './components/TemplateGallerySection';
import { ManifestoSection } from './components/ManifestoSection';
import { TeamSection } from './components/TeamSection';
import { FAQSection } from './components/FAQSection';
import { FinalCTASection } from './components/FinalCTASection';

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .font-display { font-family: 'Outfit', system-ui, sans-serif; }
        @keyframes flowDrift { 0% { transform: translateX(0); } 100% { transform: translateX(40px); } }
        @keyframes flowDrift2 { 0% { transform: translateX(0) translateY(0); } 100% { transform: translateX(-30px) translateY(15px); } }
        @keyframes flowDrift3 { 0% { transform: translateX(0) translateY(0); } 100% { transform: translateX(20px) translateY(-10px); } }
        @keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .animate-cursor-blink { animation: cursorBlink 1s step-end infinite; }
        @keyframes typing { from { width: 0; } to { width: 100%; } }
        .typing-container { overflow: hidden; white-space: nowrap; border-right: 2px solid var(--purple); animation: typing 2s steps(30) forwards, cursorBlink 1s step-end infinite; will-change: transform; }
      `}</style>

      <div className="min-h-screen bg-[var(--landing-bg)] dark:bg-[var(--landing-dark-surface)] text-gray-900 dark:text-white font-display relative transition-colors duration-300">
        <FlowFieldBackground />
        <LandingHeader onOpenModal={() => setModalOpen(true)} />

        {/* 1. Hero — headline + paragraph + CTA + price pill */}
        <LandingHero onOpenModal={() => setModalOpen(true)} />

        {/* 2. Audience — who this is for */}
        <AudienceSection />
        <PreQualModal open={modalOpen} onClose={() => setModalOpen(false)} source="page" />

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

        {/* 8. Everything you need — features */}
        <IncludedSection />

        {/* 9. Clear pricing */}
        <LandingPricing />

        {/* 10. Manifesto — emotional/mission */}
        <TestimonialsSection />

        <ManifestoSection />

        {/* 11. Who's behind Flowstarter */}
        <TeamSection />

        {/* 12. FAQ */}
        <FAQSection />

        {/* 13. Final CTA + footer */}
        <FinalCTASection onOpenModal={() => setModalOpen(true)} />
        <Footer />
        <CookieConsent />
      </div>
        <ScrollFab />
    </>
  );
}
