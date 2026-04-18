'use client';

import { useState, useEffect } from 'react';
import { PreQualModal } from './PreQualModal';

import Footer from '@/components/Footer';
import { CookieConsent } from '@/components/CookieConsent';
import { ScrollFab } from './ScrollFab';
import { FlowFieldBackground } from './FlowFieldBackground';
import { LandingHeader } from './LandingHeader';
import { LandingHero } from './LandingHero';
import { EditorShowcase } from './EditorShowcase';
import { ProcessSection } from './ProcessSection';
import { ProblemSection } from './ProblemSection';
import { PillarsSection } from './PillarsSection';
import { IncludedSection } from './IncludedSection';
import { DifferentiationSection } from './DifferentiationSection';
import { AudienceSection } from './AudienceSection';
import { TestimonialsSection } from './TestimonialsSection';
import { LandingPricing } from './LandingPricing';
import { TemplateGallerySection } from './TemplateGallerySection';
import { ManifestoSection } from './ManifestoSection';
import { TeamSection } from './TeamSection';
import { FAQSection } from './FAQSection';
import { FinalCTASection } from './FinalCTASection';

export function LandingPageClient() {
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('book') === '1') {
      setModalOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const open = () => setModalOpen(true);

  return (
    <div className="min-h-screen bg-[var(--landing-bg)] dark:bg-[var(--landing-dark-surface)] text-gray-900 dark:text-white font-display relative transition-colors duration-300">
      <FlowFieldBackground />
      <LandingHeader onOpenModal={open} />
      <LandingHero onOpenModal={open} />
      <EditorShowcase />
      <PreQualModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        source="page"
      />
      <AudienceSection />
      <TemplateGallerySection />
      <ProcessSection />
      <ProblemSection />
      <PillarsSection />
      <DifferentiationSection />
      <IncludedSection />
      <LandingPricing />
      <TestimonialsSection />
      <ManifestoSection />
      <TeamSection />
      <FAQSection />
      <FinalCTASection onOpenModal={open} />
      <Footer />
      <CookieConsent />
      <ScrollFab />
    </div>
  );
}
