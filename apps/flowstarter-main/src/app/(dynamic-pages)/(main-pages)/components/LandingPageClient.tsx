'use client';

import { useState, useEffect } from 'react';
import { PreQualModal } from './PreQualModal';

import Footer from '@/components/Footer';
import { CookieConsent } from '@/components/CookieConsent';
import { ScrollFab } from './ScrollFab';
import { FlowBackground } from '@flowstarter/flow-design-system';
import { SiteHeader } from '@/components/SiteHeader';
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
import { LandingSupportSection } from './LandingSupportSection';

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
    <>
      <FlowBackground
        variant="landing"
        animated
        style={{ position: 'fixed', inset: 0, zIndex: 0, opacity: 1 }}
      />
      <div
        className="min-h-screen text-[var(--fs-ink)] font-display relative"
        style={{ overflowX: 'clip' }}
      >
        <SiteHeader mode="landing" onOpenModal={open} />
        <main id="main-content">
          <LandingHero onOpenModal={open} />
          <EditorShowcase />
          <PreQualModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            source="page"
          />
          <hr className="ls-scope ls-section-divider" aria-hidden="true" />
          <AudienceSection />
          <TemplateGallerySection />
          <hr className="ls-scope ls-section-divider" aria-hidden="true" />
          <ProcessSection />
          <ProblemSection />
          <hr className="ls-scope ls-section-divider" aria-hidden="true" />
          <PillarsSection />
          <DifferentiationSection />
          <IncludedSection />
          <hr className="ls-scope ls-section-divider" aria-hidden="true" />
          <LandingPricing />
          <hr className="ls-scope ls-section-divider" aria-hidden="true" />
          <TestimonialsSection />
          <ManifestoSection />
          <TeamSection />
          <hr className="ls-scope ls-section-divider" aria-hidden="true" />
          <FAQSection />
          <FinalCTASection onOpenModal={open} />
          <LandingSupportSection />
        </main>
        <Footer />
        <CookieConsent />
        <ScrollFab />
      </div>
    </>
  );
}
