'use client';

import Footer from '@/components/Footer';
import { SupportHeader } from '@/components/SupportHeader';
import { HelpContent } from '@/components/HelpContent';
import { FlowBackground } from '@flowstarter/flow-design-system';

export default function HelpPage() {
  return (
    <div className="relative min-h-screen page-gradient">
      <FlowBackground variant="dashboard" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />
      <SupportHeader />
      <main className="relative z-10 pt-16">
        <HelpContent showHero showCta />
      </main>
      <Footer />
    </div>
  );
}
